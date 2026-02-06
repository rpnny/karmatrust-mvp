/**
 * EAS Attestation Service V2 - ZK-Friendly
 * 
 * This version stores COMMITMENT instead of plaintext score.
 * 
 * Architecture:
 * 1. EAS stores: commitment (Poseidon hash), minTier (public threshold)
 * 2. User generates: ZK proof that score matches commitment and meets tier
 * 3. Bank verifies: ZK proof + reads commitment from EAS
 * 
 * Benefits:
 * - Privacy: Exact score never revealed
 * - On-chain verifiable: Commitment stored on EAS
 * - ZK-compatible: Public signals reference EAS commitment
 * - Trust: Banks verify both ZK proof AND EAS attestation
 * 
 * Schema Design:
 * ```
 * bytes32 commitment   // Poseidon(score, salt) - Cannot reverse to get score
 * uint8 minTier        // Minimum tier achieved (1-5)
 * uint64 timestamp     // Attestation time
 * ```
 */

import { ethers } from 'ethers';
import { buildPoseidon } from 'circomlibjs';

// =============================================================================
// TYPES
// =============================================================================

interface CommitmentAttestationData {
  wallet: string;
  commitment: string;      // Poseidon(score, salt)
  minTier: number;         // 1-5 (Bronze to Diamond)
  timestamp: number;
}

interface CommitmentAttestationResult {
  attestationId: string;
  explorerUrl: string;
  schemaId: string;
  recipient: string;
  commitment: string;
  minTier: number;
  txHash?: string;
  blockNumber?: number;
  isSimulated: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const EAS_CONFIG = {
  sepolia: {
    easContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    explorerUrl: 'https://sepolia.easscan.org',
  },
};

// ZK-Friendly Schema - Only stores commitment, not plaintext score
const COMMITMENT_SCHEMA = {
  raw: 'bytes32 commitment,uint8 minTier,uint64 timestamp',
  types: ['bytes32', 'uint8', 'uint64'],
  // REAL REGISTERED SCHEMA UID ON SEPOLIA!
  // Registered in tx: 0x5b2edc70f9e9e2c6fa792506d6df8791296e40731be476c161a777780981d4f5
  uid: '0xef0ccdc547432a192cb07a23a2c3fc1d3da013fa20980f7db8c2bbfb924ebb11',
};

const EAS_ABI = [
  'function attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, uint256 value) data)) external payable returns (bytes32)',
  'function getAttestation(bytes32 uid) external view returns ((bytes32 uid, bytes32 schema, uint64 time, uint64 expirationTime, uint64 revocationTime, bytes32 refUID, address recipient, address attester, bool revocable, bytes data))',
  'event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUid)',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let poseidon: any = null;

async function initPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  return poseidon;
}

/**
 * Compute Poseidon commitment from score and salt
 */
export async function computeCommitment(score: number, salt: bigint): Promise<string> {
  const pos = await initPoseidon();
  const hash = pos([BigInt(score), salt]);
  return '0x' + pos.F.toString(hash, 16).padStart(64, '0');
}

/**
 * Generate random salt for commitment
 */
export function generateSalt(): bigint {
  const bytes = ethers.randomBytes(32);
  return BigInt(ethers.hexlify(bytes));
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class EASAttestationServiceV2 {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private easContract: ethers.Contract | null = null;
  private isSimulation: boolean = true;
  private schemaId: string;
  // Simulation mode: in-memory store for attestation commitments
  private simulationStore: Map<string, {
    commitment: string;
    minTier: number;
    timestamp: number;
    recipient: string;
    revoked: boolean;
  }> = new Map();

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Use registered schema ID
    this.schemaId = COMMITMENT_SCHEMA.uid!;

    // Check for private key (enables real mode)
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      try {
        const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.signer = new ethers.Wallet(pk, this.provider);
        this.easContract = new ethers.Contract(
          EAS_CONFIG.sepolia.easContract,
          EAS_ABI,
          this.signer
        );
        this.isSimulation = false;
        console.log('[EAS-V2] ZK-friendly mode enabled ✅');
        console.log(`[EAS-V2] Attester: ${this.signer.address}`);
      } catch (error) {
        console.warn('[EAS-V2] Falling back to simulation:', error);
      }
    } else {
      console.log('[EAS-V2] Simulation mode (no PRIVATE_KEY)');
    }
  }

  /**
   * Create a commitment-based attestation
   * 
   * This stores ONLY the commitment on-chain, not the plaintext score.
   * The commitment can later be used as a public input to ZK proofs.
   * 
   * @param data - Commitment attestation data
   * @returns Attestation result with UID and explorer URL
   */
  async createCommitmentAttestation(
    data: CommitmentAttestationData
  ): Promise<CommitmentAttestationResult> {
    console.log(`[EAS-V2] Creating commitment attestation for ${data.wallet.slice(0, 10)}...`);

    if (this.isSimulation) {
      return this.createSimulatedCommitmentAttestation(data);
    }

    return this.createRealCommitmentAttestation(data);
  }

  /**
   * Create simulated commitment attestation
   */
  private createSimulatedCommitmentAttestation(
    data: CommitmentAttestationData
  ): CommitmentAttestationResult {
    // Generate deterministic attestation ID
    const attestationId = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'bytes32', 'uint8', 'uint64'],
        [
          data.wallet,
          data.commitment,
          data.minTier,
          BigInt(Math.floor(data.timestamp / 1000)),
        ]
      )
    );

    // Store in simulation store for later verification
    this.simulationStore.set(attestationId, {
      commitment: data.commitment,
      minTier: data.minTier,
      timestamp: data.timestamp,
      recipient: data.wallet,
      revoked: false,
    });

    console.log(`[EAS-V2] Simulated commitment attestation: ${attestationId.slice(0, 20)}...`);
    console.log(`[EAS-V2] Stored commitment: ${data.commitment.slice(0, 20)}... for verification`);

    return {
      attestationId,
      explorerUrl: `${EAS_CONFIG.sepolia.explorerUrl}/attestation/view/${attestationId}`,
      schemaId: this.schemaId,
      recipient: data.wallet,
      commitment: data.commitment,
      minTier: data.minTier,
      isSimulated: true,
    };
  }

  /**
   * Create real on-chain commitment attestation
   */
  private async createRealCommitmentAttestation(
    data: CommitmentAttestationData
  ): Promise<CommitmentAttestationResult> {
    if (!this.signer || !this.easContract) {
      throw new Error('Signer not initialized');
    }

    // Encode attestation data
    const abiCoder = new ethers.AbiCoder();
    const encodedData = abiCoder.encode(
      COMMITMENT_SCHEMA.types,
      [
        data.commitment,                           // bytes32 commitment
        data.minTier,                              // uint8 minTier
        BigInt(Math.floor(data.timestamp / 1000)), // uint64 timestamp
      ]
    );

    console.log('[EAS-V2] Sending commitment attestation transaction...');

    try {
      // Create attestation request
      const attestationRequest = {
        schema: this.schemaId,
        data: {
          recipient: data.wallet,
          expirationTime: 0n,
          revocable: true,
          refUID: ethers.ZeroHash,
          data: encodedData,
          value: 0n,
        },
      };

      // Send transaction
      const tx = await this.easContract.attest(attestationRequest);
      console.log(`[EAS-V2] Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[EAS-V2] Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract attestation UID from logs
      let attestationId = ethers.ZeroHash;
      const attestedEventSig = ethers.id('Attested(address,address,bytes32,bytes32)');
      const attestedLog = receipt.logs.find((log: any) => log.topics[0] === attestedEventSig);
      
      if (attestedLog) {
        attestationId = attestedLog.data;
        console.log(`[EAS-V2] Commitment attestation UID: ${attestationId}`);
      } else {
        console.log('[EAS-V2] Attested event not found, using fallback');
        attestationId = receipt.logs[0]?.data || ethers.ZeroHash;
      }

      return {
        attestationId,
        explorerUrl: `${EAS_CONFIG.sepolia.explorerUrl}/attestation/view/${attestationId}`,
        schemaId: this.schemaId,
        recipient: data.wallet,
        commitment: data.commitment,
        minTier: data.minTier,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isSimulated: false,
      };
    } catch (error) {
      console.error('[EAS-V2] Transaction failed:', error);
      console.log('[EAS-V2] Falling back to simulation mode');
      return this.createSimulatedCommitmentAttestation(data);
    }
  }

  /**
   * Read a commitment attestation from on-chain
   * 
   * This is CRITICAL for secure verification:
   * Banks must check that the commitment in the ZK proof
   * actually exists on-chain and hasn't been revoked.
   * 
   * @param attestationId - The attestation UID to read
   * @returns Attestation data or null if not found
   */
  async getCommitmentAttestation(attestationId: string): Promise<{
    commitment: string;
    minTier: number;
    timestamp: number;
    recipient: string;
    revoked: boolean;
  } | null> {
    console.log(`[EAS-V2] Reading attestation ${attestationId.slice(0, 20)}...`);

    if (this.isSimulation) {
      // In simulation mode, check our in-memory store
      const stored = this.simulationStore.get(attestationId);
      if (stored) {
        console.log('[EAS-V2] Simulation mode: Found attestation in store');
        console.log(`[EAS-V2]   Commitment: ${stored.commitment.slice(0, 20)}...`);
        console.log(`[EAS-V2]   MinTier: ${stored.minTier}`);
        return stored;
      } else {
        console.log('[EAS-V2] Simulation mode: Attestation not found in store');
        return null;
      }
    }

    try {
      const easContract = new ethers.Contract(
        EAS_CONFIG.sepolia.easContract,
        EAS_ABI,
        this.provider
      );

      const attestation = await easContract.getAttestation(attestationId);

      // Check if attestation exists
      if (attestation.uid === ethers.ZeroHash) {
        console.log('[EAS-V2] Attestation not found on-chain');
        return null;
      }

      // Decode data: bytes32 commitment, uint8 minTier, uint64 timestamp
      const abiCoder = new ethers.AbiCoder();
      const decoded = abiCoder.decode(
        COMMITMENT_SCHEMA.types,
        attestation.data
      );

      const result = {
        commitment: decoded[0],
        minTier: Number(decoded[1]),
        timestamp: Number(decoded[2]),
        recipient: attestation.recipient,
        revoked: attestation.revocationTime > 0,
      };

      console.log('[EAS-V2] ✅ Attestation read successfully');
      console.log(`[EAS-V2]   Commitment: ${result.commitment.slice(0, 20)}...`);
      console.log(`[EAS-V2]   MinTier: ${result.minTier}`);
      console.log(`[EAS-V2]   Revoked: ${result.revoked}`);

      return result;
    } catch (error) {
      console.error('[EAS-V2] Failed to read attestation:', error);
      return null;
    }
  }

  /**
   * Get schema details
   */
  getSchema() {
    return {
      ...COMMITMENT_SCHEMA,
      uid: this.schemaId,
    };
  }
}

// Export singleton
export const easAttestationServiceV2 = new EASAttestationServiceV2();

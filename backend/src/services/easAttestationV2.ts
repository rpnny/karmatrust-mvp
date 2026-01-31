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
  // This schema would need to be registered on EAS
  // For demo, we compute deterministic UID
  uid: null as string | null,
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

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Compute schema ID
    this.schemaId = ethers.keccak256(ethers.toUtf8Bytes(COMMITMENT_SCHEMA.raw));
    COMMITMENT_SCHEMA.uid = this.schemaId;

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

    console.log(`[EAS-V2] Simulated commitment attestation: ${attestationId.slice(0, 20)}...`);

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

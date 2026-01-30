/**
 * EAS Attestation Service
 * 
 * Creates on-chain attestations using Ethereum Attestation Service (EAS).
 * 
 * What is EAS?
 * - Decentralized attestation protocol on Ethereum
 * - Creates verifiable, on-chain credentials
 * - Used by: Coinbase, Gitcoin, Optimism
 * - Explorer: easscan.org
 * 
 * Why EAS for KarmaTrust?
 * 1. On-chain verifiable: Anyone can verify the attestation
 * 2. Standard format: Banks and DeFi protocols can integrate
 * 3. Revocable: Can be revoked if fraud detected
 * 4. Schema-based: Structured data with typed fields
 * 
 * Operating Modes:
 * - REAL MODE: Creates actual on-chain attestations (requires PRIVATE_KEY)
 * - SIMULATION MODE: Returns mock attestation ID (for demos without gas)
 * 
 * Schema Design:
 * address wallet     - The wallet being attested
 * uint16 score       - FICO-style score (300-850)
 * string risk        - Risk level ("Low" | "Medium" | "High")
 * uint64 timestamp   - Unix timestamp of attestation
 * uint16 volatility  - Volatility score (0-1000, scaled by 1000)
 * uint16 stability   - Stability score (0-1000, scaled by 1000)
 * uint8 level        - Credit level (1-5)
 */

import { ethers } from 'ethers';
import { CreditScore, AttestationResult } from '../types/index.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

// EAS Contract Addresses (Sepolia Testnet)
const EAS_CONFIG = {
  sepolia: {
    easContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    schemaRegistry: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
    explorerUrl: 'https://sepolia.easscan.org',
  },
};

// Our Credit Score Schema
// Registered on Sepolia: address wallet, uint16 score, string risk, uint64 timestamp, uint16 volatility, uint16 stability, uint8 level
const CREDIT_SCHEMA = {
  raw: 'address wallet,uint16 score,string risk,uint64 timestamp,uint16 volatility,uint16 stability,uint8 level',
  types: ['address', 'uint16', 'string', 'uint64', 'uint16', 'uint16', 'uint8'],
  // This would be the actual schema UID after registration
  // For MVP, we compute it dynamically
  uid: null as string | null,
};

// EAS Contract ABI (minimal, just what we need)
const EAS_ABI = [
  'function attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, uint256 value) data)) external payable returns (bytes32)',
  'function getAttestation(bytes32 uid) external view returns ((bytes32 uid, bytes32 schema, uint64 time, uint64 expirationTime, uint64 revocationTime, bytes32 refUID, address recipient, address attester, bool revocable, bytes data))',
];

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class EASAttestationService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private easContract: ethers.Contract | null = null;
  private isSimulation: boolean = true;
  private schemaId: string;

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.gateway.tatum.io';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Compute schema ID
    this.schemaId = this.computeSchemaId(CREDIT_SCHEMA.raw);

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
        console.log('[EAS] Real mode enabled ✅');
        console.log(`[EAS] Attester address: ${this.signer.address}`);
      } catch (error) {
        console.warn('[EAS] Failed to initialize signer, falling back to simulation:', error);
      }
    } else {
      console.log('[EAS] Simulation mode (no PRIVATE_KEY configured)');
    }
  }

  /**
   * Create an attestation for a credit score
   * 
   * @param creditScore - The credit score to attest
   * @returns AttestationResult with ID and explorer URL
   */
  async createAttestation(creditScore: CreditScore): Promise<AttestationResult> {
    console.log(`[EAS] Creating attestation for ${creditScore.wallet.slice(0, 10)}...`);

    if (this.isSimulation) {
      return this.createSimulatedAttestation(creditScore);
    }

    return this.createRealAttestation(creditScore);
  }

  /**
   * Create a simulated attestation (no gas, for demos)
   * 
   * Why simulation?
   * - Hackathon demos may not have testnet ETH
   * - Faster iteration during development
   * - Same UI experience, just no on-chain record
   * 
   * The simulated ID is deterministic (same input = same output)
   * so it's consistent across refreshes.
   */
  private createSimulatedAttestation(creditScore: CreditScore): AttestationResult {
    // Generate deterministic attestation ID from credit score data
    const attestationId = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint16', 'string', 'uint64'],
        [
          creditScore.wallet,
          Math.round(creditScore.score),
          creditScore.risk,
          BigInt(Math.floor(creditScore.timestamp / 1000)),
        ]
      )
    );

    console.log(`[EAS] Simulated attestation: ${attestationId.slice(0, 20)}...`);

    return {
      attestationId,
      explorerUrl: `${EAS_CONFIG.sepolia.explorerUrl}/attestation/view/${attestationId}`,
      schemaId: this.schemaId,
      recipient: creditScore.wallet,
      isSimulated: true,
    };
  }

  /**
   * Create a real on-chain attestation
   * 
   * Process:
   * 1. Encode the attestation data according to schema
   * 2. Call EAS contract's attest() function
   * 3. Wait for transaction confirmation
   * 4. Extract attestation UID from receipt
   */
  private async createRealAttestation(creditScore: CreditScore): Promise<AttestationResult> {
    if (!this.signer || !this.easContract) {
      throw new Error('Signer not initialized');
    }

    // Encode attestation data
    const abiCoder = new ethers.AbiCoder();
    const encodedData = abiCoder.encode(
      CREDIT_SCHEMA.types,
      [
        creditScore.wallet,                                    // address wallet
        Math.round(creditScore.score),                         // uint16 score (FICO)
        creditScore.risk,                                      // string risk
        BigInt(Math.floor(creditScore.timestamp / 1000)),      // uint64 timestamp
        Math.round(creditScore.factors.volatility * 1000),     // uint16 volatility (scaled)
        Math.round(creditScore.factors.stability * 1000),      // uint16 stability (scaled)
        creditScore.level,                                     // uint8 level
      ]
    );

    console.log('[EAS] Sending attestation transaction...');

    try {
      // Create attestation request
      const attestationRequest = {
        schema: this.schemaId,
        data: {
          recipient: creditScore.wallet,
          expirationTime: 0n,           // No expiration
          revocable: true,              // Can be revoked if fraud detected
          refUID: ethers.ZeroHash,      // No reference to other attestation
          data: encodedData,
          value: 0n,                    // No ETH value
        },
      };

      // Send transaction
      const tx = await this.easContract.attest(attestationRequest);
      console.log(`[EAS] Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[EAS] Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract attestation UID from logs
      // The EAS contract emits an Attested event with the UID
      const attestationId = receipt.logs[0]?.topics[1] || ethers.ZeroHash;

      return {
        attestationId,
        explorerUrl: `${EAS_CONFIG.sepolia.explorerUrl}/attestation/view/${attestationId}`,
        schemaId: this.schemaId,
        recipient: creditScore.wallet,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isSimulated: false,
      };
    } catch (error) {
      console.error('[EAS] Transaction failed:', error);
      
      // Fallback to simulation if transaction fails
      console.log('[EAS] Falling back to simulation mode');
      return this.createSimulatedAttestation(creditScore);
    }
  }

  /**
   * Verify an attestation exists on-chain
   * 
   * @param attestationId - The attestation UID to verify
   * @returns Whether the attestation is valid and not revoked
   */
  async verifyAttestation(attestationId: string): Promise<{
    valid: boolean;
    revoked: boolean;
    data?: any;
  }> {
    if (this.isSimulation) {
      // In simulation mode, just check if it looks like a valid hash
      return {
        valid: /^0x[a-fA-F0-9]{64}$/.test(attestationId),
        revoked: false,
      };
    }

    try {
      const easContract = new ethers.Contract(
        EAS_CONFIG.sepolia.easContract,
        EAS_ABI,
        this.provider
      );

      const attestation = await easContract.getAttestation(attestationId);
      
      return {
        valid: attestation.uid !== ethers.ZeroHash,
        revoked: attestation.revocationTime > 0,
        data: {
          schema: attestation.schema,
          recipient: attestation.recipient,
          attester: attestation.attester,
          time: Number(attestation.time),
        },
      };
    } catch (error) {
      console.error('[EAS] Verification failed:', error);
      return { valid: false, revoked: false };
    }
  }

  /**
   * Compute schema ID from schema string
   * 
   * EAS uses keccak256 of the schema string as the schema ID.
   * This must match the registered schema on the Schema Registry.
   */
  private computeSchemaId(schema: string): string {
    // For a proper implementation, we would query the Schema Registry
    // For MVP, we compute a deterministic ID
    return ethers.keccak256(ethers.toUtf8Bytes(schema));
  }

  /**
   * Get service status and configuration
   */
  getStatus(): {
    mode: 'real' | 'simulation';
    schemaId: string;
    network: string;
    attester?: string;
  } {
    return {
      mode: this.isSimulation ? 'simulation' : 'real',
      schemaId: this.schemaId,
      network: 'sepolia',
      attester: this.signer?.address,
    };
  }

  /**
   * Get the schema details
   */
  getSchema(): typeof CREDIT_SCHEMA {
    return {
      ...CREDIT_SCHEMA,
      uid: this.schemaId,
    };
  }
}

// Export singleton instance
export const easAttestationService = new EASAttestationService();

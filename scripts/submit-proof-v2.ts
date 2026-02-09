#!/usr/bin/env ts-node
/**
 * Submit Proof V2 CLI Script
 * 
 * Fully decentralized flow - USER submits proof, CONTRACT verifies on-chain.
 * 
 * Flow:
 * 1. Score wallet (backend API)
 * 2. Generate ZK proof (backend API or local)
 * 3. Format proof for Solidity
 * 4. USER (not backend) calls registry.submitProof()
 * 5. Contract verifies proof ON-CHAIN
 * 6. If valid, tier auto-updated
 * 
 * Key difference from V1:
 * - V1: Backend owner calls setTier() (centralized)
 * - V2: User calls submitProof() (decentralized) ✅
 * 
 * Usage:
 *   ts-node scripts/submit-proof-v2.ts
 *   (Uses PRIVATE_KEY from .env as the user wallet)
 */

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const REGISTRY_V2_ADDRESS = process.env.CREDIT_REGISTRY_V2_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

// CreditRegistryV2 ABI
const REGISTRY_V2_ABI = [
  'function submitProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals) external',
  'function getTier(address user) external view returns (uint8)',
  'function canSubmitProof(address user) external view returns (bool canSubmit, uint256 timeUntilNext)',
  'function lastProofTime(address user) external view returns (uint256)',
  'event TierUpdated(address indexed user, uint8 oldTier, uint8 newTier, uint256 timestamp)',
  'event ProofRejected(address indexed user, uint8 claimedTier, string reason)',
];

interface ScoreResponse {
  score: number;
  tier: number;
  tierName: string;
  factors: Record<string, number>;
}

interface ZKProofResponse {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
  tier: number;
  generationTime: number;
}

/**
 * Format proof for Solidity contract
 * SnarkJS outputs pi_a with 3 elements, but we only need first 2 for Solidity
 */
function formatProofForSolidity(proof: ZKProofResponse['proof']) {
  return {
    pA: [proof.pi_a[0], proof.pi_a[1]],
    pB: [
      [proof.pi_b[0][1], proof.pi_b[0][0]], // Reverse order for G2 points
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    pC: [proof.pi_c[0], proof.pi_c[1]],
  };
}

async function main() {
  console.log('🚀 KarmaTrust V2: Submit Proof (Decentralized)\n');
  console.log('='.repeat(60));

  // 1. Validate inputs
  if (!REGISTRY_V2_ADDRESS) {
    console.error('❌ Error: CREDIT_REGISTRY_V2_ADDRESS not set in .env');
    process.exit(1);
  }

  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const registry = new ethers.Contract(REGISTRY_V2_ADDRESS, REGISTRY_V2_ABI, wallet);

  const walletAddress = wallet.address;

  console.log('📋 Configuration:');
  console.log(`   User wallet: ${walletAddress}`);
  console.log(`   Backend:     ${BACKEND_URL}`);
  console.log(`   Registry V2: ${REGISTRY_V2_ADDRESS}`);
  console.log(`   Network:     Base Sepolia (${RPC_URL})`);
  
  const balance = await provider.getBalance(walletAddress);
  console.log(`   Balance:     ${ethers.formatEther(balance)} ETH`);
  console.log('='.repeat(60) + '\n');

  // 2. Check if user can submit proof
  console.log('🔍 Checking proof submission eligibility...');
  try {
    const [canSubmit, timeUntilNext] = await registry.canSubmitProof(walletAddress);
    
    if (!canSubmit) {
      const hoursRemaining = Number(timeUntilNext) / 3600;
      console.error(`❌ Error: Too soon since last proof submission`);
      console.error(`   Wait ${hoursRemaining.toFixed(1)} more hours (cooldown: 24h)`);
      process.exit(1);
    }
    
    console.log('✅ Eligible to submit proof');
    
    const currentTier = await registry.getTier(walletAddress);
    console.log(`   Current tier: ${currentTier}`);
  } catch (error: any) {
    console.error('❌ Failed to check eligibility:', error.message);
    process.exit(1);
  }

  // 3. Score the wallet
  console.log('\n📊 Step 1/4: Scoring wallet...');
  let scoreData: ScoreResponse;
  try {
    const response = await axios.get(`${BACKEND_URL}/api/credit/score`, {
      params: { wallet: walletAddress },
      timeout: 30000,
    });
    scoreData = response.data.data;
    
    console.log(`✅ Score: ${scoreData.score}/850`);
    console.log(`✅ Tier: ${scoreData.tier} (${scoreData.tierName})`);
  } catch (error: any) {
    console.error('❌ Failed to score wallet:', error.message);
    process.exit(1);
  }

  // 4. Generate ZK proof
  console.log('\n🔐 Step 2/4: Generating ZK proof...');
  let proofData: ZKProofResponse;
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/zkp/generate`,
      {
        score: scoreData.score,
        tier: scoreData.tier,
      },
      { timeout: 60000 }
    );
    proofData = response.data.data;
    
    console.log(`✅ Proof generated in ${proofData.generationTime}ms`);
    console.log(`   Public signals: ${proofData.publicSignals.length} elements`);
    console.log(`   - Tier: ${proofData.publicSignals[0]}`);
    console.log(`   - Lower bound: ${proofData.publicSignals[1]}`);
    console.log(`   - Upper bound: ${proofData.publicSignals[2]}`);
    console.log(`   - Commitment: ${proofData.publicSignals[3]}`);
  } catch (error: any) {
    console.error('❌ Failed to generate ZK proof:', error.message);
    process.exit(1);
  }

  // 5. Format proof for Solidity
  console.log('\n📝 Step 3/4: Formatting proof for Solidity...');
  const formattedProof = formatProofForSolidity(proofData.proof);
  console.log('✅ Proof formatted');

  // 6. Submit proof on-chain
  console.log('\n⛓️  Step 4/4: Submitting proof to contract...');
  console.log('   Contract will verify proof ON-CHAIN (trustless!)');
  
  try {
    // Estimate gas first
    const gasEstimate = await registry.submitProof.estimateGas(
      formattedProof.pA,
      formattedProof.pB,
      formattedProof.pC,
      proofData.publicSignals.slice(0, 4).map(s => BigInt(s))
    );
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);

    // Send transaction
    console.log('   Sending transaction...');
    const tx = await registry.submitProof(
      formattedProof.pA,
      formattedProof.pB,
      formattedProof.pC,
      proofData.publicSignals.slice(0, 4).map(s => BigInt(s))
    );
    
    console.log(`   TX hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

    // Check for events
    const tierUpdatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed?.name === 'TierUpdated';
      } catch {
        return false;
      }
    });

    if (tierUpdatedEvent) {
      const parsed = registry.interface.parseLog(tierUpdatedEvent);
      console.log(`\n🎉 Tier updated successfully!`);
      console.log(`   Old tier: ${parsed?.args[1]}`);
      console.log(`   New tier: ${parsed?.args[2]}`);
    }

    // Verify tier was updated
    const newTier = await registry.getTier(walletAddress);
    console.log(`   Verified tier: ${newTier}`);

  } catch (error: any) {
    console.error('❌ Failed to submit proof:', error.message);
    
    // Check if it was a proof rejection
    if (error.message.includes('Proof verification failed')) {
      console.error('\n❌ Proof verification failed on-chain!');
      console.error('   The ZK proof is cryptographically invalid.');
      console.error('   This could mean:');
      console.error('   1. Circuit mismatch (backend vs contract)');
      console.error('   2. Proof generation error');
      console.error('   3. Wrong verifier contract');
    }
    
    process.exit(1);
  }

  // 7. Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ SUCCESS - Proof verified on-chain, tier updated!');
  console.log('='.repeat(60));
  console.log(`Wallet:       ${walletAddress}`);
  console.log(`Score:        ${scoreData.score}/850`);
  console.log(`Tier:         ${scoreData.tier} (${scoreData.tierName})`);
  console.log(`Registry V2:  ${REGISTRY_V2_ADDRESS}`);
  console.log(`TX:           https://sepolia.basescan.org/tx/${receipt.hash}`);
  console.log('='.repeat(60));
  
  console.log('\n🎯 What just happened (V2 = Fully Decentralized):');
  console.log('   1. YOU scored your wallet (backend API)');
  console.log('   2. YOU generated a ZK proof (backend/local)');
  console.log('   3. YOU submitted proof to contract (your wallet)');
  console.log('   4. CONTRACT verified proof on-chain (trustless!) ✅');
  console.log('   5. CONTRACT updated your tier automatically');
  console.log('   6. NO backend owner key needed!');
  
  console.log('\n💡 Next step: Test borrowing!');
  console.log('   npm run test:borrow');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

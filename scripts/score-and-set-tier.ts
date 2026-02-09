#!/usr/bin/env ts-node
/**
 * Score-and-Set-Tier CLI Script
 * 
 * This is the "dirty but real" integration script that:
 * 1. Scores a wallet via backend API
 * 2. Generates a real ZK proof
 * 3. Writes the tier on-chain (Base Sepolia)
 * 
 * Usage:
 *   ts-node scripts/score-and-set-tier.ts 0x123...abc
 * 
 * Prerequisites:
 * - Backend running on localhost:3001
 * - PRIVATE_KEY in .env
 * - CREDIT_REGISTRY_ADDRESS in .env
 * - Base Sepolia ETH in deployer wallet
 */

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const REGISTRY_ADDRESS = process.env.CREDIT_REGISTRY_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

// CreditRegistry ABI (minimal - only what we need)
const REGISTRY_ABI = [
  'function setTier(address user, uint8 tier) external',
  'function getTier(address user) external view returns (uint8)',
  'event TierUpdated(address indexed user, uint8 oldTier, uint8 newTier, uint256 timestamp)',
];

interface ScoreResponse {
  score: number;
  tier: number;
  tierName: string;
  factors: Record<string, number>;
  timestamp: number;
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

async function main() {
  console.log('🚀 KarmaTrust Score-and-Set-Tier CLI\n');
  console.log('='.repeat(60));

  // 1. Validate inputs
  const walletAddress = process.argv[2];
  if (!walletAddress) {
    console.error('❌ Error: Wallet address required');
    console.log('\nUsage: ts-node scripts/score-and-set-tier.ts 0x123...abc');
    process.exit(1);
  }

  if (!ethers.isAddress(walletAddress)) {
    console.error('❌ Error: Invalid Ethereum address');
    process.exit(1);
  }

  if (!REGISTRY_ADDRESS) {
    console.error('❌ Error: CREDIT_REGISTRY_ADDRESS not set in .env');
    process.exit(1);
  }

  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Wallet:   ${walletAddress}`);
  console.log(`   Backend:  ${BACKEND_URL}`);
  console.log(`   Registry: ${REGISTRY_ADDRESS}`);
  console.log(`   Network:  Base Sepolia (${RPC_URL})`);
  console.log('='.repeat(60) + '\n');

  // 2. Score the wallet
  console.log('📊 Step 1/3: Scoring wallet...');
  let scoreData: ScoreResponse;
  try {
    const response = await axios.get(`${BACKEND_URL}/api/credit/score`, {
      params: { wallet: walletAddress },
      timeout: 30000,
    });
    scoreData = response.data.data;
    
    console.log(`✅ Score: ${scoreData.score}/850`);
    console.log(`✅ Tier: ${scoreData.tier} (${scoreData.tierName})`);
    console.log(`   Factors:`);
    Object.entries(scoreData.factors).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value.toFixed(2)}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to score wallet:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }

  // 3. Generate ZK proof
  console.log('\n🔐 Step 2/3: Generating ZK proof...');
  let proofData: ZKProofResponse;
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/zkp/generate`,
      {
        score: scoreData.score,
        tier: scoreData.tier,
      },
      { timeout: 60000 } // ZK proof can take a few seconds
    );
    proofData = response.data.data;
    
    console.log(`✅ Proof generated in ${proofData.generationTime}ms`);
    console.log(`   Public signals: ${proofData.publicSignals.length} elements`);
  } catch (error: any) {
    console.error('❌ Failed to generate ZK proof:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }

  // 4. Write tier on-chain
  console.log('\n⛓️  Step 3/3: Writing tier on-chain...');
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

    console.log(`   Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // Check current tier
    const currentTier = await registry.getTier(walletAddress);
    console.log(`   Current tier: ${currentTier}`);
    console.log(`   New tier: ${scoreData.tier}`);

    if (Number(currentTier) === scoreData.tier) {
      console.log('⚠️  Tier unchanged, skipping transaction');
    } else {
      // Send transaction
      console.log('   Sending transaction...');
      const tx = await registry.setTier(walletAddress, scoreData.tier);
      console.log(`   TX hash: ${tx.hash}`);
      console.log('   Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify tier was set
      const newTier = await registry.getTier(walletAddress);
      console.log(`   Verified tier: ${newTier}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to set tier on-chain:', error.message);
    if (error.transaction) {
      console.error('   Transaction:', error.transaction);
    }
    process.exit(1);
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ SUCCESS - Tier set on-chain!');
  console.log('='.repeat(60));
  console.log(`Wallet:     ${walletAddress}`);
  console.log(`Score:      ${scoreData.score}/850`);
  console.log(`Tier:       ${scoreData.tier} (${scoreData.tierName})`);
  console.log(`Registry:   ${REGISTRY_ADDRESS}`);
  console.log(`Explorer:   https://sepolia.basescan.org/address/${walletAddress}`);
  console.log('='.repeat(60));
  
  console.log('\n🎯 Next step: Test borrowing with reduced collateral!');
  console.log(`   cd contracts`);
  console.log(`   npx hardhat console --network baseSepolia`);
  console.log(`   > const lending = await ethers.getContractAt("KarmaTrustLending", "<LENDING_ADDRESS>")`);
  console.log(`   > await lending.borrow(ethers.parseEther("0.01"), { value: ethers.parseEther("0.013") })`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

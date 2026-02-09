#!/usr/bin/env ts-node
/**
 * Environment Checker Script
 * 
 * Validates that all prerequisites are met for running the integration:
 * - Environment variables are set
 * - Backend is running
 * - Contracts are deployed
 * - Wallet has sufficient balance
 * - ZK circuits are compiled
 * 
 * Usage:
 *   ts-node scripts/check-environment.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { ethers } from 'ethers';
import axios from 'axios';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const checks: CheckResult[] = [];

function addCheck(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  checks.push({ name, status, message });
}

async function main() {
  console.log('🔍 KarmaTrust Environment Checker\n');
  console.log('='.repeat(60));

  // 1. Check environment variables
  console.log('\n📋 Checking environment variables...');
  
  const requiredVars = [
    'PRIVATE_KEY',
    'CREDIT_REGISTRY_ADDRESS',
    'ETHERSCAN_API_KEY',
  ];

  const optionalVars = [
    'LENDING_CONTRACT_ADDRESS',
    'BASESCAN_API_KEY',
    'BASE_SEPOLIA_RPC',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addCheck(varName, 'pass', 'Set');
    } else {
      addCheck(varName, 'fail', 'Missing (required)');
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addCheck(varName, 'pass', 'Set');
    } else {
      addCheck(varName, 'warn', 'Missing (optional)');
    }
  }

  // 2. Check wallet balance
  console.log('\n💰 Checking wallet balance...');
  if (process.env.PRIVATE_KEY) {
    try {
      const rpc = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
      const provider = new ethers.JsonRpcProvider(rpc);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      
      const balanceEth = parseFloat(ethers.formatEther(balance));
      if (balanceEth > 0.01) {
        addCheck('Wallet Balance', 'pass', `${balanceEth.toFixed(4)} ETH (sufficient)`);
      } else if (balanceEth > 0) {
        addCheck('Wallet Balance', 'warn', `${balanceEth.toFixed(4)} ETH (may be low for multiple txs)`);
      } else {
        addCheck('Wallet Balance', 'fail', '0 ETH (need Base Sepolia ETH from faucet)');
      }
      
      console.log(`   Address: ${wallet.address}`);
    } catch (error: any) {
      addCheck('Wallet Balance', 'fail', `Error: ${error.message}`);
    }
  }

  // 3. Check backend
  console.log('\n🔧 Checking backend...');
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  try {
    const response = await axios.get(`${backendUrl}/api/health`, { timeout: 5000 });
    if (response.status === 200) {
      addCheck('Backend API', 'pass', `Running at ${backendUrl}`);
    } else {
      addCheck('Backend API', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addCheck('Backend API', 'fail', `Not reachable at ${backendUrl}`);
  }

  // 4. Check ZK circuits
  console.log('\n🔐 Checking ZK circuits...');
  const circuitPaths = [
    'circuits/build/tier_membership_js/tier_membership.wasm',
    'circuits/build/tier_membership_final.zkey',
    'circuits/build/state_transition_js/state_transition.wasm',
    'circuits/build/state_transition_final.zkey',
  ];

  let allCircuitsExist = true;
  for (const circuitPath of circuitPaths) {
    const fullPath = path.resolve(process.cwd(), circuitPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      addCheck(path.basename(circuitPath), 'pass', `${sizeMB} MB`);
    } else {
      addCheck(path.basename(circuitPath), 'fail', 'Missing');
      allCircuitsExist = false;
    }
  }

  if (!allCircuitsExist) {
    console.log('\n   💡 To build circuits: cd circuits && npm run build:circuits');
  }

  // 5. Check contracts
  console.log('\n⛓️  Checking contracts...');
  if (process.env.CREDIT_REGISTRY_ADDRESS) {
    const registryAddr = process.env.CREDIT_REGISTRY_ADDRESS;
    if (ethers.isAddress(registryAddr)) {
      try {
        const rpc = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const provider = new ethers.JsonRpcProvider(rpc);
        const code = await provider.getCode(registryAddr);
        
        if (code === '0x') {
          addCheck('CreditRegistry', 'fail', `No contract at ${registryAddr}`);
        } else {
          addCheck('CreditRegistry', 'pass', `Deployed at ${registryAddr}`);
        }
      } catch (error: any) {
        addCheck('CreditRegistry', 'warn', `Cannot verify: ${error.message}`);
      }
    } else {
      addCheck('CreditRegistry', 'fail', 'Invalid address format');
    }
  }

  if (process.env.LENDING_CONTRACT_ADDRESS) {
    const lendingAddr = process.env.LENDING_CONTRACT_ADDRESS;
    if (ethers.isAddress(lendingAddr)) {
      try {
        const rpc = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const provider = new ethers.JsonRpcProvider(rpc);
        const code = await provider.getCode(lendingAddr);
        
        if (code === '0x') {
          addCheck('KarmaTrustLending', 'fail', `No contract at ${lendingAddr}`);
        } else {
          const balance = await provider.getBalance(lendingAddr);
          const poolEth = parseFloat(ethers.formatEther(balance));
          addCheck('KarmaTrustLending', 'pass', `Deployed, pool: ${poolEth.toFixed(4)} ETH`);
        }
      } catch (error: any) {
        addCheck('KarmaTrustLending', 'warn', `Cannot verify: ${error.message}`);
      }
    } else {
      addCheck('KarmaTrustLending', 'fail', 'Invalid address format');
    }
  }

  // 6. Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 CHECK RESULTS');
  console.log('='.repeat(60));

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const check of checks) {
    let symbol = '';
    if (check.status === 'pass') {
      symbol = '✅';
      passCount++;
    } else if (check.status === 'warn') {
      symbol = '⚠️ ';
      warnCount++;
    } else {
      symbol = '❌';
      failCount++;
    }
    console.log(`${symbol} ${check.name.padEnd(30)} ${check.message}`);
  }

  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passCount}  ⚠️  Warnings: ${warnCount}  ❌ Failed: ${failCount}`);
  console.log('='.repeat(60));

  // 7. Recommendations
  if (failCount > 0) {
    console.log('\n💡 Action items:');
    
    for (const check of checks) {
      if (check.status === 'fail') {
        if (check.name === 'PRIVATE_KEY') {
          console.log('   - Add PRIVATE_KEY to .env file');
        } else if (check.name === 'CREDIT_REGISTRY_ADDRESS') {
          console.log('   - Deploy contracts: npm run deploy:base');
        } else if (check.name === 'Backend API') {
          console.log('   - Start backend: cd backend && npm run dev');
        } else if (check.name.includes('.wasm') || check.name.includes('.zkey')) {
          console.log('   - Build circuits: cd circuits && npm run build:circuits');
        } else if (check.name === 'Wallet Balance') {
          console.log('   - Get Base Sepolia ETH: https://faucet.quicknode.com/base/sepolia');
        }
      }
    }
  } else if (warnCount > 0) {
    console.log('\n✨ System is ready! Some optional items missing.');
  } else {
    console.log('\n✨ All checks passed! System is ready to use.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Score a wallet:');
    console.log('      npm run score-and-set 0xYOUR_ADDRESS');
    console.log('\n   2. Test borrowing:');
    console.log('      npm run test:borrow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

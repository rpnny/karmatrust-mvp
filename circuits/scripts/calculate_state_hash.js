/**
 * Calculate State Hash using Poseidon
 * 
 * This script calculates the correct Poseidon hash for testing the state_transition circuit.
 */

import { buildPoseidon } from 'circomlibjs';

async function calculateStateHash(score, level, salt) {
  const poseidon = await buildPoseidon();
  const hash = poseidon([BigInt(score), BigInt(level), BigInt(salt)]);
  return poseidon.F.toString(hash);
}

async function main() {
  console.log('=== Calculating State Hashes for Testing ===\n');
  
  // Test case: Silver (2) -> Gold (3) upgrade
  const oldScore = 50;
  const newScore = 65;
  const oldLevel = 2; // Silver
  const newLevel = 3; // Gold
  const salt = '12345678901234567890123456789012';
  
  console.log('Input Values:');
  console.log(`  Old Score: ${oldScore}`);
  console.log(`  New Score: ${newScore}`);
  console.log(`  Old Level: ${oldLevel} (Silver)`);
  console.log(`  New Level: ${newLevel} (Gold)`);
  console.log(`  Salt: ${salt}`);
  console.log('');
  
  const oldStateHash = await calculateStateHash(oldScore, oldLevel, salt);
  const newStateHash = await calculateStateHash(newScore, newLevel, salt);
  
  console.log('Calculated Hashes:');
  console.log(`  Old State Hash: ${oldStateHash}`);
  console.log(`  New State Hash: ${newStateHash}`);
  console.log('');
  
  // Generate complete input JSON
  const input = {
    // Private inputs
    oldScore: oldScore.toString(),
    newScore: newScore.toString(),
    salt: salt,
    onTimePayments: "10",
    debtRatio: "40",
    sybilScore: "45",
    
    // Public inputs
    oldStateHash: oldStateHash,
    newStateHash: newStateHash,
    fromLevel: oldLevel.toString(),
    toLevel: newLevel.toString(),
    minScoreRequired: "60",
    minPaymentsRequired: "6",
    maxDebtRatioAllowed: "50",
    minSybilScore: "35"
  };
  
  console.log('Complete Input JSON:');
  console.log(JSON.stringify(input, null, 2));
  console.log('');
  
  console.log('✅ Copy the above JSON to build/test_transition_input.json');
}

main().catch(console.error);

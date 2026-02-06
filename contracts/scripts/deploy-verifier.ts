/**
 * KarmaTrust Groth16 Verifier Deployment Script
 * 
 * This script:
 * 1. Deploys the Groth16Verifier contract (ZK proof verification)
 * 2. Links it to VCSMStateManager for on-chain verification
 * 
 * After running this:
 * - updateStateWithProof() can be called for TRUSTLESS on-chain verification
 * - No backend involvement needed in proof verification
 * - "Trust Math, Not Humans" ✅
 * 
 * Usage:
 * npx hardhat run scripts/deploy-verifier.ts --network sepolia
 */

import { ethers, network } from "hardhat";

// Existing VCSMStateManager address on Sepolia
// Update this after initial deployment
const VCSM_ADDRESS = process.env.VCSM_ADDRESS || "";

async function main() {
  console.log("🔐 KarmaTrust Groth16 Verifier Deployment");
  console.log("==========================================");
  console.log(`Network: ${network.name}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  // =========================================================================
  // Deploy Groth16Verifier
  // =========================================================================
  
  console.log("📦 Deploying Groth16Verifier...");
  console.log("   This contract verifies ZK proofs ON-CHAIN");
  console.log("   Generated from tier_membership.circom circuit");
  console.log("");
  
  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Groth16Verifier.deploy();
  await verifier.waitForDeployment();
  
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ Groth16Verifier deployed to: ${verifierAddress}`);

  // =========================================================================
  // Link to VCSMStateManager (if address provided)
  // =========================================================================
  
  if (VCSM_ADDRESS) {
    console.log("\n🔗 Linking Verifier to VCSMStateManager...");
    console.log(`   VCSMStateManager: ${VCSM_ADDRESS}`);
    
    const VCSMStateManager = await ethers.getContractFactory("VCSMStateManager");
    const stateManager = VCSMStateManager.attach(VCSM_ADDRESS);
    
    // Set the verifier address
    const tx = await stateManager.setZKPVerifier(verifierAddress);
    await tx.wait();
    
    console.log(`✅ ZKP Verifier linked to VCSMStateManager`);
    
    // Verify the link
    const configuredVerifier = await stateManager.zkpVerifier();
    console.log(`   Configured verifier: ${configuredVerifier}`);
  } else {
    console.log("\n⚠️  No VCSM_ADDRESS provided");
    console.log("   To link the verifier, run:");
    console.log(`   VCSM_ADDRESS=<your-vcsm-address> npx hardhat run scripts/deploy-verifier.ts --network ${network.name}`);
    console.log("");
    console.log("   Or manually call:");
    console.log(`   VCSMStateManager.setZKPVerifier("${verifierAddress}")`);
  }

  // =========================================================================
  // Test Verifier
  // =========================================================================
  
  console.log("\n🧪 Testing Verifier...");
  
  // This is a simple sanity check - real proof verification would need actual proof data
  // Just verify the contract is deployed and callable
  try {
    // Check the contract is responding
    const code = await ethers.provider.getCode(verifierAddress);
    console.log(`   Contract bytecode size: ${code.length / 2} bytes`);
    console.log(`   ✅ Verifier contract is live and callable`);
  } catch (error) {
    console.log(`   ❌ Error testing verifier: ${error}`);
  }

  // =========================================================================
  // Verification Commands
  // =========================================================================
  
  console.log("\n==========================================");
  console.log("📋 Deployment Summary");
  console.log("==========================================");
  console.log(`Groth16Verifier: ${verifierAddress}`);
  if (VCSM_ADDRESS) {
    console.log(`VCSMStateManager: ${VCSM_ADDRESS} (linked)`);
  }
  console.log("");
  
  console.log("📝 Etherscan Verification:");
  console.log(`npx hardhat verify --network ${network.name} ${verifierAddress}`);
  console.log("");
  
  console.log("🔑 What This Enables:");
  console.log("   - Users can call updateStateWithProof() directly");
  console.log("   - ZK proof verified ON-CHAIN by Groth16 verifier");
  console.log("   - No backend trust required for proof verification");
  console.log("   - Gas cost: ~250-300k per verification");
  console.log("");
  
  console.log("📖 Integration Example:");
  console.log(`
  // User submits proof directly to contract
  await stateManager.updateStateWithProof(
    proof.pi_a,    // G1 point
    proof.pi_b,    // G2 point  
    proof.pi_c,    // G1 point
    [tier, lowerBound, upperBound, commitment],  // Public signals
    newStateHash   // Commitment hash
  );
  `);

  return {
    network: network.name,
    verifier: verifierAddress,
    vcsmLinked: !!VCSM_ADDRESS,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

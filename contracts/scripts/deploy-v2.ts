/**
 * Deploy CreditRegistryV2 + KarmaTrustLending to Base Sepolia
 * 
 * This is the V2 deployment with on-chain ZK verification.
 * Users submit proofs themselves, no backend owner key needed.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-v2.ts --network baseSepolia
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying KarmaTrust V2 (with on-chain ZK verification) to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy Groth16Verifier
  console.log("📦 Deploying Groth16Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ Groth16Verifier deployed at:", verifierAddress);

  // 2. Deploy CreditRegistryV2
  console.log("\n📦 Deploying CreditRegistryV2...");
  const CreditRegistryV2 = await ethers.getContractFactory("CreditRegistryV2");
  const registry = await CreditRegistryV2.deploy(verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ CreditRegistryV2 deployed at:", registryAddress);

  // 3. Deploy KarmaTrustLending (can reuse V1, just points to V2 registry)
  console.log("\n📦 Deploying KarmaTrustLending (V2-compatible)...");
  const KarmaTrustLending = await ethers.getContractFactory("KarmaTrustLending");
  const lending = await KarmaTrustLending.deploy(registryAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✅ KarmaTrustLending deployed at:", lendingAddress);

  // 4. Fund the lending pool
  console.log("\n💸 Funding lending pool with 0.1 ETH...");
  const fundTx = await lending.fund({ value: ethers.parseEther("0.1") });
  await fundTx.wait();
  console.log("✅ Pool funded");

  // 5. Summary
  console.log("\n" + "=".repeat(70));
  console.log("📋 V2 DEPLOYMENT SUMMARY");
  console.log("=".repeat(70));
  console.log("Network:           Base Sepolia (Chain ID: 84532)");
  console.log("Deployer:         ", deployer.address);
  console.log("Groth16Verifier:  ", verifierAddress);
  console.log("CreditRegistryV2: ", registryAddress);
  console.log("KarmaTrustLending:", lendingAddress);
  console.log("=".repeat(70));

  console.log("\n🔧 Next steps:");
  console.log("1. Update .env with:");
  console.log(`   VERIFIER_ADDRESS=${verifierAddress}`);
  console.log(`   CREDIT_REGISTRY_V2_ADDRESS=${registryAddress}`);
  console.log(`   LENDING_CONTRACT_ADDRESS=${lendingAddress}`);
  
  console.log("\n2. Verify contracts on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${verifierAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${registryAddress} ${verifierAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${lendingAddress} ${registryAddress}`);
  
  console.log("\n3. Test the V2 flow (fully decentralized):");
  console.log("   Step 1: Score wallet (backend API)");
  console.log("   Step 2: Generate ZK proof (local/backend)");
  console.log("   Step 3: User submits proof to CreditRegistryV2.submitProof()");
  console.log("   Step 4: Contract verifies proof ON-CHAIN ✨");
  console.log("   Step 5: If valid, tier updated automatically");
  console.log("   Step 6: User borrows with reduced collateral");
  
  console.log("\n🎯 Key difference from V1:");
  console.log("   V1: Backend owner calls registry.setTier() (centralized)");
  console.log("   V2: User calls registry.submitProof() (decentralized) ✅");
  console.log("       → Contract verifies proof on-chain");
  console.log("       → No trust in backend needed!");
  
  console.log("\n✨ V2 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

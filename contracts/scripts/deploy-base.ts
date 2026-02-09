/**
 * Deploy CreditRegistry + KarmaTrustLending to Base Sepolia
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-base.ts --network baseSepolia
 * 
 * This deploys the "dirty but real" MVP contracts.
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying KarmaTrust contracts to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy CreditRegistry
  console.log("📦 Deploying CreditRegistry...");
  const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ CreditRegistry deployed at:", registryAddress);

  // 2. Deploy KarmaTrustLending
  console.log("\n📦 Deploying KarmaTrustLending...");
  const KarmaTrustLending = await ethers.getContractFactory("KarmaTrustLending");
  const lending = await KarmaTrustLending.deploy(registryAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("✅ KarmaTrustLending deployed at:", lendingAddress);

  // 3. Fund the lending pool with 0.1 ETH
  console.log("\n💸 Funding lending pool with 0.1 ETH...");
  const fundTx = await lending.fund({ value: ethers.parseEther("0.1") });
  await fundTx.wait();
  console.log("✅ Pool funded");

  // 4. Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:          Base Sepolia (Chain ID: 84532)");
  console.log("Deployer:        ", deployer.address);
  console.log("CreditRegistry:  ", registryAddress);
  console.log("KarmaTrustLending:", lendingAddress);
  console.log("=".repeat(60));

  console.log("\n🔧 Next steps:");
  console.log("1. Update backend/.env with:");
  console.log(`   CREDIT_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`   LENDING_CONTRACT_ADDRESS=${lendingAddress}`);
  console.log("\n2. Verify contracts on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${registryAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${lendingAddress} ${registryAddress}`);
  
  console.log("\n3. Test the flow:");
  console.log("   - Score a wallet via backend API");
  console.log("   - Backend calls registry.setTier()");
  console.log("   - User calls lending.borrow() with reduced collateral");
  
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

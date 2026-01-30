/**
 * KarmaTrust Contract Deployment Script
 * 
 * Deploys:
 * 1. VCSMStateManager - Credit state storage
 * 2. TieredLending - Credit-based lending (optional)
 * 
 * Usage:
 * npx hardhat run scripts/deploy.ts --network sepolia
 */

import { ethers, network } from "hardhat";

async function main() {
  console.log("🚀 KarmaTrust Contract Deployment");
  console.log("=====================================");
  console.log(`Network: ${network.name}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  // =========================================================================
  // Deploy VCSMStateManager
  // =========================================================================
  
  console.log("📦 Deploying VCSMStateManager...");
  
  const VCSMStateManager = await ethers.getContractFactory("VCSMStateManager");
  const stateManager = await VCSMStateManager.deploy();
  await stateManager.waitForDeployment();
  
  const stateManagerAddress = await stateManager.getAddress();
  console.log(`✅ VCSMStateManager deployed to: ${stateManagerAddress}`);

  // =========================================================================
  // Deploy TieredLending
  // =========================================================================
  
  console.log("\n📦 Deploying TieredLending...");
  
  const TieredLending = await ethers.getContractFactory("TieredLending");
  const lending = await TieredLending.deploy(stateManagerAddress);
  await lending.waitForDeployment();
  
  const lendingAddress = await lending.getAddress();
  console.log(`✅ TieredLending deployed to: ${lendingAddress}`);

  // =========================================================================
  // Verification Info
  // =========================================================================
  
  console.log("\n=====================================");
  console.log("📋 Deployment Summary");
  console.log("=====================================");
  console.log(`VCSMStateManager: ${stateManagerAddress}`);
  console.log(`TieredLending:    ${lendingAddress}`);
  console.log("");
  
  // Generate verification commands
  console.log("📝 Verification Commands:");
  console.log(`npx hardhat verify --network ${network.name} ${stateManagerAddress}`);
  console.log(`npx hardhat verify --network ${network.name} ${lendingAddress} ${stateManagerAddress}`);
  console.log("");

  // =========================================================================
  // Test Interaction
  // =========================================================================
  
  console.log("🧪 Testing Contracts...");
  
  // Test state manager
  const levelName = await stateManager.getLevelName(3);
  console.log(`  Level 3 name: ${levelName}`);
  
  // Test lending config
  const goldConfig = await lending.getTierConfig(3);
  console.log(`  Gold tier collateral ratio: ${goldConfig[0]}bps (${Number(goldConfig[0]) / 100}%)`);
  
  // Test collateral calculation
  const [collateral, tier, ratio] = await lending.calculateRequiredCollateral(
    deployer.address,
    ethers.parseEther("1")
  );
  console.log(`  1 ETH borrow requires: ${ethers.formatEther(collateral)} ETH collateral (${Number(ratio) / 100}%)`);
  
  console.log("\n✅ All tests passed!");
  
  // =========================================================================
  // Save Deployment Info
  // =========================================================================
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      VCSMStateManager: stateManagerAddress,
      TieredLending: lendingAddress,
    },
  };
  
  console.log("\n📄 Deployment Info (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

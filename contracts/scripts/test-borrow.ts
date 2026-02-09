/**
 * Test Borrowing Script
 * 
 * Tests the end-to-end borrowing flow on Base Sepolia:
 * 1. Check user's credit tier
 * 2. Calculate required collateral based on tier
 * 3. Borrow funds with tier-based collateral
 * 
 * Usage:
 *   npx hardhat run scripts/test-borrow.ts --network baseSepolia
 * 
 * Prerequisites:
 * - LENDING_CONTRACT_ADDRESS in .env
 * - User wallet has credit tier set in CreditRegistry
 * - Lending pool has funds
 */

import { ethers } from "hardhat";

const LENDING_ADDRESS = process.env.LENDING_CONTRACT_ADDRESS;
const REGISTRY_ADDRESS = process.env.CREDIT_REGISTRY_ADDRESS;

async function main() {
  console.log("🧪 Testing KarmaTrust Lending on Base Sepolia\n");
  console.log("=".repeat(60));

  // Validation
  if (!LENDING_ADDRESS) {
    throw new Error("LENDING_CONTRACT_ADDRESS not set in .env");
  }
  if (!REGISTRY_ADDRESS) {
    throw new Error("CREDIT_REGISTRY_ADDRESS not set in .env");
  }

  const [borrower] = await ethers.getSigners();
  console.log("📋 Configuration:");
  console.log(`   Borrower:  ${borrower.address}`);
  console.log(`   Registry:  ${REGISTRY_ADDRESS}`);
  console.log(`   Lending:   ${LENDING_ADDRESS}`);
  
  const balance = await ethers.provider.getBalance(borrower.address);
  console.log(`   Balance:   ${ethers.formatEther(balance)} ETH`);
  console.log("=".repeat(60) + "\n");

  // Get contracts
  const registry = await ethers.getContractAt("CreditRegistry", REGISTRY_ADDRESS);
  const lending = await ethers.getContractAt("KarmaTrustLending", LENDING_ADDRESS);

  // 1. Check credit tier
  console.log("📊 Step 1/3: Checking credit tier...");
  const tier = await registry.getTier(borrower.address);
  
  if (tier === 0n) {
    console.error("❌ Error: No credit tier found for this address");
    console.log("\n💡 Run this first:");
    console.log(`   ts-node scripts/score-and-set-tier.ts ${borrower.address}`);
    process.exit(1);
  }

  const tierNames = ["Unrated", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  console.log(`✅ Credit tier: ${tier} (${tierNames[Number(tier)]})`);

  // 2. Get collateral ratio
  const collateralRatio = await lending.collateralRatio(tier);
  console.log(`✅ Collateral ratio: ${Number(collateralRatio) / 100}%`);

  // 3. Calculate borrow amounts
  const borrowAmount = ethers.parseEther("0.01"); // Borrow 0.01 ETH
  const requiredCollateral = (borrowAmount * collateralRatio) / 10000n;
  
  console.log(`\n💰 Borrowing details:`);
  console.log(`   Borrow amount:       ${ethers.formatEther(borrowAmount)} ETH`);
  console.log(`   Required collateral: ${ethers.formatEther(requiredCollateral)} ETH`);
  console.log(`   Savings vs Bronze:   ${ethers.formatEther((borrowAmount * 15000n / 10000n) - requiredCollateral)} ETH`);

  // 4. Check pool balance
  const poolBalance = await ethers.provider.getBalance(LENDING_ADDRESS);
  console.log(`\n💎 Pool status:`);
  console.log(`   Pool balance: ${ethers.formatEther(poolBalance)} ETH`);
  
  if (poolBalance < borrowAmount) {
    console.error("❌ Error: Insufficient pool funds");
    console.log("\n💡 Fund the pool first:");
    console.log(`   npx hardhat console --network baseSepolia`);
    console.log(`   > const lending = await ethers.getContractAt("KarmaTrustLending", "${LENDING_ADDRESS}")`);
    console.log(`   > await lending.fund({ value: ethers.parseEther("0.1") })`);
    process.exit(1);
  }

  // 5. Borrow
  console.log(`\n⛓️  Step 2/3: Borrowing ${ethers.formatEther(borrowAmount)} ETH...`);
  console.log(`   Sending ${ethers.formatEther(requiredCollateral)} ETH as collateral...`);
  
  const balanceBefore = await ethers.provider.getBalance(borrower.address);
  
  const tx = await lending.borrow(borrowAmount, {
    value: requiredCollateral,
  });
  console.log(`   TX hash: ${tx.hash}`);
  console.log("   Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt!.blockNumber}`);
  console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
  
  // 6. Verify balance change
  console.log(`\n📊 Step 3/3: Verifying balance change...`);
  const balanceAfter = await ethers.provider.getBalance(borrower.address);
  const gasCost = receipt!.gasUsed * receipt!.gasPrice;
  const netChange = balanceAfter - balanceBefore;
  const expectedChange = borrowAmount - requiredCollateral - gasCost;
  
  console.log(`   Balance before:  ${ethers.formatEther(balanceBefore)} ETH`);
  console.log(`   Balance after:   ${ethers.formatEther(balanceAfter)} ETH`);
  console.log(`   Net change:      ${ethers.formatEther(netChange)} ETH`);
  console.log(`   Expected:        ${ethers.formatEther(expectedChange)} ETH`);
  console.log(`   Gas cost:        ${ethers.formatEther(gasCost)} ETH`);
  
  const diff = netChange - expectedChange;
  if (diff < ethers.parseEther("0.0001") && diff > -ethers.parseEther("0.0001")) {
    console.log("✅ Balance change matches expected (within rounding error)");
  } else {
    console.log("⚠️  Balance change differs from expected");
  }

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ SUCCESS - Borrowed with tier-based collateral!");
  console.log("=".repeat(60));
  console.log(`Borrower:          ${borrower.address}`);
  console.log(`Credit tier:       ${tier} (${tierNames[Number(tier)]})`);
  console.log(`Borrowed:          ${ethers.formatEther(borrowAmount)} ETH`);
  console.log(`Collateral paid:   ${ethers.formatEther(requiredCollateral)} ETH`);
  console.log(`Collateral ratio:  ${Number(collateralRatio) / 100}%`);
  console.log(`TX:                https://sepolia.basescan.org/tx/${tx.hash}`);
  console.log("=".repeat(60));
  
  console.log("\n🎯 Key insight:");
  console.log(`   A Bronze user would need ${ethers.formatEther((borrowAmount * 15000n) / 10000n)} ETH collateral`);
  console.log(`   You only needed ${ethers.formatEther(requiredCollateral)} ETH`);
  console.log(`   Savings: ${ethers.formatEther((borrowAmount * 15000n / 10000n) - requiredCollateral)} ETH (${((1 - Number(collateralRatio) / 15000) * 100).toFixed(2)}%)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });

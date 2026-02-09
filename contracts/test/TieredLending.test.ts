/**
 * TieredLending Contract Tests
 * 
 * Tests:
 * - Tier configurations
 * - Borrowing with different tiers
 * - Collateral calculations
 * - Repayment
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { VCSMStateManager, TieredLending } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TieredLending", function () {
  let stateManager: VCSMStateManager;
  let lending: TieredLending;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const SAMPLE_HASH = ethers.keccak256(ethers.toUtf8Bytes("test_state"));

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy StateManager
    const VCSMStateManager = await ethers.getContractFactory("VCSMStateManager");
    stateManager = await VCSMStateManager.deploy();
    await stateManager.waitForDeployment();

    // Deploy Lending
    const TieredLending = await ethers.getContractFactory("TieredLending");
    lending = await TieredLending.deploy(await stateManager.getAddress());
    await lending.waitForDeployment();
  });

  describe("Tier Configurations", function () {
    it("Should have correct Bronze config", async function () {
      const config = await lending.getTierConfig(1);
      expect(config.collateralRatioBps).to.equal(15000); // 150%
    });

    it("Should have correct Gold config", async function () {
      const config = await lending.getTierConfig(3);
      expect(config.collateralRatioBps).to.equal(12500); // 125%
    });

    it("Should have correct Diamond config", async function () {
      const config = await lending.getTierConfig(5);
      expect(config.collateralRatioBps).to.equal(11000); // 110%
    });
  });

  describe("Collateral Calculations", function () {
    it("Should calculate Bronze collateral (150%)", async function () {
      // Initialize user as Bronze
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 1);

      const borrowAmount = ethers.parseEther("1");
      const [collateral, tier, ratio] = await lending.calculateRequiredCollateral(
        user1.address,
        borrowAmount
      );

      expect(tier).to.equal(1);
      expect(ratio).to.equal(15000);
      expect(collateral).to.equal(ethers.parseEther("1.5"));
    });

    it("Should calculate Gold collateral (125%)", async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 3);

      const borrowAmount = ethers.parseEther("1");
      const [collateral, tier, ratio] = await lending.calculateRequiredCollateral(
        user1.address,
        borrowAmount
      );

      expect(tier).to.equal(3);
      expect(ratio).to.equal(12500);
      expect(collateral).to.equal(ethers.parseEther("1.25"));
    });

    it("Should calculate Diamond collateral (110%)", async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 5);

      const borrowAmount = ethers.parseEther("1");
      const [collateral, tier, ratio] = await lending.calculateRequiredCollateral(
        user1.address,
        borrowAmount
      );

      expect(tier).to.equal(5);
      expect(ratio).to.equal(11000);
      expect(collateral).to.equal(ethers.parseEther("1.1"));
    });
  });

  describe("Collateral Savings", function () {
    it("Should calculate savings for Gold vs Bronze", async function () {
      const borrowAmount = ethers.parseEther("10");
      const [base, tier, savings, percent] = await lending.getCollateralSavings(3, borrowAmount);

      expect(base).to.equal(ethers.parseEther("15"));    // 150% of 10
      expect(tier).to.equal(ethers.parseEther("12.5"));  // 125% of 10
      expect(savings).to.equal(ethers.parseEther("2.5")); // Difference
      expect(percent).to.equal(16); // 16.67% rounded
    });

    it("Should calculate savings for Diamond vs Bronze", async function () {
      const borrowAmount = ethers.parseEther("10");
      const [base, tier, savings, percent] = await lending.getCollateralSavings(5, borrowAmount);

      expect(base).to.equal(ethers.parseEther("15"));   // 150% of 10
      expect(tier).to.equal(ethers.parseEther("11"));   // 110% of 10
      expect(savings).to.equal(ethers.parseEther("4")); // Difference
      expect(percent).to.equal(26); // 26.67% rounded
    });
  });

  describe("Borrowing", function () {
    beforeEach(async function () {
      // Initialize user1 as Gold tier
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 3);
      
      // Fund the lending contract
      await owner.sendTransaction({
        to: await lending.getAddress(),
        value: ethers.parseEther("100"),
      });
    });

    it("Should allow borrowing with sufficient collateral", async function () {
      const borrowAmount = ethers.parseEther("1");
      const collateral = ethers.parseEther("1.3"); // More than 125%

      await expect(
        lending.connect(user1).borrow(borrowAmount, { value: collateral })
      ).to.emit(lending, "Borrowed");

      const position = await lending.getPosition(user1.address);
      expect(position.borrowed).to.equal(borrowAmount);
      expect(position.active).to.be.true;
    });

    it("Should reject borrowing with insufficient collateral", async function () {
      const borrowAmount = ethers.parseEther("1");
      const collateral = ethers.parseEther("1.1"); // Less than 125%

      await expect(
        lending.connect(user1).borrow(borrowAmount, { value: collateral })
      ).to.be.revertedWithCustomError(lending, "InsufficientCollateral");
    });

    it("Should reject borrowing without credit tier", async function () {
      const borrowAmount = ethers.parseEther("1");
      const collateral = ethers.parseEther("2");

      await expect(
        lending.connect(user2).borrow(borrowAmount, { value: collateral })
      ).to.be.revertedWithCustomError(lending, "InsufficientCredit");
    });
  });

  describe("Repayment", function () {
    beforeEach(async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 3);
      
      await owner.sendTransaction({
        to: await lending.getAddress(),
        value: ethers.parseEther("100"),
      });

      // Create a loan
      await lending.connect(user1).borrow(
        ethers.parseEther("1"),
        { value: ethers.parseEther("1.3") }
      );
    });

    it("Should allow full repayment", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      await expect(
        lending.connect(user1).repay({ value: ethers.parseEther("1") })
      ).to.emit(lending, "Repaid");

      const position = await lending.getPosition(user1.address);
      expect(position.active).to.be.false;
    });

    it("Should return collateral on repayment", async function () {
      // Get position before repay
      const position = await lending.getPosition(user1.address);
      const collateral = position.collateral;

      // Repay
      const tx = await lending.connect(user1).repay({ value: ethers.parseEther("1") });
      await tx.wait();

      // Position should be cleared
      const newPosition = await lending.getPosition(user1.address);
      expect(newPosition.active).to.be.false;
      expect(newPosition.collateral).to.equal(0);
    });
  });
});

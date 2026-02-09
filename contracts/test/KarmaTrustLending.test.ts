import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditRegistry, KarmaTrustLending } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KarmaTrustLending", function () {
  let registry: CreditRegistry;
  let lending: KarmaTrustLending;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy CreditRegistry
    const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
    registry = await CreditRegistry.deploy();
    
    // Deploy KarmaTrustLending
    const KarmaTrustLending = await ethers.getContractFactory("KarmaTrustLending");
    lending = await KarmaTrustLending.deploy(await registry.getAddress());
    
    // Fund the pool
    await lending.fund({ value: ethers.parseEther("10") });
  });

  describe("Deployment", function () {
    it("Should set the correct registry address", async function () {
      expect(await lending.registry()).to.equal(await registry.getAddress());
    });

    it("Should have correct collateral ratios", async function () {
      expect(await lending.collateralRatio(0)).to.equal(20000); // Unrated: 200%
      expect(await lending.collateralRatio(1)).to.equal(15000); // Bronze: 150%
      expect(await lending.collateralRatio(4)).to.equal(12500); // Platinum: 125%
    });
  });

  describe("borrow", function () {
    it("Should allow borrowing with correct collateral (Bronze)", async function () {
      // Set user1 to Bronze (tier 1)
      await registry.setTier(user1.address, 1);
      
      const borrowAmount = ethers.parseEther("1");
      const requiredCollateral = borrowAmount * 15000n / 10000n; // 150%
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await lending.connect(user1).borrow(borrowAmount, { 
        value: requiredCollateral 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // User should receive borrowAmount, minus collateral and gas
      expect(finalBalance).to.be.closeTo(
        initialBalance + borrowAmount - requiredCollateral - gasUsed,
        ethers.parseEther("0.0001") // Allow small rounding error
      );
    });

    it("Should allow borrowing with reduced collateral (Platinum)", async function () {
      // Set user1 to Platinum (tier 4)
      await registry.setTier(user1.address, 4);
      
      const borrowAmount = ethers.parseEther("1");
      const requiredCollateral = borrowAmount * 12500n / 10000n; // 125%
      
      await expect(
        lending.connect(user1).borrow(borrowAmount, { value: requiredCollateral })
      ).to.not.be.reverted;
    });

    it("Should emit Borrowed event", async function () {
      await registry.setTier(user1.address, 2);
      const borrowAmount = ethers.parseEther("0.5");
      const collateral = ethers.parseEther("0.7"); // 140%
      
      await expect(lending.connect(user1).borrow(borrowAmount, { value: collateral }))
        .to.emit(lending, "Borrowed")
        .withArgs(user1.address, borrowAmount, collateral, 2);
    });

    it("Should revert if no credit tier", async function () {
      await expect(
        lending.connect(user1).borrow(ethers.parseEther("1"), { 
          value: ethers.parseEther("2") 
        })
      ).to.be.revertedWith("No credit tier");
    });

    it("Should revert if insufficient collateral", async function () {
      await registry.setTier(user1.address, 1);
      const borrowAmount = ethers.parseEther("1");
      const insufficientCollateral = ethers.parseEther("1.4"); // Less than 150%
      
      await expect(
        lending.connect(user1).borrow(borrowAmount, { value: insufficientCollateral })
      ).to.be.revertedWith("Insufficient collateral");
    });

    it("Should revert if pool has insufficient funds", async function () {
      await registry.setTier(user1.address, 1);
      const borrowAmount = ethers.parseEther("100"); // More than pool
      const collateral = ethers.parseEther("150");
      
      await expect(
        lending.connect(user1).borrow(borrowAmount, { value: collateral })
      ).to.be.revertedWith("Insufficient pool");
    });
  });

  describe("Tier-based collateral differences", function () {
    it("Should demonstrate collateral savings for higher tiers", async function () {
      const borrowAmount = ethers.parseEther("1");
      
      // Bronze: 150%
      const bronzeCollateral = borrowAmount * 15000n / 10000n;
      expect(bronzeCollateral).to.equal(ethers.parseEther("1.5"));
      
      // Platinum: 125%
      const platinumCollateral = borrowAmount * 12500n / 10000n;
      expect(platinumCollateral).to.equal(ethers.parseEther("1.25"));
      
      // Savings: 0.25 ETH (16.67% reduction)
      const savings = bronzeCollateral - platinumCollateral;
      expect(savings).to.equal(ethers.parseEther("0.25"));
    });
  });

  describe("fund", function () {
    it("Should allow owner to fund pool", async function () {
      const initialBalance = await ethers.provider.getBalance(await lending.getAddress());
      await lending.fund({ value: ethers.parseEther("5") });
      const finalBalance = await ethers.provider.getBalance(await lending.getAddress());
      
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("5"));
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        lending.connect(user1).fund({ value: ethers.parseEther("1") })
      ).to.be.reverted;
    });
  });

  describe("withdraw", function () {
    it("Should allow owner to withdraw from pool", async function () {
      await lending.withdraw(ethers.parseEther("1"));
      // Should not revert
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        lending.connect(user1).withdraw(ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });

  describe("Pausable", function () {
    it("Should pause and block borrowing", async function () {
      await registry.setTier(user1.address, 3);
      await lending.pause();
      await expect(
        lending.connect(user1).borrow(ethers.parseEther("1"), {
          value: ethers.parseEther("1.5"),
        })
      ).to.be.revertedWithCustomError(lending, "EnforcedPause");
    });

    it("Should unpause and allow borrowing again", async function () {
      await registry.setTier(user1.address, 3);
      await lending.pause();
      await lending.unpause();
      await expect(
        lending.connect(user1).borrow(ethers.parseEther("1"), {
          value: ethers.parseEther("1.5"),
        })
      ).to.not.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      await expect(lending.connect(user1).pause()).to.be.reverted;
    });
  });
});

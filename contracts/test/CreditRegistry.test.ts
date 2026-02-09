import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CreditRegistry", function () {
  let registry: CreditRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
    registry = await CreditRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should grant admin and operator roles to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const OPERATOR_ROLE = await registry.OPERATOR_ROLE();
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(OPERATOR_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct tier constants", async function () {
      expect(await registry.TIER_UNRATED()).to.equal(0);
      expect(await registry.TIER_BRONZE()).to.equal(1);
      expect(await registry.TIER_DIAMOND()).to.equal(5);
    });
  });

  describe("setTier", function () {
    it("Should set tier for a user", async function () {
      await registry.setTier(user1.address, 3); // Gold
      expect(await registry.creditTier(user1.address)).to.equal(3);
    });

    it("Should emit TierUpdated event", async function () {
      const tx = await registry.setTier(user1.address, 4);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(registry, "TierUpdated")
        .withArgs(user1.address, 0, 4, block!.timestamp);
    });

    it("Should revert if tier is invalid", async function () {
      await expect(registry.setTier(user1.address, 6)).to.be.revertedWith("Invalid tier");
    });

    it("Should revert if not called by operator", async function () {
      await expect(registry.connect(user1).setTier(user2.address, 2)).to.be.reverted;
    });

    it("Should allow granted operator to set tiers", async function () {
      const OPERATOR_ROLE = await registry.OPERATOR_ROLE();
      await registry.grantRole(OPERATOR_ROLE, user1.address);
      await registry.connect(user1).setTier(user2.address, 3);
      expect(await registry.creditTier(user2.address)).to.equal(3);
    });
  });

  describe("batchSetTiers", function () {
    it("Should set tiers for multiple users", async function () {
      await registry.batchSetTiers([user1.address, user2.address], [2, 4]);
      expect(await registry.creditTier(user1.address)).to.equal(2);
      expect(await registry.creditTier(user2.address)).to.equal(4);
    });

    it("Should revert if arrays length mismatch", async function () {
      await expect(registry.batchSetTiers([user1.address], [2, 3])).to.be.revertedWith("Length mismatch");
    });
  });

  describe("getTier", function () {
    it("Should return 0 for unrated users", async function () {
      expect(await registry.getTier(user1.address)).to.equal(0);
    });

    it("Should return correct tier after setting", async function () {
      await registry.setTier(user1.address, 5);
      expect(await registry.getTier(user1.address)).to.equal(5);
    });
  });

  describe("Pausable", function () {
    it("Should pause and block setTier", async function () {
      await registry.pause();
      await expect(registry.setTier(user1.address, 3)).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should unpause and allow setTier again", async function () {
      await registry.pause();
      await registry.unpause();
      await registry.setTier(user1.address, 3);
      expect(await registry.creditTier(user1.address)).to.equal(3);
    });

    it("Should block batchSetTiers when paused", async function () {
      await registry.pause();
      await expect(
        registry.batchSetTiers([user1.address], [2])
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("Should only allow admin to pause", async function () {
      await expect(registry.connect(user1).pause()).to.be.reverted;
    });
  });
});

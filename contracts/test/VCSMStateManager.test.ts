/**
 * VCSMStateManager Contract Tests
 * 
 * Tests:
 * - State initialization
 * - State updates
 * - Attester functionality
 * - Level queries
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { VCSMStateManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("VCSMStateManager", function () {
  let stateManager: VCSMStateManager;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let attester: SignerWithAddress;

  const SAMPLE_HASH = ethers.keccak256(ethers.toUtf8Bytes("test_state_hash"));
  const SAMPLE_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("test_state_hash_2"));

  beforeEach(async function () {
    [owner, user1, user2, attester] = await ethers.getSigners();

    const VCSMStateManager = await ethers.getContractFactory("VCSMStateManager");
    stateManager = await VCSMStateManager.deploy();
    await stateManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await stateManager.owner()).to.equal(owner.address);
    });

    it("Should set owner as trusted attester", async function () {
      expect(await stateManager.trustedAttesters(owner.address)).to.be.true;
    });

    it("Should start with zero users", async function () {
      expect(await stateManager.totalUsers()).to.equal(0);
    });
  });

  describe("State Initialization", function () {
    it("Should allow user to initialize state", async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 2);

      const state = await stateManager.getState(user1.address);
      expect(state.stateHash).to.equal(SAMPLE_HASH);
      expect(state.level).to.equal(2);
      expect(state.version).to.equal(1);
      expect(state.initialized).to.be.true;
    });

    it("Should increment total users", async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 2);
      expect(await stateManager.totalUsers()).to.equal(1);
    });

    it("Should emit StateInitialized event", async function () {
      await expect(stateManager.connect(user1).initializeState(SAMPLE_HASH, 2))
        .to.emit(stateManager, "StateInitialized")
        // Timestamp is block-dependent; assert it's present rather than exact.
        .withArgs(user1.address, SAMPLE_HASH, 2, anyValue);
    });

    it("Should reject duplicate initialization", async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 2);
      await expect(
        stateManager.connect(user1).initializeState(SAMPLE_HASH, 3)
      ).to.be.revertedWithCustomError(stateManager, "AlreadyInitialized");
    });

    it("Should reject invalid level", async function () {
      await expect(
        stateManager.connect(user1).initializeState(SAMPLE_HASH, 6)
      ).to.be.revertedWithCustomError(stateManager, "InvalidLevel");
    });

    it("Should reject zero hash", async function () {
      await expect(
        stateManager.connect(user1).initializeState(ethers.ZeroHash, 2)
      ).to.be.revertedWithCustomError(stateManager, "InvalidStateHash");
    });
  });

  describe("State Updates", function () {
    beforeEach(async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 2);
    });

    it("Should allow user to update state", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await stateManager.connect(user1).updateState(SAMPLE_HASH_2, 3, proofHash);

      const state = await stateManager.getState(user1.address);
      expect(state.stateHash).to.equal(SAMPLE_HASH_2);
      expect(state.level).to.equal(3);
      expect(state.version).to.equal(2);
    });

    it("Should emit StateUpdated event", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await expect(stateManager.connect(user1).updateState(SAMPLE_HASH_2, 3, proofHash))
        .to.emit(stateManager, "StateUpdated");
    });

    it("Should reject update for uninitialized user", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await expect(
        stateManager.connect(user2).updateState(SAMPLE_HASH_2, 3, proofHash)
      ).to.be.revertedWithCustomError(stateManager, "NotInitialized");
    });
  });

  describe("Attester Functionality", function () {
    it("Should allow owner to add attester", async function () {
      await stateManager.setTrustedAttester(attester.address, true);
      expect(await stateManager.trustedAttesters(attester.address)).to.be.true;
    });

    it("Should allow attester to attest state", async function () {
      await stateManager.setTrustedAttester(attester.address, true);
      await stateManager.connect(attester).attestState(user1.address, SAMPLE_HASH, 3);

      const state = await stateManager.getState(user1.address);
      expect(state.level).to.equal(3);
      expect(state.initialized).to.be.true;
    });

    it("Should reject attestation from non-attester", async function () {
      await expect(
        stateManager.connect(user2).attestState(user1.address, SAMPLE_HASH, 3)
      ).to.be.revertedWithCustomError(stateManager, "Unauthorized");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await stateManager.connect(user1).initializeState(SAMPLE_HASH, 3);
    });

    it("Should return correct level", async function () {
      expect(await stateManager.getLevel(user1.address)).to.equal(3);
    });

    it("Should return level name", async function () {
      expect(await stateManager.getLevelName(3)).to.equal("Gold");
    });

    it("Should check level requirement correctly", async function () {
      expect(await stateManager.meetsLevelRequirement(user1.address, 2)).to.be.true;
      expect(await stateManager.meetsLevelRequirement(user1.address, 3)).to.be.true;
      expect(await stateManager.meetsLevelRequirement(user1.address, 4)).to.be.false;
    });
  });

  // Helper function
  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block?.timestamp || 0;
  }
});

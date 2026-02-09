// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Groth16Verifier.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CreditRegistryV2
 * @notice Fully decentralized credit tier registry with on-chain ZK verification
 * @dev Users submit ZK proofs, contract verifies on-chain, no owner privilege needed
 * 
 * Security features:
 * - Pausable: Emergency stop for discovered vulnerabilities
 * - AccessControl: Admin can pause/unpause, upgrade verifier
 * - Rate limiting: 24-hour cooldown between proof submissions
 * 
 * Key improvement over V1:
 * V1: Backend has owner key, calls setTier() (centralized)
 * V2: Users submit proof, contract verifies (decentralized) ✅
 */
contract CreditRegistryV2 is Pausable, AccessControl {
    /// @notice Tier levels
    uint8 public constant TIER_UNRATED = 0;
    uint8 public constant TIER_BRONZE = 1;
    uint8 public constant TIER_SILVER = 2;
    uint8 public constant TIER_GOLD = 3;
    uint8 public constant TIER_PLATINUM = 4;
    uint8 public constant TIER_DIAMOND = 5;

    /// @notice Role for emergency operations
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    /// @notice Groth16 verifier contract
    Groth16Verifier public immutable verifier;

    /// @notice Mapping from user address to credit tier
    mapping(address => uint8) public creditTier;

    /// @notice Last proof submission timestamp per user (anti-spam)
    mapping(address => uint256) public lastProofTime;

    /// @notice Minimum time between proof submissions (24 hours)
    uint256 public constant MIN_PROOF_INTERVAL = 24 hours;

    /// @notice Event emitted when tier is updated via proof
    event TierUpdated(
        address indexed user,
        uint8 oldTier,
        uint8 newTier,
        uint256 timestamp
    );

    /// @notice Event emitted when proof verification fails
    event ProofRejected(
        address indexed user,
        uint8 claimedTier,
        string reason
    );

    /**
     * @notice Constructor
     * @param _verifier Address of Groth16Verifier contract
     */
    constructor(address _verifier) {
        require(_verifier != address(0), "Invalid verifier address");
        verifier = Groth16Verifier(_verifier);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    /**
     * @notice Submit ZK proof to update credit tier
     * @param _pA Proof component A
     * @param _pB Proof component B
     * @param _pC Proof component C
     * @param _pubSignals Public signals [tier, lowerBound, upperBound, commitment]
     * 
     * Public signals format:
     * - pubSignals[0]: tier (1-5)
     * - pubSignals[1]: lowerBound (min score for tier)
     * - pubSignals[2]: upperBound (max score for tier)
     * - pubSignals[3]: commitment (Poseidon hash of score + salt)
     * 
     * The circuit proves:
     * - User has a score that qualifies for the claimed tier
     * - Score is within [lowerBound, upperBound]
     * - Commitment matches Poseidon(score, salt)
     * - Anti-sybil checks passed
     */
    function submitProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external whenNotPaused {
        // Anti-spam: Rate limit proof submissions
        require(
            block.timestamp >= lastProofTime[msg.sender] + MIN_PROOF_INTERVAL,
            "Too soon since last proof"
        );

        // Extract tier from public signals
        uint8 claimedTier = uint8(_pubSignals[0]);
        
        // Validate tier range
        require(claimedTier >= TIER_BRONZE && claimedTier <= TIER_DIAMOND, "Invalid tier");

        // Verify ZK proof on-chain
        bool isValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        
        if (!isValid) {
            emit ProofRejected(msg.sender, claimedTier, "Invalid proof");
            revert("Proof verification failed");
        }

        // Update tier
        uint8 oldTier = creditTier[msg.sender];
        creditTier[msg.sender] = claimedTier;
        lastProofTime[msg.sender] = block.timestamp;

        emit TierUpdated(msg.sender, oldTier, claimedTier, block.timestamp);
    }

    /**
     * @notice Get tier for a user
     * @param user User address
     * @return tier Credit tier (0-5)
     */
    function getTier(address user) external view returns (uint8) {
        return creditTier[user];
    }

    /**
     * @notice Check if user can submit a new proof
     * @param user User address
     * @return canSubmit Whether user can submit now
     * @return timeUntilNext Time until next submission allowed (0 if can submit now)
     */
    function canSubmitProof(address user) external view returns (bool canSubmit, uint256 timeUntilNext) {
        uint256 nextAllowedTime = lastProofTime[user] + MIN_PROOF_INTERVAL;
        
        if (block.timestamp >= nextAllowedTime) {
            return (true, 0);
        } else {
            return (false, nextAllowedTime - block.timestamp);
        }
    }

    /**
     * @notice Batch query tiers for multiple users
     * @param users Array of user addresses
     * @return tiers Array of tiers
     */
    function getTiers(address[] calldata users) external view returns (uint8[] memory tiers) {
        tiers = new uint8[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            tiers[i] = creditTier[users[i]];
        }
    }

    /// @notice Pause all proof submissions (emergency)
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /// @notice Unpause proof submissions
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

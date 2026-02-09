// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CreditRegistry
 * @notice Production-grade credit tier registry for KarmaTrust
 * @dev Stores tier (1-5) with AccessControl + Pausable.
 * 
 * Roles:
 * - DEFAULT_ADMIN_ROLE: Can grant/revoke roles, pause/unpause
 * - OPERATOR_ROLE: Can set tiers (backend, oracle, etc.)
 * 
 * Security: Pausable in case of emergency (oracle compromise, etc.)
 */
contract CreditRegistry is AccessControl, Pausable {
    /// @notice Role for operators who can set tiers
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Tier levels
    uint8 public constant TIER_UNRATED = 0;
    uint8 public constant TIER_BRONZE = 1;
    uint8 public constant TIER_SILVER = 2;
    uint8 public constant TIER_GOLD = 3;
    uint8 public constant TIER_PLATINUM = 4;
    uint8 public constant TIER_DIAMOND = 5;

    /// @notice Mapping from user address to credit tier
    mapping(address => uint8) public creditTier;

    /// @notice Event emitted when tier is updated
    event TierUpdated(address indexed user, uint8 oldTier, uint8 newTier, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @notice Set credit tier for a user
     * @param user User address
     * @param tier Credit tier (0-5)
     * @dev Only OPERATOR_ROLE can call this
     */
    function setTier(address user, uint8 tier) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(tier <= TIER_DIAMOND, "Invalid tier");
        
        uint8 oldTier = creditTier[user];
        creditTier[user] = tier;
        
        emit TierUpdated(user, oldTier, tier, block.timestamp);
    }

    /**
     * @notice Batch set tiers (gas optimization)
     * @param users Array of user addresses
     * @param tiers Array of tiers
     */
    function batchSetTiers(address[] calldata users, uint8[] calldata tiers) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(users.length == tiers.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(tiers[i] <= TIER_DIAMOND, "Invalid tier");
            uint8 oldTier = creditTier[users[i]];
            creditTier[users[i]] = tiers[i];
            emit TierUpdated(users[i], oldTier, tiers[i], block.timestamp);
        }
    }

    /**
     * @notice Get tier for a user
     * @param user User address
     * @return tier Credit tier (0-5)
     */
    function getTier(address user) external view returns (uint8) {
        return creditTier[user];
    }

    /// @notice Pause all tier updates (emergency)
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause tier updates
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

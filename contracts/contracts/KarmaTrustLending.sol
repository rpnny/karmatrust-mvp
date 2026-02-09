// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Interface for reading credit tiers (compatible with V1 and V2)
interface ICreditRegistry {
    function creditTier(address user) external view returns (uint8);
    function getTier(address user) external view returns (uint8);
}

/**
 * @title KarmaTrustLending
 * @notice ULTRA-MINIMAL lending contract with emergency controls
 * @dev The ONLY goal: Prove "higher tier = lower collateral"
 * 
 * INTENTIONALLY OMITTED (per user feedback):
 * - No interest rate models
 * - No liquidation logic
 * - No repayment schedules
 * 
 * Security: Pausable + ReentrancyGuard + Ownable
 */
contract KarmaTrustLending is Ownable, ReentrancyGuard, Pausable {
    /// @notice Registry for reading credit tiers (works with V1 and V2)
    ICreditRegistry public registry;

    /// @notice Collateral ratios in basis points (1 bp = 0.01%)
    /// e.g. 15000 = 150% collateral
    mapping(uint8 => uint256) public collateralRatio;

    event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint8 tier);

    constructor(address _registry) Ownable(msg.sender) {
        registry = ICreditRegistry(_registry);
        
        // Tier-based collateral requirements
        collateralRatio[0] = 20000;  // Unrated: 200%
        collateralRatio[1] = 15000;  // Bronze: 150%
        collateralRatio[2] = 14000;  // Silver: 140%
        collateralRatio[3] = 13000;  // Gold: 130%
        collateralRatio[4] = 12500;  // Platinum: 125%
        collateralRatio[5] = 12000;  // Diamond: 120%
    }

    /**
     * @notice Borrow funds based on credit tier
     * @param amount Amount to borrow
     * @dev Sends borrowed amount immediately. No interest, no liquidation.
     */
    function borrow(uint256 amount) external payable nonReentrant whenNotPaused {
        uint8 tier = registry.creditTier(msg.sender);
        require(tier > 0, "No credit tier");
        
        uint256 required = (amount * collateralRatio[tier]) / 10000;
        require(msg.value >= required, "Insufficient collateral");
        // Check pool balance BEFORE accepting collateral
        require(address(this).balance - msg.value >= amount, "Insufficient pool");
        
        payable(msg.sender).transfer(amount);
        
        emit Borrowed(msg.sender, amount, msg.value, tier);
    }

    /// @notice Fund the pool (owner only for now)
    function fund() external payable onlyOwner {}

    /// @notice Withdraw from pool (owner only for now)
    function withdraw(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    /// @notice Pause borrowing (emergency)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause borrowing
    function unpause() external onlyOwner {
        _unpause();
    }
}

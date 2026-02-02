// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 *                    ⚠️  REFERENCE IMPLEMENTATION ONLY  ⚠️
 * ============================================================================
 * 
 * This contract is a DEMONSTRATION of how lending protocols can integrate
 * with KarmaTrust/DAISY credit infrastructure. It is NOT part of the core
 * infrastructure offering.
 * 
 * KarmaTrust's Core Product (Infrastructure):
 * - VCSMStateManager.sol  → Credit state storage & verification
 * - EAS Attestations      → On-chain credentials
 * - ZK Proof System       → Privacy-preserving verification
 * 
 * This Contract (Example Application):
 * - Shows HOW to use KarmaTrust infrastructure
 * - Demonstrates collateral reduction based on credit tier
 * - Should be REPLACED by institution's own lending logic in production
 * 
 * Analogy:
 * - KarmaTrust = FICO (provides credit scores)
 * - TieredLending = Example Bank (makes lending decisions)
 * - In production: Banks/DeFi protocols write their OWN lending contracts
 *   and only CALL our VCSMStateManager for credit verification.
 * 
 * RESPONSIBILITY MODEL:
 * - KarmaTrust: Responsible for accurate credit scoring & attestations
 * - Institution: Responsible for lending decisions, risk management, compliance
 * 
 * ============================================================================
 * 
 * @title TieredLending
 * @notice EXAMPLE: Credit-tier based lending with reduced collateral requirements
 * 
 * @dev This contract demonstrates how credit tiers can reduce collateral requirements.
 * Higher credit tiers get better loan terms (lower collateral ratio).
 * 
 * Collateral Ratios by Tier:
 * - Bronze (1): 150% (standard DeFi)
 * - Silver (2): 140%
 * - Gold (3): 125%
 * - Platinum (4): 115%
 * - Diamond (5): 110%
 * 
 * This is the KEY VALUE PROPOSITION:
 * Instead of 150% collateral for everyone, creditworthy users get better rates.
 * 
 * MVP Note: Simplified for hackathon. Production would include:
 * - Interest calculations
 * - Liquidation mechanics
 * - Multi-asset support
 * - Oracle price feeds
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVCSMStateManager {
    function getLevel(address _user) external view returns (uint8);
    function meetsLevelRequirement(address _user, uint8 _minLevel) external view returns (bool);
}

contract TieredLending is Ownable, ReentrancyGuard {
    
    // =========================================================================
    // STRUCTS
    // =========================================================================
    
    /**
     * @notice Tier configuration for lending terms
     * @param collateralRatioBps Collateral ratio in basis points (15000 = 150%)
     * @param maxBorrowAmount Maximum amount user can borrow at this tier
     * @param interestRateBps Annual interest rate in basis points
     * @param enabled Whether this tier is enabled
     */
    struct TierConfig {
        uint256 collateralRatioBps;
        uint256 maxBorrowAmount;
        uint256 interestRateBps;
        bool enabled;
    }
    
    /**
     * @notice User's loan position
     */
    struct LoanPosition {
        uint256 borrowed;
        uint256 collateral;
        uint8 tierAtBorrow;
        uint64 borrowTime;
        bool active;
    }
    
    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    
    /// @notice VCSM State Manager contract
    IVCSMStateManager public stateManager;
    
    /// @notice Tier configurations (tier 1-5)
    mapping(uint8 => TierConfig) public tierConfigs;
    
    /// @notice User loan positions
    mapping(address => LoanPosition) public positions;
    
    /// @notice Total borrowed amount
    uint256 public totalBorrowed;
    
    /// @notice Total collateral locked
    uint256 public totalCollateral;
    
    /// @notice Minimum borrow amount
    uint256 public constant MIN_BORROW = 0.01 ether;
    
    // =========================================================================
    // EVENTS
    // =========================================================================
    
    event Borrowed(
        address indexed user,
        uint256 amount,
        uint256 collateral,
        uint8 tier,
        uint256 collateralRatio
    );
    
    event Repaid(
        address indexed user,
        uint256 amount,
        uint256 collateralReturned
    );
    
    event TierConfigUpdated(
        uint8 indexed tier,
        uint256 collateralRatioBps,
        uint256 maxBorrowAmount
    );
    
    // =========================================================================
    // ERRORS
    // =========================================================================
    
    error TierNotEnabled();
    error InsufficientCollateral();
    error ExceedsMaxBorrow();
    error ExistingLoan();
    error NoActiveLoan();
    error InvalidAmount();
    error TransferFailed();
    error InsufficientCredit();
    
    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================
    
    constructor(address _stateManager) Ownable(msg.sender) {
        stateManager = IVCSMStateManager(_stateManager);
        
        // Initialize tier configs
        // Collateral ratios decrease with higher tiers (better credit = less collateral)
        tierConfigs[1] = TierConfig({
            collateralRatioBps: 15000,  // 150% - Bronze
            maxBorrowAmount: 1 ether,
            interestRateBps: 1000,      // 10% APR
            enabled: true
        });
        
        tierConfigs[2] = TierConfig({
            collateralRatioBps: 14000,  // 140% - Silver
            maxBorrowAmount: 5 ether,
            interestRateBps: 800,       // 8% APR
            enabled: true
        });
        
        tierConfigs[3] = TierConfig({
            collateralRatioBps: 12500,  // 125% - Gold
            maxBorrowAmount: 20 ether,
            interestRateBps: 600,       // 6% APR
            enabled: true
        });
        
        tierConfigs[4] = TierConfig({
            collateralRatioBps: 11500,  // 115% - Platinum
            maxBorrowAmount: 50 ether,
            interestRateBps: 400,       // 4% APR
            enabled: true
        });
        
        tierConfigs[5] = TierConfig({
            collateralRatioBps: 11000,  // 110% - Diamond
            maxBorrowAmount: 100 ether,
            interestRateBps: 200,       // 2% APR
            enabled: true
        });
    }
    
    // =========================================================================
    // EXTERNAL FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Borrow ETH based on credit tier
     * @param _amount Amount to borrow
     */
    function borrow(uint256 _amount) external payable nonReentrant {
        if (_amount < MIN_BORROW) revert InvalidAmount();
        if (positions[msg.sender].active) revert ExistingLoan();
        
        // Get user's credit tier from VCSM
        uint8 userTier = stateManager.getLevel(msg.sender);
        if (userTier == 0) revert InsufficientCredit();
        
        TierConfig memory config = tierConfigs[userTier];
        if (!config.enabled) revert TierNotEnabled();
        if (_amount > config.maxBorrowAmount) revert ExceedsMaxBorrow();
        
        // Calculate required collateral
        uint256 requiredCollateral = (_amount * config.collateralRatioBps) / 10000;
        if (msg.value < requiredCollateral) revert InsufficientCollateral();
        
        // Create loan position
        positions[msg.sender] = LoanPosition({
            borrowed: _amount,
            collateral: msg.value,
            tierAtBorrow: userTier,
            borrowTime: uint64(block.timestamp),
            active: true
        });
        
        totalBorrowed += _amount;
        totalCollateral += msg.value;
        
        // Send borrowed amount to user
        (bool success, ) = msg.sender.call{value: _amount}("");
        if (!success) revert TransferFailed();
        
        emit Borrowed(
            msg.sender,
            _amount,
            msg.value,
            userTier,
            config.collateralRatioBps
        );
    }
    
    /**
     * @notice Repay loan and get collateral back
     */
    function repay() external payable nonReentrant {
        LoanPosition storage position = positions[msg.sender];
        if (!position.active) revert NoActiveLoan();
        
        // For MVP, simple full repayment (production would add interest)
        uint256 amountOwed = position.borrowed;
        if (msg.value < amountOwed) revert InvalidAmount();
        
        uint256 collateralToReturn = position.collateral;
        
        // Clear position
        totalBorrowed -= position.borrowed;
        totalCollateral -= position.collateral;
        
        position.borrowed = 0;
        position.collateral = 0;
        position.active = false;
        
        // Return collateral
        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        if (!success) revert TransferFailed();
        
        // Return excess payment
        if (msg.value > amountOwed) {
            (success, ) = msg.sender.call{value: msg.value - amountOwed}("");
            if (!success) revert TransferFailed();
        }
        
        emit Repaid(msg.sender, amountOwed, collateralToReturn);
    }
    
    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Get user's current loan position
     */
    function getPosition(address _user) external view returns (
        uint256 borrowed,
        uint256 collateral,
        uint8 tierAtBorrow,
        uint64 borrowTime,
        bool active
    ) {
        LoanPosition memory pos = positions[_user];
        return (pos.borrowed, pos.collateral, pos.tierAtBorrow, pos.borrowTime, pos.active);
    }
    
    /**
     * @notice Calculate required collateral for a borrow amount
     */
    function calculateRequiredCollateral(
        address _user,
        uint256 _borrowAmount
    ) external view returns (uint256 collateral, uint8 tier, uint256 ratioBps) {
        tier = stateManager.getLevel(_user);
        if (tier == 0) tier = 1; // Default to Bronze for uninitialized
        
        TierConfig memory config = tierConfigs[tier];
        ratioBps = config.collateralRatioBps;
        collateral = (_borrowAmount * ratioBps) / 10000;
    }
    
    /**
     * @notice Get tier configuration
     */
    function getTierConfig(uint8 _tier) external view returns (
        uint256 collateralRatioBps,
        uint256 maxBorrowAmount,
        uint256 interestRateBps,
        bool enabled
    ) {
        TierConfig memory config = tierConfigs[_tier];
        return (
            config.collateralRatioBps,
            config.maxBorrowAmount,
            config.interestRateBps,
            config.enabled
        );
    }
    
    /**
     * @notice Get collateral savings for a tier compared to base (Bronze)
     */
    function getCollateralSavings(uint8 _tier, uint256 _borrowAmount) external view returns (
        uint256 baseCollateral,
        uint256 tierCollateral,
        uint256 savings,
        uint256 savingsPercent
    ) {
        TierConfig memory baseConfig = tierConfigs[1];
        TierConfig memory tierConfig = tierConfigs[_tier];
        
        baseCollateral = (_borrowAmount * baseConfig.collateralRatioBps) / 10000;
        tierCollateral = (_borrowAmount * tierConfig.collateralRatioBps) / 10000;
        savings = baseCollateral - tierCollateral;
        savingsPercent = (savings * 100) / baseCollateral;
    }
    
    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================
    
    /**
     * @notice Update tier configuration
     */
    function setTierConfig(
        uint8 _tier,
        uint256 _collateralRatioBps,
        uint256 _maxBorrowAmount,
        uint256 _interestRateBps,
        bool _enabled
    ) external onlyOwner {
        tierConfigs[_tier] = TierConfig({
            collateralRatioBps: _collateralRatioBps,
            maxBorrowAmount: _maxBorrowAmount,
            interestRateBps: _interestRateBps,
            enabled: _enabled
        });
        
        emit TierConfigUpdated(_tier, _collateralRatioBps, _maxBorrowAmount);
    }
    
    /**
     * @notice Update state manager address
     */
    function setStateManager(address _stateManager) external onlyOwner {
        stateManager = IVCSMStateManager(_stateManager);
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}

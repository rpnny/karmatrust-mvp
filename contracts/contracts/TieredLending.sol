// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 *                    ⚠️  REFERENCE IMPLEMENTATION ONLY  ⚠️
 * ============================================================================
 *
 * NOTE:
 * This file is intentionally included under `contracts/contracts/` so it is
 * compiled by Hardhat and its tests run by default.
 *
 * The same reference implementation is also documented under `contracts/examples/`.
 * This contract is NOT the core product; it is an example integration.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVCSMStateManager {
    function getLevel(address _user) external view returns (uint8);
    function meetsLevelRequirement(address _user, uint8 _minLevel) external view returns (bool);
}

contract TieredLending is Ownable, ReentrancyGuard {
    struct TierConfig {
        uint256 collateralRatioBps;
        uint256 maxBorrowAmount;
        uint256 interestRateBps;
        bool enabled;
    }

    struct LoanPosition {
        uint256 borrowed;
        uint256 collateral;
        uint8 tierAtBorrow;
        uint64 borrowTime;
        bool active;
    }

    IVCSMStateManager public stateManager;
    mapping(uint8 => TierConfig) public tierConfigs;
    mapping(address => LoanPosition) public positions;

    uint256 public totalBorrowed;
    uint256 public totalCollateral;

    uint256 public constant MIN_BORROW = 0.01 ether;

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

    error TierNotEnabled();
    error InsufficientCollateral();
    error ExceedsMaxBorrow();
    error ExistingLoan();
    error NoActiveLoan();
    error InvalidAmount();
    error TransferFailed();
    error InsufficientCredit();

    constructor(address _stateManager) Ownable(msg.sender) {
        stateManager = IVCSMStateManager(_stateManager);

        tierConfigs[1] = TierConfig({
            collateralRatioBps: 15000,
            maxBorrowAmount: 1 ether,
            interestRateBps: 1000,
            enabled: true
        });

        tierConfigs[2] = TierConfig({
            collateralRatioBps: 14000,
            maxBorrowAmount: 5 ether,
            interestRateBps: 800,
            enabled: true
        });

        tierConfigs[3] = TierConfig({
            collateralRatioBps: 12500,
            maxBorrowAmount: 20 ether,
            interestRateBps: 600,
            enabled: true
        });

        tierConfigs[4] = TierConfig({
            collateralRatioBps: 11500,
            maxBorrowAmount: 50 ether,
            interestRateBps: 400,
            enabled: true
        });

        tierConfigs[5] = TierConfig({
            collateralRatioBps: 11000,
            maxBorrowAmount: 100 ether,
            interestRateBps: 200,
            enabled: true
        });
    }

    function borrow(uint256 _amount) external payable nonReentrant {
        if (_amount < MIN_BORROW) revert InvalidAmount();
        if (positions[msg.sender].active) revert ExistingLoan();

        uint8 userTier = stateManager.getLevel(msg.sender);
        if (userTier == 0) revert InsufficientCredit();

        TierConfig memory config = tierConfigs[userTier];
        if (!config.enabled) revert TierNotEnabled();
        if (_amount > config.maxBorrowAmount) revert ExceedsMaxBorrow();

        uint256 requiredCollateral = (_amount * config.collateralRatioBps) / 10000;
        if (msg.value < requiredCollateral) revert InsufficientCollateral();

        positions[msg.sender] = LoanPosition({
            borrowed: _amount,
            collateral: msg.value,
            tierAtBorrow: userTier,
            borrowTime: uint64(block.timestamp),
            active: true
        });

        totalBorrowed += _amount;
        totalCollateral += msg.value;

        (bool success, ) = msg.sender.call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit Borrowed(msg.sender, _amount, msg.value, userTier, config.collateralRatioBps);
    }

    function repay() external payable nonReentrant {
        LoanPosition storage position = positions[msg.sender];
        if (!position.active) revert NoActiveLoan();

        uint256 amountOwed = position.borrowed;
        if (msg.value < amountOwed) revert InvalidAmount();

        uint256 collateralToReturn = position.collateral;

        totalBorrowed -= position.borrowed;
        totalCollateral -= position.collateral;

        position.borrowed = 0;
        position.collateral = 0;
        position.active = false;

        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        if (!success) revert TransferFailed();

        if (msg.value > amountOwed) {
            (success, ) = msg.sender.call{value: msg.value - amountOwed}("");
            if (!success) revert TransferFailed();
        }

        emit Repaid(msg.sender, amountOwed, collateralToReturn);
    }

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

    function calculateRequiredCollateral(
        address _user,
        uint256 _borrowAmount
    ) external view returns (uint256 collateral, uint8 tier, uint256 ratioBps) {
        tier = stateManager.getLevel(_user);
        if (tier == 0) tier = 1;

        TierConfig memory config = tierConfigs[tier];
        ratioBps = config.collateralRatioBps;
        collateral = (_borrowAmount * ratioBps) / 10000;
    }

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

    function setStateManager(address _stateManager) external onlyOwner {
        stateManager = IVCSMStateManager(_stateManager);
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {}
}


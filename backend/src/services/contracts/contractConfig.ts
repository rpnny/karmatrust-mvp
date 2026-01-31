/**
 * KarmaTrust Smart Contract Configuration
 * 
 * This file contains deployed contract addresses and ABIs for interacting with
 * VCSMStateManager and TieredLending contracts on Sepolia testnet.
 */

// Contract Addresses (Sepolia)
export const SEPOLIA_CONTRACTS = {
  VCSMStateManager: '0x2113Dd751B588D807aA37e7D714864666d35E273',
  TieredLending: '0x37bA854436157064F6d502DBA620778336116725',
} as const;

// VCSMStateManager ABI (essential functions only)
export const VCSM_STATE_MANAGER_ABI = [
  'function initializeState(bytes32 _stateHash, uint8 _level) external',
  'function updateState(bytes32 _newStateHash, uint8 _newLevel, bytes32 _proofHash) external',
  'function attestState(address _user, bytes32 _newStateHash, uint8 _newLevel) external',
  'function getState(address _user) external view returns (bytes32 stateHash, uint8 level, uint64 version, uint64 updatedAt, bool initialized)',
  'function getLevel(address _user) external view returns (uint8)',
  'function getLevelName(uint8 _level) external view returns (string memory)',
  'function meetsLevelRequirement(address _user, uint8 _minLevel) external view returns (bool)',
  'function totalUsers() external view returns (uint256)',
  'event StateInitialized(address indexed user, bytes32 indexed stateHash, uint8 level, uint64 timestamp)',
  'event StateUpdated(address indexed user, bytes32 indexed oldHash, bytes32 indexed newHash, uint8 fromLevel, uint8 toLevel, uint64 version, bytes32 proofHash)',
] as const;

// TieredLending ABI (essential functions only)
export const TIERED_LENDING_ABI = [
  'function borrow(uint256 _amount) external payable',
  'function repay() external payable',
  'function getPosition(address _user) external view returns (uint256 borrowed, uint256 collateral, uint8 tierAtBorrow, uint64 borrowTime, bool active)',
  'function calculateRequiredCollateral(address _user, uint256 _borrowAmount) external view returns (uint256 collateral, uint8 tier, uint256 ratioBps)',
  'function getTierConfig(uint8 _tier) external view returns (uint256 collateralRatioBps, uint256 maxBorrowAmount, uint256 interestRateBps, bool enabled)',
  'function getCollateralSavings(uint8 _tier, uint256 _borrowAmount) external view returns (uint256 baseCollateral, uint256 tierCollateral, uint256 savings, uint256 savingsPercent)',
  'function totalBorrowed() external view returns (uint256)',
  'function totalCollateral() external view returns (uint256)',
  'event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint8 tier, uint256 collateralRatio)',
  'event Repaid(address indexed user, uint256 amount, uint256 collateralReturned)',
] as const;

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  explorerUrl: 'https://sepolia.etherscan.io',
} as const;

// Tier information
export const TIER_INFO = {
  1: { name: 'Bronze', collateralRatio: 150, maxBorrow: '1 ETH', interestRate: 10 },
  2: { name: 'Silver', collateralRatio: 140, maxBorrow: '5 ETH', interestRate: 8 },
  3: { name: 'Gold', collateralRatio: 125, maxBorrow: '20 ETH', interestRate: 6 },
  4: { name: 'Platinum', collateralRatio: 115, maxBorrow: '50 ETH', interestRate: 4 },
  5: { name: 'Diamond', collateralRatio: 110, maxBorrow: '100 ETH', interestRate: 2 },
} as const;

// Helper function to get explorer URLs
export function getContractExplorerUrl(contractName: keyof typeof SEPOLIA_CONTRACTS): string {
  return `${CHAIN_CONFIG.explorerUrl}/address/${SEPOLIA_CONTRACTS[contractName]}`;
}

export function getTxExplorerUrl(txHash: string): string {
  return `${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`;
}

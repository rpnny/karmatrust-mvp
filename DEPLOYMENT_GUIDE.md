# 🚀 KarmaTrust Base Sepolia Deployment Guide

## Prerequisites

1. **Private Key with Base Sepolia ETH**:
   - Get free Base Sepolia ETH from: https://faucet.quicknode.com/base/sepolia
   - Or: https://www.alchemy.com/faucets/base-sepolia
   - Need ~0.15 ETH for deployment + funding pool

2. **Basescan API Key** (for verification):
   - Sign up at: https://basescan.org/
   - Create API key: https://basescan.org/myapikey

3. **Environment Variables**:
   ```bash
   # In contracts/.env or root .env
   PRIVATE_KEY=0x...                        # Your deployment wallet private key
   BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY   # For contract verification
   ```

---

## Step 1: Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy-base.ts --network baseSepolia
```

**Expected Output**:
```
🚀 Deploying KarmaTrust contracts to Base Sepolia...

📝 Deploying with account: 0x...
💰 Account balance: 0.15 ETH

📦 Deploying CreditRegistry...
✅ CreditRegistry deployed at: 0xABC...

📦 Deploying KarmaTrustLending...
✅ KarmaTrustLending deployed at: 0xDEF...

💸 Funding lending pool with 0.1 ETH...
✅ Pool funded

============================================================
📋 DEPLOYMENT SUMMARY
============================================================
Network:          Base Sepolia (Chain ID: 84532)
Deployer:         0x...
CreditRegistry:   0xABC...
KarmaTrustLending: 0xDEF...
============================================================
```

**Save these addresses!** You'll need them for Step 2 and 3.

---

## Step 2: Verify Contracts on Basescan

```bash
# Verify CreditRegistry
npx hardhat verify --network baseSepolia 0xABC...

# Verify KarmaTrustLending (needs constructor arg: registry address)
npx hardhat verify --network baseSepolia 0xDEF... 0xABC...
```

**Expected Output**:
```
Successfully verified contract CreditRegistry on Etherscan.
https://sepolia.basescan.org/address/0xABC...#code

Successfully verified contract KarmaTrustLending on Etherscan.
https://sepolia.basescan.org/address/0xDEF...#code
```

---

## Step 3: Update Backend Configuration

```bash
# Edit backend/.env
CREDIT_REGISTRY_ADDRESS=0xABC...
LENDING_CONTRACT_ADDRESS=0xDEF...
BASE_SEPOLIA_RPC=https://sepolia.base.org
CHAIN_ID=84532
```

---

## Step 4: Test End-to-End Flow

### 4.1 Score a Wallet (Backend API)

```bash
curl http://localhost:3001/api/credit/score?wallet=0x123...abc
```

**Response**:
```json
{
  "score": 720,
  "tier": 3,  // Gold
  "tierName": "Gold",
  ...
}
```

### 4.2 Set Tier On-Chain (Backend calls contract)

**Option A**: Via API endpoint (if implemented):
```bash
curl -X POST http://localhost:3001/api/credit/set-tier \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x123...abc", "tier": 3}'
```

**Option B**: Direct Hardhat script:
```javascript
// scripts/set-tier.ts
const registry = await ethers.getContractAt("CreditRegistry", "0xABC...");
await registry.setTier("0x123...abc", 3); // Gold
console.log("Tier set!");
```

Run:
```bash
npx hardhat run scripts/set-tier.ts --network baseSepolia
```

### 4.3 Verify Tier On-Chain

```bash
npx hardhat console --network baseSepolia
```

```javascript
const registry = await ethers.getContractAt("CreditRegistry", "0xABC...");
const tier = await registry.getTier("0x123...abc");
console.log("Tier:", tier); // Should print: 3n (Gold)
```

### 4.4 Test Borrowing with Reduced Collateral

```javascript
const lending = await ethers.getContractAt("KarmaTrustLending", "0xDEF...");
const borrowAmount = ethers.parseEther("0.01"); // Borrow 0.01 ETH
const collateral = ethers.parseEther("0.013");  // 130% collateral (Gold tier)

await lending.borrow(borrowAmount, { value: collateral });
console.log("✅ Borrowed 0.01 ETH with only 0.013 ETH collateral!");
```

**Comparison**:
- **Unrated**: Would need 0.02 ETH collateral (200%)
- **Bronze**: Would need 0.015 ETH collateral (150%)
- **Gold**: Only needs 0.013 ETH collateral (130%) ✅

---

## Troubleshooting

### Error: "Insufficient funds for intrinsic transaction cost"
**Solution**: Your wallet needs more Base Sepolia ETH. Get from faucet (Step 0).

### Error: "ZK circuit files not found"
**Solution**: 
```bash
cd circuits
npm install
npm run build:circuits
```

### Error: "PRIVATE_KEY environment variable is required"
**Solution**: Add `PRIVATE_KEY=0x...` to your `.env` file.

### Error: "Contract creation code storage out of gas"
**Solution**: Your contract is too large. But our contracts are <60 lines, so this shouldn't happen!

### Verification Error: "Already Verified"
**Solution**: Contract is already verified! Check Basescan link.

---

## Expected Gas Costs (Base Sepolia)

| Action | Gas Cost | ETH Cost (1 gwei) |
|--------|----------|-------------------|
| Deploy CreditRegistry | ~400k gas | ~0.0004 ETH |
| Deploy KarmaTrustLending | ~600k gas | ~0.0006 ETH |
| Fund Pool (0.1 ETH) | 21k gas | 0.1 + 0.000021 ETH |
| setTier() | ~50k gas | ~0.00005 ETH |
| borrow() | ~80k gas | ~0.00008 ETH |
| **Total** | **~1.2M gas** | **~0.102 ETH** |

---

## Useful Links

- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Sepolia Faucet**: https://faucet.quicknode.com/base/sepolia
- **Base Docs**: https://docs.base.org
- **Hardhat Docs**: https://hardhat.org/docs

---

## Next Steps After Deployment

1. ✅ Contracts deployed & verified on Base Sepolia
2. ✅ Backend updated with contract addresses
3. 🔜 Build CLI script to automate: score → set tier → borrow (Week 3-4)
4. 🔜 Integrate with real lending protocol (Morpho) (Week 5-6)
5. 🔜 Add on-chain ZK verification (CreditRegistryV2) (Month 1 end)

---

## Security Notes

⚠️ **IMPORTANT**: This is MVP code. For production:

1. **Multi-sig for Registry**: Don't use single owner EOA
2. **Timelocks**: Add delay for tier updates
3. **Rate limiting**: Prevent spam tier updates
4. **Emergency pause**: Add Pausable to contracts
5. **Audit**: Get smart contract audit before mainnet deployment

**Current setup is for TESTNET ONLY.**

# ⚡ KarmaTrust Quickstart Guide

Get up and running with KarmaTrust in 5 minutes.

---

## 🎯 What You'll Achieve

1. Score a wallet and set its credit tier on Base Sepolia
2. Borrow funds with reduced collateral based on credit tier
3. See real savings (e.g., Platinum saves 16.7% collateral vs Bronze)

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- A wallet with some Base Sepolia ETH ([get from faucet](https://faucet.quicknode.com/base/sepolia))
- [Etherscan API key](https://etherscan.io/myapikey) (free)

---

## 🚀 Setup (5 minutes)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/karmatrust-mvp
cd karmatrust-mvp
npm install
```

### 2. Configure Environment

Create `.env` in the project root:

```bash
# Your deployment wallet
PRIVATE_KEY=0x...

# Etherscan API (for scoring wallets)
ETHERSCAN_API_KEY=YOUR_KEY_HERE

# After deployment, add these:
CREDIT_REGISTRY_ADDRESS=0x...
LENDING_CONTRACT_ADDRESS=0x...
```

### 3. Build ZK Circuits

```bash
cd circuits
npm install
npm run build:circuits
cd ..
```

**Expected time**: ~2-3 minutes  
**Output**: Circuit files in `circuits/build/`

### 4. Deploy Contracts

```bash
npm run deploy:base
```

**Expected output**:
```
✅ CreditRegistry deployed at: 0xABC...
✅ KarmaTrustLending deployed at: 0xDEF...
```

**Copy these addresses to your `.env`!**

### 5. Start Backend

```bash
cd backend
npm install
npm run dev
```

**Verify**: Open http://localhost:3001/api/health

---

## 🎮 Usage

### Check Environment

```bash
npx ts-node scripts/check-environment.ts
```

Should show mostly ✅. Fix any ❌ before continuing.

### Score a Wallet and Set Tier

```bash
npm run score-and-set 0xYOUR_WALLET_ADDRESS
```

**Example output**:
```
📊 Step 1/3: Scoring wallet...
✅ Score: 720/850
✅ Tier: 3 (Gold)

🔐 Step 2/3: Generating ZK proof...
✅ Proof generated in 1823ms

⛓️  Step 3/3: Writing tier on-chain...
✅ Transaction confirmed in block 12345678

✨ SUCCESS - Tier set on-chain!
```

### Test Borrowing

```bash
npm run test:borrow
```

**Example output**:
```
📊 Checking credit tier...
✅ Credit tier: 3 (Gold)
✅ Collateral ratio: 130%

💰 Borrowing details:
   Borrow amount:       0.01 ETH
   Required collateral: 0.013 ETH
   Savings vs Bronze:   0.002 ETH (13.3%)

✨ SUCCESS - Borrowed with tier-based collateral!
```

---

## 📊 Credit Tiers & Collateral

| Tier | Score Range | Collateral Required | Savings vs Bronze |
|------|-------------|---------------------|-------------------|
| Unrated | - | 200% | -33% ❌ |
| Bronze | 300-499 | 150% | Baseline |
| Silver | 500-649 | 140% | 6.7% |
| Gold | 650-749 | 130% | 13.3% ⭐ |
| Platinum | 750-849 | 125% | 16.7% 🏆 |
| Diamond | 850 | 120% | 20% 💎 |

**Real Example**: To borrow 100 ETH
- Bronze needs 150 ETH collateral
- Platinum needs 125 ETH collateral
- **Savings: 25 ETH** (can use for other investments!)

---

## 🛠️ Troubleshooting

### "Backend not reachable"
```bash
cd backend && npm run dev
# In another terminal: curl http://localhost:3001/api/health
```

### "No credit tier found"
Run `npm run score-and-set 0xYOUR_ADDRESS` first.

### "Insufficient pool funds"
```bash
npx hardhat console --network baseSepolia
> const lending = await ethers.getContractAt("KarmaTrustLending", "0xDEF...")
> await lending.fund({ value: ethers.parseEther("0.1") })
```

### "ZK circuit files not found"
```bash
cd circuits && npm run build:circuits
```

### "Wallet balance 0 ETH"
Get Base Sepolia ETH: https://faucet.quicknode.com/base/sepolia

---

## 📚 Documentation

- **Full integration guide**: `WEEK3-4_INTEGRATION_GUIDE.md`
- **Week 1-2 summary**: `MONTH1_WEEK1-2_COMPLETE.md`
- **Week 3-4 summary**: `MONTH1_WEEK3-4_COMPLETE.md`
- **Deployment guide**: `DEPLOYMENT_GUIDE.md`

---

## 🎯 What's Next?

### Current (Week 3-4): "Dirty But Real"
- ✅ Backend sets tier (owner-controlled)
- ✅ Users borrow with reduced collateral
- ✅ Real ZK proofs, real blockchain

### Coming (Week 5-6): Fully Decentralized
- 🔜 Users submit ZK proofs themselves
- 🔜 Contracts verify proofs on-chain
- 🔜 No owner privilege needed
- 🔜 Fully permissionless

### Future (Month 2-4)
- 🔜 PostgreSQL persistence
- 🔜 Frontend wallet connection
- 🔜 TLSNotary for trustless data
- 🔜 Morpho Protocol integration

---

## 💡 Pro Tips

1. **Use testnet wallets only**: Never use mainnet keys!
2. **Check gas prices**: Base Sepolia gas is usually < 0.1 gwei
3. **Verify on Basescan**: All transactions visible at https://sepolia.basescan.org
4. **Test with demo wallets first**: Try Vitalik's address to see how it works
5. **Monitor backend logs**: Helpful for debugging

---

## 🚀 Commands Cheat Sheet

```bash
# Check environment
npx ts-node scripts/check-environment.ts

# Deploy contracts to Base Sepolia
npm run deploy:base

# Score wallet and set tier on-chain
npm run score-and-set 0xWALLET_ADDRESS

# Test borrowing
npm run test:borrow

# Run all contract tests
npm run test:contracts

# Start frontend + backend
npm run dev

# Start backend only
cd backend && npm run dev
```

---

## 📞 Support

- **GitHub**: [Issues](https://github.com/yourusername/karmatrust-mvp/issues)
- **Documentation**: See `WEEK3-4_INTEGRATION_GUIDE.md`
- **Logs**: Check `backend/logs/` for detailed errors

---

## ⚠️ Important Notes

- **Testnet only**: This is Base Sepolia, not mainnet!
- **MVP status**: Not audited, not production-ready
- **Privacy**: ZK proofs are real, but server still has some trust assumptions
- **Gas costs**: Very cheap on Base Sepolia (~$0.0001 per transaction)

---

**🎉 Ready to build credit infrastructure for Web3!**

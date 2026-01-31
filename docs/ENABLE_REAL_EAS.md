# Enable Real EAS Attestations

This guide shows how to switch from simulation mode to real on-chain EAS attestations.

---

## 🎯 Overview

**Current Status:** Simulation Mode (mock attestations)  
**Target:** Real Mode (actual on-chain attestations on Sepolia)

---

## 📋 Prerequisites

Before enabling real attestations, you need:

1. ✅ **Sepolia Testnet Wallet**
   - Any Ethereum wallet (MetaMask, Coinbase Wallet, etc.)
   - Exported private key

2. ✅ **Sepolia ETH**
   - At least 0.001 ETH for gas fees
   - Get free from faucets (see below)

3. ✅ **Backend Server Running**
   - Your backend must be running to process attestations

---

## 🚰 Step 1: Get Sepolia ETH (Free)

Visit any of these faucets to get free Sepolia test ETH:

### Recommended Faucets

| Faucet | Amount | URL |
|--------|--------|-----|
| **Alchemy** | 0.5 ETH | https://sepoliafaucet.com/ |
| **Infura** | 0.5 ETH | https://www.infura.io/faucet/sepolia |
| **QuickNode** | 0.05 ETH | https://faucet.quicknode.com/ethereum/sepolia |
| **Paradigm** | 0.1 ETH | https://faucet.paradigm.xyz/ |

**Instructions:**
1. Copy your wallet address: `0x8103ac5D4a8C01Be2181AF080794411376C7f61c`
2. Paste into faucet website
3. Click "Send Me ETH" or "Get ETH"
4. Wait 1-2 minutes
5. Check balance on Sepolia Etherscan

**Verify Balance:**
```
https://sepolia.etherscan.io/address/0x8103ac5D4a8C01Be2181AF080794411376C7f61c
```

---

## 🔑 Step 2: Export Your Private Key

### For MetaMask Users

1. **Open MetaMask**
2. **Click** the 3 dots (⋯) next to your account name
3. **Select** "Account Details"
4. **Click** "Export Private Key"
5. **Enter** your MetaMask password
6. **Copy** the private key (64 hex characters)

**Format:** `0x1234567890abcdef...` or `1234567890abcdef...`

### ⚠️ CRITICAL WARNINGS

- ❌ **NEVER** use your mainnet wallet's private key!
- ❌ **NEVER** share your private key with anyone!
- ❌ **NEVER** commit private keys to Git!
- ✅ **ONLY** use testnet wallets (Sepolia, Goerli, etc.)

**Best Practice:**
Create a NEW wallet specifically for testing/development.

---

## ⚙️ Step 3: Create .env File

### 3.1 Navigate to backend directory

```bash
cd "/Users/ronny/Desktop/hackerthon ethglobal/karmatrust-mvp/backend"
```

### 3.2 Create .env file

```bash
# Create new file
touch .env

# Open in editor
open -a TextEdit .env
```

### 3.3 Add configuration

Copy and paste this into your `.env` file:

```bash
# KarmaTrust Backend Configuration
NODE_ENV=development
PORT=3000

# Blockchain RPC
SEPOLIA_RPC_URL=https://ethereum-sepolia.gateway.tatum.io

# EAS Configuration (Sepolia)
EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
SCHEMA_REGISTRY_ADDRESS=0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0

# ⚠️ Your Private Key (replace with actual key)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 3.4 Replace placeholder

**Replace this line:**
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**With your actual private key:**
```bash
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 3.5 Save the file

Press `Cmd + S` to save, then close the editor.

---

## 🔄 Step 4: Restart Backend

The backend needs to restart to load the new configuration.

### 4.1 Stop current backend

In the terminal running the backend, press `Ctrl + C`

### 4.2 Start backend again

```bash
cd "/Users/ronny/Desktop/hackerthon ethglobal/karmatrust-mvp/backend"
npm run dev
```

### 4.3 Check for success message

You should see:
```
✅ EAS: Real mode enabled
✅ Attester address: 0x8103ac5D4a8C01Be2181AF080794411376C7f61c
```

If you see this, real mode is active! ✨

---

## 🧪 Step 5: Test Real Attestation

### 5.1 Via cURL

```bash
curl -X POST http://localhost:3000/api/credit/attest \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' \
  | python3 -m json.tool
```

### 5.2 Check response

**Simulation mode response:**
```json
{
  "attestation": {
    "attestationId": "0x...",
    "isSimulated": true  // ← Still simulation!
  }
}
```

**Real mode response:**
```json
{
  "attestation": {
    "attestationId": "0x...",
    "explorerUrl": "https://sepolia.easscan.org/attestation/view/0x...",
    "txHash": "0x...",  // ← Real transaction hash!
    "isSimulated": false  // ← Real attestation!
  }
}
```

### 5.3 Verify on-chain

If real mode worked, you can verify the attestation on EASScan:

1. Copy the `explorerUrl` from response
2. Open in browser
3. See your on-chain attestation with:
   - Score: 641
   - Level: Gold
   - Risk: Medium
   - Timestamp
   - All factors

Example: https://sepolia.easscan.org/attestation/view/0x...

---

## 🌐 Step 6: Test in Browser

### 6.1 Open dashboard

```
http://localhost:5173/dashboard/0x8103ac5D4a8C01Be2181AF080794411376C7f61c
```

### 6.2 Click "Create Attestation"

The button should now:
1. Show "Creating..." (takes ~15 seconds)
2. Wait for transaction confirmation
3. Display transaction hash
4. Show EASScan link

### 6.3 View on EASScan

Click the "View on EASScan" link to see your real on-chain attestation!

---

## 🔍 Troubleshooting

### Issue 1: "Insufficient funds"

**Error:**
```
Error: insufficient funds for intrinsic transaction cost
```

**Solution:**
Your wallet needs more Sepolia ETH. Go back to Step 1 and get more from faucets.

---

### Issue 2: "Transaction failed"

**Error:**
```
Transaction reverted without a reason string
```

**Possible causes:**
1. Gas price too low
2. Network congestion
3. Invalid schema

**Solution:**
Wait a few minutes and try again. Sepolia can be slow sometimes.

---

### Issue 3: "Invalid private key"

**Error:**
```
invalid private key
```

**Solution:**
Check that your private key:
- Is 64 hex characters (without 0x) or 66 (with 0x)
- Doesn't have any spaces
- Is from a real wallet

---

### Issue 4: Still shows "isSimulated: true"

**Possible causes:**
1. `.env` file not created correctly
2. Backend not restarted
3. Private key not set

**Solution:**
```bash
# Check if .env file exists
cd backend
ls -la .env

# Check if PRIVATE_KEY is set
cat .env | grep PRIVATE_KEY

# Should show: PRIVATE_KEY=0x...
# If blank, add your private key and restart
```

---

## 📊 Cost Estimation

### Gas Fees (Sepolia)

Each EAS attestation costs approximately:

| Operation | Gas | Cost (ETH) |
|-----------|-----|------------|
| Create Attestation | ~100,000 | ~0.0001 |
| Revoke Attestation | ~50,000 | ~0.00005 |

**With 0.001 ETH, you can create ~10 attestations.**

---

## 🔐 Security Best Practices

### DO ✅

- Use a separate wallet for development
- Keep private keys in `.env` files (not in code)
- Add `.env` to `.gitignore` (already done)
- Use testnet wallets only
- Regularly rotate test keys

### DON'T ❌

- Never use mainnet private keys
- Never commit `.env` files
- Never share private keys
- Never reuse test keys in production
- Never store large amounts in test wallets

---

## 🎯 Verification Checklist

After setup, verify:

- [ ] Sepolia ETH balance > 0.001 ETH
- [ ] `.env` file created in `/backend/` directory
- [ ] `PRIVATE_KEY` set in `.env`
- [ ] Backend restarted successfully
- [ ] Backend shows "✅ EAS: Real mode enabled"
- [ ] Test attestation created successfully
- [ ] `isSimulated: false` in response
- [ ] Transaction hash visible
- [ ] Attestation visible on EASScan

---

## 🚀 Success!

Once all steps are complete, you're running real EAS attestations!

**What this means:**
- ✅ Your credit scores are permanently stored on Sepolia
- ✅ Anyone can verify them on EASScan
- ✅ They're cryptographically signed by your wallet
- ✅ They can be used in smart contracts
- ✅ They demonstrate real blockchain integration

**For the hackathon:**
- Show judges the real EASScan link
- Explain how EAS provides trustless verification
- Demonstrate the on-chain attestation structure

---

## 📚 Additional Resources

| Resource | Link |
|----------|------|
| EAS Documentation | https://docs.attest.sh/ |
| Sepolia Faucets | https://faucetlink.to/sepolia |
| EAS Explorer (Sepolia) | https://sepolia.easscan.org/ |
| Etherscan (Sepolia) | https://sepolia.etherscan.io/ |

---

## ❓ FAQ

**Q: Do I need real ETH for this?**  
A: No! Sepolia is a testnet. All ETH is free from faucets.

**Q: Will my attestations work on mainnet?**  
A: Not yet. This MVP uses Sepolia. Production would use mainnet EAS.

**Q: Can I delete attestations?**  
A: Yes, EAS attestations are revocable if needed.

**Q: How long do attestations last?**  
A: Forever (until revoked). They're permanent on-chain records.

**Q: Can others see my attestations?**  
A: Yes, they're public on EASScan. That's the point - verifiable credentials!

---

**Last Updated:** January 31, 2026

# KarmaTrust Deployment Guide

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Blockchain RPC (Tatum - recommended)
SEPOLIA_RPC_URL=https://ethereum-sepolia.gateway.tatum.io

# Optional: Etherscan API for enhanced data
ETHERSCAN_API_KEY=your_key_here

# Optional: Private key for real EAS attestations
# Leave empty for simulation mode
PRIVATE_KEY=

# EAS Contract addresses (Sepolia)
EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
SCHEMA_REGISTRY_ADDRESS=0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0
```

---

## Quick Start (Demo Mode)

### 1. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Contracts (optional)
cd ../contracts && npm install
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 3. Access

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api/health

---

## Production Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

**Vercel Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: None required for frontend

### Backend (Railway/Render)

```bash
cd backend
npm run build
# Deploy to Railway or Render
```

**Environment Variables for Production:**
```
NODE_ENV=production
PORT=3000
SEPOLIA_RPC_URL=https://ethereum-sepolia.gateway.tatum.io
ETHERSCAN_API_KEY=your_production_key
PRIVATE_KEY=your_attester_private_key
```

---

## Smart Contract Deployment

### 1. Configure Network

Edit `contracts/hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.gateway.tatum.io",
    accounts: process.env.DEPLOYER_PRIVATE_KEY 
      ? [process.env.DEPLOYER_PRIVATE_KEY]
      : []
  }
}
```

### 2. Deploy

```bash
cd contracts

# Set deployer key
export DEPLOYER_PRIVATE_KEY=0x...

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia
```

### 3. Verify on Etherscan

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

---

## ZK Circuit Compilation

### Prerequisites

```bash
# Install Circom globally
npm install -g circom

# Install SnarkJS globally
npm install -g snarkjs
```

### 1. Compile Circuit

```bash
cd circuits

# Compile
circom tier_membership.circom --r1cs --wasm --sym -o build

# Download Powers of Tau (one-time)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau -O ptau/pot14_final.ptau

# Generate ZKey
snarkjs groth16 setup build/tier_membership.r1cs ptau/pot14_final.ptau build/tier_membership_0000.zkey

# Contribute to ceremony (for demo, skip in production)
snarkjs zkey contribute build/tier_membership_0000.zkey build/tier_membership.zkey --name="KarmaTrust" -v

# Export verification key
snarkjs zkey export verificationkey build/tier_membership.zkey build/verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier build/tier_membership.zkey build/TierVerifier.sol
```

### 2. Test Proof Generation

```bash
# Create input file
echo '{"score": "75", "salt": "12345678901234567890", "tier": "3", "lowerBound": "60", "upperBound": "79", "commitment": "..."}' > input.json

# Generate witness
node build/tier_membership_js/generate_witness.js build/tier_membership_js/tier_membership.wasm input.json witness.wtns

# Generate proof
snarkjs groth16 prove build/tier_membership.zkey witness.wtns proof.json public.json

# Verify proof
snarkjs groth16 verify build/verification_key.json public.json proof.json
```

---

## Troubleshooting

### Common Issues

**1. "Cannot find module 'circomlibjs'"**
```bash
cd backend && npm install circomlibjs
```

**2. "CORS error in frontend"**
- Ensure backend is running on port 3000
- Check Vite proxy configuration in `vite.config.ts`

**3. "EAS attestation fails"**
- Check PRIVATE_KEY is set and has Sepolia ETH
- Get Sepolia ETH from faucet: https://sepoliafaucet.com/

**4. "RPC timeout"**
- Try alternative RPC: `https://ethereum-sepolia-rpc.publicnode.com`

---

## Architecture Notes

### Data Flow

```
User Input (wallet address)
      │
      ▼
┌─────────────────┐
│ BlockchainData  │ → Etherscan API → RPC Fallback → Deterministic
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CreditScoring   │ → Calculate 8 factors → FICO score
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VCSM Service   │ → State machine → Poseidon hash → ZK proof
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EAS Attestation │ → On-chain credential
└─────────────────┘
```

### Security Model

1. **Score Privacy**: Only hash stored on-chain, never raw score
2. **Anti-Sybil**: Wallet age enforced in ZK circuit
3. **Attestation Trust**: EAS provides verifiable credentials
4. **Data Integrity**: Multi-source validation with confidence scores

---

## Demo Checklist

Before presenting:

- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Test with Vitalik's address: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- [ ] Verify split-screen shows User vs Bank view
- [ ] Test ZK proof generation
- [ ] Test EAS attestation (simulation mode OK)

---

**Questions? Open an issue on GitHub!**

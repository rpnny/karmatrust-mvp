# Backend Setup Guide

## Environment Configuration

### Required: .env File in Backend Directory

**Important**: The backend service requires a `.env` file in the `backend/` directory (not just the project root).

### Setup Steps

1. **Copy the .env file to backend directory**:
   ```bash
   cp ../.env .env
   ```

2. **Verify environment variables**:
   ```bash
   cat .env | grep ETHERSCAN_API_KEY
   ```

   You should see:
   ```
   ETHERSCAN_API_KEY=your_api_key_here
   ```

### Required Environment Variables

```bash
# Etherscan API Key (required for mainnet data)
ETHERSCAN_API_KEY=your_etherscan_api_key

# RPC URLs (optional, has fallbacks)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Private Key (for contract deployment)
PRIVATE_KEY=your_private_key
```

### Getting an Etherscan API Key

1. Visit https://etherscan.io/
2. Sign up for a free account
3. Navigate to API-KEYs section
4. Generate a new API key
5. Add it to your `.env` file

**Free tier limits**: 5 calls/second, 100,000 calls/day (sufficient for demos)

### Verification

Start the backend and check the logs:

```bash
npm run dev
```

Look for:
```
[BlockchainData] Etherscan API Key: ✅ SET (length=34)
```

If you see `❌ NOT SET`, the `.env` file is not properly configured.

### Troubleshooting

**Problem**: `dataSource: "rpc"` instead of `"etherscan"`
- **Cause**: Etherscan API key not loaded
- **Solution**: Ensure `.env` exists in `backend/` directory

**Problem**: `dataSource: "deterministic"`
- **Cause**: Both Etherscan and RPC failed
- **Solution**: Check API key validity and network connection

**Problem**: `transaction_frequency: 0` for Vitalik's address
- **Cause**: Using Etherscan API V1 (deprecated)
- **Solution**: Already fixed in latest commit (API V2)

### Data Source Priority

1. **Etherscan API** (trustLevel: 100) - Most reliable
   - Full transaction history
   - Protocol interactions
   - Accurate wallet age

2. **RPC Provider** (trustLevel: 80) - Fallback
   - Balance only
   - Limited transaction count
   - No protocol data

3. **Deterministic** (trustLevel: 20) - Demo fallback
   - Simulated data based on address hash
   - For testing when APIs unavailable

### Security Notes

- Never commit `.env` files to git
- Keep your Etherscan API key private
- Regenerate keys if accidentally exposed
- Use different keys for dev/prod environments

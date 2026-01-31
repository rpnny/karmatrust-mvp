/**
 * Register V2 Commitment Schema to EAS Schema Registry
 * 
 * This script registers the privacy-friendly schema that stores:
 * - bytes32 commitment (Poseidon hash, not plaintext score)
 * - uint8 minTier (minimum tier achieved)
 * - uint64 timestamp (attestation time)
 * 
 * Usage:
 *   npx tsx backend/scripts/register-commitment-schema.ts
 * 
 * Requirements:
 *   - PRIVATE_KEY in backend/.env
 *   - Sepolia ETH (~0.001 ETH for gas)
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// =============================================================================
// CONFIGURATION
// =============================================================================

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const SCHEMA_REGISTRY_ADDRESS = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

// V2 Schema Definition
const V2_SCHEMA = {
  schema: 'bytes32 commitment,uint8 minTier,uint64 timestamp',
  resolverAddress: ethers.ZeroAddress, // No resolver
  revocable: true,
};

// Schema Registry ABI (only what we need)
const SCHEMA_REGISTRY_ABI = [
  'function register(string schema, address resolver, bool revocable) external returns (bytes32)',
  'function getSchema(bytes32 uid) external view returns (string schema, address resolver, bool revocable)',
];

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📝 EAS Schema Registration - V2 Commitment Schema');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY not found in backend/.env');
    console.error('   Please add: PRIVATE_KEY=your_private_key_here');
    process.exit(1);
  }

  // 2. Setup provider and wallet
  console.log('📡 Connecting to Sepolia...');
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  
  const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(pk, provider);
  
  console.log(`   Address: ${wallet.address}`);

  // 3. Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceEth} ETH`);

  if (balance === 0n) {
    console.error('\n❌ Error: Insufficient balance');
    console.error('   You need Sepolia ETH to register the schema');
    console.error('   Get testnet ETH from: https://sepoliafaucet.com/');
    process.exit(1);
  }

  // 4. Calculate expected schema UID
  const expectedUid = ethers.keccak256(ethers.toUtf8Bytes(V2_SCHEMA.schema));
  console.log('\n📋 Schema Details:');
  console.log(`   Schema: ${V2_SCHEMA.schema}`);
  console.log(`   Expected UID: ${expectedUid}`);
  console.log(`   Revocable: ${V2_SCHEMA.revocable}`);

  // 5. Check if schema already exists
  console.log('\n🔍 Checking if schema already exists...');
  const registry = new ethers.Contract(
    SCHEMA_REGISTRY_ADDRESS,
    SCHEMA_REGISTRY_ABI,
    wallet
  );

  try {
    const existingSchema = await registry.getSchema(expectedUid);
    if (existingSchema.schema && existingSchema.schema.length > 0) {
      console.log('✅ Schema already registered!');
      console.log(`   UID: ${expectedUid}`);
      console.log(`   Schema: ${existingSchema.schema}`);
      console.log(`   Resolver: ${existingSchema.resolver}`);
      console.log(`   Revocable: ${existingSchema.revocable}`);
      console.log('\n✨ No need to register again. You can use this schema now!');
      process.exit(0);
    }
  } catch (error) {
    // Schema doesn't exist, continue with registration
    console.log('   Schema not found, proceeding with registration...');
  }

  // 6. Estimate gas
  console.log('\n⛽ Estimating gas...');
  try {
    const gasEstimate = await registry.register.estimateGas(
      V2_SCHEMA.schema,
      V2_SCHEMA.resolverAddress,
      V2_SCHEMA.revocable
    );
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);
  } catch (error: any) {
    console.error('❌ Gas estimation failed:', error.message);
    console.error('   This might indicate a problem with the schema or network');
    process.exit(1);
  }

  // 7. Confirm registration
  console.log('\n⚠️  Ready to register schema');
  console.log('   This will cost ~0.001 ETH in gas');
  console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 8. Register schema
  console.log('📤 Registering schema...');
  try {
    const tx = await registry.register(
      V2_SCHEMA.schema,
      V2_SCHEMA.resolverAddress,
      V2_SCHEMA.revocable
    );
    
    console.log(`   Transaction sent: ${tx.hash}`);
    console.log('   Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

    // 9. Verify registration
    console.log('\n🔍 Verifying registration...');
    const registeredSchema = await registry.getSchema(expectedUid);
    
    if (registeredSchema.schema === V2_SCHEMA.schema) {
      console.log('   ✅ Schema verified on-chain!');
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  ✨ SUCCESS! Schema Registered');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📋 Registration Details:');
      console.log(`   Schema UID: ${expectedUid}`);
      console.log(`   Schema: ${registeredSchema.schema}`);
      console.log(`   Resolver: ${registeredSchema.resolver}`);
      console.log(`   Revocable: ${registeredSchema.revocable}`);
      console.log(`   Transaction: ${tx.hash}`);
      console.log(`   Block: ${receipt.blockNumber}`);
      
      console.log('\n🔗 View on Explorer:');
      console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      console.log('\n📝 Next Steps:');
      console.log('   1. Update backend/.env with schema UID (if needed)');
      console.log('   2. Restart backend: npm run dev');
      console.log('   3. Privacy mode attestations will now be REAL!\n');
    } else {
      console.error('❌ Verification failed: Schema mismatch');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Registration failed:', error.message);
    if (error.transaction) {
      console.error(`   Transaction hash: ${error.transaction.hash}`);
    }
    process.exit(1);
  }
}

// =============================================================================
// EXECUTE
// =============================================================================

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });

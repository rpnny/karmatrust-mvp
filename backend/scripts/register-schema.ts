/**
 * Script to register EAS Schema and create attestation
 * Run: npx tsx scripts/register-schema.ts
 */

import { ethers } from 'ethers';
import 'dotenv/config';

// Configuration
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

// EAS Sepolia addresses
const EAS_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';
const SCHEMA_REGISTRY = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

// ABIs
const SCHEMA_REGISTRY_ABI = [
  'function register(string schema, address resolver, bool revocable) external returns (bytes32)',
  'function getSchema(bytes32 uid) external view returns ((bytes32 uid, address resolver, bool revocable, string schema))',
];

const EAS_ABI = [
  'function attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, uint256 value) data)) external payable returns (bytes32)',
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  EAS Schema Registration & Attestation Test');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Setup
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env');
    process.exit(1);
  }
  
  const pk = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  const wallet = new ethers.Wallet(pk, provider);
  
  console.log(`\n📍 Wallet: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error('❌ No ETH balance. Get some from https://sepoliafaucet.com/');
    process.exit(1);
  }

  // Use a simple schema for testing
  const SIMPLE_SCHEMA = 'uint16 score,string level';
  
  const schemaRegistry = new ethers.Contract(SCHEMA_REGISTRY, SCHEMA_REGISTRY_ABI, wallet);
  const eas = new ethers.Contract(EAS_ADDRESS, EAS_ABI, wallet);

  try {
    // Step 1: Register Schema
    console.log('\n📝 Step 1: Registering schema...');
    console.log(`   Schema: "${SIMPLE_SCHEMA}"`);
    
    const registerTx = await schemaRegistry.register(
      SIMPLE_SCHEMA,
      ethers.ZeroAddress, // No resolver
      true // Revocable
    );
    
    console.log(`   TX sent: ${registerTx.hash}`);
    const registerReceipt = await registerTx.wait();
    console.log(`   ✅ Confirmed in block ${registerReceipt.blockNumber}`);
    
    // Get schema UID from event
    const schemaUID = registerReceipt.logs[0]?.topics[1];
    console.log(`   📋 Schema UID: ${schemaUID}`);

    // Step 2: Create Attestation
    console.log('\n📝 Step 2: Creating attestation...');
    
    // Encode data
    const abiCoder = new ethers.AbiCoder();
    const encodedData = abiCoder.encode(
      ['uint16', 'string'],
      [652, 'Gold']
    );
    
    const attestationRequest = {
      schema: schemaUID,
      data: {
        recipient: wallet.address,
        expirationTime: 0n,
        revocable: true,
        refUID: ethers.ZeroHash,
        data: encodedData,
        value: 0n,
      },
    };
    
    const attestTx = await eas.attest(attestationRequest);
    console.log(`   TX sent: ${attestTx.hash}`);
    
    const attestReceipt = await attestTx.wait();
    console.log(`   ✅ Confirmed in block ${attestReceipt.blockNumber}`);
    
    // Get attestation UID
    const attestationUID = attestReceipt.logs[0]?.topics[1];
    console.log(`   📋 Attestation UID: ${attestationUID}`);
    
    // Success!
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  🎉 SUCCESS!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🔗 View attestation on EASScan:`);
    console.log(`   https://sepolia.easscan.org/attestation/view/${attestationUID}`);
    console.log(`\n🔗 View schema on EASScan:`);
    console.log(`   https://sepolia.easscan.org/schema/view/${schemaUID}`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('AlreadyExists')) {
      console.log('\nℹ️  Schema already registered. Trying to get existing UID...');
      // Schema already exists, try to use existing one
    }
    
    throw error;
  }
}

main().catch(console.error);

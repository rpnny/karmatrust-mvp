// Direct test of circuit file paths
// This tests if circuits can be found and loaded

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate backend's path calculation
// backend/src/services/zkStateTransition.ts does: path.resolve(__dirname, '../../../')
// If we were in backend/src/services/, that would be correct
// But let's verify from project root

const PROJECT_ROOT = __dirname; // We're at project root

const CIRCUIT_PATHS = {
  tierMembership: {
    wasm: path.join(PROJECT_ROOT, 'circuits/build/tier_membership_js/tier_membership.wasm'),
    zkey: path.join(PROJECT_ROOT, 'circuits/build/tier_membership_final.zkey'),
    vkey: path.join(PROJECT_ROOT, 'circuits/build/verification_key.json'),
  },
  stateTransition: {
    wasm: path.join(PROJECT_ROOT, 'circuits/build/state_transition_js/state_transition.wasm'),
    zkey: path.join(PROJECT_ROOT, 'circuits/build/state_transition_final.zkey'),
    vkey: path.join(PROJECT_ROOT, 'circuits/build/state_transition_vkey.json'),
  },
};

console.log('═══════════════════════════════════════════════════════════');
console.log('Testing Circuit File Paths');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('PROJECT_ROOT:', PROJECT_ROOT);
console.log('');

let allFound = true;

// Check Tier Membership circuit
console.log('1. Tier Membership Circuit:');
console.log('   -----------------------------------------');
for (const [name, filePath] of Object.entries(CIRCUIT_PATHS.tierMembership)) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${name}:`);
  console.log(`      ${filePath}`);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`      Size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  if (!exists) allFound = false;
}
console.log('');

// Check State Transition circuit
console.log('2. State Transition Circuit:');
console.log('   -----------------------------------------');
for (const [name, filePath] of Object.entries(CIRCUIT_PATHS.stateTransition)) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${name}:`);
  console.log(`      ${filePath}`);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`      Size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  if (!exists) allFound = false;
}
console.log('');

console.log('═══════════════════════════════════════════════════════════');
if (allFound) {
  console.log('✅ All circuit files found!');
  console.log('');
  console.log('Backend services should be able to load real circuits.');
  console.log('If still falling back to simulation, check:');
  console.log('  1. Backend logs for path resolution');
  console.log('  2. __dirname calculation in service files');
  console.log('  3. Current working directory when starting backend');
} else {
  console.log('❌ Some circuit files are missing!');
  console.log('');
  console.log('Run circuit compilation:');
  console.log('  cd circuits && npm run compile');
}
console.log('═══════════════════════════════════════════════════════════');

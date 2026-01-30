# KarmaTrust API Reference

Base URL: `http://localhost:3000` (development)

---

## Health Check

### GET /api/health

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1706500000000,
  "version": "1.0.0"
}
```

---

## Credit Scoring

### GET /api/credit/score

Calculate credit score for a wallet address.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| wallet | string | Yes | Ethereum address (0x...) |

**Example Request:**
```bash
curl "http://localhost:3000/api/credit/score?wallet=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "score": 762,
    "internalScore": 84,
    "risk": "Low",
    "level": 4,
    "levelName": "Platinum",
    "factors": {
      "walletAge": 0.95,
      "transactionFrequency": 0.88,
      "protocolDiversity": 0.72,
      "assetValue": 0.90,
      "activeUsage": 1.0,
      "volatility": 0.15,
      "scamConnection": 0,
      "mixerUsage": 0
    },
    "timestamp": 1706500000000,
    "wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "meta": {
      "dataSource": "etherscan",
      "confidence": 95
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid wallet address"
}
```

---

### POST /api/credit/attest

Create an EAS attestation for a wallet's credit score.

**Request Body:**
```json
{
  "wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "score": {
      "score": 762,
      "risk": "Low",
      "level": 4
    },
    "attestation": {
      "attestationId": "0x1234...abcd",
      "explorerUrl": "https://sepolia.easscan.org/attestation/view/0x1234...abcd",
      "schemaId": "0xabcd...1234",
      "recipient": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "txHash": "0x5678...efgh",
      "mode": "real"
    }
  }
}
```

**Note:** If `PRIVATE_KEY` is not configured, attestation runs in simulation mode:
```json
{
  "attestation": {
    "attestationId": "0xsimulated...",
    "mode": "simulation"
  }
}
```

---

## VCSM (Verifiable Credit State Machine)

### POST /api/vcsm/init

Initialize a new credit state for a user.

**Request Body:**
```json
{
  "userId": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "initialScore": 50
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "stateId": "uuid-here",
    "userId": "0xd8dA...",
    "level": 2,
    "levelName": "Silver",
    "score": 50,
    "stateHash": "12345678901234567890",
    "previousHash": "0",
    "version": 1,
    "timestamp": 1706500000000,
    "attributes": {
      "onTimePayments": 0,
      "defaultCount": 0,
      "debtRatio": 0,
      "kycVerified": false
    }
  }
}
```

---

### GET /api/vcsm/state/:userId

Get current credit state for a user.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User's wallet address |

**Example Request:**
```bash
curl "http://localhost:3000/api/vcsm/state/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "stateId": "uuid-here",
    "level": 3,
    "levelName": "Gold",
    "score": 65,
    "stateHash": "987654321098765432",
    "version": 2
  }
}
```

---

### POST /api/vcsm/transition

Execute a state transition (upgrade/downgrade credit level).

**Request Body:**
```json
{
  "userId": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "ruleId": "UPGRADE_SILVER_TO_GOLD",
  "newScore": 65,
  "evidence": {
    "eventType": "SCORE_IMPROVED",
    "eventData": {
      "reason": "consistent_repayment"
    }
  }
}
```

**Available Rule IDs:**
- `UPGRADE_BRONZE_TO_SILVER`
- `UPGRADE_SILVER_TO_GOLD`
- `UPGRADE_GOLD_TO_PLATINUM`
- `UPGRADE_PLATINUM_TO_DIAMOND`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "fromLevel": "Silver",
    "toLevel": "Gold",
    "newState": {
      "stateHash": "new-hash-here",
      "version": 3
    },
    "proof": {
      "simulated": true,
      "pi_a": ["1", "2", "3"],
      "pi_b": [["1", "2"], ["3", "4"]],
      "pi_c": ["5", "6", "7"],
      "publicSignals": ["old-hash", "new-hash", "2", "3"]
    }
  }
}
```

---

## ZK Proofs

### POST /api/zkp/generate

Generate a ZK proof for tier membership.

**Request Body:**
```json
{
  "score": 75,
  "targetTier": 3
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": ["12345...", "67890...", "1"],
      "pi_b": [["12345...", "67890..."], ["12345...", "67890..."], ["1", "0"]],
      "pi_c": ["12345...", "67890...", "1"],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "publicSignals": [
      "3",     // tier
      "60",    // lowerBound
      "79",    // upperBound
      "12345..." // commitment
    ],
    "commitment": "12345...",
    "tier": 3,
    "tierName": "Gold",
    "simulated": true
  }
}
```

---

### POST /api/zkp/verify

Verify a ZK proof.

**Request Body:**
```json
{
  "proof": {
    "pi_a": ["...", "...", "1"],
    "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
    "pi_c": ["...", "...", "1"]
  },
  "publicSignals": ["3", "60", "79", "12345..."]
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "tier": 3,
    "tierName": "Gold",
    "bounds": {
      "lower": 60,
      "upper": 79
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /api/credit/* | 100 req/min |
| /api/vcsm/* | 50 req/min |
| /api/zkp/* | 20 req/min |

**Note:** Rate limits not enforced in MVP demo mode.

---

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get credit score
curl "http://localhost:3000/api/credit/score?wallet=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

# Create attestation
curl -X POST http://localhost:3000/api/credit/attest \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'

# Initialize VCSM state
curl -X POST http://localhost:3000/api/vcsm/init \
  -H "Content-Type: application/json" \
  -d '{"userId": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "initialScore": 50}'

# Generate ZK proof
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"score": 75, "targetTier": 3}'
```

---

## SDK Usage (JavaScript)

```javascript
// Using fetch
const response = await fetch('/api/credit/score?wallet=0x...');
const { success, data, error } = await response.json();

if (success) {
  console.log(`Score: ${data.score}`);
  console.log(`Risk: ${data.risk}`);
} else {
  console.error(error);
}
```

---

**API Version:** 1.0.0  
**Last Updated:** January 2026

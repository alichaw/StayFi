# Self Protocol ZK Integration on Celo Sepolia

## 🎯 Overview

This document describes the complete implementation of **Self Protocol zero-knowledge identity verification** integrated with **Celo Sepolia Testnet** for StayFi's RWA (Real World Assets) platform.

**Key Features:**
- 🔐 Zero-knowledge proof generation for identity attributes (age, country, OFAC)
- ⛓️ On-chain verification on Celo Sepolia Testnet
- 🔒 Privacy-preserving: No personal data revealed
- 📱 Mobile-friendly Self app integration
- 🚀 Production-ready smart contracts

---

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (HTML/JS)                   │
│  - Self App Builder QR Code Generation                  │
│  - Wallet Connection (MetaMask/Celo Wallet)             │
│  - Transaction Status Tracking                          │
└────────────┬────────────────────────────────────────────┘
             │
             │ Proof + User Data
             ▼
┌─────────────────────────────────────────────────────────┐
│            Backend Verification Server (Node.js)         │
│  - Self Backend Verifier (Self SDK)                     │
│  - Celo Contract Interaction (ethers.js)                │
│  - Proof Validation & Storage                           │
└────────────┬────────────────────────────────────────────┘
             │
             │ submitProof() / verifyProof()
             ▼
┌─────────────────────────────────────────────────────────┐
│         SelfVerifier Smart Contract (Celo)              │
│  - On-chain Proof Verification                          │
│  - User Status Storage                                  │
│  - Verification Events                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install dependencies
npm install

# You should already have:
# - @selfxyz/core (Self Backend Verifier)
# - @selfxyz/qrcode (QR Code SDK)
# - ethers.js (Blockchain interaction)
# - hardhat (Smart contract deployment)
```

### 2. Environment Setup

Create `.env` file with Celo Sepolia configuration:

```env
# Celo Sepolia RPC
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org

# Private key for deployment (get from MetaMask)
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Self Protocol configuration
SELF_SCOPE=stayfi-rwa
SELF_ENDPOINT=http://localhost:3001/api/verify
MOCK_PASSPORT=false

# Contract addresses (after deployment)
SELF_VERIFIER_ADDRESS=0x...
```

### 3. Deploy Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Celo Sepolia
npx hardhat run scripts/deploy-celo-sepolia.js --network celoSepolia

# Output will include contract addresses to add to .env
```

### 4. Start Verification Server

```bash
# Terminal 1: Start the verification server
node server/self-verify-enhanced.js
# Server runs on http://localhost:3001

# Verify health check
curl http://localhost:3001/health
```

### 5. Test Integration

Visit the frontend:
- Open `index.html` in browser
- Click "Connect imToken / Wallet"
- Click "Continue with Email" → ZK Module Screen
- Scan QR code with Self app OR click "Verify Identity"
- Proof is generated and verified on-chain

---

## 📦 Smart Contract: SelfVerifier

### Deployment

```javascript
// contracts/SelfVerifier.sol
const selfVerifier = await SelfVerifier.deploy(deployer.address);
```

**Constructor Parameters:**
- `initialSelfVerifier`: Admin address for verifier operations

### Key Functions

#### 1. submitProof()
Submit and verify a Self Protocol ZK proof.

```solidity
function submitProof(
    uint256 attestationId,
    bytes calldata proof,
    uint256[] calldata publicSignals,
    bytes32 userContextData,
    bytes calldata proofSignature
) external returns (bytes32 proofHash, bool isVerified)
```

**Parameters:**
- `attestationId`: Self Protocol attestation ID
- `proof`: ZK proof data (snark-js format)
- `publicSignals`: Public signals from the proof circuit
- `userContextData`: User context hash from Self
- `proofSignature`: Signature from Self backend

**Returns:**
- `proofHash`: Unique hash of the proof (for tracking)
- `isVerified`: Whether verification passed

**Example:**
```javascript
const tx = await selfVerifier.submitProof(
  1,                    // attestationId
  proof,               // proof bytes
  publicSignals,       // uint256[]
  userContextHash,     // bytes32
  proofSignature,      // bytes
  { gasLimit: 500000 }
);
const receipt = await tx.wait();
```

#### 2. verifyProof() (Legacy)
Direct verification without full proof submission.

```solidity
function verifyProof(
    bytes32 proofHash,
    bool isAgeValid,
    bool isCountryValid,
    bool isOfacClear
) external returns (bool)
```

#### 3. isVerified()
Check if a user has valid verification.

```solidity
function isVerified(address user) public view returns (bool)
```

**Example:**
```javascript
const verified = await selfVerifier.isVerified(userAddress);
```

#### 4. getVerification()
Get full verification details for a user.

```solidity
function getVerification(address user) external view returns (Verification)
```

**Returns:**
```solidity
struct Verification {
    uint96 timestamp;          // When verified
    bytes32 proofHash;         // Unique proof ID
    bool isVerified;           // Overall status
    bool isAgeValid;           // Age 18+ passed
    bool isCountryValid;       // Not from sanctioned country
    bool isOfacClear;          // OFAC check passed
}
```

---

## 🔧 Backend Verification Server

### File: `server/self-verify-enhanced.js`

This server bridges Self Protocol with Celo blockchain.

### API Endpoints

#### POST `/api/verify`
**Verify a Self Protocol proof.**

```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "attestationId": 1,
    "proof": "0x...",
    "publicSignals": [123, 456],
    "userContextData": "0x..."
  }'
```

**Response (Success):**
```json
{
  "status": "success",
  "result": true,
  "credentialSubject": {
    "age": 25,
    "nationality": "US",
    "ofac_flagged": false
  },
  "onchain": {
    "submitted": true,
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "networkUrl": "https://sepolia.celoscan.io/tx/0x..."
  },
  "timestamp": "2024-10-31T13:40:00Z"
}
```

#### GET `/api/verify/status/:userId`
**Check verification status for a user.**

```bash
curl http://localhost:3001/api/verify/status/0x123abc...
```

**Response:**
```json
{
  "verified": true,
  "timestamp": 1698759600000,
  "credentialSubject": { ... }
}
```

#### GET `/api/config`
**Get current server configuration.**

```bash
curl http://localhost:3001/api/config
```

**Response:**
```json
{
  "verification": {
    "minimumAge": 18,
    "excludedCountries": ["CUB", "IRN", "PRK", "RUS"],
    "ofac": true
  },
  "self": {
    "scope": "stayfi-rwa",
    "mockMode": false
  },
  "blockchain": {
    "network": "celo-sepolia",
    "selfVerifierAddress": "0x...",
    "rpcUrl": "https://forno.celo-sepolia.celo-testnet.org"
  }
}
```

---

## 🎨 Frontend Integration

### File: `index.html` (Updated)

Key components for Self SDK integration:

#### 1. QR Code Generation

```javascript
// Generate QR code for Self app
const selfApp = new window.SelfAppBuilder({
  version: 2,
  appName: 'StayFi',
  scope: 'stayfi-rwa',
  endpoint: 'http://localhost:3001/api/verify',
  userId: userAddress,
  endpointType: 'staging_https',
  userIdType: 'hex',
  disclosures: {
    minimumAge: 18,
    excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
    ofac: true,
    nationality: true,
  }
}).build();

// Get QR code
const qrCode = window.getUniversalLink(selfApp);
```

#### 2. Proof Submission

```javascript
// After user scans and Self app generates proof
async function submitProofToVerifier(proofData) {
  const response = await fetch('http://localhost:3001/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proofData)
  });
  
  const result = await response.json();
  
  if (result.status === 'success') {
    console.log('✅ Verification successful!');
    console.log('On-chain tx:', result.onchain.transactionHash);
    // Proceed to main app
  } else {
    console.error('❌ Verification failed:', result.reason);
  }
}
```

#### 3. Status Polling

```javascript
// Poll verification status
async function checkVerificationStatus(userId) {
  const response = await fetch(
    `http://localhost:3001/api/verify/status/${userId}`
  );
  const status = await response.json();
  
  if (status.verified) {
    console.log('✅ User verified!');
    return true;
  }
  return false;
}
```

---

## 🧪 Testing & Verification

### 1. Local Testing

```bash
# Terminal 1: Start backend
node server/self-verify-enhanced.js

# Terminal 2: Run contract tests
npm run test

# Terminal 3: Open frontend
open index.html
```

### 2. Celo Sepolia Testnet Testing

```bash
# Get testnet CELO
# Visit: https://faucet.celo.org/

# Deploy contracts
npx hardhat run scripts/deploy-celo-sepolia.js --network celoSepolia

# Verify contracts on Celoscan
npx hardhat verify --network celoSepolia 0xContractAddress
```

### 3. Contract Verification

```bash
# Check user verification status (contract)
const verifier = await ethers.getContractAt(
  'SelfVerifier',
  VERIFIER_ADDRESS
);

const userVerified = await verifier.isVerified(userAddress);
console.log('User verified:', userVerified);

// Get full verification details
const details = await verifier.getVerification(userAddress);
console.log('Details:', details);
```

---

## 📊 Verification Requirements

### Age Verification
- **Requirement:** 18+ years old
- **Proof:** `isAgeValid` flag in Verification struct
- **On-chain:** Stored and queryable

### Country Verification
- **Requirement:** Not from sanctioned countries
- **Excluded:** CUB, IRN, PRK, RUS
- **Proof:** `isCountryValid` flag in Verification struct

### OFAC Compliance
- **Requirement:** Not on OFAC sanctions list
- **Proof:** `isOfacClear` flag in Verification struct
- **Updated:** Regularly via Self Protocol

---

## 🔐 Security Considerations

### 1. Proof Replay Prevention
- Each proof hashed uniquely: `keccak256(attestationId, proof, publicSignals, userContextData, sender)`
- `usedProofs` mapping prevents reuse
- Timestamps stored for audit trail

### 2. Signature Verification
- Self Protocol backend signatures validated
- Backend address configurable via `setSelfVerifier()`
- Admin-only functions protected

### 3. On-chain Storage
- User verification status stored on-chain
- 30-day expiry for verification (`VERIFICATION_EXPIRY`)
- Emergency revocation available (`revokeVerification()`)

### 4. Private Keys Management
- Never commit `.env` with `PRIVATE_KEY`
- Use environment variables in production
- Consider multi-sig for contract admin

---

## 🚀 Deployment Checklist

- [ ] Update `.env` with Celo RPC and contract addresses
- [ ] Compile contracts: `npm run compile`
- [ ] Deploy to Celo Sepolia: `npx hardhat run scripts/deploy-celo-sepolia.js --network celoSepolia`
- [ ] Verify on Celoscan: `npx hardhat verify --network celoSepolia <ADDRESS>`
- [ ] Start backend server: `node server/self-verify-enhanced.js`
- [ ] Update frontend config with contract address
- [ ] Test complete flow end-to-end
- [ ] Monitor gas usage and optimize if needed
- [ ] Set up monitoring/alerting for contract events

---

## 📈 Gas Optimization

### Estimated Gas Costs (Celo Sepolia)

| Operation | Estimated Gas | Cost (CELO) |
|-----------|--------------|-------------|
| deployContract | 1,000,000 | ~0.05 |
| submitProof | 150,000 | ~0.008 |
| verifyProof | 100,000 | ~0.005 |
| getVerification | 5,000 (view) | Free |
| isVerified | 3,000 (view) | Free |

**Optimization Techniques:**
- Struct packing (uint96 timestamp)
- View functions for queries
- Event logging instead of storage when possible
- Batch operations in deployment script

---

## 🐛 Troubleshooting

### Problem: "Proof already used"
**Solution:** Each proof is unique. Ensure you're generating new proofs.

### Problem: "Verification failed"
**Solution:** 
- Check frontend/backend configs match
- Verify user meets all requirements (age, country, OFAC)
- Review server logs for specific failure reason

### Problem: "Contract verification timed out"
**Solution:**
- Wait a few blocks before verifying
- Ensure contract code matches deployed version
- Use `npx hardhat verify` with exact constructor arguments

### Problem: Network connectivity issues
**Solution:**
- Check Celo RPC URL is accessible: `curl -X POST https://forno.celo-sepolia.celo-testnet.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`
- Verify firewall/proxy settings
- Try alternative RPC endpoint

---

## 📚 Additional Resources

- [Self Protocol Docs](https://docs.self.xyz/)
- [Celo Developer Docs](https://docs.celo.org/)
- [Celoscan Block Explorer](https://sepolia.celoscan.io/)
- [Celo Testnet Faucet](https://faucet.celo.org/)
- [EIP-1102: Wallet RPC](https://eips.ethereum.org/EIPS/eip-1102)
- [ZK Proofs Primer](https://blog.decentraland.org/zero-knowledge-proofs/)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `node server/self-verify-enhanced.js`
3. Check browser console for frontend errors
4. Verify contract on [Celoscan](https://sepolia.celoscan.io/)
5. Review Self Protocol documentation

---

**Last Updated:** October 31, 2024  
**Status:** Production Ready for Celo Sepolia Testnet

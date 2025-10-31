# Quick Deployment Guide: Celo Sepolia

## 📋 Prerequisites

1. **Node.js & npm installed**
2. **MetaMask or Celo Wallet with Sepolia testnet**
3. **Testnet CELO tokens** (from faucet)

---

## 🚀 Step 1: Setup Environment

```bash
# Clone/update repo
cd /Users/alichen/Desktop/StayFi

# Install dependencies (if not done)
npm install

# Create .env file
cat > .env << 'EOF'
# Celo Sepolia Configuration
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Self Protocol
SELF_SCOPE=stayfi-rwa
SELF_ENDPOINT=http://localhost:3001/api/verify
MOCK_PASSPORT=true

# Contract addresses (fill after deployment)
SELF_VERIFIER_ADDRESS=
EOF

# Get your private key from MetaMask:
# 1. Open MetaMask
# 2. Click Account menu
# 3. Account Details
# 4. Export Private Key
# 5. Paste into .env
```

---

## 💰 Step 2: Get Testnet CELO

```bash
# Visit: https://faucet.celo.org/
# 1. Connect your wallet
# 2. Select Celo Sepolia network
# 3. Request CELO tokens
# 4. Wait for confirmation
```

---

## 🔧 Step 3: Deploy Contracts

```bash
# Terminal 1: Compile contracts
npm run compile

# Deploy to Celo Sepolia
npx hardhat run scripts/deploy-celo-sepolia.js --network celoSepolia

# Expected output:
# ✅ SelfVerifier deployed at: 0x...
# ✅ NightPassNFT deployed at: 0x...
# ✅ NightPassMarketplace deployed at: 0x...
# ✅ NightPassLending deployed at: 0x...
# ✅ RewardDistributor deployed at: 0x...

# Copy SelfVerifier address and add to .env:
# SELF_VERIFIER_ADDRESS=0x...
```

---

## 🔌 Step 4: Start Backend Server

```bash
# Terminal 2: Start verification server
node server/self-verify-enhanced.js

# Expected output:
# ✅ StayFi Self Verification Server Started
# 📍 Port: 3001
# 🔗 API: http://localhost:3001/api/verify
```

---

## ✅ Step 5: Verify Integration

```bash
# Terminal 3: Test health check
curl http://localhost:3001/health

# Should return:
# {
#   "status": "ok",
#   "message": "StayFi Self Verification Server Running",
#   "config": {
#     "mockMode": true,
#     "celoConfigured": true
#   }
# }
```

---

## 🌐 Step 6: Test Frontend

```bash
# Open in browser:
# Option 1: File protocol
open index.html

# Option 2: Local server (better for CORS)
# Terminal 3: python -m http.server 8000
# Then visit: http://localhost:8000/index.html
```

**Test Flow:**
1. Click "Connect imToken / Wallet"
2. Connect MetaMask to Celo Sepolia
3. Click "Continue with Email"
4. In ZK Module: Click "📱 驗證身份 / Verify Identity"
5. (Mock mode) Approve the verification
6. Should show "✅ Verified"

---

## 🔍 Step 7: Verify On-Chain

```bash
# Check contract on Celoscan
# Visit: https://sepolia.celoscan.io/address/YOUR_SELF_VERIFIER_ADDRESS

# Or query via ethers.js:
cat > check-verification.js << 'EOF'
const { ethers } = require('ethers');

const RPC = 'https://forno.celo-sepolia.celo-testnet.org';
const VERIFIER = '0x...'; // Your SelfVerifier address
const USER = '0x...';      // Your user address

const provider = new ethers.providers.JsonRpcProvider(RPC);
const verifier = new ethers.Contract(
  VERIFIER,
  ['function isVerified(address) view returns (bool)'],
  provider
);

async function check() {
  const verified = await verifier.isVerified(USER);
  console.log('User verified:', verified);
}

check();
EOF

node check-verification.js
```

---

## 📊 Monitor Transactions

**Celoscan Block Explorer:**
- URL: https://sepolia.celoscan.io/
- Search for your contract address
- View all verification events
- Track gas costs

**Key Events to Look For:**
- `ProofSubmitted(user, proofHash, attestationId)`
- `ProofVerified(user, proofHash, timestamp)`
- `VerificationFailed(user, proofHash, reason)`

---

## 🧪 Test Cases

### Test 1: Age Verification
```javascript
// Should succeed
const result = await verifier.verifyProof(
  proofHash,
  true,  // isAgeValid
  true,  // isCountryValid
  true   // isOfacClear
);

// Result: true ✅
```

### Test 2: OFAC Failure
```javascript
// Should fail
const result = await verifier.verifyProof(
  proofHash,
  true,   // isAgeValid
  true,   // isCountryValid
  false   // isOfacClear (FAILED)
);

// Result: false ❌
```

### Test 3: Replay Prevention
```javascript
// First submission
const result1 = await verifier.verifyProof(proofHash, true, true, true);
// Result: true ✅

// Same proof again (should fail)
const result2 = await verifier.verifyProof(proofHash, true, true, true);
// Error: "Proof already used" ❌
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient funds"
```bash
# Solution: Get more testnet CELO
# https://faucet.celo.org/
```

### Issue: "Network error"
```bash
# Solution: Check RPC endpoint
curl -X POST https://forno.celo-sepolia.celo-testnet.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","result":"0xaae8","id":1}
```

### Issue: Contract not found on Celoscan
```bash
# Solution: Wait for block confirmation (usually 5-10 seconds)
# Then refresh: https://sepolia.celoscan.io/address/YOUR_ADDRESS
```

### Issue: Backend won't start
```bash
# Check Node.js version
node -v  # Should be 16+

# Check port 3001 is free
lsof -i :3001

# Try different port
PORT=3002 node server/self-verify-enhanced.js
```

---

## 📱 Mobile Testing

### With Real Self App
```bash
# 1. Install Self app on mobile
# 2. Update endpoint to public URL:
#    SELF_ENDPOINT=https://your-ngrok-url.ngrok.io/api/verify

# 3. Setup ngrok tunnel:
npm install -g ngrok
ngrok http 3001

# 4. Update .env with ngrok URL
# 5. Restart server
# 6. Scan QR code with Self app
```

---

## 📈 Production Deployment

Before going live, ensure:

- [ ] `.env` variables are secure (never commit)
- [ ] `MOCK_PASSPORT=false` for real verification
- [ ] Database configured (not in-memory)
- [ ] HTTPS enabled for production
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry, LogRocket)
- [ ] Gas costs optimized
- [ ] Contract audited (optional but recommended)

---

## 🔗 Useful Links

- **Celo Sepolia Faucet:** https://faucet.celo.org/
- **Celoscan Explorer:** https://sepolia.celoscan.io/
- **Celo Docs:** https://docs.celo.org/
- **Self Protocol:** https://docs.self.xyz/
- **Hardhat:** https://hardhat.org/

---

## ⏱️ Estimated Timeline

| Step | Time |
|------|------|
| Setup | 5 min |
| Get Testnet CELO | 2 min |
| Deploy Contracts | 2 min |
| Start Server | 1 min |
| Test Frontend | 5 min |
| **Total** | **15 min** |

---

**Status:** Ready for Celo Sepolia Testing ✅  
**Last Updated:** October 31, 2024

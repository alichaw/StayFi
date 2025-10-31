# 🧪 StayFi Localhost Testing Guide

## ✅ Services Running

### 1. Backend Verification Server
- **URL:** http://localhost:3001
- **Status:** ✅ Running
- **Health Check:** http://localhost:3001/health

### 2. Frontend HTTP Server  
- **URL:** http://localhost:8000
- **Main App:** http://localhost:8000/index.html
- **Status:** ✅ Running

### 3. Smart Contract (Celo Sepolia)
- **Address:** `0x0E801D84Fa97b50751Dbf25036d067dCf18858bF`
- **Network:** Celo Sepolia Testnet (Chain ID: 11142220)
- **Explorer:** https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF

---

## 🚀 Quick Start Testing

### Step 1: Open the App
```bash
# Open in your browser
open http://localhost:8000/index.html

# Or manually visit:
# http://localhost:8000/index.html
```

### Step 2: Connect Wallet
1. Click **"Connect imToken / Wallet"**
2. Approve MetaMask connection
3. Switch to **Celo Sepolia Testnet** if prompted

**Add Celo Sepolia to MetaMask:**
- Network Name: `Celo Sepolia Testnet`
- RPC URL: `https://forno.celo-sepolia.celo-testnet.org`
- Chain ID: `11142220` (or `0xaa0dc8`)
- Currency Symbol: `CELO`
- Explorer: `https://sepolia.celoscan.io`

### Step 3: Initiate Verification
1. Click **"Continue with Email"** on login screen
2. ZK Module screen appears
3. Click **"📱 驗證身份 / Verify Identity"** button

### Step 4: Complete Verification (Mock Mode)
Since `MOCK_PASSPORT=true` in `.env`, the backend will:
- ✅ Simulate proof verification
- ✅ Submit to blockchain automatically
- ✅ Return verification result

**Watch the status indicators:**
- Age 18+ → ⏳ → ✅
- Not Sanctioned Country → ⏳ → ✅  
- OFAC Compliant → ⏳ → ✅

---

## 🔍 Verify Results

### Check Backend Logs
```bash
# Backend should show logs like:
# 📨 Received verification request
# 🔐 Verifying proof with Self SDK...
# ✅ Verification result: { isValid: true }
# 🔗 Submitting proof to blockchain...
# ✅ On-chain verification submitted: 0x...
```

### Check Contract Status
```bash
# Query contract with your wallet address
node scripts/check-verification.js 0xYourWalletAddress

# Example output:
# 📌 Is Verified: ✅ YES
# 📋 Verification Details:
#   Age Valid (18+): ✅
#   Country Valid: ✅
#   OFAC Clear: ✅
```

### View on Block Explorer
Visit Celoscan to see the transaction:
```
https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
```

Look for:
- `ProofSubmitted` events
- `ProofVerified` events
- Recent transactions

---

## 📊 API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "StayFi Verification Server Running"
}
```

### Get Configuration
```bash
curl http://localhost:3001/api/config
```

**Expected Response:**
```json
{
  "verification": {
    "minimumAge": 18,
    "excludedCountries": ["CUB", "IRN", "PRK", "RUS"],
    "ofac": true
  },
  "self": {
    "scope": "stayfi-rwa",
    "mockMode": true
  },
  "blockchain": {
    "network": "celo-sepolia",
    "selfVerifierAddress": "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF",
    "rpcUrl": "https://forno.celo-sepolia.celo-testnet.org"
  }
}
```

### Manual Proof Verification (Advanced)
```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "attestationId": 1,
    "proof": "0x1234...",
    "publicSignals": [1, 2, 3],
    "userContextData": "0xabcd..."
  }'
```

---

## 🧪 Test Scenarios

### ✅ Scenario 1: Successful Verification
1. Connect wallet
2. Click "Verify Identity"
3. Wait for confirmation
4. Check all status indicators turn ✅
5. Verify on-chain record exists

**Expected Result:** User marked as verified in contract

### ❌ Scenario 2: Verification Failure (Manual Test)
To test failure, modify backend to simulate rejection:
```javascript
// In server/self-verify-enhanced.js, temporarily change:
const isAgeValid = false; // Simulate age check failure
```

**Expected Result:** Verification fails, error displayed

### 🔄 Scenario 3: Replay Prevention
1. Complete verification once
2. Try to verify again with same proof
3. Should be rejected (proof already used)

**Expected Result:** "Proof already used" error

---

## 🐛 Troubleshooting

### Problem: Backend not responding
```bash
# Check if process is running
lsof -i :3001

# Restart if needed
pkill -f "node server/self-verify-enhanced.js"
node server/self-verify-enhanced.js &
```

### Problem: Frontend not loading
```bash
# Check if http-server is running
lsof -i :8000

# Restart if needed
pkill -f "http-server"
npx http-server -p 8000 --cors &
```

### Problem: MetaMask not connecting
1. Make sure MetaMask is installed
2. Switch to Celo Sepolia network
3. Refresh the page
4. Check browser console for errors

### Problem: Contract query fails
```bash
# Test RPC connection
curl -X POST https://forno.celo-sepolia.celo-testnet.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","result":"0xaa0dc8","id":1}
```

### Problem: Verification timeout
- Check backend logs for errors
- Verify contract address is correct in `.env`
- Ensure wallet has testnet CELO for gas

---

## 📋 Pre-Submission Checklist

Before submitting to hackathon:

- [ ] Backend server running without errors
- [ ] Frontend accessible on localhost:8000
- [ ] Can connect MetaMask to Celo Sepolia
- [ ] Verification flow completes successfully
- [ ] Contract query shows verified status
- [ ] Transaction visible on Celoscan
- [ ] All three verification criteria pass (Age, Country, OFAC)
- [ ] Screenshots/video captured of complete flow

---

## 🎥 Recording Demo Video

### What to Capture
1. **Opening screen** - http://localhost:8000/index.html
2. **Wallet connection** - MetaMask popup and approval
3. **Network switch** - Changing to Celo Sepolia
4. **ZK Module** - Verification screen with QR code/button
5. **Status updates** - Watch ⏳ turn to ✅
6. **Backend logs** - Terminal showing verification process
7. **Celoscan** - On-chain transaction confirmation
8. **Contract query** - Running check-verification.js script

### Recommended Tools
- **macOS:** QuickTime Screen Recording
- **Cross-platform:** OBS Studio
- **Simple:** Loom (online)

### Demo Script
```
1. "Here's StayFi running on localhost"
2. "I'll connect my MetaMask wallet"
3. "Now switching to Celo Sepolia testnet"
4. "Clicking to verify my identity with Self Protocol"
5. "The backend is verifying my ZK proof..."
6. "All three checks passed: Age 18+, Country, and OFAC"
7. "Let's check the contract on Celoscan"
8. "Here's the on-chain proof verification record"
9. "And querying the contract directly shows I'm verified"
```

---

## 🔗 Useful Links

- **Local Frontend:** http://localhost:8000/index.html
- **Local Backend:** http://localhost:3001
- **Backend Health:** http://localhost:3001/health
- **Backend Config:** http://localhost:3001/api/config
- **Celoscan Contract:** https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
- **Celo Faucet:** https://faucet.celo.org/
- **Self Protocol Docs:** https://docs.self.xyz/

---

## 🎯 Success Criteria

Your localhost testing is successful if:

✅ Backend responds to health check  
✅ Frontend loads without errors  
✅ MetaMask connects to Celo Sepolia  
✅ Verification completes with all ✅  
✅ Contract query shows isVerified = true  
✅ Transaction appears on Celoscan  
✅ No errors in browser console  
✅ No errors in backend logs  

---

## 📞 Next Steps

After successful localhost testing:

1. **Deploy to Production**
   - Use Vercel/Netlify for frontend
   - Use Heroku/Railway for backend
   - Update endpoints in `.env`

2. **Record Demo Video**
   - Follow demo script above
   - Upload to YouTube/Loom
   - Share link in submission

3. **Prepare Submission**
   - Repo URL: GitHub public repo
   - Demo URL: http://localhost:8000 (or deployed URL)
   - Contract: 0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
   - Video: [Your demo video link]
   - README: Updated with screenshots

---

**Status:** ✅ Ready for Testing  
**Last Updated:** October 31, 2024

---

## 🚀 Start Testing Now

```bash
# 1. Open frontend
open http://localhost:8000/index.html

# 2. Watch backend logs
tail -f server/self-verify-enhanced.log  # (if logging to file)

# 3. Query contract after verification
node scripts/check-verification.js <YOUR_WALLET_ADDRESS>
```

**Happy Testing! 🎉**

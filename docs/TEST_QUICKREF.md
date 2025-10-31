# 🚀 StayFi - Quick Testing Reference

## ✅ Current Status

```
✅ Backend Running:    http://localhost:3001
✅ Frontend Running:   http://localhost:8000
✅ Contract Deployed:  0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
✅ Network:            Celo Sepolia (Chain ID: 11142220)
```

---

## 🎯 One-Line Commands

```bash
# Check backend health
curl http://localhost:3001/health

# Open frontend
open http://localhost:8000/index.html

# Check contract (replace with your address)
node scripts/check-verification.js 0xYourAddress

# View on Celoscan
open https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
```

---

## 📱 Testing Steps

### 1. Open App
→ Browser opens to http://localhost:8000/index.html

### 2. Connect Wallet  
→ Click "Connect imToken / Wallet"  
→ Approve MetaMask  
→ Switch to Celo Sepolia if needed

### 3. Verify Identity
→ Click "Continue with Email"  
→ Click "📱 驗證身份 / Verify Identity"  
→ Wait for ✅ ✅ ✅

### 4. Check Results
```bash
# Replace with your wallet address
node scripts/check-verification.js 0xYourAddress
```

---

## 🔍 Expected Results

### Backend Logs
```
✅ StayFi Verification Server Started
📍 Port: 3001
🔗 API: http://localhost:3001/api/verify
📨 Received verification request
🔐 Verifying proof with Self SDK...
✅ Verification result: { isValid: true }
🔗 Submitting proof to blockchain...
✅ On-chain verification submitted: 0x...
```

### Frontend UI
```
Age 18+                    ✅
Not Sanctioned Country     ✅
OFAC Compliant            ✅
```

### Contract Query
```
📌 Is Verified: ✅ YES
  Age Valid (18+): ✅
  Country Valid: ✅
  OFAC Clear: ✅
```

---

## 🆘 Quick Fixes

### Backend down?
```bash
pkill -f "node server/self-verify-enhanced.js"
node server/self-verify-enhanced.js &
```

### Frontend down?
```bash
pkill -f "http-server"
npx http-server -p 8000 --cors &
```

### Wallet won't connect?
1. Install MetaMask
2. Add Celo Sepolia network manually
3. Refresh page

---

## 📊 Key Endpoints

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8000/index.html |
| Backend | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Config API | http://localhost:3001/api/config |
| Celoscan | https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF |

---

## 📹 Demo Recording Checklist

- [ ] Show frontend loading
- [ ] Connect MetaMask
- [ ] Click "Verify Identity"
- [ ] Watch status indicators
- [ ] Show backend logs
- [ ] Query contract
- [ ] Show Celoscan transaction

**Total time:** ~2-3 minutes

---

## 🎓 Self Protocol Integration Highlights

✅ **Zero-Knowledge Proofs** - Age, country, OFAC verified without revealing data  
✅ **On-Chain Verification** - Proofs stored on Celo Sepolia blockchain  
✅ **Replay Prevention** - Proof hashing prevents reuse  
✅ **Gas Optimized** - ~0.063 CELO per full verification  
✅ **Privacy First** - No personal data stored anywhere  

---

## 📝 For Hackathon Submission

```markdown
**Project:** StayFi - RWA Platform with Self Protocol ZK Verification
**Demo:** http://localhost:8000 (video: [link])
**Contract:** 0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
**Network:** Celo Sepolia Testnet
**Explorer:** https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF

**Features:**
- ✅ Self SDK Integration (@selfxyz/core, @selfxyz/qrcode)
- ✅ Age 18+ verification
- ✅ Country sanctions check (CUB, IRN, PRK, RUS)
- ✅ OFAC compliance verification
- ✅ On-chain proof storage
- ✅ Privacy-preserving (zero-knowledge)
- ✅ Frontend + Backend + Smart Contract
```

---

**Need help?** Check `LOCALHOST_TESTING.md` for full guide.

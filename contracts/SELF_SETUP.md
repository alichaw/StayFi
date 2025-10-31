# Self Protocol 整合指南 - Celo Testnet

## 📋 概述

Self Protocol 是一個零知識證明 (ZK Proof) 身份驗證系統，允許用戶在不洩露個人資訊的情況下證明：
- ✅ 年齡 18 歲以上
- ✅ 來自非制裁國家
- ✅ OFAC 合規（非制裁名單）

## 🏗️ 架構

```
┌─────────────────┐
│   User Wallet   │
└────────┬────────┘
         │
         ├─► 1. 生成 ZK Proof (前端)
         │      ↓
         ├─► 2. Submit to SelfVerifier Contract (Celo)
         │      ↓
         └─► 3. On-chain Verification ✅
```

## 📝 部署步驟

### 1. 編譯合約

```bash
cd /Users/alichen/Desktop/StayFi
npx hardhat compile
```

### 2. 部署到 Celo Testnet (Sepolia)

```bash
# 設置環境變數
export PRIVATE_KEY="your_private_key_here"

# 部署
npx hardhat run contracts/deploy-self.js --network celoSepolia
```

**預期輸出：**
```
🔐 Deploying Self Protocol Verifier Contract...
✅ SelfVerifier deployed to: 0x1234...5678
Deployer: 0xabcd...ef01

📝 Contract Configuration:
SELF_VERIFIER: 0x1234...5678

🔧 Sanctioned Countries:
  CU: Sanctioned
  IR: Sanctioned
  KP: Sanctioned
  SY: Sanctioned
  RU: Sanctioned
```

### 3. 記錄合約地址

複製 `SELF_VERIFIER` 地址，稍後需要更新到前端。

## 🔧 前端整合

### 1. 更新 CONFIG

在 `index.html` 中找到 CONFIG 對象（約 line 1086），添加：

```javascript
CONTRACTS: {
    NIGHT_PASS_NFT: '0x...',
    MARKETPLACE: '0x...',
    PASSFI_LENDING: '0x...',
    SELF_VERIFIER: '0xYOUR_DEPLOYED_ADDRESS' // 新增
}
```

### 2. 添加 ABI

在其他 ABI 之後（約 line 1121），添加：

```javascript
const SELF_VERIFIER_ABI = [
    "function submitVerification(address user, bytes32 proofHash, uint8 attributes) external",
    "function verifyUser(address user, uint8 requiredAttributes) view returns (bool)",
    "function getVerification(address user) view returns (bool, uint256, uint256, bytes32, bool, bool, bool)",
    "function isFullyCompliant(address user) view returns (bool)"
];
```

### 3. 初始化合約

在錢包連接成功後（約 line 1938），添加：

```javascript
selfVerifierContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.SELF_VERIFIER,
    SELF_VERIFIER_ABI,
    signer
);
console.log('🔐 Self Verifier Contract initialized');
```

### 4. 替換驗證函數

參考 `self-integration.js` 中的代碼，替換：
- `initializeSelfProtocol()`
- `generateSelfQRCode()`

並添加新函數：
- `generateZKProof()`
- `submitProofOnChain()`
- `checkOnChainVerification()`
- `requireFullCompliance()`

## 🧪 測試流程

### 1. 用戶驗證流程

1. **連接錢包**
   ```
   用戶點擊 "Connect Wallet"
   → MetaMask/imToken 彈出
   → 確認連接到 Celo Sepolia
   ```

2. **進入驗證頁面**
   ```
   自動跳轉到 screen-zk-module
   → 顯示三個驗證項目（待驗證 ⏳）
   ```

3. **開始驗證**
   ```
   用戶點擊 "📱 驗證身份"
   → 生成 ZK Proof (前端)
   → 提交到 SelfVerifier 合約
   → 等待交易確認
   ```

4. **驗證成功**
   ```
   三個項目都變成 ✅
   → 顯示 "✅ Verified on Celo!"
   → 自動跳轉到 Explore 頁面
   ```

### 2. 檢查鏈上狀態

在瀏覽器控制台執行：

```javascript
// 檢查當前用戶是否已驗證
const isCompliant = await selfVerifierContract.isFullyCompliant(userAddress);
console.log('Is compliant:', isCompliant);

// 查看詳細驗證資訊
const verification = await selfVerifierContract.getVerification(userAddress);
console.log('Verification:', {
    isVerified: verification[0],
    verifiedAt: new Date(verification[1] * 1000),
    expiresAt: new Date(verification[2] * 1000),
    age18Plus: verification[4],
    nonSanctioned: verification[5],
    ofacClear: verification[6]
});
```

### 3. 測試訪問控制

驗證完成後嘗試 Mint NFT，應該成功。

未驗證用戶嘗試 Mint，會看到：
```
⚠️ 需要先完成 KYC 驗證 / KYC verification required

請先完成年齡、國籍和 OFAC 驗證。
```

## 🔒 安全特性

### 1. 零知識證明
- ✅ 不洩露具體年齡，只證明 18+
- ✅ 不洩露具體國籍，只證明非制裁國家
- ✅ 不洩露個人身份，只證明通過 OFAC 檢查

### 2. 鏈上驗證
- ✅ 證明儲存在 Celo 區塊鏈上
- ✅ 任何人都可以驗證（公開透明）
- ✅ 不可篡改（區塊鏈不可變性）

### 3. 過期機制
- ✅ 驗證有效期 90 天
- ✅ 過期後需重新驗證
- ✅ 防止過時資訊

### 4. 訪問控制
- ✅ 只有受信任的驗證者可以提交證明
- ✅ 合約 Owner 可以管理驗證者清單
- ✅ 合約 Owner 可以撤銷驗證

## 📊 屬性編碼

驗證屬性使用 bitmap 編碼：

```
bit 0 (值 1): Age 18+
bit 1 (值 2): Non-sanctioned country  
bit 2 (值 4): OFAC clear

完全合規 = 0b111 = 7
```

範例：
```solidity
// 檢查所有屬性
uint8 allAttributes = 7; // 0b111
bool isCompliant = verifyUser(user, allAttributes);

// 只檢查年齡
uint8 ageOnly = 1; // 0b001
bool isAdult = verifyUser(user, ageOnly);
```

## 🔍 鏈上查詢

### 使用 Hardhat Console

```bash
npx hardhat console --network celoSepolia
```

```javascript
const SelfVerifier = await ethers.getContractFactory("SelfVerifier");
const verifier = await SelfVerifier.attach("YOUR_CONTRACT_ADDRESS");

// 查詢用戶驗證狀態
const userAddress = "0x...";
const verification = await verifier.getVerification(userAddress);
console.log(verification);

// 檢查是否完全合規
const isCompliant = await verifier.isFullyCompliant(userAddress);
console.log("Compliant:", isCompliant);
```

### 使用區塊鏈瀏覽器

訪問 Celo Sepolia Blockscout:
```
https://celo-sepolia.blockscout.com/address/YOUR_CONTRACT_ADDRESS
```

## 🐛 常見問題

### Q: 交易失敗 "Not a trusted verifier"
A: 確認你使用的錢包地址是部署合約的地址。只有受信任的驗證者（deployer）可以提交驗證。

### Q: 驗證過期怎麼辦？
A: 用戶需要重新進行驗證流程。過期時間為 90 天。

### Q: 如何添加更多受信任的驗證者？
A: 使用 Owner 權限調用：
```javascript
await verifier.addTrustedVerifier("0xNEW_VERIFIER_ADDRESS");
```

### Q: 可以撤銷某用戶的驗證嗎？
A: 可以，使用：
```javascript
await verifier.revokeVerification("0xUSER_ADDRESS");
```

## 📝 合約地址（範例）

```
Network: Celo Sepolia Testnet (Chain ID: 11142220)
RPC: https://forno.celo-sepolia.celo-testnet.org
Explorer: https://celo-sepolia.blockscout.com

SELF_VERIFIER: 0x... (部署後更新)
```

## 🚀 進階功能

### 1. 整合 Self Protocol SDK（未來）

當 Self Protocol 推出正式 SDK 時，可以替換 `generateZKProof()` 函數：

```javascript
import { SelfSDK } from '@self-protocol/sdk';

async function generateZKProof() {
    const self = new SelfSDK({
        network: 'celo-sepolia'
    });
    
    // 使用 Self app 生成真實 ZK proof
    const proof = await self.generateProof({
        attributes: ['age_18_plus', 'country', 'ofac']
    });
    
    return proof;
}
```

### 2. 支援更多屬性

修改合約添加新屬性：
```solidity
uint8 constant ATTR_NAME_VERIFIED = 1 << 3;    // bit 3
uint8 constant ATTR_PASSPORT = 1 << 4;         // bit 4
```

### 3. 多鏈支持

部署相同合約到其他鏈：
- Celo Mainnet
- Polygon
- Ethereum
- Arbitrum

## 📚 參考資料

- [Self Protocol Docs](https://docs.selfprotocol.io/)
- [Celo Developer Docs](https://docs.celo.org/)
- [Zero-Knowledge Proofs](https://z.cash/technology/zksnarks/)
- [EIP-3643 (T-REX)](https://eips.ethereum.org/EIPS/eip-3643)

## ✅ Checklist

完成整合後確認：

- [ ] SelfVerifier 合約已部署到 Celo Sepolia
- [ ] 前端已更新合約地址和 ABI
- [ ] 用戶可以完成驗證流程
- [ ] 驗證狀態正確儲存到鏈上
- [ ] 可以查詢鏈上驗證狀態
- [ ] 訪問控制正常工作（未驗證用戶無法 mint）
- [ ] 提供截圖/影片展示完整流程
- [ ] README 包含合約地址和使用說明
- [ ] 原始碼已公開到 GitHub

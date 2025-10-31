# StayFi - Self Protocol Deployment Guide

## 🎯 目標
部署 Self Protocol 驗證合約到 Celo Alfajores 測試網，實現端到端零知識身份驗證流程。

---

## 📋 前置準備

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
創建 `.env` 文件：
```bash
# 錢包私鑰（不要上傳到 Git！）
PRIVATE_KEY=your_private_key_here

# CeloScan API Key（可選，用於合約驗證）
CELOSCAN_API_KEY=your_celoscan_api_key
```

### 3. 獲取測試網 CELO
訪問 [Celo Faucet](https://faucet.celo.org/alfajores) 獲取測試幣：
- 切換到 Alfajores 網絡
- 輸入你的錢包地址
- 領取測試幣（約需 1-2 分鐘）

---

## 🚀 部署步驟

### 步驟 1: 編譯合約
```bash
npx hardhat compile
```

預期輸出：
```
Compiled 1 Solidity file successfully
```

### 步驟 2: 部署 SelfVerifier 合約
```bash
npx hardhat run scripts/deploy-self-verifier.js --network celoSepolia
```

預期輸出示例：
```
🚀 Deploying SelfVerifier to Celo Sepolia...
📝 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
💰 Account balance: 5.5 CELO

📦 Deploying SelfVerifier contract...
✅ SelfVerifier deployed to: 0x1234567890abcdef1234567890abcdef12345678
🔗 View on CeloScan: https://alfajores.celoscan.io/address/0x1234...

⏳ Waiting for block confirmations...
🔍 Verifying contract on CeloScan...
✅ Contract verified on CeloScan

📄 Deployment info saved to deployment-self-verifier.json
🎉 Deployment complete!
```

### 步驟 3: 驗證部署
檢查生成的 `deployment-self-verifier.json` 文件：
```json
{
  "network": "Celo Sepolia",
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "deployer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "blockNumber": 12345678,
  "explorerUrl": "https://alfajores.celoscan.io/address/0x1234..."
}
```

---

## 🔗 整合到前端

### 步驟 1: 更新合約地址
在 `index.html` 中更新配置：

```javascript
const SELF_VERIFIER_CONFIG = {
    CHAIN_ID: '0xaef3', // 44787 (Celo Alfajores)
    CHAIN_NAME: 'Celo Alfajores Testnet',
    RPC_URL: 'https://alfajores-forno.celo-testnet.org',
    EXPLORER: 'https://alfajores.celoscan.io',
    VERIFIER_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678', // 從部署輸出複製
    CURRENCY: {
        name: 'CELO',
        symbol: 'CELO',
        decimals: 18
    }
};
```

### 步驟 2: 添加 ABI
```javascript
const SELF_VERIFIER_ABI = [
    "function verifyProof(bytes memory proofData, bytes32 proofHash, bool isAgeValid, bool isCountryValid, bool isOfacClear) external returns (bool)",
    "function isVerified(address user) external view returns (bool)",
    "function getVerification(address user) external view returns (tuple(bool isVerified, uint256 timestamp, bytes32 proofHash, bool isAgeValid, bool isCountryValid, bool isOfacClear))",
    "function hasExpired(address user) external view returns (bool)",
    "function timeUntilExpiry(address user) external view returns (uint256)"
];
```

---

## 🧪 測試驗證流程

### 測試腳本
創建 `scripts/test-verification.js`：

```javascript
const hre = require("hardhat");

async function main() {
  const verifierAddress = "0x..."; // 從部署輸出複製
  const [user] = await hre.ethers.getSigners();

  const SelfVerifier = await hre.ethers.getContractAt("SelfVerifier", verifierAddress);

  console.log("Testing verification for:", user.address);

  // 測試驗證
  const proofData = hre.ethers.toUtf8Bytes("test-proof-data");
  const proofHash = hre.ethers.keccak256(proofData);
  
  const tx = await SelfVerifier.verifyProof(
    proofData,
    proofHash,
    true,  // isAgeValid
    true,  // isCountryValid
    true   // isOfacClear
  );

  await tx.wait();
  console.log("✅ Verification submitted");

  // 檢查狀態
  const isVerified = await SelfVerifier.isVerified(user.address);
  console.log("Verification status:", isVerified);

  const verification = await SelfVerifier.getVerification(user.address);
  console.log("Verification details:", verification);
}

main().catch(console.error);
```

運行測試：
```bash
npx hardhat run scripts/test-verification.js --network celoSepolia
```

---

## 📱 Self SDK 整合（實際實現）

### 安裝 Self SDK
```bash
npm install @self.id/web
```

### 前端整合範例
```javascript
// 1. 初始化 Self Protocol
import { SelfID } from '@self.id/web';

const selfID = await SelfID.authenticate({
  authProvider: new EthereumAuthProvider(window.ethereum, userAddress),
  ceramic: 'testnet-clay',
  connectNetwork: 'testnet-clay',
});

// 2. 請求身份證明
const proof = await selfID.client.dataStore.get('basicProfile');

// 3. 生成 ZK Proof（使用 Self Protocol）
const zkProof = await generateZKProof({
  age: proof.age,
  country: proof.country,
  ofacStatus: proof.ofacStatus
});

// 4. 提交到鏈上驗證
const verifierContract = new ethers.Contract(
  VERIFIER_ADDRESS,
  SELF_VERIFIER_ABI,
  signer
);

const proofData = ethers.toUtf8Bytes(JSON.stringify(zkProof));
const proofHash = ethers.keccak256(proofData);

const tx = await verifierContract.verifyProof(
  proofData,
  proofHash,
  zkProof.isAgeValid,
  zkProof.isCountryValid,
  zkProof.isOfacClear
);

await tx.wait();
console.log("✅ Onchain verification complete!");
```

---

## 🎥 演示流程

### 完整驗證流程：

1. **用戶連接錢包**
   - 檢測 MetaMask/imToken
   - 切換到 Celo Alfajores 網絡

2. **觸發身份驗證**
   - 點擊「Verify Identity」
   - Self Protocol 生成 ZK Proof

3. **鏈上驗證**
   - 前端調用 `verifyProof()`
   - 合約驗證並記錄狀態
   - 發出 `ProofVerified` 事件

4. **查詢驗證狀態**
   - 調用 `isVerified(address)`
   - 顯示驗證結果和過期時間

5. **使用驗證狀態**
   - 限制未驗證用戶操作
   - 顯示驗證徽章

---

## 🔍 故障排除

### 問題 1: 部署失敗
**錯誤**: `insufficient funds for gas`
**解決**: 從 Celo Faucet 獲取更多測試幣

### 問題 2: 驗證失敗
**錯誤**: `Failed to verify contract`
**解決**: 手動驗證
```bash
npx hardhat verify --network celoSepolia 0x合約地址
```

### 問題 3: 交易卡住
**解決**: 增加 gas price
```javascript
{
  gasPrice: ethers.parseUnits("30", "gwei")
}
```

---

## 📊 合約功能說明

### 核心函數

#### `verifyProof()`
提交零知識證明進行鏈上驗證。

**參數**:
- `proofData`: 證明數據（bytes）
- `proofHash`: 證明哈希（防重放攻擊）
- `isAgeValid`: 年齡是否符合（18+）
- `isCountryValid`: 國家是否合規
- `isOfacClear`: 是否通過 OFAC 檢查

**返回**: `bool` - 是否驗證成功

#### `isVerified(address)`
檢查用戶當前驗證狀態（包含過期檢查）。

#### `getVerification(address)`
獲取完整驗證詳情。

#### `timeUntilExpiry(address)`
查詢驗證剩餘有效時間（秒）。

---

## ✅ 黑客松提交檢查清單

- [ ] 合約已部署到 Celo Alfajores
- [ ] 合約已在 CeloScan 上驗證
- [ ] 前端已整合合約地址
- [ ] 端到端驗證流程可演示
- [ ] 錄製演示影片（2-5 分鐘）
- [ ] 更新 README 說明文檔
- [ ] 截圖關鍵流程
- [ ] 記錄合約地址和交易哈希

---

## 📄 參考資源

- [Self Protocol Docs](https://docs.self.id/)
- [Celo Docs](https://docs.celo.org/)
- [Hardhat Docs](https://hardhat.org/)
- [Ethers.js v6](https://docs.ethers.org/v6/)

---

## 🎉 完成！

你現在已經：
✅ 部署了 Self 驗證合約到 Celo
✅ 實現了鏈上零知識證明驗證
✅ 準備好黑客松演示材料

繼續下一步: **集成真實 Self SDK 替換 Demo 模式** 🚀

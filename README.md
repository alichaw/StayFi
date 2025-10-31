# 🏨 StayFi - Real World Asset (RWA) on Blockchain

> Own Your Night: Hotel Night-Pass as Tokenized RWA NFTs on Multiple Blockchains

StayFi 是一個創新的 RWA (Real World Assets) 平台，將飯店房晚代幣化為 NFT。目前支援：
- 🔵 **Celo** - EVM 兼容，低成本，移動優先
- 🔴 **SUI** - 高性能，Move 語言，<1秒確認

---

## ✨ 核心功能

### 🎫 **Night-Pass NFT**
- **鑄造 (Mint)**: 將飯店房晚鑄造為 ERC-721 NFT
- **元數據**: 包含飯店名稱、入住日期、價格、APY 等資訊
- **合規性**: 整合 OFAC 驗證，符合 ERC-3643 標準

### 🛒 **去中心化市場**
- **P2P 交易**: 直接買賣 Night-Pass NFT
- **平台費用**: 2.5% 平台手續費
- **即時結算**: 智能合約自動執行交易

### 🔐 **合規轉移 (ERC-3643)**
- **OFAC 驗證**: 轉移前驗證接收方合規性
- **ZK Proof**: 保護隱私的零知識證明
- **限制轉移**: 只有合規地址可接收 NFT

### 💰 **Pass-Fi 借貸**
- **NFT 抵押**: 使用 Night-Pass 作為抵押品
- **借出流動資金**: 獲得 USDC/CELO
- **LTV 比例**: 最高 50% 借貸價值比

---

## 🔗 支援的區塊鏈

### Celo (EVM)
- **語言**: Solidity
- **網絡**: Alfajores Testnet
- **文檔**: 見下方「快速開始」

### SUI
- **語言**: Move
- **網絡**: Testnet / Devnet
- **文檔**: 📖 [SUI_INTEGRATION.md](./SUI_INTEGRATION.md)
- **前端**: `sui-integration.html`

---

## 🚀 快速開始 (Celo)

### 前置需求

```bash
# 1. 安裝 Node.js (v16+)
node --version  # 確認版本

# 2. 安裝 MetaMask 瀏覽器擴充功能
# https://metamask.io

# 3. 取得 Celo 測試網代幣
# https://faucet.celo.org
```

### 📦 安裝依賴

```bash
# Clone 專案
cd StayFi

# 安裝 Hardhat 和依賴
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv

# 初始化 Hardhat (如果需要)
npx hardhat
```

### 🔑 設定環境變數

建立 `.env` 檔案：

```bash
# 你的錢包私鑰 (從 MetaMask 匯出)
PRIVATE_KEY=your_private_key_here

# Celoscan API Key (可選，用於驗證合約)
CELOSCAN_API_KEY=your_api_key_here
```

⚠️ **重要**: 永遠不要將 `.env` 提交到 Git！

---

## 📝 部署智能合約

### 1️⃣ 編譯合約

```bash
npx hardhat compile
```

### 2️⃣ 部署到 Celo Alfajores 測試網

```bash
npx hardhat run scripts/deploy.js --network alfajores
```

輸出範例：
```
🚀 Starting StayFi contract deployment...

📝 Deploying contracts with account: 0x1234...5678
💰 Account balance: 5.2345 CELO

✅ NightPassNFT deployed to: 0xABCD...1234
✅ NightPassMarketplace deployed to: 0xEFGH...5678

============================================================
🎉 Deployment Complete!
============================================================

📋 Contract Addresses:
   NightPassNFT:         0xABCD...1234
   NightPassMarketplace: 0xEFGH...5678
```

### 3️⃣ 更新前端配置

在 `app.html` 中找到並更新合約地址：

```javascript
CONTRACTS: {
    NIGHT_PASS_NFT: '0xYourDeployedNFTAddress',  // ← 更新這裡
    MARKETPLACE: '0xYourDeployedMarketplaceAddress'  // ← 更新這裡
}
```

---

## 🌐 運行 Demo

```bash
# 使用 Python 簡單伺服器
python3 -m http.server 8000

# 或使用 npx
npx http-server -p 8000

# 訪問: http://localhost:8000/app.html
```

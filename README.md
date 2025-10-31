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

### 選項 1: 直接開啟 HTML

```bash
# 在瀏覽器中開啟
open app.html
```

### 選項 2: 使用本地伺服器

```bash
# 使用 Python 簡單伺服器
python3 -m http.server 8000

# 或使用 npx
npx http-server -p 8000

# 訪問: http://localhost:8000/app.html
```

---

## 🎯 使用流程

### 1️⃣ **連接錢包**

1. 點擊 "Connect Wallet (MetaMask)"
2. 批准 MetaMask 連接請求
3. 確認切換到 Celo Alfajores 測試網

### 2️⃣ **鑄造 Night-Pass**

1. 點擊 "Mint Night-Pass NFT"
2. 在 MetaMask 中確認交易
3. 等待交易確認（約 5 秒）
4. 查看你的 NFT 收藏

### 3️⃣ **測試其他功能**

- **查看交易**: 在 [Alfajores Celoscan](https://alfajores.celoscan.io) 查看你的交易
- **檢視 NFT**: 查看 NFT 的元數據和所有權
- **轉移測試**: 嘗試轉移給其他合規地址

---

## 📚 合約架構

### NightPassNFT.sol
```solidity
// 主要功能
- mintNightPass()        // 鑄造 NFT
- useNightPass()         // 標記為已使用
- updateCompliance()     // 更新合規狀態
- getNightPass()         // 查詢 NFT 詳情
```

### NightPassMarketplace.sol
```solidity
// 主要功能
- listNightPass()        // 上架到市場
- buyNightPass()         // 購買 NFT
- cancelListing()        // 取消上架
- withdrawFees()         // 提取平台費用
```

---

## 🧪 測試

```bash
# 運行測試 (待實作)
npx hardhat test

# 檢查 Gas 使用
npx hardhat test --gas-report

# 測試覆蓋率
npx hardhat coverage
```

---

## 🔧 常見問題

### Q: 為什麼無法鑄造 NFT？
A: 確認以下事項：
- ✅ 錢包已連接到 Celo Alfajores 測試網
- ✅ 有足夠的 CELO 測試幣（至少 0.2 CELO）
- ✅ 合約地址已正確更新在 `app.html`
- ✅ 你的地址已被設為合規（部署時自動完成）

### Q: 如何取得測試幣？
A: 訪問 [Celo Faucet](https://faucet.celo.org)，輸入你的錢包地址即可領取。

### Q: MetaMask 沒有 Celo 網路？
A: App 會自動提示添加 Celo Alfajores 測試網，點擊批准即可。

### Q: 交易失敗？
A: 常見原因：
- Gas 不足
- 未合規地址
- 合約未部署

---

## 🛣️ 路線圖

### Phase 1: MVP (當前)
- [x] 基礎 NFT 合約
- [x] Marketplace 合約
- [x] Web3 前端整合
- [x] 部署到 Celo 測試網

### Phase 2: 增強功能
- [ ] Pass-Fi 借貸合約
- [ ] IPFS 元數據存儲
- [ ] ZK Proof 整合
- [ ] 進階 UI/UX

### Phase 3: 生產就緒
- [ ] 安全審計
- [ ] 主網部署
- [ ] 與飯店 API 整合
- [ ] 移動端 App

---

## 🤝 貢獻

歡迎提交 PR！請確保：

1. 遵循 Solidity 風格指南
2. 添加適當的測試
3. 更新文檔

---

## 📄 授權

MIT License

---

## 🔗 相關連結

- **Celo 文檔**: https://docs.celo.org
- **Hardhat 文檔**: https://hardhat.org
- **OpenZeppelin**: https://openzeppelin.com/contracts
- **ERC-3643**: https://erc3643.org

---

## 📞 支援

有問題？聯繫我們：
- **GitHub Issues**: [提交問題](https://github.com/your-repo/issues)
- **Discord**: [加入社群](https://discord.gg/stayfi)

---

**Built with ❤️ by StayFi Team**

🌟 如果這個專案對你有幫助，請給我們一個 Star！

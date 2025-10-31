# 📁 StayFi 專案結構

## 📂 目錄說明

```
StayFi/
├── 📄 README.md                          # 專案主文檔
├── 📄 index.html                         # 主應用入口
├── 📄 package.json                       # 專案配置
├── 📄 hardhat.config.js                  # Hardhat 配置
├── 📄 .env                               # 環境變數
│
├── 📁 frontend/                          # 前端展示頁面
│   ├── app.html                          # 完整應用展示
│   ├── imtoken-simple-test.html          # 簡化測試頁面（推薦）
│   ├── multichain-app.html               # 多鏈應用
│   └── sui-integration.html              # SUI 鏈整合
│
├── 📁 contracts/                         # 智能合約
│   ├── SelfVerifier.sol                  # ⭐ Self Protocol 驗證合約
│   ├── NightPassNFT.sol                  # NFT 合約
│   ├── NightPassMarketplace.sol          # 市場合約
│   ├── NightPassLending.sol              # 借貸合約
│   ├── RewardDistributor.sol             # 獎勵合約
│   └── PassFiLending.sol                 # Pass-Fi 借貸
│
├── 📁 scripts/                           # 部署腳本
│   ├── deploy-celo-sepolia.js            # Celo 部署
│   ├── deploy-self-verifier.js           # Self 驗證器部署
│   ├── check-verification.js             # 驗證查詢腳本
│   └── deploy-sui.js                     # SUI 部署
│
├── 📁 server/                            # 後端服務
│   ├── self-verify-enhanced.js           # ⭐ Self Protocol 驗證服務
│   └── verify-server.js                  # 驗證服務（原始版）
│
├── 📁 docs/                              # 文檔
│   ├── QUICK_START.md                    # 快速開始
│   ├── LOCALHOST_TESTING.md              # 本地測試指南
│   ├── TEST_QUICKREF.md                  # 測試快速參考
│   ├── HACKATHON_REQUIREMENTS.md         # 比賽要求對照
│   │
│   ├── 📁 self/                          # Self Protocol 文檔
│   │   ├── SELF_SDK_IMPLEMENTATION.md    # ⭐ 技術實作文檔
│   │   ├── SELF_ZK_CELO_README.md        # ⭐ Self + Celo 總覽
│   │   ├── SELF_INTEGRATION.md           # 整合指南
│   │   └── IMPLEMENTATION_SUMMARY.md     # 實作總結
│   │
│   ├── 📁 deployment/                    # 部署文檔
│   │   ├── CELO_SEPOLIA_DEPLOYMENT.md    # Celo 部署指南
│   │   └── DEPLOYMENT_GUIDE.md           # 通用部署指南
│   │
│   └── 📁 sui/                           # SUI 鏈文檔
│       ├── SUI_INTEGRATION.md            # SUI 整合
│       ├── SUI_QUICKSTART.md             # SUI 快速開始
│       └── SUI_SETUP.md                  # SUI 設置
│
├── 📁 deployments/                       # 部署記錄
├── 📁 libs/                              # 函式庫
└── 📁 move/                              # Move 合約（SUI）
```

---

## ⭐ 核心檔案（比賽重點）

### **展示頁面：**
```
frontend/imtoken-simple-test.html     # 推薦用於 Demo
```

### **智能合約：**
```
contracts/SelfVerifier.sol            # Self Protocol 驗證合約
```

### **後端服務：**
```
server/self-verify-enhanced.js        # Self Protocol 驗證服務
```

### **部署腳本：**
```
scripts/deploy-celo-sepolia.js        # Celo 部署腳本
scripts/check-verification.js         # 驗證查詢
```

### **核心文檔：**
```
README.md                             # 專案主文檔
docs/self/SELF_SDK_IMPLEMENTATION.md  # 技術實作
docs/self/SELF_ZK_CELO_README.md      # 總覽
docs/QUICK_START.md                   # 快速開始
```

---

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境
```bash
cp .env.example .env
# 編輯 .env 添加你的配置
```

### 3. 啟動後端
```bash
node server/self-verify-enhanced.js
```

### 4. 啟動前端
```bash
npx http-server -p 8000
```

### 5. 打開 Demo
```bash
open http://localhost:8000/frontend/imtoken-simple-test.html
```

---

## 📊 已部署的合約

### Celo Sepolia Testnet
```
SelfVerifier: 0x0E801D84Fa97b50751Dbf25036d067dCf18858bF
```

查看：https://sepolia.celoscan.io/address/0x0E801D84Fa97b50751Dbf25036d067dCf18858bF

---

## 📖 文檔索引

### Self Protocol 整合
- [技術實作文檔](docs/self/SELF_SDK_IMPLEMENTATION.md)
- [Self + Celo 總覽](docs/self/SELF_ZK_CELO_README.md)
- [整合指南](docs/self/SELF_INTEGRATION.md)

### 測試與部署
- [快速開始](docs/QUICK_START.md)
- [本地測試](docs/LOCALHOST_TESTING.md)
- [Celo 部署](docs/deployment/CELO_SEPOLIA_DEPLOYMENT.md)

### 比賽相關
- [比賽要求對照](docs/HACKATHON_REQUIREMENTS.md)
- [測試快速參考](docs/TEST_QUICKREF.md)

---

## 🎯 Self Protocol 功能

✅ 零知識身份驗證  
✅ 年齡驗證（18+）  
✅ 國家驗證（非制裁國）  
✅ OFAC 合規驗證  
✅ Celo 鏈上存證  
✅ 隱私保護（不洩露個人資料）  

---

## 💻 技術棧

- **前端**: HTML, JavaScript, Tailwind CSS, ethers.js
- **後端**: Node.js, Express, Self Protocol SDK
- **智能合約**: Solidity, Hardhat
- **區塊鏈**: Celo Sepolia Testnet
- **身份驗證**: Self Protocol (@selfxyz/core, @selfxyz/qrcode)

---

**最後更新**: 2024-10-31

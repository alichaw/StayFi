# StayFi - Hackathon Requirements Checklist

## 項目概述
**StayFi** 是一個結合 RWA（Real World Assets）與零知識證明的去中心化酒店訂房平台。用戶可以鑄造代表酒店住宿權的 Night-Pass NFT，享受收益，並透過 Self Protocol 進行隱私身份驗證。

---

## 🏆 imToken 賽道要求 (2k USD)

### ✅ 已完成項目

#### 1. RWA 資產整合
- [x] Night-Pass NFT 代表實體酒店住宿權
- [x] ERC-721 標準 NFT 合約
- [x] RWA 資產定價與收益計算
- [x] 資產實時估值顯示（Earnings 頁面）

#### 2. 錢包支援與檢測
- [x] 自動檢測 imToken WebView 環境
- [x] 支援 `window.ethereum.isImToken` 檢測
- [x] 支援 MetaMask、imToken、Celo Wallet
- [x] 動態顯示連接的錢包類型
- [x] 國際化支援（讀取 locale 參數）

#### 3. ERC-3643 合規功能
- [x] 合規轉移驗證（Transfer Verify Modal）
- [x] 接收方身份驗證流程
- [x] OFAC 清單檢查模擬
- [x] 非受制裁國家驗證

#### 4. 支付體驗
- [x] 多幣種支付選項（USDC、SUI）
- [x] 交易確認流程
- [x] Gas 費用顯示
- [x] 交易狀態追蹤

#### 5. DeFi 功能
- [x] RWA 資產抵押借貸（Pass-Fi）
- [x] 收益領取功能
- [x] 二級市場交易
- [x] AI 智能定價建議

### 🔨 需要補充的功能

#### 1. 多鏈 RWA 支援
- [ ] 添加鏈切換功能（Celo ↔ Ethereum）
- [ ] 實現 `wallet_addEthereumChain` RPC
- [ ] 實現 `wallet_switchEthereumChain` RPC
- [ ] 顯示當前連接的網絡

#### 2. 增強錢包體驗
- [ ] imToken 深鏈接（DeepLink）集成
- [ ] WalletConnect 支援（桌面端）
- [ ] 更好的錯誤處理與提示

#### 3. RWA 資產管理
- [ ] 資產詳情頁面優化
- [ ] 歷史交易記錄
- [ ] 資產證明文件展示

---

## 🔐 Self 賽道要求 (2k USD)

### ✅ 已完成項目

#### 1. Self SDK 整合（Demo 模式）
- [x] Zero-Knowledge 身份驗證流程
- [x] 國家驗證
- [x] 年齡驗證（18+）
- [x] OFAC / 非受制裁清單驗證
- [x] 視覺化驗證狀態指示器

#### 2. 隱私保護
- [x] 最小信息揭露原則
- [x] 不向第三方洩露個資
- [x] ZK Proof 生成與驗證邏輯

#### 3. 使用體驗
- [x] 清晰的驗證引導流程
- [x] 移動端優化
- [x] 錯誤處理與失敗流程

### 🔨 需要補充的功能（關鍵）

#### 1. **真實 Self Onchain SDK 整合**
- [ ] 替換 Demo 模式為真實 Self SDK
- [ ] 連接 Celo 主網/測試網
- [ ] 實現端到端 proof 生成
- [ ] 部署驗證智能合約到 Celo

#### 2. **Onchain 驗證**
- [ ] 編寫 Solidity 驗證合約
- [ ] 實現 `verifyProof()` 函數
- [ ] 鏈上驗證流程展示
- [ ] 合約部署與測試

#### 3. **完整文檔**
- [ ] README 技術說明
- [ ] 操作流程文檔
- [ ] 截圖/短影片演示
- [ ] 部署鏈接與合約地址

#### 4. **擴展性**
- [ ] 模組化設計
- [ ] 支援更多屬性驗證（護照號、姓名）
- [ ] 多鏈支持架構

---

## 📦 提交清單

### 必需項目

#### 1. Github Repo
- [x] 公開 Repository
- [ ] 完整的前後端代碼
- [ ] 智能合約代碼
- [ ] 清晰的 commit 歷史

#### 2. Demo/原型
- [x] 可訪問的部署鏈接
- [ ] Celo 測試網部署
- [ ] 合約驗證地址

#### 3. 文檔
- [ ] 項目說明 PPT/文檔
- [ ] 技術架構圖
- [ ] 流程說明文檔
- [ ] API 文檔

#### 4. 演示材料
- [ ] 操作演示影片（2-5 分鐘）
- [ ] 截圖集
- [ ] 使用說明

---

## 🎯 評審重點對照

### imToken 賽道

| 評審點 | 完成度 | 說明 |
|--------|--------|------|
| RWA 場景創新 | 90% | Night-Pass NFT 結合實體酒店 |
| 錢包體驗優化 | 80% | 支援多錢包，需加強鏈切換 |
| 功能擴展性 | 85% | DeFi 功能完整，需多鏈支援 |
| 技術實踐 | 75% | 合約完整，需部署驗證 |

### Self 賽道

| 評審點 | 完成度 | 說明 |
|--------|--------|------|
| 可靠性 | 40% | **需真實 SDK 替換 Demo** |
| 隱私保護 | 95% | ZK 設計良好 |
| 使用體驗 | 90% | UI/UX 優秀 |
| 技術深度 | 30% | **需 onchain 驗證合約** |
| 擴展性 | 70% | 架構良好，需實際實現 |

---

## ⚠️ 關鍵待辦（高優先級）

### Self 賽道（必須完成）
1. ✅ **整合真實 Self Onchain SDK**
2. ✅ **部署驗證合約到 Celo 測試網**
3. ✅ **實現端到端鏈上驗證流程**
4. 📝 **錄製演示影片**
5. 📝 **編寫完整文檔**

### imToken 賽道（建議完成）
1. 🔧 **實現鏈切換功能**
2. 🔧 **添加 Celo 網絡支援**
3. 🔧 **部署到 Celo 主網**
4. 📝 **準備演示材料**

---

## 📊 時間規劃建議

### 第一優先（48 小時內）
- [ ] 研究 Self SDK 文檔
- [ ] 編寫 Solidity 驗證合約
- [ ] 部署到 Celo 測試網
- [ ] 集成真實 SDK

### 第二優先（72 小時內）
- [ ] 添加多鏈支援
- [ ] 完善錯誤處理
- [ ] 編寫技術文檔
- [ ] 錄製演示影片

### 第三優先（提交前）
- [ ] 代碼清理與優化
- [ ] 安全審查
- [ ] 準備演講材料
- [ ] 最終測試

---

## 🔗 參考資源

### Self Protocol
- [Self SDK 文檔](https://docs.selfprotocol.io/)
- [Celo 測試網水龍頭](https://faucet.celo.org/)
- [EIP-1102 標準](https://eips.ethereum.org/EIPS/eip-1102)

### imToken
- [imToken 開發者文檔](https://imtoken.gitbook.io/developers/zh/)
- [ERC-3643 規範](https://erc3643.org/)
- [Wallet RPC 參考](https://docs.metamask.io/wallet/reference/)

---

## 💡 項目亮點總結

### 創新點
1. **RWA + DeFi 融合**：酒店 NFT 可抵押借貸
2. **零知識身份驗證**：Self Protocol 隱私保護
3. **ERC-3643 合規**：符合 RWA 監管要求
4. **AI 智能定價**：機器學習優化市場效率
5. **多錢包支援**：imToken、MetaMask、Celo Wallet

### 技術棧
- Frontend: HTML5, TailwindCSS, Vanilla JavaScript
- Smart Contracts: Solidity, Hardhat
- Blockchain: Celo, Ethereum
- Identity: Self Protocol (Zero-Knowledge Proofs)
- Wallets: imToken, MetaMask, WalletConnect

---

## ✅ 最終檢查清單

提交前確認：
- [ ] 代碼推送到公開 GitHub
- [ ] 合約部署並驗證
- [ ] Demo 可正常訪問
- [ ] 文檔完整且清晰
- [ ] 演示影片已錄製
- [ ] 所有功能可演示
- [ ] 符合原創性要求
- [ ] 授權文件齊全

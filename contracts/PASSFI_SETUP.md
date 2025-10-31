# Pass-Fi Lending 整合指南

## 📋 概述

Pass-Fi 是一個去中心化借貸協議，允許用戶抵押 Night-Pass NFT 來借出 USDC。

## 🏗️ 架構

```
┌─────────────────┐
│   User Wallet   │
└────────┬────────┘
         │
         ├─────► Night-Pass NFT (抵押品)
         │
         ├─────► Pass-Fi Lending Contract (借貸邏輯)
         │
         └─────► USDC Token (借出資產)
```

## 📝 部署步驟

### 1. 準備環境

```bash
cd /Users/alichen/Desktop/StayFi
npm install --save-dev hardhat @openzeppelin/contracts
```

### 2. 編譯合約

```bash
npx hardhat compile
```

### 3. 部署到本地測試網

```bash
# 啟動本地節點
npx hardhat node

# 新開一個終端，部署合約
npx hardhat run contracts/deploy-passfi.js --network localhost
```

### 4. 部署到 Celo Testnet (Alfajores)

```bash
# 設置環境變數
export PRIVATE_KEY="your_private_key"
export NIGHT_PASS_NFT_ADDRESS="0x..."
export USDC_TOKEN_ADDRESS="0x..."

# 部署
npx hardhat run contracts/deploy-passfi.js --network alfajores
```

## 🔧 前端整合

### 1. 更新 CONFIG

在 `index.html` 中找到 CONFIG 對象（約 line 1086），添加：

```javascript
CONTRACTS: {
    NIGHT_PASS_NFT: '0x...',
    MARKETPLACE: '0x...',
    PASSFI_LENDING: '0xYOUR_DEPLOYED_ADDRESS', // 新增
    USDC_TOKEN: '0xYOUR_USDC_ADDRESS'          // 新增
}
```

### 2. 添加 ABI

在 MARKETPLACE_ABI 之後（約 line 1121），添加：

```javascript
const PASSFI_LENDING_ABI = [
    "function borrow(uint256 tokenId, uint256 collateralValue, uint256 borrowAmount) external",
    "function repay(uint256 tokenId) external",
    "function calculateDebt(uint256 tokenId) view returns (uint256)",
    "function getLoan(uint256 tokenId) view returns (address, uint256, uint256, uint256, bool, uint256)",
    "function isCollateralized(uint256 tokenId) view returns (bool)"
];

const USDC_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
];
```

### 3. 初始化合約

在錢包連接成功後（約 line 1938），添加：

```javascript
passFiContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.PASSFI_LENDING,
    PASSFI_LENDING_ABI,
    signer
);

usdcContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.USDC_TOKEN,
    USDC_ABI,
    signer
);
```

### 4. 替換 executeBorrow 函數

用 `passfi-integration.js` 中的真實實現替換現有的模擬函數（line 2676）。

### 5. 添加 executeRepay 函數

複製 `passfi-integration.js` 中的 `executeRepay` 函數。

### 6. 更新 UI

修改 `loadUserNFTs` 函數以顯示抵押狀態，並添加「Repay Loan」按鈕。

## 💰 測試流程

### 1. 準備測試數據

```javascript
// 在 Hardhat console 或測試腳本中
const PassFi = await ethers.getContractFactory("PassFiLending");
const passFi = await PassFi.attach("DEPLOYED_ADDRESS");

// Owner 存入 USDC 流動性
await usdcToken.approve(passFi.address, ethers.utils.parseUnits("10000", 6));
await passFi.depositLiquidity(ethers.utils.parseUnits("10000", 6));
```

### 2. 用戶借貸流程

1. 用戶 Mint 一個 Night-Pass NFT
2. 點擊「Borrow」按鈕
3. 輸入借款金額（不超過 NFT 價值的 50%）
4. 確認交易
5. NFT 被轉移到 Pass-Fi 合約作為抵押
6. USDC 轉移到用戶錢包

### 3. 還款流程

1. 在「MyPass」中找到 Collateralized 的 NFT
2. 點擊「Repay Loan」
3. 確認交易（會自動計算本金 + 利息）
4. USDC 從用戶錢包扣除
5. NFT 返回用戶錢包

## 🔒 安全特性

- ✅ **ReentrancyGuard**: 防止重入攻擊
- ✅ **LTV 限制**: 最多只能借出抵押品價值的 50%
- ✅ **利息計算**: 10% APR，按秒計息
- ✅ **清算機制**: LTV > 80% 時可被清算
- ✅ **權限控制**: 只有貸款所有者可以還款

## 📊 合約功能

| 功能 | 描述 |
|------|------|
| `borrow()` | 抵押 NFT 借出 USDC |
| `repay()` | 還款並取回 NFT |
| `calculateDebt()` | 計算當前欠款（本金 + 利息）|
| `getLoan()` | 查詢貸款詳情 |
| `isCollateralized()` | 檢查 NFT 是否已抵押 |
| `liquidate()` | 清算欠抵押的貸款 |
| `getPoolStats()` | 查詢池子統計數據 |

## 🐛 常見問題

### Q: 部署失敗怎麼辦？
A: 檢查 Gas 費用是否足夠，確認 NIGHT_PASS_NFT 和 USDC_TOKEN 地址正確。

### Q: 借款交易失敗？
A: 確認：
1. NFT 所有權正確
2. NFT 未被抵押
3. 借款金額不超過 LTV 限制
4. 合約有足夠的 USDC 流動性

### Q: 還款失敗？
A: 檢查 USDC 餘額是否足夠支付本金 + 利息。

## 📝 合約地址（範例）

```
Network: Celo Alfajores Testnet
NIGHT_PASS_NFT: 0x0165878A594ca255338adfa4d48449f69242Eb8F
USDC_TOKEN: 0x...
PASSFI_LENDING: 0x... (部署後更新)
```

## 🚀 後續優化

- [ ] 支援多種穩定幣（USDC, DAI, USDT）
- [ ] 動態 LTV 根據 NFT 流動性調整
- [ ] 自動清算機器人
- [ ] 利率動態調整（根據利用率）
- [ ] Flash loan 支援
- [ ] 治理代幣獎勵

## 📚 參考資料

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Docs](https://docs.celo.org/)

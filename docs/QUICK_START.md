# StayFi + Self Protocol - 快速開始指南

## 🚀 快速啟動步驟

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動驗證服務器
在第一個終端窗口：
```bash
npm run server
```
服務器將在 `http://localhost:3001` 運行

### 3. 啟動區塊鏈節點 (可選)
如果你想測試完整的 NFT mint 功能，在第二個終端窗口：
```bash
npm run node
```

### 4. 部署合約 (可選)
如果啟動了本地節點，在第三個終端窗口：
```bash
npm run deploy:local
```

### 5. 打開應用
用瀏覽器打開 `index.html`
```bash
open index.html
```

## 📱 使用流程

### 方式一：完整 Self Protocol 流程

#### 桌面端體驗 🖥️

1. **連接錢包**
   - 點擊 "Connect imToken / Wallet" 按鈕
   - 在 MetaMask 或其他 Web3 錢包中確認連接
   
2. **ZK 身份驗證**
   - 連接錢包後，自動進入 Self Protocol 驗證畫面
   - 會看到一個 QR code
   
3. **掃描驗證**
   - 用 Self app (手機) 掃描 QR code
   - 在 Self app 中完成零知識證明生成
   - 等待驗證完成（約 5-30 秒）
   
4. **驗證成功**
   - 狀態指示器變為綠色 ✅
   - 自動跳轉到主應用 Explore 頁面

#### 移動端體驗 📱 (推薦)

1. **連接錢包**
   - 點擊 "Connect imToken / Wallet" 按鈕
   - 在移動錢包中確認連接
   
2. **一鍵打開 Self App**
   - 在 ZK 驗證畫面會看到大按鈕 "Open Self App"
   - 點擊按鈕直接跳轉到 Self app（無需掃描 QR code）
   
3. **完成驗證**
   - 在 Self app 中完成零知識證明生成
   - Self app 會自動倒數並返回 StayFi 應用
   
4. **自動返回**
   - 驗證成功後，Self app 顯示："Redirecting to StayFi in 5...4...3...2...1"
   - 自動跳轉回 StayFi，進入 Explore 頁面

### 方式二：Demo 模式 (無需 Self app)

如果沒有 Self app 或驗證服務器未運行：

1. 連接錢包後進入 ZK Module
2. 等待約 10 秒，會出現 Demo 按鈕
3. 點擊 "Demo: Skip to Success" 直接進入應用

## 🔧 配置說明

### Self Protocol 配置 (index.html)

```javascript
const SELF_CONFIG = {
    SELF_APP_NAME: 'StayFi',
    SELF_SCOPE: 'stayfi-rwa',
    SELF_ENDPOINT: 'http://localhost:3001/api/verify',
    SELF_LOGO: 'https://i.postimg.cc/mrmVf9hm/self.png',
    VERIFICATION_CONFIG: {
        minimumAge: 18,
        excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
        ofac: true,
        nationality: true,
        gender: false,
    }
};
```

### 驗證服務器配置 (server/verify-server.js)

```javascript
const VERIFICATION_CONFIG = {
  minimumAge: 18,
  excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
  ofac: true,
};
```

**重要**：前端和後端的配置必須完全一致！

## 🧪 測試 Self Protocol 驗證

### 使用 ngrok 進行本地測試

如果想用真實的 Self app 測試，需要將本地服務器暴露到公網：

```bash
# 安裝 ngrok
brew install ngrok  # macOS
# 或從 https://ngrok.com 下載

# 暴露端口 3001
ngrok http 3001
```

然後更新 `index.html` 中的端點：
```javascript
SELF_ENDPOINT: 'https://your-ngrok-url.ngrok.io/api/verify'
```

## 🔗 Deeplinking 功能說明

### 什麼是 Deeplinking？

Deeplinking 允許用戶直接打開 Self 移動應用，而不需要掃描 QR code。這提供了更好的移動體驗。

### 如何運作？

1. **裝置偵測**
   - 系統自動偵測是桌面還是移動裝置
   - 桌面：顯示 QR code
   - 移動：顯示 "Open Self App" 按鈕

2. **Universal Link 生成**
   - 系統生成一個 universal link，包含所有驗證配置
   - 這個 link 可以透過 QR code 或 deeplink 使用

3. **自動返回**
   - 配置了 `deeplinkCallback` 參數
   - Self app 完成驗證後會顯示倒數
   - 倒數結束後自動跳轉回 StayFi

### 配置細節

```javascript
// index.html 中的配置
const SELF_CONFIG = {
    DEEPLINK_CALLBACK: window.location.href, // 返回當前頁面
    // ...
};

// 在 SelfAppBuilder 中使用
selfApp = new SelfAppBuilder({
    deeplinkCallback: SELF_CONFIG.DEEPLINK_CALLBACK,
    // ...
}).build();
```

### 利益

- ✅ **更好的移動體驗**：無需在同一裝置上掃描 QR code
- ✅ **更快的流程**：一鍵打開，自動返回
- ✅ **更低的確誤率**：減少手動操作步驟
- ✅ **跨平台支持**：iOS Safari 和 Android Chrome 均支持

## 📝 API 端點

驗證服務器提供以下端點：

### POST /api/verify
接收並驗證來自 Self app 的零知識證明

### GET /api/verify/status/:userId
查詢特定用戶的驗證狀態

### POST /api/verify/store
儲存驗證結果（用於測試）

### GET /health
健康檢查

## 🐛 故障排除

### QR Code 無法生成
- 檢查瀏覽器控制台是否有 Self SDK 載入錯誤
- 確認 `window.SelfAppBuilder` 可用
- 如果失敗，會自動顯示 Demo 按鈕

### 驗證超時
- 確認驗證服務器正在運行: `http://localhost:3001/health`
- 檢查 CORS 設置是否允許前端訪問
- 查看服務器日誌中的錯誤信息

### 驗證失敗
- 確保前端和後端配置完全匹配
- 檢查用戶是否符合所有要求（年齡、國籍、OFAC）
- 查看後端日誌了解具體失敗原因

## 🎯 功能特性

### 已整合的 Self Protocol 功能
- ✅ 零知識身份驗證
- ✅ 實時 QR code 生成（桌面端）
- ✅ 手機 deeplink 支持（移動端）
- ✅ 自動返回 callback 功能
- ✅ 智能裝置偵測（桌面/移動）
- ✅ 狀態輪詢（每 5 秒）
- ✅ 超時處理（5 分鐘）
- ✅ Demo 模式 fallback
- ✅ 視覺化驗證狀態

### StayFi 應用功能
- 🏨 瀏覽酒店 Night-Pass
- 🎫 Mint NFT (需要區塊鏈節點)
- 💼 管理 NFT 組合
- 🛍️ 二級市場交易
- 💰 收益追蹤
- 🔐 零知識身份證明

## 📚 更多資源

- [Self Protocol 文檔](https://docs.self.xyz)
- [Self Protocol GitHub](https://github.com/selfxyz/self)
- [ETHGlobal Workshop](https://www.youtube.com/watch?v=2g0F5dWrUKk)
- [完整整合指南](./SELF_INTEGRATION.md)

## 💡 提示

1. **開發模式**：使用 Demo 按鈕可以快速測試應用功能
2. **生產模式**：設置 ngrok 並使用真實 Self app 進行完整測試
3. **配置同步**：修改驗證要求時，記得同時更新前端和後端配置
4. **日誌查看**：打開瀏覽器控制台和服務器終端查看詳細日誌

## 🤝 支持

遇到問題？
1. 查看瀏覽器控制台錯誤
2. 查看服務器日誌: `npm run server`
3. 參考 [SELF_INTEGRATION.md](./SELF_INTEGRATION.md) 詳細文檔
4. 檢查 [故障排除](#故障排除) 章節

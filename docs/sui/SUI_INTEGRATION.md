# SUI 區塊鏈集成指南

## 📋 概述

StayFi 已成功集成 SUI 區塊鏈，提供高性能、低成本的酒店住宿 NFT 解決方案。SUI 採用 Move 語言編寫智能合約，提供更強的安全性和更好的性能。

## 🏗️ 項目結構

```
StayFi/
├── move/                          # SUI Move 智能合約
│   ├── Move.toml                 # Move 包配置
│   └── sources/
│       └── hotel_nft.move        # 酒店 NFT 合約
├── scripts/
│   └── deploy-sui.js             # SUI 部署腳本
├── sui.config.js                 # SUI 配置文件
├── sui-integration.html          # SUI 前端示例
└── .env.example                  # 環境變量示例（含 SUI 配置）
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 安裝 Node.js 依賴
npm install

# 安裝 SUI CLI（如果還沒有）
# macOS
brew install sui

# 其他系統請參考: https://docs.sui.io/build/install
```

### 2. 配置環境變量

複製 `.env.example` 為 `.env` 並填入你的配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# === SUI Configuration ===
SUI_NETWORK=testnet
SUI_PRIVATE_KEY=your_sui_private_key_hex_here
SUI_PACKAGE_ID=
SUI_REGISTRY_OBJECT_ID=
```

### 3. 生成 SUI 錢包（如果需要）

```bash
# 創建新錢包
sui client new-address ed25519

# 查看地址
sui client active-address

# 導出私鑰（用於 .env）
sui keytool export --key-identity <your-address>
```

### 4. 獲取測試代幣

訪問 [SUI Discord](https://discord.gg/sui) 的 #devnet-faucet 或 #testnet-faucet 頻道，請求測試代幣：

```
!faucet <your-sui-address>
```

或使用 CLI：

```bash
sui client faucet
```

### 5. 編譯和部署合約

```bash
# 編譯 Move 合約
cd move
sui move build

# 部署到 SUI 網絡
cd ..
npm run deploy:sui
```

部署成功後，會生成 `deployment-sui-testnet.json` 文件，包含：
- Package ID
- Registry Object ID
- Transaction Digest
- Explorer URL

### 6. 更新前端配置

編輯 `sui-integration.html`，更新配置：

```javascript
const SUI_CONFIG = {
    network: 'testnet',
    packageId: 'YOUR_PACKAGE_ID_HERE',  // 從部署結果中獲取
    registryId: 'YOUR_REGISTRY_OBJECT_ID_HERE'  // 從部署結果中獲取
};
```

### 7. 測試前端

在瀏覽器中打開 `sui-integration.html`：

```bash
open sui-integration.html
# 或使用 Python 啟動簡單服務器
python3 -m http.server 8000
# 然後訪問 http://localhost:8000/sui-integration.html
```

## 📦 智能合約功能

### HotelNFT 結構

```move
struct HotelNFT has key, store {
    id: UID,
    token_id: u64,
    hotel_name: String,
    room_type: String,
    check_in_date: u64,
    check_out_date: u64,
    guest_name: String,
    price_paid: u64,
    is_used: bool,
    metadata_uri: String,
}
```

### 主要功能

1. **mint_hotel_nft** - 鑄造新的酒店 NFT
   - 參數: hotel_name, room_type, check_in_date, check_out_date, guest_name, metadata_uri, payment
   - 支付 SUI 代幣以鑄造 NFT

2. **use_nft** - 標記 NFT 為已使用（check-in）
   - 參數: nft reference
   - 只能使用一次

3. **transfer_nft** - 轉移 NFT 到其他地址
   - 參數: nft, recipient address
   - 已使用的 NFT 不能轉移

4. **withdraw_treasury** - 提取資金（僅所有者）
   - 參數: registry, amount
   - 只有合約所有者可以提取

### View 函數

- `get_token_id(nft)` - 獲取 token ID
- `get_hotel_name(nft)` - 獲取酒店名稱
- `get_room_type(nft)` - 獲取房型
- `get_check_in_date(nft)` - 獲取入住日期
- `get_check_out_date(nft)` - 獲取退房日期
- `get_guest_name(nft)` - 獲取客人姓名
- `get_price_paid(nft)` - 獲取支付金額
- `is_used(nft)` - 檢查是否已使用
- `get_metadata_uri(nft)` - 獲取元數據 URI

## 🔌 前端集成

### 安裝 SUI SDK

```bash
npm install @mysten/sui.js
```

### 基本用法

```javascript
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// 初始化客戶端
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// 鑄造 NFT
const tx = new TransactionBlock();
const [coin] = tx.splitCoins(tx.gas, [tx.pure(priceInMist)]);

tx.moveCall({
    target: `${packageId}::hotel_nft::mint_hotel_nft`,
    arguments: [
        tx.object(registryId),
        tx.pure(Array.from(new TextEncoder().encode(hotelName))),
        tx.pure(Array.from(new TextEncoder().encode(roomType))),
        tx.pure(checkInTimestamp),
        tx.pure(checkOutTimestamp),
        tx.pure(Array.from(new TextEncoder().encode(guestName))),
        tx.pure(Array.from(new TextEncoder().encode(metadataUri))),
        coin
    ],
});

const result = await client.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
});
```

### 查詢 NFT

```javascript
// 獲取用戶擁有的 NFT
const objects = await client.getOwnedObjects({
    owner: userAddress,
    filter: {
        StructType: `${packageId}::hotel_nft::HotelNFT`
    },
    options: {
        showContent: true,
        showDisplay: true
    }
});

// 解析 NFT 數據
objects.data.forEach(obj => {
    const nft = obj.data.content.fields;
    console.log('Hotel:', nft.hotel_name);
    console.log('Guest:', nft.guest_name);
    console.log('Used:', nft.is_used);
});
```

## 🌐 網絡配置

### Testnet
- RPC: `https://fullnode.testnet.sui.io:443`
- Faucet: Discord #testnet-faucet
- Explorer: `https://suiexplorer.com/?network=testnet`

### Devnet
- RPC: `https://fullnode.devnet.sui.io:443`
- Faucet: Discord #devnet-faucet
- Explorer: `https://suiexplorer.com/?network=devnet`

### Mainnet
- RPC: `https://fullnode.mainnet.sui.io:443`
- Explorer: `https://suiexplorer.com/?network=mainnet`

### Localnet
- RPC: `http://127.0.0.1:9000`
- 啟動方式: `sui start --with-faucet`

## 🔧 開發命令

```bash
# 構建 Move 合約
cd move && sui move build

# 運行 Move 單元測試
cd move && sui move test

# 部署到 testnet
npm run deploy:sui

# 檢查包的依賴
cd move && sui move manage-package

# 查看 gas 估算
sui client gas
```

## 💡 最佳實踐

### 1. 安全性
- **永遠不要** 在代碼中硬編碼私鑰
- 使用環境變量存儲敏感信息
- 在生產環境中使用硬件錢包

### 2. Gas 優化
- 批量操作以減少交易次數
- 合理設置 gas budget
- 使用 `sui client gas` 查看 gas 情況

### 3. 錯誤處理
- 所有交易都應該有適當的錯誤處理
- 檢查用戶餘額是否足夠
- 驗證輸入參數

### 4. 測試
- 先在 devnet/testnet 上測試
- 編寫 Move 單元測試
- 測試所有邊界情況

## 🆚 SUI vs EVM (Celo) 對比

| 特性 | SUI | EVM (Celo) |
|------|-----|------------|
| 語言 | Move | Solidity |
| TPS | >100,000 | ~1,000 |
| 交易確認 | <1s | ~5s |
| Gas 費用 | 極低 (< $0.001) | 低 (~$0.01) |
| NFT 模型 | Object-based | Token-based |
| 並行處理 | 是 | 否 |
| 安全性 | 資源導向 | 帳戶導向 |

## 📚 資源

- [SUI 官方文檔](https://docs.sui.io/)
- [Move 語言書](https://move-book.com/)
- [SUI TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)
- [SUI Discord](https://discord.gg/sui)
- [SUI Explorer](https://suiexplorer.com/)

## 🐛 故障排除

### 問題: 部署失敗 "Insufficient gas"
**解決**: 確保錢包有足夠的 SUI 代幣，至少 0.1 SUI

### 問題: "Package not found"
**解決**: 確保已正確編譯並部署合約，檢查 Package ID 是否正確

### 問題: "Object not found"
**解決**: 確保 Registry Object ID 正確，可能需要重新部署

### 問題: 前端無法連接錢包
**解決**: 確保已安裝 Sui Wallet 瀏覽器擴展，並且已解鎖

## 🤝 貢獻

歡迎提交 issues 和 pull requests！

## 📄 許可證

MIT License

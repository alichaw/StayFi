# SUI 快速部署指南

## ⚠️ 当前状态

**Move 合约编译遇到框架版本兼容性问题。** Sui 框架在不同版本间存在破坏性更改（enums 支持等）。

## 🔄 临时解决方案

### 方案 1: 使用 Sui Move 示例项目生成器

```bash
# 1. 创建新的 Sui Move 项目
sui move new hotel_nft

# 2. 将我们的合约代码复制到新项目
cp /Users/alichen/Desktop/StayFi/move/sources/hotel_nft.move hotel_nft/sources/

# 3. 在新项目中构建
cd hotel_nft
sui move build
```

### 方案 2: 使用在线 Sui Playground

1. 访问 [Sui Playground](https://playground.sui.io/)
2. 创建新项目
3. 粘贴简化的合约代码
4. 在线编译和部署

### 方案 3: 等待框架更新

Sui 团队正在积极开发中，等待稳定版本发布。

## 📋 简化合约代码

如果您需要立即部署，使用以下最小化版本：

```move
module stayfi::hotel_nft_simple {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;

    public struct HotelNFT has key, store {
        id: UID,
        hotel_name: String,
        room_type: String,
        check_in_date: u64,
        check_out_date: u64,
        guest_name: String,
        price_paid: u64,
        is_used: bool,
    }

    public struct NFTMinted has copy, drop {
        nft_id: address,
        hotel_name: String,
        guest: address,
    }

    public fun mint_hotel_nft(
        hotel_name: vector<u8>,
        room_type: vector<u8>,
        check_in_date: u64,
        check_out_date: u64,
        guest_name: vector<u8>,
        price_paid: u64,
        ctx: &mut TxContext
    ): HotelNFT {
        let nft = HotelNFT {
            id: object::new(ctx),
            hotel_name: string::utf8(hotel_name),
            room_type: string::utf8(room_type),
            check_in_date,
            check_out_date,
            guest_name: string::utf8(guest_name),
            price_paid,
            is_used: false,
        };

        event::emit(NFTMinted {
            nft_id: object::uid_to_address(&nft.id),
            hotel_name: nft.hotel_name,
            guest: tx_context::sender(ctx),
        });

        nft
    }

    public fun use_nft(nft: &mut HotelNFT) {
        assert!(!nft.is_used, 1);
        nft.is_used = true;
    }

    public fun transfer_nft(nft: HotelNFT, recipient: address) {
        assert!(!nft.is_used, 2);
        transfer::public_transfer(nft, recipient);
    }

    // Getter functions...
    public fun hotel_name(nft: &HotelNFT): String { nft.hotel_name }
    public fun is_used(nft: &HotelNFT): bool { nft.is_used }
}
```

## 🛠 手动部署步骤（当框架修复后）

### 1. 确保 Sui CLI 已安装

```bash
sui --version
# 应该显示: sui 1.28.0 或更高版本
```

### 2. 创建/导入钱包

```bash
# 创建新地址
sui client new-address ed25519

# 查看当前地址
sui client active-address

# 切换网络到 testnet
sui client switch --env testnet
```

### 3. 获取测试币

```bash
# 使用 CLI 请求测试币
sui client faucet

# 或访问 Discord
# https://discord.gg/sui
# 在 #testnet-faucet 频道使用: !faucet YOUR_ADDRESS
```

### 4. 编译合约

```bash
cd /Users/alichen/Desktop/StayFi/move
sui move build
```

### 5. 部署到 testnet

```bash
sui client publish --gas-budget 100000000
```

### 6. 保存部署信息

部署后会输出：
- Package ID
- Transaction Digest  
- Created Objects

将这些信息保存到 `.env` 文件：

```env
SUI_PACKAGE_ID=0x...
SUI_REGISTRY_OBJECT_ID=0x...
```

### 7. 更新前端配置

编辑 `sui-integration.html`：

```javascript
const SUI_CONFIG = {
    network: 'testnet',
    packageId: '你的_PACKAGE_ID',
    registryId: '你的_REGISTRY_OBJECT_ID'
};
```

## 📱 使用前端

```bash
# 启动本地服务器
python3 -m http.server 8000

# 访问
open http://localhost:8000/sui-integration.html
```

## ❓ 故障排除

### 编译错误: "Enums not supported"

**原因**: 框架版本不匹配

**解决**: 
1. 更新 Sui CLI: `cargo install --git https://github.com/MystenLabs/sui.git sui`
2. 或使用简化版合约（见上方）

### 编译错误: "dependency cycle"

**原因**: 框架内部问题

**解决**: 等待框架更新或使用 Sui Playground

### 部署失败: "Insufficient gas"

**原因**: SUI 余额不足

**解决**: 
```bash
sui client faucet
sui client gas
```

### 前端无法连接

**原因**: Sui Wallet 未安装

**解决**: 
1. 安装 [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet)
2. 创建/导入钱包
3. 切换到 testnet

## 📚 相关资源

- [Sui 官方文档](https://docs.sui.io/)
- [Move 语言书](https://move-book.com/)
- [Sui Discord](https://discord.gg/sui)
- [Sui GitHub](https://github.com/MystenLabs/sui)

## 🔄 后续步骤

框架稳定后，我们将：
1. ✅ 完善合约（添加支付功能）
2. ✅ 添加单元测试
3. ✅ 集成市场功能
4. ✅ 支持跨链桥接

---

**注意**: 当前 Sui 生态系统仍在快速发展中，建议关注官方更新。如需生产环境部署，请等待 mainnet 稳定版本。

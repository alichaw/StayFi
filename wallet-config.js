/**
 * StayFi 钱包连接配置文件
 * 包含合约地址、ABI 和网络配置
 */

// ===== 合约地址配置 =====
const CONTRACT_ADDRESSES = {
    // Localhost (Hardhat)
    localhost: {
        nft: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        marketplace: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
        selfVerifier: '' // 本地未部署
    },
    
    // Celo Sepolia (测试网)
    celoSepolia: {
        nft: '', // 待部署
        marketplace: '', // 待部署
        selfVerifier: '0x783013312b6Ceb60e19D77CF32B0877B84308176'
    },
    
    // Celo Alfajores (推荐测试网)
    celoAlfajores: {
        nft: '', // TODO: 部署后更新
        marketplace: '', // TODO: 部署后更新
        selfVerifier: '' // TODO: 部署后更新
    }
};

// ===== 合约 ABI (简化版) =====
const CONTRACT_ABIS = {
    // NightPassNFT ABI
    nft: [
        // 查询函数
        'function balanceOf(address owner) view returns (uint256)',
        'function ownerOf(uint256 tokenId) view returns (address)',
        'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
        'function getNightPass(uint256 tokenId) view returns (tuple(string hotelName, uint256 checkInDate, uint256 price, uint256 yield, bool isActive, bool isUsed))',
        'function compliantAddresses(address user) view returns (bool)',
        
        // 交易函数
        'function mintNightPass(address to, string memory hotelName, uint256 checkInDate, uint256 price, uint256 yieldPercent, string memory uri) payable returns (uint256)',
        'function useNightPass(uint256 tokenId)',
        'function approve(address to, uint256 tokenId)',
        'function transferFrom(address from, address to, uint256 tokenId)',
        
        // 管理函数
        'function updateCompliance(address user, bool isCompliant)',
        
        // 事件
        'event NightPassMinted(uint256 indexed tokenId, address indexed owner, string hotelName, uint256 price)',
        'event NightPassUsed(uint256 indexed tokenId)',
        'event ComplianceStatusUpdated(address indexed user, bool isCompliant)'
    ],
    
    // NightPassMarketplace ABI
    marketplace: [
        // 查询函数
        'function listings(uint256 tokenId) view returns (tuple(address seller, uint256 price, bool isActive))',
        'function getActiveListing(uint256 tokenId) view returns (address seller, uint256 price, bool isActive)',
        
        // 交易函数
        'function listNightPass(uint256 tokenId, uint256 price)',
        'function buyNightPass(uint256 tokenId) payable',
        'function cancelListing(uint256 tokenId)',
        
        // 事件
        'event NightPassListed(uint256 indexed tokenId, address indexed seller, uint256 price)',
        'event NightPassSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)',
        'event ListingCancelled(uint256 indexed tokenId, address indexed seller)'
    ],
    
    // SelfVerifier ABI
    selfVerifier: [
        // 查询函数
        'function isVerified(address user) view returns (bool)',
        'function getVerification(address user) view returns (tuple(uint96 timestamp, bytes32 proofHash, bool isVerified, bool isAgeValid, bool isCountryValid, bool isOfacClear))',
        'function hasExpired(address user) view returns (bool)',
        'function timeUntilExpiry(address user) view returns (uint256)',
        'function usedProofs(bytes32 proofHash) view returns (bool)',
        
        // 交易函数
        'function verifyProof(bytes32 proofHash, bool isAgeValid, bool isCountryValid, bool isOfacClear) returns (bool)',
        
        // 管理函数
        'function revokeVerification(address user)',
        
        // 事件
        'event ProofVerified(address indexed user, bytes32 indexed proofHash, uint256 timestamp)',
        'event VerificationFailed(address indexed user, bytes32 indexed proofHash, string reason)'
    ]
};

// ===== 网络配置 =====
const NETWORK_CONFIGS = {
    localhost: {
        chainId: '0x7a69', // 31337
        chainName: 'Localhost 8545',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: []
    },
    
    celoAlfajores: {
        chainId: '0xaef3', // 44787
        chainName: 'Celo Alfajores Testnet',
        nativeCurrency: {
            name: 'CELO',
            symbol: 'CELO',
            decimals: 18
        },
        rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
        blockExplorerUrls: ['https://alfajores.celoscan.io']
    },
    
    celoSepolia: {
        chainId: '0xaa36a4', // 11155420 (实际是 11142220)
        chainName: 'Celo Sepolia Testnet',
        nativeCurrency: {
            name: 'CELO',
            symbol: 'CELO',
            decimals: 18
        },
        rpcUrls: ['https://forno.celo-testnet.org'],
        blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
    },
    
    celoMainnet: {
        chainId: '0xa4ec', // 42220
        chainName: 'Celo Mainnet',
        nativeCurrency: {
            name: 'CELO',
            symbol: 'CELO',
            decimals: 18
        },
        rpcUrls: ['https://forno.celo.org'],
        blockExplorerUrls: ['https://explorer.celo.org']
    }
};

// ===== 默认配置 =====
const DEFAULT_CONFIG = {
    // 当前使用的网络 (根据你的需求修改)
    currentNetwork: 'celoSepolia', // 'localhost', 'celoAlfajores', 'celoSepolia'
    
    // 钱包连接器配置
    walletConnector: {
        requireCompliance: true,      // 是否需要合规验证
        autoSwitchNetwork: true,      // 是否自动切换网络
        targetNetwork: 'celoSepolia'  // 目标网络
    }
};

// ===== 辅助函数 =====

/**
 * 获取当前网络的合约地址
 * @param {string} network - 网络名称
 * @returns {Object} 合约地址对象
 */
function getContractAddresses(network = DEFAULT_CONFIG.currentNetwork) {
    const addresses = CONTRACT_ADDRESSES[network];
    if (!addresses) {
        throw new Error(`未找到网络配置: ${network}`);
    }
    return addresses;
}

/**
 * 获取网络配置
 * @param {string} network - 网络名称
 * @returns {Object} 网络配置对象
 */
function getNetworkConfig(network = DEFAULT_CONFIG.currentNetwork) {
    const config = NETWORK_CONFIGS[network];
    if (!config) {
        throw new Error(`未找到网络配置: ${network}`);
    }
    return config;
}

/**
 * 检查合约地址是否已配置
 * @param {string} network - 网络名称
 * @returns {Object} 检查结果
 */
function checkContractAddresses(network = DEFAULT_CONFIG.currentNetwork) {
    const addresses = CONTRACT_ADDRESSES[network];
    return {
        network,
        nft: !!addresses.nft,
        marketplace: !!addresses.marketplace,
        selfVerifier: !!addresses.selfVerifier,
        allConfigured: !!(addresses.nft && addresses.marketplace && addresses.selfVerifier)
    };
}

// ===== 导出配置 =====
if (typeof window !== 'undefined') {
    window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
    window.CONTRACT_ABIS = CONTRACT_ABIS;
    window.NETWORK_CONFIGS = NETWORK_CONFIGS;
    window.DEFAULT_CONFIG = DEFAULT_CONFIG;
    
    // 辅助函数
    window.getContractAddresses = getContractAddresses;
    window.getNetworkConfig = getNetworkConfig;
    window.checkContractAddresses = checkContractAddresses;
    
    console.log('✅ StayFi 配置已加载');
    console.log('当前网络:', DEFAULT_CONFIG.currentNetwork);
    
    // 自动检查配置
    const status = checkContractAddresses();
    console.log('合约配置状态:', status);
    
    if (!status.allConfigured) {
        console.warn('⚠️ 部分合约地址未配置，请在 wallet-config.js 中更新');
    }
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONTRACT_ADDRESSES,
        CONTRACT_ABIS,
        NETWORK_CONFIGS,
        DEFAULT_CONFIG,
        getContractAddresses,
        getNetworkConfig,
        checkContractAddresses
    };
}

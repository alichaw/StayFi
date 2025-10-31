/**
 * StayFi Multi-Chain Configuration
 * Unified configuration for all supported blockchains
 */

const MULTICHAIN_CONFIG = {
    // Supported chains
    CHAINS: {
        CELO: {
            id: 'celo',
            name: 'Celo',
            displayName: 'Celo Alfajores',
            type: 'evm',
            icon: '🔵',
            color: '#FBCC5C',
            
            // Network configuration
            network: {
                chainId: '0xaef3', // 44787 in hex
                chainIdDecimal: 44787,
                chainName: 'Celo Alfajores Testnet',
                nativeCurrency: {
                    name: 'CELO',
                    symbol: 'CELO',
                    decimals: 18
                },
                rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
                blockExplorerUrls: ['https://alfajores.celoscan.io']
            },
            
            // Contract addresses (update after deployment)
            contracts: {
                nftContract: process.env.NIGHT_PASS_NFT_ADDRESS || '',
                marketplace: process.env.MARKETPLACE_ADDRESS || ''
            },
            
            // Wallet support
            wallets: ['metamask', 'walletconnect'],
            
            // Features
            features: {
                nftMinting: true,
                marketplace: true,
                staking: true,
                lending: true,
                compliance: true // ERC-3643
            },
            
            // Performance metrics
            metrics: {
                avgBlockTime: '5s',
                avgGasCost: '~$0.01',
                tps: '~1000'
            }
        },
        
        SUI: {
            id: 'sui',
            name: 'Sui',
            displayName: 'Sui Testnet',
            type: 'move',
            icon: '🔴',
            color: '#4DA2FF',
            
            // Network configuration
            network: {
                name: 'testnet',
                rpcUrl: 'https://fullnode.testnet.sui.io:443',
                faucetUrl: 'https://discord.gg/sui',
                explorerUrl: 'https://suiexplorer.com'
            },
            
            // Contract configuration (update after deployment)
            contracts: {
                packageId: process.env.SUI_PACKAGE_ID || '',
                registryId: process.env.SUI_REGISTRY_OBJECT_ID || ''
            },
            
            // Wallet support
            wallets: ['sui-wallet', 'suiet', 'ethos'],
            
            // Features
            features: {
                nftMinting: true,
                marketplace: false, // Coming soon
                staking: false,
                lending: false,
                compliance: false
            },
            
            // Performance metrics
            metrics: {
                avgBlockTime: '<1s',
                avgGasCost: '< $0.001',
                tps: '>100000'
            }
        },
        
        // Future chains
        ETHEREUM: {
            id: 'ethereum',
            name: 'Ethereum',
            displayName: 'Ethereum Sepolia',
            type: 'evm',
            icon: '⟠',
            color: '#627EEA',
            status: 'coming-soon',
            
            network: {
                chainId: '0xaa36a7', // Sepolia
                chainIdDecimal: 11155111,
                chainName: 'Ethereum Sepolia',
                nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
            }
        },
        
        POLYGON: {
            id: 'polygon',
            name: 'Polygon',
            displayName: 'Polygon Mumbai',
            type: 'evm',
            icon: '🟣',
            color: '#8247E5',
            status: 'coming-soon',
            
            network: {
                chainId: '0x13881', // Mumbai
                chainIdDecimal: 80001,
                chainName: 'Polygon Mumbai',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com']
            }
        }
    },
    
    // Default chain
    DEFAULT_CHAIN: 'CELO',
    
    // Wallet providers
    WALLET_PROVIDERS: {
        EVM: {
            metamask: {
                name: 'MetaMask',
                icon: '🦊',
                downloadUrl: 'https://metamask.io/download'
            },
            walletconnect: {
                name: 'WalletConnect',
                icon: '🔗',
                projectId: 'YOUR_PROJECT_ID' // Replace with your WalletConnect project ID
            }
        },
        MOVE: {
            'sui-wallet': {
                name: 'Sui Wallet',
                icon: '💧',
                downloadUrl: 'https://chrome.google.com/webstore/detail/sui-wallet'
            },
            suiet: {
                name: 'Suiet',
                icon: '🌊',
                downloadUrl: 'https://suiet.app'
            },
            ethos: {
                name: 'Ethos',
                icon: '⚡',
                downloadUrl: 'https://ethoswallet.xyz'
            }
        }
    }
};

/**
 * Get chain configuration by ID
 */
function getChainConfig(chainId) {
    return MULTICHAIN_CONFIG.CHAINS[chainId.toUpperCase()];
}

/**
 * Get all active chains (not coming-soon)
 */
function getActiveChains() {
    return Object.entries(MULTICHAIN_CONFIG.CHAINS)
        .filter(([_, config]) => !config.status || config.status !== 'coming-soon')
        .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get chains by type (evm, move)
 */
function getChainsByType(type) {
    return Object.entries(MULTICHAIN_CONFIG.CHAINS)
        .filter(([_, config]) => config.type === type)
        .map(([id, config]) => ({ id, ...config }));
}

/**
 * Check if a feature is supported on a chain
 */
function isFeatureSupported(chainId, feature) {
    const chain = getChainConfig(chainId);
    return chain?.features?.[feature] || false;
}

/**
 * Get wallet providers for a chain
 */
function getWalletProviders(chainId) {
    const chain = getChainConfig(chainId);
    if (!chain) return [];
    
    const type = chain.type === 'evm' ? 'EVM' : 'MOVE';
    return chain.wallets.map(walletId => ({
        id: walletId,
        ...MULTICHAIN_CONFIG.WALLET_PROVIDERS[type][walletId]
    }));
}

/**
 * Format address for display (truncate)
 */
function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Format token amount
 */
function formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(displayDecimals);
}

/**
 * Get explorer URL for transaction
 */
function getExplorerTxUrl(chainId, txHash) {
    const chain = getChainConfig(chainId);
    if (!chain) return '';
    
    if (chain.type === 'evm') {
        return `${chain.network.blockExplorerUrls[0]}/tx/${txHash}`;
    } else if (chain.type === 'move') {
        return `${chain.network.explorerUrl}/txblock/${txHash}?network=${chain.network.name}`;
    }
    return '';
}

/**
 * Get explorer URL for address
 */
function getExplorerAddressUrl(chainId, address) {
    const chain = getChainConfig(chainId);
    if (!chain) return '';
    
    if (chain.type === 'evm') {
        return `${chain.network.blockExplorerUrls[0]}/address/${address}`;
    } else if (chain.type === 'move') {
        return `${chain.network.explorerUrl}/address/${address}?network=${chain.network.name}`;
    }
    return '';
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MULTICHAIN_CONFIG,
        getChainConfig,
        getActiveChains,
        getChainsByType,
        isFeatureSupported,
        getWalletProviders,
        formatAddress,
        formatTokenAmount,
        getExplorerTxUrl,
        getExplorerAddressUrl
    };
}

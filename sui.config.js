// SUI Network Configuration
const { getFullnodeUrl } = require('@mysten/sui.js/client');

const SUI_NETWORKS = {
    mainnet: {
        url: getFullnodeUrl('mainnet'),
        explorer: 'https://suiexplorer.com',
    },
    testnet: {
        url: getFullnodeUrl('testnet'),
        explorer: 'https://suiexplorer.com',
    },
    devnet: {
        url: getFullnodeUrl('devnet'),
        explorer: 'https://suiexplorer.com',
    },
    localnet: {
        url: 'http://127.0.0.1:9000',
        explorer: 'http://localhost:3000',
    }
};

// Default network
const DEFAULT_NETWORK = process.env.SUI_NETWORK || 'testnet';

// Gas budget for transactions (in MIST, 1 SUI = 1e9 MIST)
const GAS_BUDGET = 10_000_000; // 0.01 SUI

// Module and function names
const MODULE_NAME = 'hotel_nft';
const FUNCTIONS = {
    MINT: 'mint_hotel_nft',
    USE_NFT: 'use_nft',
    TRANSFER: 'transfer_nft',
    WITHDRAW: 'withdraw_treasury',
};

module.exports = {
    SUI_NETWORKS,
    DEFAULT_NETWORK,
    GAS_BUDGET,
    MODULE_NAME,
    FUNCTIONS,
    
    // Helper to get current network config
    getCurrentNetwork: () => {
        return SUI_NETWORKS[DEFAULT_NETWORK];
    },
    
    // Helper to build function identifier
    buildFunctionId: (packageId, functionName) => {
        return `${packageId}::${MODULE_NAME}::${functionName}`;
    }
};

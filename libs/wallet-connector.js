/**
 * StayFi Wallet Connector - ERC-3643 Compliant
 * 支持 MetaMask, imToken 和其他 EIP-1193 兼容钱包
 * 包含合规验证流程 (OFAC, KYC)
 */

class WalletConnector {
    constructor(config = {}) {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.walletType = 'unknown';
        this.chainId = null;
        this.isCompliant = false;
        
        // 合约配置
        this.contracts = {
            nftContract: null,
            marketplaceContract: null,
            selfVerifierContract: null
        };
        
        // 配置
        this.config = {
            requireCompliance: config.requireCompliance !== false, // 默认需要合规验证
            autoSwitchNetwork: config.autoSwitchNetwork !== false,
            targetNetwork: config.targetNetwork || 'CELO_ALFAJORES',
            ...config
        };
    }

    /**
     * 检测可用的钱包类型
     * @returns {Object} 钱包检测结果
     */
    detectWallet() {
        if (typeof window.ethereum === 'undefined') {
            return {
                available: false,
                type: 'none',
                message: '未检测到 Web3 钱包\nNo Web3 wallet detected'
            };
        }

        // 优先检测 imToken
        if (window.ethereum.isImToken || window.imToken) {
            return {
                available: true,
                type: 'imToken',
                name: 'imToken',
                icon: '🦄',
                provider: window.ethereum,
                supportsEIP1193: true
            };
        }

        // 检测 MetaMask
        if (window.ethereum.isMetaMask) {
            return {
                available: true,
                type: 'MetaMask',
                name: 'MetaMask',
                icon: '🦊',
                provider: window.ethereum,
                supportsEIP1193: true
            };
        }

        // 其他钱包
        if (window.ethereum.isCoinbaseWallet) {
            return {
                available: true,
                type: 'Coinbase',
                name: 'Coinbase Wallet',
                icon: '💰',
                provider: window.ethereum,
                supportsEIP1193: true
            };
        }

        // 通用 Web3 钱包
        return {
            available: true,
            type: 'Web3',
            name: 'Web3 Wallet',
            icon: '🔗',
            provider: window.ethereum,
            supportsEIP1193: true
        };
    }

    /**
     * 连接钱包 (ERC-3643 合规流程)
     * @returns {Promise<Object>} 连接结果
     */
    async connect() {
        try {
            // 1. 检测钱包
            const walletInfo = this.detectWallet();
            
            if (!walletInfo.available) {
                throw new Error('请安装 MetaMask、imToken 或其他 Web3 钱包\nPlease install MetaMask, imToken, or another Web3 wallet');
            }

            this.walletType = walletInfo.type;
            console.log(`🔌 正在连接 ${walletInfo.name}... / Connecting to ${walletInfo.name}...`);

            // 2. 请求账户访问
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('未找到账户，请解锁钱包\nNo accounts found. Please unlock your wallet.');
            }

            // 3. 初始化 ethers.js provider
            if (typeof window.ethers === 'undefined') {
                throw new Error('Ethers.js 库未加载\nEthers.js library not loaded');
            }

            this.provider = new window.ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            // 4. 获取网络信息
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;

            // 5. 检查网络并切换
            if (this.config.autoSwitchNetwork) {
                await this.ensureCorrectNetwork();
            }

            // 6. 获取余额
            const balance = await this.provider.getBalance(this.userAddress);
            const balanceInEther = window.ethers.utils.formatEther(balance);

            console.log(`✅ ${walletInfo.name} 连接成功 / Connected successfully`);
            console.log(`   地址 Address: ${this.userAddress}`);
            console.log(`   余额 Balance: ${balanceInEther} ${this.getNetworkCurrency()}`);
            console.log(`   网络 Chain ID: ${this.chainId}`);

            return {
                success: true,
                address: this.userAddress,
                balance: balanceInEther,
                chainId: this.chainId,
                walletType: this.walletType,
                walletName: walletInfo.name,
                network: network,
                isCompliant: false // 初始未验证
            };

        } catch (error) {
            console.error('❌ 钱包连接失败 / Wallet connection failed:', error);
            
            // 用户拒绝连接
            if (error.code === 4001) {
                throw new Error('您取消了连接请求\nYou canceled the connection request');
            }
            
            throw error;
        }
    }

    /**
     * 初始化合约实例
     * @param {Object} contractAddresses - 合约地址
     * @param {Object} abis - 合约 ABI
     */
    initContracts(contractAddresses, abis) {
        if (!this.signer) {
            throw new Error('钱包未连接 / Wallet not connected');
        }

        // NFT 合约
        if (contractAddresses.nft && abis.nft) {
            this.contracts.nftContract = new window.ethers.Contract(
                contractAddresses.nft,
                abis.nft,
                this.signer
            );
            console.log('📜 NFT 合约已初始化 / NFT Contract initialized');
        }

        // Marketplace 合约
        if (contractAddresses.marketplace && abis.marketplace) {
            this.contracts.marketplaceContract = new window.ethers.Contract(
                contractAddresses.marketplace,
                abis.marketplace,
                this.signer
            );
            console.log('🏪 Marketplace 合约已初始化 / Marketplace Contract initialized');
        }

        // Self Verifier 合约
        if (contractAddresses.selfVerifier && abis.selfVerifier) {
            this.contracts.selfVerifierContract = new window.ethers.Contract(
                contractAddresses.selfVerifier,
                abis.selfVerifier,
                this.signer
            );
            console.log('🔐 Self Verifier 合约已初始化 / Self Verifier Contract initialized');
        }

        return this.contracts;
    }

    /**
     * 检查用户合规状态 (ERC-3643)
     * @returns {Promise<Object>} 合规状态
     */
    async checkCompliance() {
        try {
            if (!this.userAddress) {
                throw new Error('钱包未连接 / Wallet not connected');
            }

            console.log('🔍 正在检查合规状态... / Checking compliance status...');

            let complianceResult = {
                isCompliant: false,
                checks: {
                    nftCompliance: false,
                    selfVerification: false
                },
                timestamp: Date.now()
            };

            // 1. 检查 NFT 合约中的合规状态
            if (this.contracts.nftContract) {
                try {
                    const isNftCompliant = await this.contracts.nftContract.compliantAddresses(this.userAddress);
                    complianceResult.checks.nftCompliance = isNftCompliant;
                    console.log(`   NFT 合规: ${isNftCompliant ? '✅' : '❌'}`);
                } catch (error) {
                    console.warn('⚠️ NFT 合规检查失败:', error.message);
                }
            }

            // 2. 检查 Self Protocol 验证状态
            if (this.contracts.selfVerifierContract) {
                try {
                    const isSelfVerified = await this.contracts.selfVerifierContract.isVerified(this.userAddress);
                    complianceResult.checks.selfVerification = isSelfVerified;
                    console.log(`   Self 验证: ${isSelfVerified ? '✅' : '❌'}`);
                    
                    // 如果已验证，获取详细信息
                    if (isSelfVerified) {
                        const verification = await this.contracts.selfVerifierContract.getVerification(this.userAddress);
                        complianceResult.verificationDetails = {
                            timestamp: verification.timestamp,
                            isAgeValid: verification.isAgeValid,
                            isCountryValid: verification.isCountryValid,
                            isOfacClear: verification.isOfacClear
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Self 验证检查失败:', error.message);
                }
            }

            // 3. 综合判断合规状态
            complianceResult.isCompliant = 
                complianceResult.checks.nftCompliance || 
                complianceResult.checks.selfVerification;

            this.isCompliant = complianceResult.isCompliant;

            console.log(`🔐 合规状态: ${this.isCompliant ? '✅ 已验证' : '❌ 未验证'}`);

            return complianceResult;

        } catch (error) {
            console.error('❌ 合规检查失败:', error);
            throw error;
        }
    }

    /**
     * 签名消息 (用于 imToken 等钱包)
     * @param {string} message - 要签名的消息
     * @returns {Promise<string>} 签名
     */
    async signMessage(message) {
        try {
            if (!this.signer) {
                throw new Error('钱包未连接 / Wallet not connected');
            }

            console.log('📝 请求签名... / Requesting signature...');
            const signature = await this.signer.signMessage(message);
            console.log('✅ 消息已签名 / Message signed successfully');
            
            return signature;

        } catch (error) {
            console.error('❌ 签名失败 / Signature failed:', error);
            
            // 用户拒绝签名
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                throw new Error('您取消了签名请求\nYou canceled the signature request');
            }
            
            throw error;
        }
    }

    /**
     * 确保连接到正确的网络
     */
    async ensureCorrectNetwork() {
        const targetNetwork = NETWORKS[this.config.targetNetwork];
        
        if (!targetNetwork) {
            console.warn('⚠️ 未指定目标网络');
            return;
        }

        const currentChainId = '0x' + this.chainId.toString(16);
        
        if (currentChainId !== targetNetwork.chainId) {
            console.log(`🔄 需要切换到 ${targetNetwork.chainName}...`);
            await this.switchNetwork(targetNetwork);
        }
    }

    /**
     * 切换到指定网络
     * @param {Object} networkConfig - 网络配置
     */
    async switchNetwork(networkConfig) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }],
            });
            console.log(`✅ 已切换到 ${networkConfig.chainName}`);
            this.chainId = parseInt(networkConfig.chainId, 16);
        } catch (switchError) {
            // 网络未添加，尝试添加
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkConfig],
                    });
                    console.log(`✅ 已添加并切换到 ${networkConfig.chainName}`);
                    this.chainId = parseInt(networkConfig.chainId, 16);
                } catch (addError) {
                    throw new Error(`添加网络失败 / Failed to add network: ${addError.message}`);
                }
            } else {
                throw switchError;
            }
        }
    }

    /**
     * 设置事件监听器
     * @param {Object} callbacks - 回调函数
     */
    setupEventListeners(callbacks = {}) {
        if (!window.ethereum) return;

        // 账户变更
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                console.log('🔌 钱包已断开 / Wallet disconnected');
                this.disconnect();
                if (callbacks.onDisconnect) callbacks.onDisconnect();
            } else {
                this.userAddress = accounts[0];
                console.log('🔄 账户已更改 / Account changed:', this.userAddress);
                
                // 重新检查合规状态
                if (this.config.requireCompliance) {
                    await this.checkCompliance();
                }
                
                if (callbacks.onAccountChanged) {
                    callbacks.onAccountChanged(accounts[0], this.isCompliant);
                }
            }
        });

        // 网络变更
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('🔄 网络已更改 / Network changed:', chainId);
            this.chainId = parseInt(chainId, 16);
            if (callbacks.onChainChanged) {
                callbacks.onChainChanged(this.chainId);
            } else {
                // 默认：重新加载页面
                window.location.reload();
            }
        });

        // 连接状态
        window.ethereum.on('connect', (connectInfo) => {
            console.log('✅ 钱包已连接 / Wallet connected:', connectInfo);
            if (callbacks.onConnect) callbacks.onConnect(connectInfo);
        });

        window.ethereum.on('disconnect', (error) => {
            console.log('🔌 钱包已断开 / Wallet disconnected:', error);
            this.disconnect();
            if (callbacks.onDisconnect) callbacks.onDisconnect();
        });
    }

    /**
     * 断开钱包连接
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.walletType = 'unknown';
        this.chainId = null;
        this.isCompliant = false;
        this.contracts = {
            nftContract: null,
            marketplaceContract: null,
            selfVerifierContract: null
        };
        console.log('🔌 钱包已本地断开 / Wallet disconnected locally');
    }

    /**
     * 检查是否已连接
     * @returns {boolean}
     */
    isConnected() {
        return this.provider !== null && this.userAddress !== null;
    }

    /**
     * 获取网络货币名称
     * @returns {string}
     */
    getNetworkCurrency() {
        const celoChainIds = [42220, 44787]; // Celo Mainnet & Alfajores
        return celoChainIds.includes(this.chainId) ? 'CELO' : 'ETH';
    }

    /**
     * 获取合约实例
     * @param {string} contractType - 合约类型: 'nft', 'marketplace', 'selfVerifier'
     * @returns {Object} Ethers.js Contract 实例
     */
    getContract(contractType) {
        const contractMap = {
            'nft': this.contracts.nftContract,
            'marketplace': this.contracts.marketplaceContract,
            'selfVerifier': this.contracts.selfVerifierContract
        };
        
        const contract = contractMap[contractType];
        if (!contract) {
            throw new Error(`合约未初始化: ${contractType}`);
        }
        
        return contract;
    }
}

// 网络配置
const NETWORKS = {
    CELO_MAINNET: {
        chainId: '0xa4ec', // 42220
        chainName: 'Celo Mainnet',
        nativeCurrency: {
            name: 'CELO',
            symbol: 'CELO',
            decimals: 18
        },
        rpcUrls: ['https://forno.celo.org'],
        blockExplorerUrls: ['https://explorer.celo.org']
    },
    CELO_ALFAJORES: {
        chainId: '0xaef3', // 44787
        chainName: 'Celo Alfajores Testnet',
        nativeCurrency: {
            name: 'CELO',
            symbol: 'CELO',
            decimals: 18
        },
        rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
        blockExplorerUrls: ['https://alfajores.celoscan.io']
    }
};

// 导出供其他脚本使用
if (typeof window !== 'undefined') {
    window.WalletConnector = WalletConnector;
    window.NETWORKS = NETWORKS;
}

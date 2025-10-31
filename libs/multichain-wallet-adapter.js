/**
 * StayFi Multi-Chain Wallet Adapter
 * Unified interface for connecting to different blockchain wallets
 */

class MultichainWalletAdapter {
    constructor() {
        this.currentChain = null;
        this.currentWallet = null;
        this.currentAccount = null;
        this.provider = null;
        this.listeners = {};
    }

    /**
     * Connect to a wallet for a specific chain
     */
    async connect(chainId, walletId) {
        const chain = getChainConfig(chainId);
        if (!chain) {
            throw new Error(`Chain ${chainId} not supported`);
        }

        this.currentChain = chainId;

        if (chain.type === 'evm') {
            return await this._connectEVM(chain, walletId);
        } else if (chain.type === 'move') {
            return await this._connectMove(chain, walletId);
        }

        throw new Error(`Chain type ${chain.type} not supported`);
    }

    /**
     * Connect to EVM wallet (MetaMask, WalletConnect, etc.)
     */
    async _connectEVM(chain, walletId) {
        if (walletId === 'metamask') {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed. Please install MetaMask extension.');
            }

            try {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                this.currentAccount = accounts[0];
                this.provider = window.ethereum;

                // Switch to correct network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chain.network.chainId }],
                    });
                } catch (switchError) {
                    // Chain not added, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: chain.network.chainId,
                                chainName: chain.network.chainName,
                                nativeCurrency: chain.network.nativeCurrency,
                                rpcUrls: chain.network.rpcUrls,
                                blockExplorerUrls: chain.network.blockExplorerUrls
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }

                // Get balance
                const balance = await this.getBalance();

                // Setup listeners
                this._setupEVMListeners();

                return {
                    address: this.currentAccount,
                    balance,
                    chain: chain.id
                };
            } catch (error) {
                throw new Error(`Failed to connect MetaMask: ${error.message}`);
            }
        }

        throw new Error(`Wallet ${walletId} not supported for EVM chains`);
    }

    /**
     * Connect to Move wallet (Sui Wallet, Suiet, Ethos)
     */
    async _connectMove(chain, walletId) {
        if (walletId === 'sui-wallet') {
            if (!window.suiWallet) {
                throw new Error('Sui Wallet not installed. Please install Sui Wallet extension.');
            }

            try {
                const accounts = await window.suiWallet.requestPermissions();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found');
                }

                this.currentAccount = accounts[0].address;
                this.provider = window.suiWallet;

                // Initialize Sui client
                if (typeof window['@mysten/sui.js'] !== 'undefined') {
                    const { SuiClient, getFullnodeUrl } = window['@mysten/sui.js'];
                    this.suiClient = new SuiClient({ url: getFullnodeUrl(chain.network.name) });
                }

                // Get balance
                const balance = await this.getBalance();

                return {
                    address: this.currentAccount,
                    balance,
                    chain: chain.id
                };
            } catch (error) {
                throw new Error(`Failed to connect Sui Wallet: ${error.message}`);
            }
        }

        throw new Error(`Wallet ${walletId} not supported for Move chains`);
    }

    /**
     * Setup EVM event listeners
     */
    _setupEVMListeners() {
        if (!this.provider) return;

        // Account changed
        this.provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.currentAccount = accounts[0];
                this._emit('accountChanged', accounts[0]);
            }
        });

        // Chain changed
        this.provider.on('chainChanged', (chainId) => {
            window.location.reload(); // Recommended by MetaMask
        });

        // Disconnect
        this.provider.on('disconnect', () => {
            this.disconnect();
        });
    }

    /**
     * Get balance
     */
    async getBalance() {
        if (!this.currentAccount) {
            throw new Error('No account connected');
        }

        const chain = getChainConfig(this.currentChain);

        if (chain.type === 'evm') {
            const balance = await this.provider.request({
                method: 'eth_getBalance',
                params: [this.currentAccount, 'latest']
            });
            return formatTokenAmount(parseInt(balance, 16), 18, 4);
        } else if (chain.type === 'move' && this.suiClient) {
            const balance = await this.suiClient.getBalance({
                owner: this.currentAccount
            });
            return formatTokenAmount(balance.totalBalance, 9, 4);
        }

        return '0.0000';
    }

    /**
     * Send transaction (generic interface)
     */
    async sendTransaction(txData) {
        if (!this.currentAccount) {
            throw new Error('No account connected');
        }

        const chain = getChainConfig(this.currentChain);

        if (chain.type === 'evm') {
            return await this._sendEVMTransaction(txData);
        } else if (chain.type === 'move') {
            return await this._sendMoveTransaction(txData);
        }

        throw new Error('Unsupported chain type');
    }

    /**
     * Send EVM transaction
     */
    async _sendEVMTransaction(txData) {
        try {
            const txHash = await this.provider.request({
                method: 'eth_sendTransaction',
                params: [txData]
            });
            return txHash;
        } catch (error) {
            throw new Error(`Transaction failed: ${error.message}`);
        }
    }

    /**
     * Send Move transaction
     */
    async _sendMoveTransaction(txBlock) {
        try {
            const result = await this.provider.signAndExecuteTransactionBlock({
                transactionBlock: txBlock,
                account: { address: this.currentAccount }
            });
            return result.digest;
        } catch (error) {
            throw new Error(`Transaction failed: ${error.message}`);
        }
    }

    /**
     * Sign message
     */
    async signMessage(message) {
        if (!this.currentAccount) {
            throw new Error('No account connected');
        }

        const chain = getChainConfig(this.currentChain);

        if (chain.type === 'evm') {
            return await this.provider.request({
                method: 'personal_sign',
                params: [message, this.currentAccount]
            });
        }

        throw new Error('Message signing not yet implemented for this chain');
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.currentAccount = null;
        this.provider = null;
        this.suiClient = null;
        this._emit('disconnected');
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return this.currentAccount !== null;
    }

    /**
     * Get current account address
     */
    getAddress() {
        return this.currentAccount;
    }

    /**
     * Get current chain
     */
    getChain() {
        return this.currentChain;
    }

    /**
     * Switch chain
     */
    async switchChain(newChainId) {
        if (this.currentChain === newChainId) {
            return;
        }

        // Disconnect current and reconnect to new chain
        const wasConnected = this.isConnected();
        if (wasConnected) {
            this.disconnect();
        }

        this.currentChain = newChainId;
        this._emit('chainSwitched', newChainId);
    }

    /**
     * Event emitter
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit event
     */
    _emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }
}

// Export
if (typeof window !== 'undefined') {
    window.MultichainWalletAdapter = MultichainWalletAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultichainWalletAdapter;
}

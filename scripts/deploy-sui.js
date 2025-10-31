require('dotenv').config();
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
    console.log('🚀 Starting SUI deployment...\n');

    // Network selection
    const network = process.env.SUI_NETWORK || 'testnet'; // testnet, devnet, mainnet
    const rpcUrl = getFullnodeUrl(network);
    
    console.log(`📡 Network: ${network}`);
    console.log(`🌐 RPC URL: ${rpcUrl}\n`);

    // Initialize SUI client
    const client = new SuiClient({ url: rpcUrl });

    // Load keypair from environment
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('❌ SUI_PRIVATE_KEY not found in .env file');
    }

    const keypair = Ed25519Keypair.fromSecretKey(
        Buffer.from(privateKey, 'hex')
    );
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`👛 Deployer Address: ${address}`);

    // Check balance
    const balance = await client.getBalance({ owner: address });
    console.log(`💰 Balance: ${balance.totalBalance / 1e9} SUI\n`);

    if (balance.totalBalance === '0') {
        console.log('⚠️  Warning: No SUI balance. Please fund your account first.');
        console.log(`   Testnet faucet: https://discord.com/channels/916379725201563759/971488439931392130`);
        return;
    }

    // Build and publish the Move package
    console.log('📦 Building Move package...');
    try {
        execSync('sui move build', { 
            cwd: './move',
            stdio: 'inherit'
        });
    } catch (error) {
        console.error('❌ Failed to build Move package:', error.message);
        return;
    }

    console.log('\n📤 Publishing package to SUI...');
    
    // Read compiled modules
    const compiledModulesPath = './move/build/stayfi_hotel_nft/bytecode_modules';
    const modulesFiles = fs.readdirSync(compiledModulesPath);
    const modules = modulesFiles.map(file => {
        const modulePath = `${compiledModulesPath}/${file}`;
        return Array.from(fs.readFileSync(modulePath));
    });

    // Create transaction to publish
    const tx = new TransactionBlock();
    const [upgradeCap] = tx.publish({
        modules,
        dependencies: [
            '0x0000000000000000000000000000000000000000000000000000000000000001', // std
            '0x0000000000000000000000000000000000000000000000000000000000000002', // sui
        ],
    });

    // Transfer upgrade capability to sender
    tx.transferObjects([upgradeCap], tx.pure(address));

    // Execute transaction
    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        console.log('\n✅ Package published successfully!');
        console.log(`📋 Transaction Digest: ${result.digest}`);

        // Extract package ID and registry object ID
        const packageId = result.objectChanges.find(
            obj => obj.type === 'published'
        )?.packageId;

        const registryObj = result.objectChanges.find(
            obj => obj.objectType?.includes('NFTRegistry')
        );

        console.log(`📦 Package ID: ${packageId}`);
        if (registryObj) {
            console.log(`🗄️  Registry Object ID: ${registryObj.objectId}`);
        }

        // Save deployment info
        const deploymentInfo = {
            network,
            packageId,
            registryObjectId: registryObj?.objectId,
            deployerAddress: address,
            transactionDigest: result.digest,
            timestamp: new Date().toISOString(),
            explorerUrl: `https://suiexplorer.com/txblock/${result.digest}?network=${network}`
        };

        const filename = `deployment-sui-${network}.json`;
        fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to ${filename}`);
        console.log(`\n🔍 View on explorer: ${deploymentInfo.explorerUrl}`);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }

    console.log('\n🎉 SUI deployment completed!\n');
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

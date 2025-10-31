const hre = require('hardhat');

// Celo Sepolia Testnet Configuration
const CELO_SEPOLIA_CONFIG = {
  chainId: 44787,
  rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
  blockExplorer: 'https://sepolia.celoscan.io',
  nativeCurrency: 'CELO',
};

async function main() {
  console.log('🚀 Deploying to Celo Sepolia Testnet...');
  console.log(`📍 Chain ID: ${CELO_SEPOLIA_CONFIG.chainId}`);
  console.log(`🔗 RPC URL: ${CELO_SEPOLIA_CONFIG.rpcUrl}`);

  // Get the contract factories
  const SelfVerifier = await hre.ethers.getContractFactory('SelfVerifier');
  const NightPassNFT = await hre.ethers.getContractFactory('NightPassNFT');
  const NightPassMarketplace = await hre.ethers.getContractFactory('NightPassMarketplace');
  const NightPassLending = await hre.ethers.getContractFactory('NightPassLending');
  const RewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n📝 Deploying with account: ${deployer.address}`);

  // Get account balance
  const provider = hre.ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} CELO`);

  if (balance === 0n) {
    console.error('❌ Account has no balance. Please request testnet CELO from faucet:');
    console.error('   https://faucet.celo.org/');
    process.exit(1);
  }

  try {
    // Deploy SelfVerifier
    console.log('\n📦 Deploying SelfVerifier...');
    const selfVerifier = await SelfVerifier.deploy(deployer.address, {
      gasLimit: 1000000,
    });
    await selfVerifier.waitForDeployment();
    console.log(`✅ SelfVerifier deployed at: ${selfVerifier.address}`);

    // Deploy NightPassNFT
    console.log('\n📦 Deploying NightPassNFT...');
    const nightPassNFT = await NightPassNFT.deploy(selfVerifier.address, {
      gasLimit: 2000000,
    });
    await nightPassNFT.waitForDeployment();
    console.log(`✅ NightPassNFT deployed at: ${nightPassNFT.address}`);

    // Deploy NightPassMarketplace
    console.log('\n📦 Deploying NightPassMarketplace...');
    const marketplace = await NightPassMarketplace.deploy(
      nightPassNFT.address,
      selfVerifier.address,
      {
        gasLimit: 2000000,
      }
    );
    await marketplace.waitForDeployment();
    console.log(`✅ NightPassMarketplace deployed at: ${marketplace.address}`);

    // Deploy NightPassLending
    console.log('\n📦 Deploying NightPassLending...');
    const lending = await NightPassLending.deploy(
      nightPassNFT.address,
      selfVerifier.address,
      {
        gasLimit: 2000000,
      }
    );
    await lending.waitForDeployment();
    console.log(`✅ NightPassLending deployed at: ${lending.address}`);

    // Deploy RewardDistributor
    console.log('\n📦 Deploying RewardDistributor...');
    const rewards = await RewardDistributor.deploy(
      nightPassNFT.address,
      {
        gasLimit: 1500000,
      }
    );
    await rewards.waitForDeployment();
    console.log(`✅ RewardDistributor deployed at: ${rewards.address}`);

    // Whitelist contracts in SelfVerifier
    console.log('\n🔧 Whitelisting contracts...');
    await selfVerifier.setAgent(marketplace.address, true, { gasLimit: 100000 });
    await selfVerifier.setAgent(lending.address, true, { gasLimit: 100000 });
    await selfVerifier.setAgent(rewards.address, true, { gasLimit: 100000 });
    console.log('✅ Contracts whitelisted');

    // Save deployment info
    const deploymentInfo = {
      network: 'celo-sepolia',
      chainId: CELO_SEPOLIA_CONFIG.chainId,
      blockExplorer: CELO_SEPOLIA_CONFIG.blockExplorer,
      rpcUrl: CELO_SEPOLIA_CONFIG.rpcUrl,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        SelfVerifier: {
          address: selfVerifier.address,
          explorer: `${CELO_SEPOLIA_CONFIG.blockExplorer}/address/${selfVerifier.address}`,
        },
        NightPassNFT: {
          address: nightPassNFT.address,
          explorer: `${CELO_SEPOLIA_CONFIG.blockExplorer}/address/${nightPassNFT.address}`,
        },
        NightPassMarketplace: {
          address: marketplace.address,
          explorer: `${CELO_SEPOLIA_CONFIG.blockExplorer}/address/${marketplace.address}`,
        },
        NightPassLending: {
          address: lending.address,
          explorer: `${CELO_SEPOLIA_CONFIG.blockExplorer}/address/${lending.address}`,
        },
        RewardDistributor: {
          address: rewards.address,
          explorer: `${CELO_SEPOLIA_CONFIG.blockExplorer}/address/${rewards.address}`,
        },
      },
    };

    // Write to file
    const fs = require('fs');
    const deploymentPath = 'deployments/celo-sepolia.json';
    fs.mkdirSync('deployments', { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log('\n✅ Deployment Summary:');
    console.log('═════════════════════════════════════');
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}`);
    console.log(`Deployer: ${deploymentInfo.deployer}`);
    console.log(`\nContracts:`);
    Object.entries(deploymentInfo.contracts).forEach(([name, info]) => {
      console.log(`  ${name}:`);
      console.log(`    Address: ${info.address}`);
      console.log(`    Explorer: ${info.explorer}`);
    });
    console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

    // Output for frontend integration
    console.log('\n📋 Frontend Configuration:');
    console.log('═════════════════════════════════════');
    console.log('Add these to your .env file:');
    console.log(`VITE_SELF_VERIFIER_ADDRESS=${selfVerifier.address}`);
    console.log(`VITE_NIGHT_PASS_NFT_ADDRESS=${nightPassNFT.address}`);
    console.log(`VITE_MARKETPLACE_ADDRESS=${marketplace.address}`);
    console.log(`VITE_LENDING_ADDRESS=${lending.address}`);
    console.log(`VITE_CELO_SEPOLIA_RPC=${CELO_SEPOLIA_CONFIG.rpcUrl}`);

    console.log('\n✨ Deployment completed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();

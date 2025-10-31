const hre = require('hardhat');

async function main() {
  console.log('🚀 Deploying SelfVerifier to Celo Sepolia...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} CELO\n`);

  if (balance === 0n) {
    console.error('❌ Account has no balance. Get testnet CELO from: https://faucet.celo.org/');
    process.exit(1);
  }

  try {
    console.log('📦 Deploying SelfVerifier...');
    const SelfVerifier = await hre.ethers.getContractFactory('SelfVerifier');
    
    const selfVerifier = await SelfVerifier.deploy(deployer.address);
    await selfVerifier.waitForDeployment();

    const address = await selfVerifier.getAddress();
    console.log(`\n✅ SelfVerifier deployed at: ${address}`);
    console.log(`\n🔍 View on Celoscan: https://sepolia.celoscan.io/address/${address}`);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
      network: 'celo-sepolia',
      timestamp: new Date().toISOString(),
      contracts: {
        SelfVerifier: {
          address: address,
          explorer: `https://sepolia.celoscan.io/address/${address}`,
        },
      },
    };

    fs.mkdirSync('deployments', { recursive: true });
    fs.writeFileSync('deployments/self-verifier.json', JSON.stringify(deploymentInfo, null, 2));

    console.log('\n📋 Add to .env:');
    console.log(`SELF_VERIFIER_ADDRESS=${address}`);

    console.log('\n✨ Deployment completed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();

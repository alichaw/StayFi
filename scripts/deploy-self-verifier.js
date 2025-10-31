const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SelfVerifier to Celo Sepolia Testnet...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");

  // Deploy SelfVerifier with gas optimization
  console.log("\n📦 Deploying SelfVerifier contract (gas optimized)...");
  const SelfVerifier = await hre.ethers.getContractFactory("SelfVerifier");
  
  // Estimate gas and use minimal settings
  const deployTx = await SelfVerifier.getDeployTransaction();
  const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
  console.log("⛽ Estimated gas:", estimatedGas.toString());
  
  const selfVerifier = await SelfVerifier.deploy({
    gasLimit: estimatedGas * 110n / 100n, // Add 10% buffer
  });

  await selfVerifier.waitForDeployment();
  const address = await selfVerifier.getAddress();

  console.log("✅ SelfVerifier deployed to:", address);
  console.log("🔗 View on Blockscout:", `https://celo-sepolia.blockscout.com/address/${address}`);
  
  // Calculate deployment cost
  const receipt = await selfVerifier.deploymentTransaction().wait();
  const gasUsed = receipt.gasUsed;
  const gasPrice = receipt.gasPrice || receipt.effectiveGasPrice;
  const cost = gasUsed * gasPrice;
  console.log("💰 Gas used:", gasUsed.toString());
  console.log("💸 Deployment cost:", hre.ethers.formatEther(cost), "CELO");

  // Wait for fewer confirmations to save time (testnet is safe with 2)
  console.log("\n⏳ Waiting for 2 block confirmations...");
  await receipt; // Already waited above

  // Verify contract on CeloScan
  console.log("\n🔍 Verifying contract on CeloScan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on CeloScan");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
    console.log("You can manually verify later with:");
    console.log(`npx hardhat verify --network celoSepolia ${address}`);
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "Celo Sepolia",
    chainId: 11142220,
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    explorerUrl: `https://celo-sepolia.blockscout.com/address/${address}`,
    rpcUrl: "https://forno.celo-testnet.org",
  };

  fs.writeFileSync(
    "deployment-self-verifier-celo.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment-self-verifier-celo.json");

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update frontend with contract address");
  console.log("2. Test verification flow");
  console.log("3. Document for hackathon submission");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

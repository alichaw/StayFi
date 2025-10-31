const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting StayFi contract deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO\n");

  // Deploy NightPassNFT
  console.log("📦 Deploying NightPassNFT...");
  const NightPassNFT = await hre.ethers.getContractFactory("NightPassNFT");
  const nightPassNFT = await NightPassNFT.deploy();
  await nightPassNFT.waitForDeployment();
  console.log("✅ NightPassNFT deployed to:", await nightPassNFT.getAddress());

  // Deploy NightPassMarketplace
  console.log("\n📦 Deploying NightPassMarketplace...");
  const NightPassMarketplace = await hre.ethers.getContractFactory("NightPassMarketplace");
  const marketplace = await NightPassMarketplace.deploy(await nightPassNFT.getAddress());
  await marketplace.waitForDeployment();
  console.log("✅ NightPassMarketplace deployed to:", await marketplace.getAddress());

  // Set deployer as compliant for testing
  console.log("\n🔐 Setting deployer as compliant...");
  const tx = await nightPassNFT.updateCompliance(deployer.address, true);
  await tx.wait();
  console.log("✅ Deployer address is now compliant");

  // Get contract addresses
  const nftAddress = await nightPassNFT.getAddress();
  const marketplaceAddress = await marketplace.getAddress();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   NightPassNFT:        ", nftAddress);
  console.log("   NightPassMarketplace:", marketplaceAddress);
  
  console.log("\n🔗 View on Explorer:");
  const networkName = hre.network.name;
  const explorerBase = networkName === "alfajores" 
    ? "https://alfajores.celoscan.io" 
    : "https://celoscan.io";
  console.log("   NFT Contract:   ", `${explorerBase}/address/${nftAddress}`);
  console.log("   Marketplace:    ", `${explorerBase}/address/${marketplaceAddress}`);

  console.log("\n⚙️  Next Steps:");
  console.log("   1. Update app.html with these contract addresses");
  console.log("   2. Get testnet CELO from: https://faucet.celo.org");
  console.log("   3. Open app.html in browser to test minting!");
  
  console.log("\n💡 To update app.html, replace these lines:");
  console.log(`   NIGHT_PASS_NFT: '${nftAddress}',`);
  console.log(`   MARKETPLACE: '${marketplaceAddress}'`);
  console.log("\n" + "=".repeat(60));

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      NightPassNFT: nftAddress,
      NightPassMarketplace: marketplaceAddress
    },
    deployer: deployer.address
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to: deployment-info.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SelfVerifier to Local Hardhat Network...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy SelfVerifier
  console.log("\n📦 Deploying SelfVerifier contract...");
  const SelfVerifier = await hre.ethers.getContractFactory("SelfVerifier");
  
  const selfVerifier = await SelfVerifier.deploy();
  await selfVerifier.waitForDeployment();
  const address = await selfVerifier.getAddress();

  console.log("✅ SelfVerifier deployed to:", address);
  
  // Calculate deployment cost
  const receipt = await selfVerifier.deploymentTransaction().wait();
  const gasUsed = receipt.gasUsed;
  const gasPrice = receipt.gasPrice || receipt.effectiveGasPrice;
  const cost = gasUsed * gasPrice;
  console.log("💰 Gas used:", gasUsed.toString());
  console.log("💸 Deployment cost:", hre.ethers.formatEther(cost), "ETH");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "Local Hardhat",
    chainId: 31337,
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    "deployment-self-verifier-local.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment-self-verifier-local.json");

  console.log("\n🎉 Local deployment complete!");
  console.log("\n📋 Contract ready for testing:");
  console.log("- Address:", address);
  console.log("- Use this for local frontend development and debugging");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

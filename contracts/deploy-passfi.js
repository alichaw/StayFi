const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Pass-Fi Lending Contract...");

  // Get the contract factories
  const PassFiLending = await hre.ethers.getContractFactory("PassFiLending");
  
  // Replace with your actual contract addresses
  const NIGHT_PASS_NFT = process.env.NIGHT_PASS_NFT_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const USDC_TOKEN = process.env.USDC_TOKEN_ADDRESS || "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  
  console.log("Night-Pass NFT:", NIGHT_PASS_NFT);
  console.log("USDC Token:", USDC_TOKEN);
  
  // Deploy the contract
  const passFiLending = await PassFiLending.deploy(NIGHT_PASS_NFT, USDC_TOKEN);
  await passFiLending.waitForDeployment();
  
  const address = await passFiLending.getAddress();
  console.log("✅ PassFiLending deployed to:", address);
  console.log("");
  console.log("📝 Contract Addresses:");
  console.log("PASSFI_LENDING:", address);
  console.log("");
  console.log("🔧 Next steps:");
  console.log("1. Update index.html with the new contract address");
  console.log("2. Deposit USDC liquidity: passFiLending.depositLiquidity(amount)");
  console.log("3. Users can now borrow against their Night-Pass NFTs!");
  
  // Optional: Verify contract on block explorer
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("");
    console.log("⏳ Waiting for block confirmations...");
    await passFiLending.deploymentTransaction().wait(6);
    
    console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [NIGHT_PASS_NFT, USDC_TOKEN],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

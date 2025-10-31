const hre = require("hardhat");

async function main() {
  console.log("🔐 Deploying Self Protocol Verifier Contract...");

  const SelfVerifier = await hre.ethers.getContractFactory("SelfVerifier");
  
  // Deploy
  const selfVerifier = await SelfVerifier.deploy();
  await selfVerifier.waitForDeployment();
  
  const address = await selfVerifier.getAddress();
  console.log("✅ SelfVerifier deployed to:", address);
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  console.log("");
  console.log("📝 Contract Configuration:");
  console.log("SELF_VERIFIER:", address);
  console.log("");
  console.log("🔧 Sanctioned Countries:");
  const countries = ["CU", "IR", "KP", "SY", "RU"];
  for (const country of countries) {
    const countryBytes = hre.ethers.encodeBytes32String(country).slice(0, 6); // bytes2
    console.log(`  ${country}: Sanctioned`);
  }
  
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Update index.html with SELF_VERIFIER address");
  console.log("2. Add deployer as trusted verifier (already done in constructor)");
  console.log("3. Test verification flow:");
  console.log("   - User connects wallet");
  console.log("   - Generate ZK proof (off-chain)");
  console.log("   - Submit proof via submitVerification()");
  console.log("   - Check status via getVerification()");
  
  // Optional: Verify on block explorer
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("");
    console.log("⏳ Waiting for block confirmations...");
    await selfVerifier.deploymentTransaction().wait(6);
    
    console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
  
  console.log("");
  console.log("🎉 Self Protocol integration ready!");
  console.log("Contract address:", address);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

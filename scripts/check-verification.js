const ethers = require('ethers');
require('dotenv').config();

// Configuration
const CELO_RPC = process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org';
const VERIFIER_ADDRESS = process.env.SELF_VERIFIER_ADDRESS || '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF';

// SelfVerifier ABI (minimal)
const VERIFIER_ABI = [
  'function isVerified(address user) view returns (bool)',
  'function getVerification(address user) view returns (tuple(uint96 timestamp, bytes32 proofHash, bool isVerified, bool isAgeValid, bool isCountryValid, bool isOfacClear))',
  'function hasExpired(address user) view returns (bool)',
  'function timeUntilExpiry(address user) view returns (uint256)',
];

async function checkVerification(userAddress) {
  console.log('🔍 Checking SelfVerifier Contract Status\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Network: Celo Sepolia Testnet`);
  console.log(`📍 RPC: ${CELO_RPC}`);
  console.log(`📍 Contract: ${VERIFIER_ADDRESS}`);
  console.log(`📍 User: ${userAddress || 'Not specified'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Connect to Celo (ethers v6)
    const provider = new ethers.JsonRpcProvider(CELO_RPC);
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Initialize contract
    const verifier = new ethers.Contract(VERIFIER_ADDRESS, VERIFIER_ABI, provider);

    if (!userAddress) {
      console.log('ℹ️  No user address provided. Use:');
      console.log(`   node scripts/check-verification.js <ADDRESS>\n`);
      console.log('📊 Contract is accessible and ready for queries.');
      return;
    }

    // Check if address is valid (ethers v6)
    if (!ethers.isAddress(userAddress)) {
      console.error('❌ Invalid Ethereum address format');
      return;
    }

    console.log('🔐 Querying Verification Status...\n');

    // Query verification status
    const isVerified = await verifier.isVerified(userAddress);
    console.log(`📌 Is Verified: ${isVerified ? '✅ YES' : '❌ NO'}`);

    if (isVerified) {
      // Get full verification details
      const verification = await verifier.getVerification(userAddress);
      const hasExpired = await verifier.hasExpired(userAddress);
      const timeLeft = await verifier.timeUntilExpiry(userAddress);

      console.log('\n📋 Verification Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Timestamp: ${new Date(verification.timestamp * 1000).toLocaleString()}`);
      console.log(`  Proof Hash: ${verification.proofHash}`);
      console.log(`  Age Valid (18+): ${verification.isAgeValid ? '✅' : '❌'}`);
      console.log(`  Country Valid: ${verification.isCountryValid ? '✅' : '❌'}`);
      console.log(`  OFAC Clear: ${verification.isOfacClear ? '✅' : '❌'}`);
      console.log(`  Expired: ${hasExpired ? '❌ YES' : '✅ NO'}`);
      
      if (!hasExpired && timeLeft > 0) {
        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft % 86400) / 3600);
        console.log(`  Time Until Expiry: ${days} days, ${hours} hours`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('\nℹ️  User has not completed verification yet.\n');
    }

    // Block explorer link
    console.log('🔗 View on Celoscan:');
    console.log(`   https://sepolia.celoscan.io/address/${VERIFIER_ADDRESS}#readContract\n`);

  } catch (error) {
    console.error('\n❌ Error querying contract:', error.message);
    
    if (error.message.includes('could not detect network')) {
      console.log('\n💡 Tip: Check your internet connection and RPC URL');
    } else if (error.message.includes('call revert')) {
      console.log('\n💡 Tip: Contract may not be deployed or address is incorrect');
    }
  }
}

// Run the check
const userAddress = process.argv[2];
checkVerification(userAddress).catch(console.error);

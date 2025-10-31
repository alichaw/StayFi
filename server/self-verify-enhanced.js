const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { SelfBackendVerifier, AllIds, DefaultConfigStore } = require('@selfxyz/core');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// ===== Configuration =====
const VERIFICATION_CONFIG = {
  minimumAge: 18,
  excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'], // Cuba, Iran, North Korea, Russia
  ofac: true,
};

const CELO_CONFIG = {
  rpcUrl: process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org',
  selfVerifierAddress: process.env.SELF_VERIFIER_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
};

const SELF_SDK_CONFIG = {
  scope: process.env.SELF_SCOPE || 'stayfi-rwa',
  endpoint: process.env.SELF_ENDPOINT || `http://localhost:${process.env.PORT || 3000}/api/verify`,
  mockPassport: process.env.MOCK_PASSPORT === 'true', // Use mock mode for testing
};

// ===== Initialize Services =====

// Initialize Self Backend Verifier
const selfBackendVerifier = new SelfBackendVerifier(
  SELF_SDK_CONFIG.scope,
  SELF_SDK_CONFIG.endpoint,
  SELF_SDK_CONFIG.mockPassport,
  AllIds,
  new DefaultConfigStore(VERIFICATION_CONFIG),
  'hex' // userIdentifierType: 'hex' for EVM addresses
);

// Initialize Celo provider and signer for on-chain verification submission
let celoProvider;
let celoSigner;
let selfVerifierContract;

async function initializeCelo() {
  if (!CELO_CONFIG.rpcUrl || !CELO_CONFIG.selfVerifierAddress) {
    console.warn('⚠️  Celo configuration incomplete. On-chain submission disabled.');
    return;
  }

  try {
    celoProvider = new ethers.providers.JsonRpcProvider(CELO_CONFIG.rpcUrl);
    
    if (CELO_CONFIG.privateKey) {
      celoSigner = new ethers.Wallet(CELO_CONFIG.privateKey, celoProvider);
      console.log(`✅ Celo signer initialized: ${celoSigner.address}`);
    }

    // Load SelfVerifier ABI
    const SelfVerifierABI = [
      'function submitProof(uint256 attestationId, bytes proof, uint256[] publicSignals, bytes32 userContextData, bytes proofSignature) external returns (bytes32 proofHash, bool isVerified)',
      'function verifyProof(bytes32 proofHash, bool isAgeValid, bool isCountryValid, bool isOfacClear) external returns (bool)',
      'event ProofSubmitted(address indexed user, bytes32 indexed proofHash, uint256 attestationId)',
      'event ProofVerified(address indexed user, bytes32 indexed proofHash, uint256 timestamp)',
    ];

    selfVerifierContract = new ethers.Contract(
      CELO_CONFIG.selfVerifierAddress,
      SelfVerifierABI,
      celoSigner || celoProvider
    );

    console.log(`✅ SelfVerifier contract initialized at: ${CELO_CONFIG.selfVerifierAddress}`);
  } catch (error) {
    console.error('❌ Failed to initialize Celo:', error.message);
  }
}

// ===== API Endpoints =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'StayFi Self Verification Server Running',
    config: {
      mockMode: SELF_SDK_CONFIG.mockPassport,
      celoConfigured: !!selfVerifierContract,
    },
  });
});

// Main verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = req.body;

    console.log('📨 Received verification request:', {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      userContextData,
    });

    // Validate required fields
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return res.status(400).json({
        status: 'error',
        result: false,
        reason: 'Missing required fields',
        error_code: 'MISSING_FIELDS',
        message: 'Proof, publicSignals, attestationId and userContextData are required',
      });
    }

    // Verify the proof using Self SDK
    console.log('🔐 Verifying proof with Self SDK...');
    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    console.log('✅ Verification result:', result);

    let verificationData = {
      status: 'success',
      result: true,
      credentialSubject: result.discloseOutput || {},
      message: 'Identity verification successful',
      timestamp: new Date().toISOString(),
      attestationId,
    };

    // If verification failed with Self SDK
    if (!result.isValidDetails.isValid) {
      verificationData = {
        status: 'error',
        result: false,
        reason: 'Verification failed',
        error_code: 'VERIFICATION_FAILED',
        details: result.isValidDetails,
        message: 'Failed to verify identity proof',
        timestamp: new Date().toISOString(),
      };
    }

    // Try to submit to blockchain if configured and verification succeeded
    if (verificationData.result && celoSigner && selfVerifierContract) {
      try {
        console.log('🔗 Submitting proof to blockchain...');
        
        // Create proof data for on-chain submission
        const proofHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['uint256', 'bytes', 'uint256[]', 'bytes32', 'address'],
            [
              attestationId,
              proof,
              publicSignals,
              userContextData,
              userContextData, // Use as user identifier for now
            ]
          )
        );

        // Extract verification flags from result
        const extractedAge = result.discloseOutput?.age || 25;
        const isAgeValid = extractedAge >= VERIFICATION_CONFIG.minimumAge;
        const isCountryValid = !result.discloseOutput?.country || 
          !VERIFICATION_CONFIG.excludedCountries.includes(result.discloseOutput.country);
        const isOfacClear = !result.discloseOutput?.ofac_flagged;

        // Submit to contract
        const tx = await selfVerifierContract.verifyProof(
          proofHash,
          isAgeValid,
          isCountryValid,
          isOfacClear,
          { gasLimit: 500000 }
        );

        const receipt = await tx.wait();
        console.log(`✅ On-chain verification submitted: ${receipt.transactionHash}`);
        
        verificationData.onchain = {
          submitted: true,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          networkUrl: `https://sepolia.celoscan.io/tx/${receipt.transactionHash}`,
        };
      } catch (chainError) {
        console.warn('⚠️  On-chain submission failed:', chainError.message);
        verificationData.onchain = {
          submitted: false,
          error: chainError.message,
        };
      }
    }

    // Store verification result in memory (use database in production)
    verificationResults.set(userContextData, {
      timestamp: Date.now(),
      credentialSubject: verificationData.credentialSubject,
      result: verificationData,
    });

    return res.json(verificationData);
  } catch (error) {
    console.error('❌ Verification error:', error);
    return res.status(500).json({
      status: 'error',
      result: false,
      reason: error.message || 'Unknown error',
      error_code: 'UNKNOWN_ERROR',
      message: 'An error occurred during verification',
      timestamp: new Date().toISOString(),
    });
  }
});

// Check verification status
app.get('/api/verify/status/:userId', (req, res) => {
  const { userId } = req.params;
  const result = verificationResults.get(userId.toLowerCase());

  if (result) {
    res.json({
      verified: true,
      timestamp: result.timestamp,
      credentialSubject: result.credentialSubject,
      ...result.result,
    });
  } else {
    res.json({
      verified: false,
      message: 'No verification found for this user',
      timestamp: new Date().toISOString(),
    });
  }
});

// Store verification result
app.post('/api/verify/store', (req, res) => {
  const { userId, credentialSubject } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  verificationResults.set(userId.toLowerCase(), {
    timestamp: Date.now(),
    credentialSubject,
  });

  res.json({
    success: true,
    message: 'Verification result stored',
    timestamp: new Date().toISOString(),
  });
});

// Get verification config
app.get('/api/config', (req, res) => {
  res.json({
    verification: VERIFICATION_CONFIG,
    self: {
      scope: SELF_SDK_CONFIG.scope,
      mockMode: SELF_SDK_CONFIG.mockPassport,
    },
    blockchain: {
      network: 'celo-sepolia',
      selfVerifierAddress: CELO_CONFIG.selfVerifierAddress,
      rpcUrl: CELO_CONFIG.rpcUrl,
    },
  });
});

// In-memory verification results storage (use database in production)
const verificationResults = new Map();

// ===== Server Startup =====
async function startServer() {
  await initializeCelo();

  app.listen(PORT, () => {
    console.log('\n✅ StayFi Self Verification Server Started');
    console.log('═════════════════════════════════════════');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/verify`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`⚙️  Config: http://localhost:${PORT}/api/config`);
    console.log('═════════════════════════════════════════');
    console.log('📋 Configuration:');
    console.log(`   Self Scope: ${SELF_SDK_CONFIG.scope}`);
    console.log(`   Mock Mode: ${SELF_SDK_CONFIG.mockPassport}`);
    console.log(`   Min Age: ${VERIFICATION_CONFIG.minimumAge}`);
    console.log(`   Celo RPC: ${CELO_CONFIG.rpcUrl}`);
    console.log(`   Verifier Contract: ${CELO_CONFIG.selfVerifierAddress || 'Not configured'}`);
    console.log('═════════════════════════════════════════\n');
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

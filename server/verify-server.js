const express = require('express');
const cors = require('cors');
const { SelfBackendVerifier, AllIds, DefaultConfigStore } = require('@selfxyz/core');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Configuration matching frontend
const VERIFICATION_CONFIG = {
  minimumAge: 18,
  excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'], // Cuba, Iran, North Korea, Russia
  ofac: true,
};

// Initialize Self Backend Verifier
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.SELF_SCOPE || 'stayfi-rwa',
  process.env.SELF_ENDPOINT || 'http://localhost:3001/api/verify',
  false, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore(VERIFICATION_CONFIG),
  'hex' // userIdentifierType: 'hex' for EVM addresses
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StayFi Verification Server Running' });
});

// Verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = req.body;

    console.log('Received verification request:', {
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

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    console.log('Verification result:', result);

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Verification successful
      return res.json({
        status: 'success',
        result: true,
        credentialSubject: result.discloseOutput,
        message: 'Identity verification successful',
      });
    } else {
      // Verification failed
      return res.json({
        status: 'error',
        result: false,
        reason: 'Verification failed',
        error_code: 'VERIFICATION_FAILED',
        details: result.isValidDetails,
        message: 'Failed to verify identity proof',
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      status: 'error',
      result: false,
      reason: error.message || 'Unknown error',
      error_code: 'UNKNOWN_ERROR',
      message: 'An error occurred during verification',
    });
  }
});

// Store verification results (in-memory for demo, use database in production)
const verificationResults = new Map();

// Endpoint to check verification status
app.get('/api/verify/status/:userId', (req, res) => {
  const { userId } = req.params;
  const result = verificationResults.get(userId.toLowerCase());
  
  if (result) {
    res.json({
      verified: true,
      timestamp: result.timestamp,
      credentialSubject: result.credentialSubject,
    });
  } else {
    res.json({
      verified: false,
      message: 'No verification found for this user',
    });
  }
});

// Endpoint to store verification result
app.post('/api/verify/store', (req, res) => {
  const { userId, credentialSubject } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  verificationResults.set(userId.toLowerCase(), {
    timestamp: Date.now(),
    credentialSubject,
  });
  
  res.json({ success: true, message: 'Verification result stored' });
});

app.listen(PORT, () => {
  console.log(`✅ StayFi Verification Server running on port ${PORT}`);
  console.log(`📍 Verification endpoint: http://localhost:${PORT}/api/verify`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Configuration:`, VERIFICATION_CONFIG);
});

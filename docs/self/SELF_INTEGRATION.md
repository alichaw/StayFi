# Self Protocol Integration Guide

This guide explains how to use the Self Protocol zero-knowledge identity verification in StayFi.

## Overview

StayFi integrates Self Protocol to provide privacy-preserving identity verification for RWA (Real World Asset) compliance. Users can prove they meet requirements (age 18+, not from sanctioned countries, OFAC compliant) without revealing personal data.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Frontend   │─────▶│ Self App     │─────▶│ Verification    │
│  (HTML/JS)  │      │ (Mobile)     │      │ Server (Node)   │
└─────────────┘      └──────────────┘      └─────────────────┘
      │                                              │
      │                                              │
      └──────────────── Poll Status ────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@selfxyz/core` - Self Protocol backend verifier
- `@selfxyz/qrcode` - QR code generation (loaded via CDN in frontend)
- `express` - Backend server
- `cors` - CORS support

### 2. Start the Verification Server

```bash
npm run server
```

The server will start on `http://localhost:3001` and provide:
- `POST /api/verify` - Verification endpoint for Self Protocol
- `GET /api/verify/status/:userId` - Check verification status
- `POST /api/verify/store` - Store verification results
- `GET /health` - Health check

## Usage

### Option 1: Standalone Verification Page

Open `self-verify.html` in your browser:

```bash
open self-verify.html
```

This page:
1. Generates a QR code for Self app
2. Displays verification requirements
3. Polls the backend for verification results
4. Shows success/failure screens

### Option 2: Integrated in Main App

The ZK verification is integrated into `index.html`:
1. User clicks "Continue with Email" on login screen
2. ZK Module screen appears with Self QR code
3. User scans with Self app
4. After verification, proceeds to main app

## Configuration

### Backend Configuration (`server/verify-server.js`)

```javascript
const VERIFICATION_CONFIG = {
  minimumAge: 18,
  excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
  ofac: true,
};
```

### Frontend Configuration

Update these values in your HTML files:

```javascript
const CONFIG = {
  SELF_APP_NAME: 'StayFi',
  SELF_SCOPE: 'stayfi-rwa',
  SELF_ENDPOINT: 'http://localhost:3001/api/verify',
  VERIFICATION_CONFIG: {
    minimumAge: 18,
    excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
    ofac: true,
    nationality: true,
    gender: false,
  }
};
```

**Important**: Frontend and backend configs must match exactly!

## Verification Flow

### 1. QR Code Generation
- Frontend creates a `SelfApp` with verification requirements
- Generates a universal link encoded in QR code
- QR code contains: app info, user ID, endpoint, and disclosure requirements

### 2. User Scans QR Code
- User opens Self app on mobile
- Scans QR code
- Self app generates zero-knowledge proof

### 3. Backend Verification
- Self app sends proof to your backend endpoint
- `SelfBackendVerifier` validates the proof
- Checks age, nationality restrictions, OFAC compliance
- Returns verification result

### 4. Status Polling
- Frontend polls `/api/verify/status/:userId` every 5 seconds
- When verified, shows success screen
- User proceeds to main app

## Testing

### Local Testing with ngrok

For testing with real Self app, expose your local server:

```bash
# Install ngrok
brew install ngrok  # macOS

# Expose port 3001
ngrok http 3001
```

Update endpoint in your config to ngrok URL:
```javascript
SELF_ENDPOINT: 'https://your-ngrok-url.ngrok.io/api/verify'
```

### Mock Testing (Staging)

For development, use staging mode:

```javascript
const selfBackendVerifier = new SelfBackendVerifier(
  'stayfi-rwa',
  'http://localhost:3001/api/verify',
  true, // mockPassport: true for staging/testnet
  AllIds,
  new DefaultConfigStore(VERIFICATION_CONFIG),
  'hex'
);
```

## API Reference

### POST /api/verify

Verify zero-knowledge proof from Self app.

**Request Body:**
```json
{
  "attestationId": 1,
  "proof": "...",
  "publicSignals": [...],
  "userContextData": "0x..."
}
```

**Response (Success):**
```json
{
  "status": "success",
  "result": true,
  "credentialSubject": {
    "nationality": "USA",
    "age": 25
  },
  "message": "Identity verification successful"
}
```

**Response (Failure):**
```json
{
  "status": "error",
  "result": false,
  "reason": "Verification failed",
  "error_code": "VERIFICATION_FAILED"
}
```

### GET /api/verify/status/:userId

Check verification status for a user.

**Response:**
```json
{
  "verified": true,
  "timestamp": 1234567890,
  "credentialSubject": {...}
}
```

## Deployment

### Production Checklist

- [ ] Update endpoint URLs to production domain
- [ ] Set `mockPassport: false` for mainnet
- [ ] Use environment variables for sensitive config
- [ ] Enable HTTPS on verification endpoint
- [ ] Store verification results in database (not in-memory)
- [ ] Add rate limiting to prevent abuse
- [ ] Monitor verification success/failure rates

### Environment Variables

Create `.env` file:

```bash
SELF_APP_NAME=StayFi
SELF_SCOPE=stayfi-rwa
SELF_ENDPOINT=https://your-domain.com/api/verify
PORT=3001
```

## Troubleshooting

### QR Code Not Generating
- Check browser console for errors
- Ensure Self SDK loaded: `window.SelfAppBuilder`
- Verify QRCode.js library loaded

### Verification Timeout
- Check backend server is running
- Verify endpoint URL is correct and accessible
- Check CORS settings allow frontend domain

### Verification Failed
- Ensure frontend/backend configs match exactly
- Check user meets all requirements (age, nationality, OFAC)
- Review backend logs for specific failure reason

## Resources

- [Self Protocol Documentation](https://docs.self.xyz)
- [Self Protocol GitHub](https://github.com/selfxyz/self)
- [ETHGlobal Workshop](https://www.youtube.com/watch?v=2g0F5dWrUKk)
- [QRCode SDK Reference](https://docs.self.xyz/frontend-integration/qrcode-sdk)

## Support

For issues with Self Protocol integration:
1. Check the [Self Protocol Docs](https://docs.self.xyz)
2. Review server logs: `npm run server`
3. Check browser console for frontend errors
4. Verify all configurations match between frontend/backend

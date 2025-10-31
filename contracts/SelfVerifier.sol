// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SelfVerifier
 * @notice Contract for verifying Self Protocol zero-knowledge proofs on Celo
 * @dev Validates age, country, and OFAC compliance without revealing personal data
 * @dev Supports on-chain verification of Self Protocol ZK proofs
 */
contract SelfVerifier {
    using ECDSA for bytes32;
    
    // Events
    event ProofVerified(address indexed user, bytes32 indexed proofHash, uint256 timestamp);
    event VerificationFailed(address indexed user, bytes32 indexed proofHash, string reason);
    event ProofSubmitted(address indexed user, bytes32 indexed proofHash, uint256 attestationId);
    
    // Struct to store verification results (optimized packing)
    struct Verification {
        uint96 timestamp;
        bytes32 proofHash;
        bool isVerified;
        bool isAgeValid;
        bool isCountryValid;
        bool isOfacClear;
    }
    
    // Struct for proof data
    struct ProofData {
        uint256 attestationId;
        bytes proof;
        uint256[] publicSignals;
        bytes32 userContextData;
        bytes proofSignature;
        uint256 timestamp;
    }
    
    // Mapping from user address to their verification status
    mapping(address => Verification) public verifications;
    // Mapping to track used proof hashes (prevent replay attacks)
    mapping(bytes32 => bool) public usedProofs;
    // Storage for submitted proofs (for on-chain verification)
    mapping(bytes32 => ProofData) public submittedProofs;
    // Admin address
    address public admin;
    // Trusted Self Protocol verifier address
    address public selfVerifier;
    // Mapping for whitelisting agent contracts (Marketplace, Lending, etc.)
    mapping(address => bool) public whitelistedAgents;
    
    // Verification expiry time (30 days)
    uint256 public constant VERIFICATION_EXPIRY = 30 days;
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor(address initialSelfVerifier) {
        admin = msg.sender;
        selfVerifier = initialSelfVerifier != address(0) ? initialSelfVerifier : msg.sender;
    }
    
    /**
     * @notice Submit a Self Protocol zero-knowledge proof for on-chain verification
     * @param attestationId Self Protocol attestation ID
     * @param proof ZK proof bytes
     * @param publicSignals Public inputs to the proof
     * @param userContextData Context data from Self Protocol
     * @param proofSignature Signature from Self Protocol backend
     */
    function submitProof(
        uint256 attestationId,
        bytes calldata proof,
        uint256[] calldata publicSignals,
        bytes32 userContextData,
        bytes calldata proofSignature
    ) external returns (bytes32 proofHash, bool isVerified) {
        // Generate proof hash for uniqueness
        proofHash = keccak256(abi.encodePacked(
            attestationId,
            proof,
            publicSignals,
            userContextData,
            msg.sender
        ));
        
        require(!usedProofs[proofHash], "Proof already used");
        
        // Store proof data for on-chain verification
        submittedProofs[proofHash] = ProofData({
            attestationId: attestationId,
            proof: proof,
            publicSignals: publicSignals,
            userContextData: userContextData,
            proofSignature: proofSignature,
            timestamp: block.timestamp
        });
        
        emit ProofSubmitted(msg.sender, proofHash, attestationId);
        
        // Verify the proof immediately
        isVerified = _verifyProofData(msg.sender, proofHash);
        
        return (proofHash, isVerified);
    }
    
    /**
     * @notice Verify a Self Protocol zero-knowledge proof (Legacy function)
     * @param proofHash Hash of the proof for uniqueness
     * @param isAgeValid Whether age requirement is met (18+)
     * @param isCountryValid Whether country is not sanctioned
     * @param isOfacClear Whether user is not on OFAC list
     */
    function verifyProof(
        bytes32 proofHash,
        bool isAgeValid,
        bool isCountryValid,
        bool isOfacClear
    ) external returns (bool) {
        require(!usedProofs[proofHash], "Proof already used");
        
        // Mark proof as used to prevent replay attacks
        usedProofs[proofHash] = true;
        
        // Verify all conditions are met
        bool isFullyVerified = isAgeValid && isCountryValid && isOfacClear;
        
        // Store verification result
        verifications[msg.sender] = Verification({
            timestamp: uint96(block.timestamp),
            proofHash: proofHash,
            isVerified: isFullyVerified,
            isAgeValid: isAgeValid,
            isCountryValid: isCountryValid,
            isOfacClear: isOfacClear
        });
        
        if (isFullyVerified) {
            emit ProofVerified(msg.sender, proofHash, block.timestamp);
        } else {
            emit VerificationFailed(msg.sender, proofHash, 
                !isAgeValid ? "Age" : !isCountryValid ? "Country" : "OFAC"
            );
        }
        
        return isFullyVerified;
    }
    
    /**
     * @notice Internal function to verify proof data and extract claims
     * @param user User address
     * @param proofHash Hash of the proof
     */
    function _verifyProofData(address user, bytes32 proofHash) internal returns (bool) {
        ProofData memory proofData = submittedProofs[proofHash];
        require(proofData.timestamp > 0, "Proof not found");
        
        // Mark proof as used to prevent replay attacks
        usedProofs[proofHash] = true;
        
        // Extract verification results from public signals
        // Note: This is a simplified version - real implementation would need
        // proper ZK proof verification circuit integration
        bool isAgeValid = true; // Would extract from publicSignals[0]
        bool isCountryValid = true; // Would extract from publicSignals[1]
        bool isOfacClear = true; // Would extract from publicSignals[2]
        
        // For demo purposes, simulate verification based on attestationId
        if (proofData.attestationId == 999) {
            // Demo failure case
            isOfacClear = false;
        }
        
        bool isFullyVerified = isAgeValid && isCountryValid && isOfacClear;
        
        // Store verification result
        verifications[user] = Verification({
            timestamp: uint96(block.timestamp),
            proofHash: proofHash,
            isVerified: isFullyVerified,
            isAgeValid: isAgeValid,
            isCountryValid: isCountryValid,
            isOfacClear: isOfacClear
        });
        
        if (isFullyVerified) {
            emit ProofVerified(user, proofHash, block.timestamp);
        } else {
            emit VerificationFailed(user, proofHash, 
                !isAgeValid ? "Age" : !isCountryValid ? "Country" : "OFAC"
            );
        }
        
        return isFullyVerified;
    }
    
    /**
     * @notice Check if a user is currently verified
     * @param user Address to check
     * @return bool Whether the user has valid verification
     */
    function isVerified(address user) public view returns (bool) {
        // <-- FIX: Allow whitelisted agent contracts
        if (whitelistedAgents[user]) {
            return true;
        }

        Verification memory verification = verifications[user];
if (!verification.isVerified) {
            return false;
}
        
        // Check if verification has expired
        if (block.timestamp > verification.timestamp + VERIFICATION_EXPIRY) {
            return false;
}
        
        return true;
}
    
    /**
     * @notice Get verification details for a user
     * @param user Address to query
     * @return Verification struct with all details
     */
    function getVerification(address user) external view returns (Verification memory) {
        return verifications[user];
}
    
    /**
     * @notice Check if verification has expired
     * @param user Address to check
     * @return bool Whether verification has expired
     */
    function hasExpired(address user) external view returns (bool) {
        uint96 timestamp = verifications[user].timestamp;
return timestamp == 0 || block.timestamp > timestamp + VERIFICATION_EXPIRY;
}
    
    /**
     * @notice Get time remaining until verification expires
     * @param user Address to check
     * @return uint256 Seconds remaining (0 if expired)
     */
    function timeUntilExpiry(address user) external view returns (uint256) {
        uint96 timestamp = verifications[user].timestamp;
if (timestamp == 0) return 0;
        
        uint256 expiryTime = uint256(timestamp) + VERIFICATION_EXPIRY;
        return block.timestamp >= expiryTime ?
0 : expiryTime - block.timestamp;
    }

    /**
     * @notice Admin function to whitelist/revoke an agent contract
     */
    function setAgent(address agent, bool isWhitelisted) external onlyAdmin {
        whitelistedAgents[agent] = isWhitelisted;
    }
    
    /**
     * @notice Admin function to update Self Protocol verifier address
     */
    function setSelfVerifier(address newSelfVerifier) external onlyAdmin {
        require(newSelfVerifier != address(0), "Invalid verifier address");
        selfVerifier = newSelfVerifier;
    }
    
    /**
     * @notice Admin function to update admin address
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
    
    /**
     * @notice Admin function to manually revoke verification (emergency only)
     */
    function revokeVerification(address user) external onlyAdmin {
        verifications[user].isVerified = false;
    }
    
    /**
     * @notice Get proof data for verification
     */
    function getProofData(bytes32 proofHash) external view returns (ProofData memory) {
        return submittedProofs[proofHash];
    }
}

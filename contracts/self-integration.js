// ===== Self Protocol Integration for index.html =====

// 1. Add to CONFIG (around line 1096):
const CONFIG = {
    // ... existing config ...
    CONTRACTS: {
        NIGHT_PASS_NFT: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        MARKETPLACE: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
        PASSFI_LENDING: '0x9d4454B023096f34B160D6B654540c56A1F81688',
        SELF_VERIFIER: '0xYOUR_SELF_VERIFIER_ADDRESS_HERE' // Add this
    }
};

// 2. Add Self Verifier ABI (around line 1121):
const SELF_VERIFIER_ABI = [
    "function submitVerification(address user, bytes32 proofHash, uint8 attributes) external",
    "function verifyUser(address user, uint8 requiredAttributes) view returns (bool)",
    "function getVerification(address user) view returns (bool, uint256, uint256, bytes32, bool, bool, bool)",
    "function isFullyCompliant(address user) view returns (bool)",
    "function isAge18Plus(address user) view returns (bool)",
    "function isNonSanctioned(address user) view returns (bool)",
    "function isOFACClear(address user) view returns (bool)"
];

// 3. Initialize Self Verifier contract (in wallet connection handler, around line 1938):
let selfVerifierContract = null;

// After initializing other contracts:
selfVerifierContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.SELF_VERIFIER,
    SELF_VERIFIER_ABI,
    signer
);
console.log('🔐 Self Verifier Contract initialized');

// 4. Replace initializeSelfProtocol function (around line 2715):
async function initializeSelfProtocol() {
    try {
        console.log('🎯 Initializing Self Protocol verification...');
        
        // Check if user already verified on-chain
        if (selfVerifierContract && userAddress) {
            const verification = await selfVerifierContract.getVerification(userAddress);
            
            if (verification[0]) { // isVerified
                console.log('✅ User already verified on-chain!');
                
                // Update UI
                document.getElementById('self-status-age').textContent = verification[4] ? '✅' : '❌';
                document.getElementById('self-status-country').textContent = verification[5] ? '✅' : '❌';
                document.getElementById('self-status-ofac').textContent = verification[6] ? '✅' : '❌';
                
                if (verification[4] && verification[5] && verification[6]) {
                    updateSelfStatus('✅ Verified on Celo! Redirecting...', 'success');
                    zkProofVerified = true;
                    
                    setTimeout(() => {
                        showScreen('screen-explore');
                    }, 2000);
                    return;
                }
            }
        }
        
        // User not verified, show verification UI
        updateSelfStatus('📱 Ready to verify. Click button to start.', 'info');
        await generateSelfQRCode();
        
        console.log('✅ Self Protocol ready');
        
    } catch (error) {
        console.error('❌ Self initialization error:', error);
        updateSelfStatus('Ready to verify. Click button above.', 'info');
    }
}

// 5. Update generateSelfQRCode to submit on-chain (around line 2735):
async function generateSelfQRCode() {
    const mobileBtn = document.getElementById('open-self-app-btn-main');
    
    try {
        console.log('🎯 Setting up Self verification flow...');
        
        mobileBtn.classList.remove('hidden');
        mobileBtn.onclick = async () => {
            console.log('🎯 Starting Self verification...');
            
            mobileBtn.disabled = true;
            mobileBtn.style.opacity = '0.5';
            mobileBtn.innerHTML = '<span>⏳ Verifying...</span>';
            
            try {
                // Step 1: Simulate ZK proof generation
                await new Promise(resolve => setTimeout(resolve, 1000));
                updateSelfStatus('📱 Generating zero-knowledge proof...', 'info');
                
                // Step 2: Generate proof data
                await new Promise(resolve => setTimeout(resolve, 2000));
                const proofData = await generateZKProof();
                updateSelfStatus('🔐 Proof generated, submitting to Celo...', 'info');
                
                // Step 3: Submit proof on-chain
                await new Promise(resolve => setTimeout(resolve, 1500));
                await submitProofOnChain(proofData);
                
                // Step 4: Success
                document.getElementById('self-status-age').textContent = '✅';
                document.getElementById('self-status-age').parentElement.classList.add('border-green-500');
                
                document.getElementById('self-status-country').textContent = '✅';
                document.getElementById('self-status-country').parentElement.classList.add('border-green-500');
                
                document.getElementById('self-status-ofac').textContent = '✅';
                document.getElementById('self-status-ofac').parentElement.classList.add('border-green-500');
                
                updateSelfStatus('✅ Verified on Celo! Redirecting...', 'success');
                zkProofVerified = true;
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                showScreen('screen-explore');
                
            } catch (error) {
                console.error('❌ Verification error:', error);
                updateSelfStatus('❌ Verification failed: ' + error.message, 'error');
                mobileBtn.disabled = false;
                mobileBtn.style.opacity = '1';
                mobileBtn.innerHTML = '<span>🔄 Try Again</span>';
            }
        };
        
        console.log('✅ Self button ready');
        
    } catch (error) {
        console.error('❌ Setup error:', error);
    }
}

// 6. Add ZK Proof generation function (NEW):
async function generateZKProof() {
    console.log('🔐 Generating ZK proof...');
    
    // In production, this would use Self Protocol SDK to generate real ZK proof
    // For demo, we generate a simulated proof structure
    
    // User attributes (private, not revealed)
    const privateData = {
        age: 25,
        country: "TW",
        notInOFAC: true,
        timestamp: Date.now()
    };
    
    // Generate commitment (hash)
    const dataString = JSON.stringify(privateData);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const proofHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Attributes bitmap
    // bit 0: age 18+ ✓
    // bit 1: non-sanctioned country ✓
    // bit 2: OFAC clear ✓
    const attributes = 0b111; // All three attributes verified
    
    console.log('✅ ZK proof generated');
    console.log('Proof hash:', proofHash);
    console.log('Attributes:', attributes.toString(2));
    
    return {
        proofHash: proofHash,
        attributes: attributes,
        privateData: privateData // Not submitted on-chain
    };
}

// 7. Add on-chain submission function (NEW):
async function submitProofOnChain(proofData) {
    try {
        if (!selfVerifierContract || !signer || !userAddress) {
            throw new Error('Wallet not connected');
        }
        
        console.log('📤 Submitting proof to Celo blockchain...');
        console.log('User:', userAddress);
        console.log('Proof hash:', proofData.proofHash);
        console.log('Attributes:', proofData.attributes);
        
        // Submit verification on-chain
        const tx = await selfVerifierContract.submitVerification(
            userAddress,
            proofData.proofHash,
            proofData.attributes
        );
        
        console.log('⏳ Waiting for confirmation... Tx:', tx.hash);
        await tx.wait();
        
        console.log('✅ Proof verified on-chain! Tx:', tx.hash);
        
        // Verify on-chain
        const isVerified = await selfVerifierContract.isFullyCompliant(userAddress);
        console.log('On-chain verification status:', isVerified);
        
        if (!isVerified) {
            throw new Error('On-chain verification failed');
        }
        
        return tx;
        
    } catch (error) {
        console.error('❌ On-chain submission error:', error);
        throw error;
    }
}

// 8. Add function to check on-chain status (NEW):
async function checkOnChainVerification() {
    try {
        if (!selfVerifierContract || !userAddress) {
            return null;
        }
        
        const verification = await selfVerifierContract.getVerification(userAddress);
        
        return {
            isVerified: verification[0],
            verifiedAt: verification[1].toNumber(),
            expiresAt: verification[2].toNumber(),
            proofHash: verification[3],
            age18Plus: verification[4],
            nonSanctioned: verification[5],
            ofacClear: verification[6]
        };
        
    } catch (error) {
        console.error('❌ Check verification error:', error);
        return null;
    }
}

// 9. Add access control check (NEW):
async function requireFullCompliance() {
    try {
        if (!selfVerifierContract || !userAddress) {
            alert('請先連接錢包 / Please connect wallet');
            return false;
        }
        
        const isCompliant = await selfVerifierContract.isFullyCompliant(userAddress);
        
        if (!isCompliant) {
            alert('⚠️ 需要先完成 KYC 驗證 / KYC verification required\n\n請先完成年齡、國籍和 OFAC 驗證。');
            showScreen('screen-zk-module');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Compliance check error:', error);
        return false;
    }
}

// 10. Usage example - Add compliance check to mint function:
// Modify executeMintNFT (around line 2924):
async function executeMintNFT() {
    try {
        // Add compliance check at the beginning
        const isCompliant = await requireFullCompliance();
        if (!isCompliant) {
            return;
        }
        
        // ... rest of mint logic
    } catch (error) {
        // ... error handling
    }
}

console.log('✅ Self Protocol integration code ready!');
console.log('📝 Steps:');
console.log('1. Deploy SelfVerifier contract to Celo');
console.log('2. Update CONFIG.CONTRACTS.SELF_VERIFIER');
console.log('3. Add SELF_VERIFIER_ABI');
console.log('4. Initialize selfVerifierContract in wallet connection');
console.log('5. Replace initializeSelfProtocol and generateSelfQRCode');
console.log('6. Add generateZKProof, submitProofOnChain functions');
console.log('7. Add access control to sensitive functions');

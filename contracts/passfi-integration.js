// ===== Pass-Fi Lending Integration for index.html =====

// 1. Add to CONFIG object (around line 1096):
const CONFIG = {
    // ... existing config ...
    CONTRACTS: {
        NIGHT_PASS_NFT: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        MARKETPLACE: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
        PASSFI_LENDING: '0xYOUR_PASSFI_CONTRACT_ADDRESS_HERE', // Add this
        USDC_TOKEN: '0xYOUR_USDC_CONTRACT_ADDRESS_HERE' // Add this
    }
};

// 2. Add ABI (around line 1121):
const PASSFI_LENDING_ABI = [
    "function borrow(uint256 tokenId, uint256 collateralValue, uint256 borrowAmount) external",
    "function repay(uint256 tokenId) external",
    "function calculateDebt(uint256 tokenId) view returns (uint256)",
    "function getLoan(uint256 tokenId) view returns (address borrower, uint256 principal, uint256 totalDebt, uint256 collateralValue, bool active, uint256 daysElapsed)",
    "function isCollateralized(uint256 tokenId) view returns (bool)",
    "function getPoolStats() view returns (uint256 totalLiquidity, uint256 availableLiquidity, uint256 totalLoanedAmount, uint256 utilizationRate)"
];

const USDC_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

// 3. Initialize contracts (add to wallet connection, around line 1938):
let passFiContract = null;
let usdcContract = null;

// In connectWalletBtn handler, after initializing other contracts:
passFiContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.PASSFI_LENDING,
    PASSFI_LENDING_ABI,
    signer
);
console.log('💰 Pass-Fi Lending Contract initialized');

usdcContract = new window.ethers.Contract(
    CONFIG.CONTRACTS.USDC_TOKEN,
    USDC_ABI,
    signer
);
console.log('💵 USDC Contract initialized');

// 4. Replace the executeBorrow function (around line 2676):
async function executeBorrow(borrowAmount) {
    try {
        if (!signer || !userAddress || !passFiContract || !nftContract) {
            alert('請先連接錢包 / Please connect wallet first');
            return;
        }
        
        // Get current NFT being borrowed against
        if (!currentTransferTokenId) {
            alert('請選擇要抵押的 NFT / Please select an NFT to collateralize');
            return;
        }
        
        const tokenId = currentTransferTokenId;
        const amount = parseFloat(borrowAmount);
        
        if (isNaN(amount) || amount <= 0) {
            alert('請輸入有效金額 / Please enter valid amount');
            return;
        }
        
        showModal('modal-mint-loading');
        console.log(`💸 Borrowing ${amount} USDC against NFT #${tokenId}...`);
        
        // Step 1: Get NFT value
        const nightPass = await nftContract.getNightPass(tokenId);
        const collateralValue = nightPass.price; // NFT price in USDC (6 decimals)
        
        // Step 2: Check if NFT is already collateralized
        const isCollateralized = await passFiContract.isCollateralized(tokenId);
        if (isCollateralized) {
            hideModal('modal-mint-loading');
            alert('此 NFT 已被抵押 / This NFT is already collateralized');
            return;
        }
        
        // Step 3: Approve Pass-Fi contract to transfer NFT
        console.log('🔒 Step 1: Approving Pass-Fi contract for NFT...');
        const approveTx = await nftContract.approve(
            CONFIG.CONTRACTS.PASSFI_LENDING,
            tokenId
        );
        await approveTx.wait();
        console.log('✅ NFT approved');
        
        // Step 4: Borrow USDC
        console.log('💰 Step 2: Executing borrow transaction...');
        const borrowAmountWei = ethers.utils.parseUnits(amount.toString(), 6); // USDC has 6 decimals
        
        const borrowTx = await passFiContract.borrow(
            tokenId,
            collateralValue,
            borrowAmountWei
        );
        
        console.log('⏳ Waiting for confirmation...');
        await borrowTx.wait();
        
        console.log(`✅ Borrowed ${amount} USDC successfully! Tx:`, borrowTx.hash);
        hideModal('modal-mint-loading');
        
        // Update debt display
        totalDebt += amount;
        document.getElementById('earnings-debt-value').textContent = `${totalDebt.toFixed(2)} USDC`;
        
        alert(`✅ 借貸成功！/ Borrowed ${amount} USDC successfully!\\n\\nNFT #${tokenId} is now collateralized.\\nTotal Debt: ${totalDebt.toFixed(2)} USDC`);
        
        // Reload NFT list to show collateralized status
        await loadUserNFTs();
        showScreen('screen-earnings');
        
    } catch (error) {
        hideModal('modal-mint-loading');
        console.error('❌ Borrow error:', error);
        alert('Borrow 失敗 / Borrow failed: ' + (error.message || 'Unknown error'));
    }
}

// 5. Add repay function (new function):
async function executeRepay(tokenId) {
    try {
        if (!signer || !userAddress || !passFiContract || !usdcContract) {
            alert('請先連接錢包 / Please connect wallet first');
            return;
        }
        
        showModal('modal-mint-loading');
        console.log(`💰 Repaying loan for NFT #${tokenId}...`);
        
        // Step 1: Get loan details
        const loan = await passFiContract.getLoan(tokenId);
        const totalDebt = loan.totalDebt;
        
        if (!loan.active) {
            hideModal('modal-mint-loading');
            alert('此 NFT 沒有活躍的貸款 / No active loan for this NFT');
            return;
        }
        
        console.log(`Total debt: ${ethers.utils.formatUnits(totalDebt, 6)} USDC`);
        
        // Step 2: Check USDC balance
        const usdcBalance = await usdcContract.balanceOf(userAddress);
        if (usdcBalance.lt(totalDebt)) {
            hideModal('modal-mint-loading');
            alert('USDC 餘額不足 / Insufficient USDC balance');
            return;
        }
        
        // Step 3: Approve Pass-Fi contract to spend USDC
        console.log('🔒 Step 1: Approving USDC...');
        const approveTx = await usdcContract.approve(
            CONFIG.CONTRACTS.PASSFI_LENDING,
            totalDebt
        );
        await approveTx.wait();
        console.log('✅ USDC approved');
        
        // Step 4: Repay loan
        console.log('💸 Step 2: Repaying loan...');
        const repayTx = await passFiContract.repay(tokenId);
        await repayTx.wait();
        
        console.log('✅ Loan repaid! Tx:', repayTx.hash);
        hideModal('modal-mint-loading');
        
        // Update debt display
        const principal = parseFloat(ethers.utils.formatUnits(loan.principal, 6));
        totalDebt -= principal;
        document.getElementById('earnings-debt-value').textContent = `${totalDebt.toFixed(2)} USDC`;
        
        alert(`✅ 還款成功！/ Loan repaid successfully!\\n\\nNFT #${tokenId} returned to your wallet.`);
        
        // Reload NFT list
        await loadUserNFTs();
        showScreen('screen-mypass');
        
    } catch (error) {
        hideModal('modal-mint-loading');
        console.error('❌ Repay error:', error);
        alert('Repay 失敗 / Repay failed: ' + (error.message || 'Unknown error'));
    }
}

// 6. Update loadUserNFTs to show collateralized status (modify existing function):
// Add this check when rendering NFT cards:
async function loadUserNFTs() {
    // ... existing code ...
    
    for (const { tokenId, nightPass, isListed } of nfts) {
        // Check if collateralized
        let isCollateralized = false;
        if (passFiContract) {
            try {
                isCollateralized = await passFiContract.isCollateralized(tokenId);
            } catch (e) {
                console.warn('Failed to check collateral status:', e);
            }
        }
        
        // Update status badge logic:
        const statusBadge = isCollateralized
            ? '<span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Collateralized</span>'
            : isListed
            ? '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Listed</span>'
            : // ... rest of conditions
        
        // Update buttons for collateralized NFTs:
        const buttonsHTML = isCollateralized
            ? `<button class="repay-btn w-full bg-purple-600 text-white font-bold py-2 rounded-lg text-sm" data-token-id="${tokenId}">Repay Loan</button>`
            : // ... existing button logic
        
        // ... rest of rendering
    }
}

// 7. Bind repay button (add to event listeners):
document.body.addEventListener('click', (e) => {
    const repayBtn = e.target.closest('.repay-btn');
    if (repayBtn && repayBtn.dataset.tokenId) {
        e.preventDefault();
        const tokenId = parseInt(repayBtn.dataset.tokenId);
        console.log('💰 Repay clicked for token:', tokenId);
        executeRepay(tokenId);
    }
});

// 8. Update modal-borrow to use real token ID:
// In the modal open handler for 'modal-borrow', capture the token ID:
if (modalButton.dataset.modal === 'modal-borrow' && modalButton.dataset.tokenId) {
    currentTransferTokenId = modalButton.dataset.tokenId;
    console.log('🏦 Borrow modal opened for token:', currentTransferTokenId);
}

console.log('✅ Pass-Fi Lending integration code ready!');
console.log('📝 Next steps:');
console.log('1. Deploy PassFiLending contract');
console.log('2. Update CONFIG with contract addresses');
console.log('3. Add PASSFI_LENDING_ABI and USDC_ABI to index.html');
console.log('4. Replace executeBorrow function');
console.log('5. Add executeRepay function');
console.log('6. Update loadUserNFTs to show collateralized status');
console.log('7. Add repay button event listener');

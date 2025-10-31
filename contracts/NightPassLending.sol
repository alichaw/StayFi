// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface INightPassNFT is IERC721 {
    struct NightPass {
        string hotelName;
uint256 checkInDate;
        uint256 price;
        uint256 yield;
        bool isActive;
        bool isUsed;
}
    function getNightPass(uint256 tokenId) external view returns (NightPass memory);
    // <-- FIX: Add the new compliance check function
    function isCompliant(address user) external view returns (bool);
}

/**
 * @title NightPassLending
 * @dev Collateralized lending using Night-Pass NFTs
 */
contract NightPassLending is Ownable, ReentrancyGuard, IERC721Receiver {
    
    INightPassNFT public nightPassNFT;
IERC20 public lendingToken; // USDC
    
    // Loan parameters
    uint256 public constant LTV_BPS = 5000;
// 50% Loan-to-Value ratio
    uint256 public constant INTEREST_RATE_BPS = 500;
// 5% annual interest
    uint256 public constant BPS_DENOMINATOR = 10000;
struct Loan {
        address borrower;
        uint256 tokenId;
        uint256 principal;
        uint256 startTime;
        bool isActive;
}
    
    // Mapping from loan ID to loan details
    mapping(uint256 => Loan) public loans;
uint256 public loanIdCounter;
    
    // Mapping from tokenId to loanId (for quick lookup)
    mapping(uint256 => uint256) public tokenToLoan;
// Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 indexed tokenId, uint256 amount);
event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId, uint256 indexed tokenId);
constructor(address _nightPassNFT, address _lendingToken) Ownable(msg.sender) {
        nightPassNFT = INightPassNFT(_nightPassNFT);
        lendingToken = IERC20(_lendingToken);
}
    
    /**
     * @dev Calculate maximum borrowable amount for a token
     * @param tokenId Token ID to calculate for
     * @return Maximum borrowable amount
     */
    function getMaxBorrow(uint256 tokenId) public view returns (uint256) {
        INightPassNFT.NightPass memory pass = nightPassNFT.getNightPass(tokenId);
// Can only borrow against active, unused passes
        if (!pass.isActive || pass.isUsed) {
            return 0;
}
        
        // LTV = 50% of price
        return (pass.price * LTV_BPS) / BPS_DENOMINATOR;
}
    
    /**
     * @dev Calculate outstanding debt including interest
     * @param loanId Loan ID
     * @return Total debt amount
     */
    function calculateDebt(uint256 loanId) public view returns (uint256) {
        Loan memory loan = loans[loanId];
if (!loan.isActive) {
            return 0;
}
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
uint256 interest = (loan.principal * INTEREST_RATE_BPS * timeElapsed) / (BPS_DENOMINATOR * 365 days);
        
        return loan.principal + interest;
}
    
    /**
     * @dev Borrow against a Night-Pass NFT
     * @param tokenId Token ID to use as collateral
     * @param amount Amount to borrow
     */
    function borrow(uint256 tokenId, uint256 amount) external nonReentrant returns (uint256) {
        require(nightPassNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
require(tokenToLoan[tokenId] == 0, "Token already collateralized");
        require(amount > 0, "Amount must be greater than 0");
        
        // <-- FIX: Add compliance pre-check for the borrower
        require(nightPassNFT.isCompliant(msg.sender), "Borrower is not compliant");

        uint256 maxBorrow = getMaxBorrow(tokenId);
require(amount <= maxBorrow, "Amount exceeds max borrow");
        require(lendingToken.balanceOf(address(this)) >= amount, "Insufficient liquidity");
// Transfer NFT to contract as collateral (This will now be checked by NightPassNFT._update)
        nightPassNFT.safeTransferFrom(msg.sender, address(this), tokenId);
// Create loan
        uint256 loanId = loanIdCounter++;
loans[loanId] = Loan({
            borrower: msg.sender,
            tokenId: tokenId,
            principal: amount,
            startTime: block.timestamp,
            isActive: true
        });
tokenToLoan[tokenId] = loanId;
        
        // Transfer borrowed amount to borrower
        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");
emit LoanCreated(loanId, msg.sender, tokenId, amount);
        return loanId;
    }
    
    /**
     * @dev Repay a loan and retrieve NFT
     * @param loanId Loan ID to repay
     */
    function repay(uint256 loanId) external nonReentrant {
        Loan memory loan = loans[loanId];
require(loan.isActive, "Loan is not active");
        require(loan.borrower == msg.sender, "Not the borrower");
        
        // <-- FIX: Add compliance pre-check for the borrower
        require(nightPassNFT.isCompliant(msg.sender), "Borrower is not compliant");

        uint256 debt = calculateDebt(loanId);
// Transfer repayment from borrower
        require(lendingToken.transferFrom(msg.sender, address(this), debt), "Transfer failed");
// Mark loan as inactive
        loans[loanId].isActive = false;
        tokenToLoan[loan.tokenId] = 0;
// Return NFT to borrower (This will now be checked by NightPassNFT._update)
        nightPassNFT.safeTransferFrom(address(this), msg.sender, loan.tokenId);
        
        emit LoanRepaid(loanId, msg.sender, debt);
}
    
    /**
     * @dev Liquidate an underwater loan (only owner can call)
     * @param loanId Loan ID to liquidate
     */
    function liquidate(uint256 loanId) external onlyOwner nonReentrant {
        Loan memory loan = loans[loanId];
require(loan.isActive, "Loan is not active");
        
        // In a real system, check if loan is underwater based on time or oracle price
        // For now, allow liquidation after 90 days
        require(block.timestamp > loan.startTime + 90 days, "Loan not eligible for liquidation");
loans[loanId].isActive = false;
        tokenToLoan[loan.tokenId] = 0;
        
        // NFT stays in contract (becomes protocol-owned)
        emit LoanLiquidated(loanId, loan.tokenId);
}
    
    /**
     * @dev Deposit lending capital (only owner)
     * @param amount Amount to deposit
     */
    function depositCapital(uint256 amount) external onlyOwner {
        require(lendingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
}
    
    /**
     * @dev Withdraw lending capital (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawCapital(uint256 amount) external onlyOwner {
        require(lendingToken.transfer(owner(), amount), "Transfer failed");
}
    
    /**
     * @dev Get loan details by token ID
     * @param tokenId Token ID
     * @return Loan ID (0 if no active loan)
     */
    function getLoanByToken(uint256 tokenId) external view returns (uint256) {
        return tokenToLoan[tokenId];
}
    
    /**
     * @dev Required for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
}
}
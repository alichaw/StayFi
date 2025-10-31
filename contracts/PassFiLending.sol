// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PassFiLending
 * @dev Collateralized lending using Night-Pass NFTs as collateral
 */
contract PassFiLending is ReentrancyGuard, Ownable {
    
    IERC721 public nightPassNFT;
    IERC20 public usdcToken;
    
    // Loan-to-Value ratio (50% = 5000 basis points)
    uint256 public constant LTV_RATIO = 5000; // 50%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Interest rate: 10% APR = 1000 basis points
    uint256 public constant INTEREST_RATE = 1000; // 10% APR
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    struct Loan {
        address borrower;
        uint256 tokenId;
        uint256 principal;      // Amount borrowed in USDC
        uint256 startTime;      // Loan start timestamp
        uint256 collateralValue; // NFT value at time of loan
        bool active;
    }
    
    // Mapping from tokenId to Loan
    mapping(uint256 => Loan) public loans;
    
    // Track total loaned amount
    uint256 public totalLoaned;
    
    // Events
    event LoanCreated(
        address indexed borrower,
        uint256 indexed tokenId,
        uint256 principal,
        uint256 collateralValue
    );
    
    event LoanRepaid(
        address indexed borrower,
        uint256 indexed tokenId,
        uint256 principal,
        uint256 interest
    );
    
    event CollateralLiquidated(
        uint256 indexed tokenId,
        address indexed borrower,
        uint256 debt
    );
    
    constructor(address _nightPassNFT, address _usdcToken) Ownable(msg.sender) {
        nightPassNFT = IERC721(_nightPassNFT);
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev Borrow USDC by collateralizing a Night-Pass NFT
     * @param tokenId The NFT token ID to use as collateral
     * @param collateralValue The current value of the NFT in USDC (6 decimals)
     * @param borrowAmount The amount of USDC to borrow (6 decimals)
     */
    function borrow(
        uint256 tokenId,
        uint256 collateralValue,
        uint256 borrowAmount
    ) external nonReentrant {
        require(nightPassNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!loans[tokenId].active, "NFT already collateralized");
        
        // Calculate maximum borrowable amount (50% LTV)
        uint256 maxBorrow = (collateralValue * LTV_RATIO) / BASIS_POINTS;
        require(borrowAmount <= maxBorrow, "Borrow amount exceeds LTV limit");
        require(borrowAmount > 0, "Borrow amount must be > 0");
        
        // Check lending pool has enough USDC
        require(
            usdcToken.balanceOf(address(this)) >= borrowAmount,
            "Insufficient liquidity"
        );
        
        // Transfer NFT to contract as collateral
        nightPassNFT.transferFrom(msg.sender, address(this), tokenId);
        
        // Create loan record
        loans[tokenId] = Loan({
            borrower: msg.sender,
            tokenId: tokenId,
            principal: borrowAmount,
            startTime: block.timestamp,
            collateralValue: collateralValue,
            active: true
        });
        
        totalLoaned += borrowAmount;
        
        // Transfer USDC to borrower
        require(
            usdcToken.transfer(msg.sender, borrowAmount),
            "USDC transfer failed"
        );
        
        emit LoanCreated(msg.sender, tokenId, borrowAmount, collateralValue);
    }
    
    /**
     * @dev Repay loan and retrieve collateralized NFT
     * @param tokenId The NFT token ID
     */
    function repay(uint256 tokenId) external nonReentrant {
        Loan storage loan = loans[tokenId];
        require(loan.active, "No active loan");
        require(loan.borrower == msg.sender, "Not loan owner");
        
        // Calculate total debt (principal + interest)
        uint256 debt = calculateDebt(tokenId);
        
        // Transfer debt from borrower to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), debt),
            "USDC transfer failed"
        );
        
        // Return NFT to borrower
        nightPassNFT.transferFrom(address(this), msg.sender, tokenId);
        
        uint256 interest = debt - loan.principal;
        totalLoaned -= loan.principal;
        
        // Mark loan as inactive
        loan.active = false;
        
        emit LoanRepaid(msg.sender, tokenId, loan.principal, interest);
    }
    
    /**
     * @dev Calculate total debt including interest
     * @param tokenId The NFT token ID
     * @return Total debt in USDC
     */
    function calculateDebt(uint256 tokenId) public view returns (uint256) {
        Loan memory loan = loans[tokenId];
        if (!loan.active) return 0;
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.principal * INTEREST_RATE * timeElapsed) / 
                          (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return loan.principal + interest;
    }
    
    /**
     * @dev Get loan details
     * @param tokenId The NFT token ID
     */
    function getLoan(uint256 tokenId) external view returns (
        address borrower,
        uint256 principal,
        uint256 totalDebt,
        uint256 collateralValue,
        bool active,
        uint256 daysElapsed
    ) {
        Loan memory loan = loans[tokenId];
        uint256 debt = calculateDebt(tokenId);
        uint256 daysElapsed = (block.timestamp - loan.startTime) / 1 days;
        
        return (
            loan.borrower,
            loan.principal,
            debt,
            loan.collateralValue,
            loan.active,
            daysElapsed
        );
    }
    
    /**
     * @dev Check if NFT is collateralized
     */
    function isCollateralized(uint256 tokenId) external view returns (bool) {
        return loans[tokenId].active;
    }
    
    /**
     * @dev Owner deposits USDC to lending pool
     */
    function depositLiquidity(uint256 amount) external onlyOwner {
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
    }
    
    /**
     * @dev Owner withdraws excess USDC from lending pool
     */
    function withdrawLiquidity(uint256 amount) external onlyOwner {
        uint256 available = usdcToken.balanceOf(address(this));
        require(amount <= available, "Insufficient balance");
        require(
            usdcToken.transfer(msg.sender, amount),
            "USDC transfer failed"
        );
    }
    
    /**
     * @dev Liquidate under-collateralized loan (for future implementation)
     * @param tokenId The NFT token ID
     */
    function liquidate(uint256 tokenId) external onlyOwner {
        Loan storage loan = loans[tokenId];
        require(loan.active, "No active loan");
        
        // Check if loan is under-collateralized
        uint256 debt = calculateDebt(tokenId);
        uint256 currentLTV = (debt * BASIS_POINTS) / loan.collateralValue;
        
        // Liquidate if LTV > 80%
        require(currentLTV > 8000, "Loan not under-collateralized");
        
        totalLoaned -= loan.principal;
        loan.active = false;
        
        // NFT stays in contract, can be sold to recover funds
        emit CollateralLiquidated(tokenId, loan.borrower, debt);
    }
    
    /**
     * @dev Get lending pool stats
     */
    function getPoolStats() external view returns (
        uint256 totalLiquidity,
        uint256 availableLiquidity,
        uint256 totalLoanedAmount,
        uint256 utilizationRate
    ) {
        totalLiquidity = usdcToken.balanceOf(address(this));
        availableLiquidity = totalLiquidity;
        totalLoanedAmount = totalLoaned;
        utilizationRate = totalLiquidity > 0 
            ? (totalLoaned * BASIS_POINTS) / totalLiquidity 
            : 0;
        
        return (totalLiquidity, availableLiquidity, totalLoanedAmount, utilizationRate);
    }
}

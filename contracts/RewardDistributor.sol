// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
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
}

/**
 * @title RewardDistributor
 * @dev Distribute yield rewards to Night-Pass NFT holders
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    
    INightPassNFT public nightPassNFT;
    IERC20 public rewardToken; // USDC or other stablecoin
    
    // Track claimed rewards
    mapping(uint256 => uint256) public lastClaimTime;
    mapping(uint256 => uint256) public totalClaimed;
    
    // Events
    event RewardsClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event RewardsDeposited(uint256 amount);
    
    constructor(address _nightPassNFT, address _rewardToken) Ownable(msg.sender) {
        nightPassNFT = INightPassNFT(_nightPassNFT);
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @dev Calculate pending rewards for a token
     * @param tokenId Token ID to calculate rewards for
     * @return Pending reward amount
     */
    function calculatePendingRewards(uint256 tokenId) public view returns (uint256) {
        INightPassNFT.NightPass memory pass = nightPassNFT.getNightPass(tokenId);
        
        // Only active and not used passes earn rewards
        if (!pass.isActive || pass.isUsed) {
            return 0;
        }
        
        uint256 timeHeld = block.timestamp - (lastClaimTime[tokenId] > 0 ? lastClaimTime[tokenId] : 0);
        
        // If never claimed, assume held for 30 days
        if (lastClaimTime[tokenId] == 0) {
            timeHeld = 30 days;
        }
        
        // Calculate: (price * yield * timeHeld) / (365 days)
        // price is in USDC (6 decimals), yield is in basis points (540 = 5.4%)
        uint256 annualReward = (pass.price * pass.yield) / 10000;
        uint256 reward = (annualReward * timeHeld) / 365 days;
        
        return reward;
    }
    
    /**
     * @dev Claim rewards for a token
     * @param tokenId Token ID to claim rewards for
     */
    function claimRewards(uint256 tokenId) external nonReentrant {
        require(nightPassNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        
        uint256 pending = calculatePendingRewards(tokenId);
        require(pending > 0, "No rewards to claim");
        require(rewardToken.balanceOf(address(this)) >= pending, "Insufficient reward funds");
        
        lastClaimTime[tokenId] = block.timestamp;
        totalClaimed[tokenId] += pending;
        
        require(rewardToken.transfer(msg.sender, pending), "Transfer failed");
        
        emit RewardsClaimed(tokenId, msg.sender, pending);
    }
    
    /**
     * @dev Batch claim rewards for multiple tokens
     * @param tokenIds Array of token IDs
     */
    function claimMultiple(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(nightPassNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
            
            uint256 pending = calculatePendingRewards(tokenId);
            if (pending > 0) {
                lastClaimTime[tokenId] = block.timestamp;
                totalClaimed[tokenId] += pending;
                totalReward += pending;
                
                emit RewardsClaimed(tokenId, msg.sender, pending);
            }
        }
        
        require(totalReward > 0, "No rewards to claim");
        require(rewardToken.balanceOf(address(this)) >= totalReward, "Insufficient reward funds");
        require(rewardToken.transfer(msg.sender, totalReward), "Transfer failed");
    }
    
    /**
     * @dev Deposit reward tokens (only owner)
     * @param amount Amount to deposit
     */
    function depositRewards(uint256 amount) external onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit RewardsDeposited(amount);
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardToken.transfer(owner(), balance), "Transfer failed");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// <-- FIX: Define the new interface for NightPassNFT
interface INightPassNFT is IERC721 {
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    // <-- FIX: Add the new compliance check function
    function isCompliant(address user) external view returns (bool);
}

/**
 * @title NightPassMarketplace
 * @dev Decentralized marketplace for Night-Pass NFT trading
 */
contract NightPassMarketplace is ReentrancyGuard, Ownable {
    
    struct Listing {
        uint256 tokenId;
address seller;
        uint256 price;
        bool isActive;
    }

    // <-- FIX: Changed from IERC721 to the compliant INightPassNFT interface
    INightPassNFT public nightPassNFT;
// Platform fee (2.5% = 250 basis points)
    uint256 public platformFeeBps = 250;
uint256 private constant BPS_DENOMINATOR = 10000;
    
    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;
// Events
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    event PlatformFeeUpdated(uint256 newFeeBps);
constructor(address _nightPassNFT) Ownable(msg.sender) {
        nightPassNFT = INightPassNFT(_nightPassNFT);
}

    /**
     * @dev List a Night-Pass for sale
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     */
    function listNightPass(uint256 tokenId, uint256 price) external nonReentrant {
        require(nightPassNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
require(price > 0, "Price must be greater than 0");
        require(nightPassNFT.getApproved(tokenId) == address(this) || 
                nightPassNFT.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });
emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @dev Buy a listed Night-Pass
     * @param tokenId Token ID to buy
     */
    function buyNightPass(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");

        // <-- FIX: Add compliance pre-check for the buyer (improves UX)
        require(nightPassNFT.isCompliant(msg.sender), "Buyer is not compliant");
        
// Calculate platform fee
        uint256 platformFee = (listing.price * platformFeeBps) / BPS_DENOMINATOR;
uint256 sellerProceeds = listing.price - platformFee;

        // Mark as inactive before transfer
        listings[tokenId].isActive = false;
// Transfer NFT to buyer (This will now be checked by NightPassNFT._update)
        nightPassNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);
// Transfer funds to seller
        (bool successSeller, ) = payable(listing.seller).call{value: sellerProceeds}("");
require(successSeller, "Transfer to seller failed");

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool successRefund, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
require(successRefund, "Refund failed");
        }

        emit Sold(tokenId, listing.seller, msg.sender, listing.price);
}

    /**
     * @dev Cancel a listing
     * @param tokenId Token ID to cancel listing for
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing is not active");

        listings[tokenId].isActive = false;

        emit ListingCancelled(tokenId);
}

    /**
     * @dev Update platform fee (only owner)
     * @param newFeeBps New fee in basis points (e.g., 250 = 2.5%)
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high");
// Max 10%
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
}

    /**
     * @dev Get listing details
     * @param tokenId Token ID to query
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
}

    /**
     * @dev Withdraw accumulated platform fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
}
    
    // <-- FIX: Marketplace does not receive NFTs, so onERC721Received is not needed
    // ... [onERC721Received function removed]
}
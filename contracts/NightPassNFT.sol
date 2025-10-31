// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// <-- FIX: Import the SelfVerifier interface
interface ISelfVerifier {
    function isVerified(address user) external view returns (bool);
}

/**
 * @title NightPassNFT
 * @dev RWA-backed hotel night pass NFT with compliance features
 */
contract NightPassNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // <-- FIX: Reference to the SelfVerifier contract (Identity Registry)
    ISelfVerifier public selfVerifier;

// Struct to store Night-Pass metadata
    struct NightPass {
        string hotelName;
uint256 checkInDate;
        uint256 price;
        uint256 yield;
        bool isActive;
        bool isUsed;
}

    // Mapping from token ID to Night-Pass data
    mapping(uint256 => NightPass) public nightPasses;

    // <-- FIX: Removed the redundant 'compliantAddresses' mapping
    // mapping(address => bool) public compliantAddresses; [DELETED]

// Events
    event NightPassMinted(uint256 indexed tokenId, address indexed owner, string hotelName, uint256 price);
    event NightPassUsed(uint256 indexed tokenId);
    // event ComplianceStatusUpdated(address indexed user, bool isCompliant); [DELETED]
    // <-- FIX: Added event for updating the verifier
    event SelfVerifierUpdated(address indexed newVerifier);

    // <-- FIX: Updated constructor to accept the SelfVerifier address
    constructor(address _selfVerifierAddress) ERC721("StayFi Night-Pass", "NIGHTPASS") Ownable(msg.sender) {
        require(_selfVerifierAddress != address(0), "Invalid verifier address");
        selfVerifier = ISelfVerifier(_selfVerifierAddress);
    }

    /**
     * @dev Mint a new Night-Pass NFT
     * @param to Address to mint to (must be compliant)
     * @param hotelName Name of the hotel
     * @param checkInDate Unix timestamp of check-in date
     * @param price Price in USDC (scaled by 10^6)
     * @param yieldPercent Annual yield percentage (scaled by 100, e.g., 540 = 5.4%)
     * @param uri IPFS URI for metadata
     */
  
  function mintNightPass(
        address to,
        string memory hotelName,
        uint256 checkInDate,
        uint256 price,
        uint256 yieldPercent,
        string memory uri
    ) public payable returns (uint256) {
        // <-- FIX: Compliance check is now handled automatically by _update function
        
        uint256 tokenId = _tokenIdCounter;
_tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        nightPasses[tokenId] = NightPass({
            hotelName: hotelName,
            checkInDate: checkInDate,
            price: price,
            yield: yieldPercent,
            isActive: true,
            isUsed: false
        });
emit NightPassMinted(tokenId, to, hotelName, price);
        return tokenId;
    }

    /**
     * @dev Mark a Night-Pass as used (for check-in)
     * @param tokenId Token ID of the Night-Pass
     */
    function useNightPass(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
require(!nightPasses[tokenId].isUsed, "Already used");
        
        nightPasses[tokenId].isUsed = true;
        nightPasses[tokenId].isActive = false;
        
        emit NightPassUsed(tokenId);
}

    // <-- FIX: Removed 'updateCompliance' function, moved to SelfVerifier
    // function updateCompliance(address user, bool isCompliant) public onlyOwner { ... } [DELETED]

    // <-- FIX: Added function to update the verifier address
    function setSelfVerifier(address _newVerifierAddress) public onlyOwner {
        require(_newVerifierAddress != address(0), "Invalid verifier address");
        selfVerifier = ISelfVerifier(_newVerifierAddress);
        emit SelfVerifierUpdated(_newVerifierAddress);
    }

    // <-- FIX: Added public view function for compliance check
    /**
     * @dev Public check if an address is compliant
     */
    function isCompliant(address user) public view returns (bool) {
        return selfVerifier.isVerified(user);
    }

    /**
     * @dev Override _update for ERC721Enumerable
     */
    // <-- FIX: This is the CORE of ERC-3643.
    // We override _update to enforce compliance on EVERY transfer.
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Check 'from' address (unless it's a mint)
        if (from != address(0)) {
            require(isCompliant(from), "NightPassNFT: Sender is not compliant");
        }

        // Check 'to' address (unless it's a burn)
        if (to != address(0)) {
            require(isCompliant(to), "NightPassNFT: Recipient is not compliant");
        }
        
        return super._update(to, tokenId, auth);
}
    
    /**
     * @dev Override _increaseBalance for ERC721Enumerable
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
}

    /**
     * @dev Get Night-Pass details
     */
    function getNightPass(uint256 tokenId) public view returns (NightPass memory) {
        return nightPasses[tokenId];
}

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
}
}
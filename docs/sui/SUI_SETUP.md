# StayFi Sui Contract - Setup & Deployment Guide

## Overview

StayFi on Sui includes three main modules:

1. **hotel_nft.move** - Core NFT and hotel profile management
2. **stayfi_marketplace.move** - Listing, buying, and trading hotel passes

## Prerequisites

- Sui CLI installed ([Installation Guide](https://docs.sui.io/guides/developer))
- Sui wallet with testnet SUI tokens
- A code editor (VS Code recommended)

## Project Structure

```
move/
├── sources/
│   ├── hotel_nft.move          # Main NFT and rental logic
│   └── stayfi_marketplace.move # Marketplace functionality
└── Move.toml                   # Package manifest
```

## Setup Instructions

### 1. Initialize Sui Project

```bash
cd /Users/alichen/Desktop/StayFi/move
sui move build
```

### 2. Build the Project

```bash
sui move build
```

Expected output: Successful compilation with no errors

### 3. Deploy to Testnet

```bash
# Set to testnet
export SUI_ENV=testnet

# Publish the package
sui client publish --gas-budget 100000
```

Save the Package ID from the output for later use.

## Core Concepts

### Hotel Profile

Hotel owners must create a profile first:

```move
public fun create_hotel_profile(
    hotel_name: vector<u8>,     // Hotel name
    royalty_bp: u64,             // Royalty in basis points (max 10,000)
    ctx: &mut TxContext
)
```

**Example**: 250 basis points = 2.5% royalty

### Minting Hotel NFTs

```move
public fun mint_hotel_nft(
    hotel_profile: &mut HotelProfile,
    room_type: vector<u8>,
    check_in_date: u64,
    check_out_date: u64,
    guest_name: vector<u8>,
    price_paid: u64,
    rental_price_per_day: u64,
    ctx: &mut TxContext
): HotelNFT
```

### Rental System

**Start rental:**
```move
public fun rent_nft(
    nft: &mut HotelNFT,
    duration_days: u64,
    payment: Coin<SUI>,
    hotel_profile: &mut HotelProfile,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**End rental (after expiry):**
```move
public fun end_rental(
    nft: &mut HotelNFT,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### Marketplace Features

**List for sale:**
```move
public fun list_nft(
    marketplace: &mut Marketplace,
    nft: &mut HotelNFT,
    price: u64,
    ctx: &mut TxContext
)
```

**Buy directly:**
```move
public fun buy_nft(
    marketplace: &mut Marketplace,
    nft: &mut HotelNFT,
    payment: Coin<SUI>,
    ctx: &mut TxContext
)
```

**Make offer:**
```move
public fun make_offer(
    nft: &mut HotelNFT,
    price: u64,
    expires_at: u64,
    ctx: &mut TxContext
)
```

## Key Features

### ✅ NFT Management
- Create hotel profiles with customizable royalties
- Mint time-bound hotel passes
- Check-in validation with timestamp checks
- Permanent burn functionality

### ✅ Rental System
- Daily rental pricing
- Automated royalty calculation and distribution
- Time-locked rental periods
- Dynamic field storage for rental metadata

### ✅ Marketplace
- List hotel passes for sale
- Direct purchase with automatic fee splitting
- Make/accept offers with expiry dates
- Track total marketplace volume

### ✅ Security
- Authorization checks on all sensitive operations
- NFT state validation before operations
- Royalty cap enforcement
- Balance verification for payments

## Common Workflows

### Workflow 1: Create and Mint NFTs

1. Hotel owner calls `create_hotel_profile()`
2. Hotel owner calls `mint_hotel_nft()` multiple times
3. Hotel passes ownership to guests or marketplace

### Workflow 2: Rental

1. Renter calls `rent_nft()` with payment
2. Royalties automatically split to hotel owner
3. After rental period, call `end_rental()`

### Workflow 3: Trading

1. Owner calls `list_nft()` on marketplace
2. Buyer calls `buy_nft()` or `make_offer()`
3. Platform fee automatically deducted
4. Payment goes to seller

## Testing

To test transactions, use the Sui CLI:

```bash
# Check object state
sui client object <OBJECT_ID>

# View object details
sui client call --package <PACKAGE_ID> --module hotel_nft \
  --function hotel_name --args '<NFT_ID>'
```

## Error Codes

| Code | Error | Cause |
|------|-------|-------|
| 1 | E_NFT_ALREADY_USED | Attempting to use/rent already-used NFT |
| 2 | E_TRANSFER_USED_NFT | Transferring a used NFT |
| 3 | E_INVALID_DATES | Check-out date before check-in date |
| 4 | E_INSUFFICIENT_BALANCE | Not enough SUI for payment |
| 5 | E_RENTAL_PERIOD_NOT_OVER | Rental period not yet expired |
| 6 | E_UNAUTHORIZED | Caller not authorized for operation |
| 7 | E_INVALID_RENTAL_DURATION | Invalid rental duration |
| 8 | E_NOT_RENTING | NFT not currently being rented |
| 9 | E_ROYALTY_TOO_HIGH | Royalty exceeds max basis points |

## Gas Considerations

- Minting: ~0.5-1.5 SUI
- Rental: ~1-2 SUI
- Marketplace listing: ~0.5-1 SUI
- Marketplace purchase: ~1-2 SUI

## Next Steps

1. Deploy to testnet
2. Test core workflows
3. Integrate with frontend
4. Deploy to mainnet with proper configuration

## Support

For issues or questions, refer to:
- [Sui Documentation](https://docs.sui.io)
- [Move Language Book](https://move-language.github.io/move/)

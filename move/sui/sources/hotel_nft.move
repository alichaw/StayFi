// Copyright (c) StayFi, Inc.
// SPDX-License-Identifier: Apache-2.0

module stayfi::hotel_nft {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::Clock;

    // Error codes
    const E_NFT_ALREADY_USED: u64 = 1;
    const E_TRANSFER_USED_NFT: u64 = 2;
    const E_INVALID_DATES: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_RENTAL_PERIOD_NOT_OVER: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;
    const E_INVALID_RENTAL_DURATION: u64 = 7;
    const E_ROYALTY_TOO_HIGH: u64 = 8;

    const SECONDS_IN_A_DAY: u64 = 86400;
    const MAX_BASIS_POINTS: u16 = 10_000;

    struct HotelNFT has key, store {
        id: UID,
        hotel_name: String,
        room_type: String,
        check_in_date: u64,
        check_out_date: u64,
        guest_name: String,
        price_paid: u64,
        is_used: bool,
        hotel_id: address,
        rental_price_per_day: u64,
        is_available_for_rental: bool,
    }

    struct HotelProfile has key, store {
        id: UID,
        hotel_name: String,
        owner: address,
        royalty_bp: u64,
        balance: Balance<SUI>,
        nfts_minted: u64,
    }

    // Events
    struct NFTMinted has copy, drop {
        nft_id: address,
        hotel_name: String,
        guest: address,
        hotel_id: address,
    }

    struct NFTUsed has copy, drop {
        nft_id: address,
    }

    struct NFTBurned has copy, drop {
        nft_id: address,
        hotel_name: String,
    }

    struct NFTTransferred has copy, drop {
        nft_id: address,
        from: address,
        to: address,
    }

    struct RentalStarted has copy, drop {
        nft_id: address,
        renter: address,
        rental_start: u64,
        rental_end: u64,
        total_paid: u64,
    }

    struct RentalEnded has copy, drop {
        nft_id: address,
        renter: address,
    }

    struct HotelProfileCreated has copy, drop {
        hotel_id: address,
        owner: address,
        hotel_name: String,
    }

    public fun create_hotel_profile(
        hotel_name: vector<u8>,
        royalty_bp: u64,
        ctx: &mut TxContext
    ) {
        assert!(royalty_bp <= (MAX_BASIS_POINTS as u64), E_ROYALTY_TOO_HIGH);
        
        let hotel_profile = HotelProfile {
            id: object::new(ctx),
            hotel_name: string::utf8(hotel_name),
            owner: tx_context::sender(ctx),
            royalty_bp,
            balance: balance::zero<SUI>(),
            nfts_minted: 0,
        };

        let hotel_id = object::uid_to_address(&hotel_profile.id);
        
        event::emit(HotelProfileCreated {
            hotel_id,
            owner: tx_context::sender(ctx),
            hotel_name: string::utf8(hotel_name),
        });

        transfer::share_object(hotel_profile);
    }

    public fun mint_hotel_nft(
        hotel_profile: &mut HotelProfile,
        room_type: vector<u8>,
        check_in_date: u64,
        check_out_date: u64,
        guest_name: vector<u8>,
        price_paid: u64,
        rental_price_per_day: u64,
        ctx: &mut TxContext
    ): HotelNFT {
        assert!(hotel_profile.owner == tx_context::sender(ctx), E_UNAUTHORIZED);
        assert!(check_in_date < check_out_date, E_INVALID_DATES);

        hotel_profile.nfts_minted = hotel_profile.nfts_minted + 1;

        let nft = HotelNFT {
            id: object::new(ctx),
            hotel_name: hotel_profile.hotel_name,
            room_type: string::utf8(room_type),
            check_in_date,
            check_out_date,
            guest_name: string::utf8(guest_name),
            price_paid,
            is_used: false,
            hotel_id: object::uid_to_address(&hotel_profile.id),
            rental_price_per_day,
            is_available_for_rental: true,
        };

        event::emit(NFTMinted {
            nft_id: object::uid_to_address(&nft.id),
            hotel_name: nft.hotel_name,
            guest: tx_context::sender(ctx),
            hotel_id: nft.hotel_id,
        });

        nft
    }

    public fun use_nft(nft: &mut HotelNFT) {
        assert!(!nft.is_used, E_NFT_ALREADY_USED);
        nft.is_used = true;

        event::emit(NFTUsed {
            nft_id: object::uid_to_address(&nft.id),
        });
    }

    public fun transfer_nft(nft: HotelNFT, recipient: address, ctx: &mut TxContext) {
        assert!(!nft.is_used, E_TRANSFER_USED_NFT);
        
        event::emit(NFTTransferred {
            nft_id: object::uid_to_address(&nft.id),
            from: tx_context::sender(ctx),
            to: recipient,
        });

        transfer::public_transfer(nft, recipient);
    }

    public fun burn_nft(nft: HotelNFT) {
        let HotelNFT {
            id,
            hotel_name,
            room_type: _,
            check_in_date: _,
            check_out_date: _,
            guest_name: _,
            price_paid: _,
            is_used: _,
            hotel_id: _,
            rental_price_per_day: _,
            is_available_for_rental: _,
        } = nft;

        event::emit(NFTBurned {
            nft_id: object::uid_to_address(&id),
            hotel_name,
        });

        object::delete(id);
    }

    // === Getters ===
    public fun hotel_name(nft: &HotelNFT): String {
        nft.hotel_name
    }

    public fun room_type(nft: &HotelNFT): String {
        nft.room_type
    }

    public fun check_in_date(nft: &HotelNFT): u64 {
        nft.check_in_date
    }

    public fun check_out_date(nft: &HotelNFT): u64 {
        nft.check_out_date
    }

    public fun guest_name(nft: &HotelNFT): String {
        nft.guest_name
    }

    public fun price_paid(nft: &HotelNFT): u64 {
        nft.price_paid
    }

    public fun is_used(nft: &HotelNFT): bool {
        nft.is_used
    }

    public fun nft_id(nft: &HotelNFT): address {
        object::uid_to_address(&nft.id)
    }

    public fun hotel_id(nft: &HotelNFT): address {
        nft.hotel_id
    }

    public fun rental_price_per_day(nft: &HotelNFT): u64 {
        nft.rental_price_per_day
    }

    public fun is_available_for_rental(nft: &HotelNFT): bool {
        nft.is_available_for_rental
    }

    public fun is_valid_for_checkin(nft: &HotelNFT, current_timestamp: u64): bool {
        !nft.is_used && current_timestamp >= nft.check_in_date && current_timestamp <= nft.check_out_date
    }

    public fun get_hotel_profile_info(profile: &HotelProfile): (String, address, u64, u64) {
        (profile.hotel_name, profile.owner, profile.royalty_bp, profile.nfts_minted)
    }

    public fun get_hotel_balance(profile: &HotelProfile): u64 {
        balance::value(&profile.balance)
    }

    public fun withdraw_royalties(
        profile: &mut HotelProfile,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(profile.owner == tx_context::sender(ctx), E_UNAUTHORIZED);
        assert!(balance::value(&profile.balance) >= amount, E_INSUFFICIENT_BALANCE);
        
        coin::from_balance(balance::split(&mut profile.balance, amount), ctx)
    }
}

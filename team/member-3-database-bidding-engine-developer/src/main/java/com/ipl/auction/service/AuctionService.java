package com.ipl.auction.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Auction;
import com.ipl.auction.model.Auction.AuctionStatus;
import com.ipl.auction.model.Player;
import com.ipl.auction.repository.AuctionRepository;
import com.ipl.auction.repository.PlayerRepository;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;

    public AuctionService(AuctionRepository auctionRepository, PlayerRepository playerRepository) {
        this.auctionRepository = auctionRepository;
        this.playerRepository = playerRepository;
    }

    public Optional<Auction> getActiveAuction() {
        return auctionRepository.findByStatus(AuctionStatus.LIVE);
    }

    @Transactional
    public Auction setActivePlayer(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        // Mark all currently LIVE auctions as COMPLETED
        List<Auction> allAuctions = auctionRepository.findAll();
        for (Auction a : allAuctions) {
            if (a.getStatus() == AuctionStatus.LIVE) {
                a.setStatus(AuctionStatus.COMPLETED);
                auctionRepository.save(a);
            }
        }

        // Check if there is an existing auction record for this player, or create new
        Auction activeAuction = allAuctions.stream()
                .filter(a -> a.getPlayer() != null && a.getPlayer().getId().equals(playerId))
                .findFirst()
                .orElseGet(() -> {
                    Auction a = new Auction();
                    a.setPlayer(player);
                    return a;
                });

        activeAuction.setStatus(AuctionStatus.LIVE);
        activeAuction.setCurrentBid(player.getBasePrice());
        activeAuction.setHighestBidder(player.getTeam());

        return auctionRepository.save(activeAuction);
    }
}

package com.ipl.auction.service;

<<<<<<< HEAD
import java.util.List;
import java.util.Optional;

=======
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.messaging.simp.SimpMessagingTemplate;
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Auction;
import com.ipl.auction.model.Auction.AuctionStatus;
import com.ipl.auction.model.Player;
<<<<<<< HEAD
=======
import com.ipl.auction.model.Team;
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
import com.ipl.auction.repository.AuctionRepository;
import com.ipl.auction.repository.PlayerRepository;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;
<<<<<<< HEAD

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
=======
    private final SimpMessagingTemplate messagingTemplate;

    public AuctionService(
            AuctionRepository auctionRepository,
            PlayerRepository playerRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.auctionRepository = auctionRepository;
        this.playerRepository = playerRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Auction getActiveAuction() {
        Optional<Auction> existing = auctionRepository.findFirstByOrderByIdDesc();
        if (existing.isPresent()) {
            return existing.get();
        }

        // Initialize with first player
        List<Player> players = playerRepository.findAll();
        if (players.isEmpty()) {
            return null;
        }

        Auction auction = new Auction();
        auction.setPlayer(players.get(0));
        auction.setCurrentBid(players.get(0).getBasePrice());
        auction.setStatus(AuctionStatus.WAITING);
        auction.setTimerSeconds(15);
        return auctionRepository.save(auction);
    }

    @Transactional
    public Auction setCurrentPlayer(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        Auction auction = getActiveAuction();
        if (auction == null) {
            auction = new Auction();
        }

        auction.setPlayer(player);
        auction.setHighestBidder(null);
        auction.setCurrentBid(player.getBasePrice());
        auction.setStatus(player.getStatus() == Player.PlayerStatus.SOLD ? AuctionStatus.SOLD : AuctionStatus.WAITING);
        auction.setTimerSeconds(15);
        auction.setRoundEndTime(LocalDateTime.now().plusSeconds(15));

        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
        return saved;
    }

    @Transactional
    public Auction nextPlayer() {
        List<Player> players = playerRepository.findAll();
        if (players.isEmpty()) return null;

        Auction active = getActiveAuction();
        int currentIndex = 0;
        if (active != null && active.getPlayer() != null) {
            for (int i = 0; i < players.size(); i++) {
                if (players.get(i).getId().equals(active.getPlayer().getId())) {
                    currentIndex = i;
                    break;
                }
            }
        }

        int nextIndex = (currentIndex + 1) % players.size();
        return setCurrentPlayer(players.get(nextIndex).getId());
    }

    @Transactional
    public Auction previousPlayer() {
        List<Player> players = playerRepository.findAll();
        if (players.isEmpty()) return null;

        Auction active = getActiveAuction();
        int currentIndex = 0;
        if (active != null && active.getPlayer() != null) {
            for (int i = 0; i < players.size(); i++) {
                if (players.get(i).getId().equals(active.getPlayer().getId())) {
                    currentIndex = i;
                    break;
                }
            }
        }

        int prevIndex = (currentIndex - 1 + players.size()) % players.size();
        return setCurrentPlayer(players.get(prevIndex).getId());
    }

    @Transactional
    public void recordBid(Player player, Team team, BigDecimal amount) {
        Auction auction = getActiveAuction();
        if (auction == null) {
            auction = new Auction();
        }

        auction.setPlayer(player);
        auction.setHighestBidder(team);
        auction.setCurrentBid(amount);
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerSeconds(15);
        auction.setRoundEndTime(LocalDateTime.now().plusSeconds(15));

        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
    }

    @Transactional
    public void recordSold(Player player, Team team, BigDecimal finalPrice) {
        Auction auction = getActiveAuction();
        if (auction != null) {
            auction.setPlayer(player);
            auction.setHighestBidder(team);
            auction.setCurrentBid(finalPrice);
            auction.setStatus(AuctionStatus.SOLD);
            auction.setTimerSeconds(0);
            Auction saved = auctionRepository.save(auction);
            broadcastAuctionState(saved);
        }
    }

    @Transactional
    public void recordUnsold(Player player) {
        Auction auction = getActiveAuction();
        if (auction != null) {
            auction.setPlayer(player);
            auction.setHighestBidder(null);
            auction.setCurrentBid(player.getBasePrice());
            auction.setStatus(AuctionStatus.UNSOLD);
            auction.setTimerSeconds(0);
            Auction saved = auctionRepository.save(auction);
            broadcastAuctionState(saved);
        }
    }

    public void broadcastAuctionState(Auction auction) {
        messagingTemplate.convertAndSend("/topic/auction-state", auction);
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
    }
}

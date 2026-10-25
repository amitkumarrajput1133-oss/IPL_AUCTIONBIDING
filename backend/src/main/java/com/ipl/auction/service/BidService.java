package com.ipl.auction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Auction;
import com.ipl.auction.model.Auction.AuctionStatus;
import com.ipl.auction.model.Bid;
import com.ipl.auction.model.Player;
import com.ipl.auction.model.Player.PlayerStatus;
import com.ipl.auction.model.Team;
import com.ipl.auction.repository.AuctionRepository;
import com.ipl.auction.repository.BidRepository;
import com.ipl.auction.repository.PlayerRepository;
import com.ipl.auction.repository.TeamRepository;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionService auctionService;

    public BidService(
            BidRepository bidRepository,
            PlayerRepository playerRepository,
            TeamRepository teamRepository,
            AuctionRepository auctionRepository,
            AuctionService auctionService) {
        this.bidRepository = bidRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.auctionRepository = auctionRepository;
        this.auctionService = auctionService;
    }

    @Transactional
    public Bid placeBid(Long playerId, Long teamId, BigDecimal amount) {
        Player player = playerRepository.findByIdForUpdate(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));
        Team team = teamRepository.findByIdForUpdate(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));

        if (player.getStatus() == PlayerStatus.SOLD) {
            throw new RuntimeException("Bidding is closed! This player is already SOLD.");
        }

        // Stage Lock Rule: Bidding is only permitted on the active player lot selected by the Admin
        Optional<Auction> liveAuctionOpt = auctionRepository.findByStatus(AuctionStatus.LIVE);
        if (liveAuctionOpt.isPresent()) {
            Auction liveAuction = liveAuctionOpt.get();
            if (liveAuction.getPlayer() != null && !liveAuction.getPlayer().getId().equals(playerId)) {
                throw new RuntimeException("Bidding locked! Only the active lot (" + liveAuction.getPlayer().getName() + ") can receive bids.");
            }
        }

        BigDecimal currentBudget = team.getBudget() != null ? team.getBudget() : BigDecimal.ZERO;

        // Rule 1: Check team budget
        if (currentBudget.compareTo(amount) < 0) {
            throw new RuntimeException(team.getName() + " does not have sufficient budget for this bid!");
        }

        // Rule 2: Fetch existing bids for this player
        List<Bid> existingBids = bidRepository.findByPlayerIdOrderByAmountDesc(playerId);
        if (!existingBids.isEmpty()) {
            Bid highestBid = existingBids.get(0);

            // Rule 2a: Prevent consecutive bids by the same team
            if (highestBid.getTeam().getId().equals(teamId)) {
                throw new RuntimeException(team.getName() + " already holds the highest bid!");
            }

            // Rule 2b: Ensure the new bid is higher than current highest bid
            if (amount.compareTo(highestBid.getAmount()) <= 0) {
                throw new RuntimeException("Bid must be higher than current highest bid of ₹" + highestBid.getAmount());
            }
        } else {
            // Rule 2c: If first bid, ensure it is at least the player's base price
            if (amount.compareTo(player.getBasePrice()) < 0) {
                throw new RuntimeException("First bid must be at least the base price of ₹" + player.getBasePrice());
            }
        }

        // Persist new bid
        Bid bid = new Bid();
        bid.setPlayer(player);
        bid.setTeam(team);
        bid.setAmount(amount);
        bid.setBidTime(LocalDateTime.now());
        Bid savedBid = bidRepository.save(bid);

        // Update active auction session & broadcast synchronized state
        auctionService.recordBid(player, team, amount);

        return savedBid;
    }

    @Transactional
    public Player resetBidsForPlayer(Long playerId) {
        Player player = playerRepository.findByIdForUpdate(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // If player was previously sold and assigned to a team, refund the team's purse
        if (player.getStatus() == PlayerStatus.SOLD && player.getTeam() != null) {
            Team team = teamRepository.findByIdForUpdate(player.getTeam().getId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            BigDecimal refundAmount = player.getBasePrice() != null ? player.getBasePrice() : BigDecimal.ZERO;
            BigDecimal currentBudget = team.getBudget() != null ? team.getBudget() : BigDecimal.ZERO;
            team.setBudget(currentBudget.add(refundAmount));
            teamRepository.save(team);
        }

        // Wipe all bid records for this player
        bidRepository.deleteByPlayerId(playerId);

        // Reset player state to UNSOLD, clear team allocation, and revert price to originalBasePrice
        player.setTeam(null);
        player.setStatus(PlayerStatus.UNSOLD);
        BigDecimal original = player.getOriginalBasePrice() != null ? player.getOriginalBasePrice() : player.getBasePrice();
        player.setBasePrice(original);

        return playerRepository.save(player);
    }

    public Optional<Bid> getHighestBidForPlayer(Long playerId) {
        List<Bid> bids = bidRepository.findByPlayerIdOrderByAmountDesc(playerId);
        return bids.isEmpty() ? Optional.empty() : Optional.of(bids.get(0));
    }
}
package com.ipl.auction.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Bid;
import com.ipl.auction.model.Player;
import com.ipl.auction.model.Player.PlayerStatus;
import com.ipl.auction.model.Team;
import com.ipl.auction.repository.BidRepository;
import com.ipl.auction.repository.PlayerRepository;
import com.ipl.auction.repository.TeamRepository;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final BidRepository bidRepository;
    private final AuctionService auctionService;

    public PlayerService(
            PlayerRepository playerRepository,
            TeamRepository teamRepository,
            BidRepository bidRepository,
            AuctionService auctionService) {
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.bidRepository = bidRepository;
        this.auctionService = auctionService;
    }

    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public Optional<Player> getPlayerById(Long id) {
        return playerRepository.findById(id);
    }

    @Transactional
    public Player createPlayer(Player player) {
        if (player.getOriginalBasePrice() == null) {
            player.setOriginalBasePrice(player.getBasePrice());
        }
        if (player.getStatus() == null) {
            player.setStatus(PlayerStatus.UNSOLD);
        }
        return playerRepository.save(player);
    }

    @Transactional
    public Player updatePlayer(Long id, Player playerDetails) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));
        player.setName(playerDetails.getName());
        player.setRole(playerDetails.getRole());
        player.setBasePrice(playerDetails.getBasePrice());
        player.setStatus(playerDetails.getStatus());
        player.setCountry(playerDetails.getCountry());
        player.setOverseas(playerDetails.isOverseas());
        if (playerDetails.getTeam() != null) {
            player.setTeam(playerDetails.getTeam());
        }
        return playerRepository.save(player);
    }

    @Transactional
    public void deletePlayer(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));
        playerRepository.delete(player);
    }

    @Transactional
    public Player sellPlayer(Long playerId, Long requestedTeamId, BigDecimal requestedFinalPrice) {
        Player player = playerRepository.findByIdForUpdate(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        // Server-side source of truth: retrieve the highest bid recorded in BidRepository
        List<Bid> bids = bidRepository.findByPlayerIdOrderByAmountDesc(playerId);
        if (bids.isEmpty()) {
            throw new RuntimeException("Cannot sell player with no bids placed!");
        }

        Bid highestBid = bids.get(0);
        Team winningTeam = highestBid.getTeam();
        BigDecimal winningPrice = highestBid.getAmount();

        Team team = teamRepository.findByIdForUpdate(winningTeam.getId())
                .orElseThrow(() -> new RuntimeException("Winning team not found with id: " + winningTeam.getId()));

        BigDecimal teamBudget = team.getBudget() != null ? team.getBudget() : BigDecimal.ZERO;
        if (teamBudget.compareTo(winningPrice) < 0) {
            throw new RuntimeException("Winning team does not have sufficient budget!");
        }

        long currentSquadSize = playerRepository.countByTeamId(team.getId());
        if (currentSquadSize >= 25) {
            throw new RuntimeException("Team has already reached the maximum squad limit of 25 players!");
        }

        if (player.isOverseas()) {
            long overseasCount = playerRepository.countByTeamIdAndOverseasTrue(team.getId());
            if (overseasCount >= 8) {
                throw new RuntimeException("Team has already reached the maximum limit of 8 overseas players!");
            }
        }

        // Deduct budget
        team.setBudget(teamBudget.subtract(winningPrice));
        teamRepository.save(team);

        // Assign player to team & mark SOLD (do NOT mutate base price)
        player.setTeam(team);
        player.setStatus(PlayerStatus.SOLD);
        Player saved = playerRepository.save(player);

        // Update synchronized auction state
        auctionService.recordSold(saved, team, winningPrice);

        return saved;
    }

    @Transactional
    public Player markUnsold(Long playerId) {
        Player player = playerRepository.findByIdForUpdate(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        // If previously sold, refund the winning team
        if (player.getStatus() == PlayerStatus.SOLD && player.getTeam() != null) {
            Team team = teamRepository.findByIdForUpdate(player.getTeam().getId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            List<Bid> bids = bidRepository.findByPlayerIdOrderByAmountDesc(playerId);
            BigDecimal refundAmount = !bids.isEmpty() ? bids.get(0).getAmount() : player.getBasePrice();
            team.setBudget(team.getBudget().add(refundAmount));
            teamRepository.save(team);
        }

        // Delete all recorded bids for this player
        bidRepository.deleteByPlayerId(playerId);

        player.setTeam(null);
        player.setStatus(PlayerStatus.UNSOLD);
        BigDecimal original = player.getOriginalBasePrice() != null ? player.getOriginalBasePrice() : player.getBasePrice();
        player.setBasePrice(original);

        Player saved = playerRepository.save(player);

        auctionService.recordUnsold(saved);

        return saved;
    }
}
package com.ipl.auction.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Auction;
import com.ipl.auction.model.Auction.AuctionStatus;
import com.ipl.auction.model.Player;
import com.ipl.auction.model.Team;
import com.ipl.auction.repository.AuctionRepository;
import com.ipl.auction.repository.PlayerRepository;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;
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
        // Timer is frozen until Admin explicitly calls startTimer
        auction.setTimerSeconds(15);
        auction.setRemainingMillis(15000L);
        auction.setEndTimeMillis(null);
        auction.setTimerRunning(false);

        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
        broadcastActivePlayer(saved);
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
        // Reset timer to 15s with synchronized epoch end time
        long now = System.currentTimeMillis();
        auction.setEndTimeMillis(now + 15000L);
        auction.setRemainingMillis(15000L);
        auction.setTimerSeconds(15);
        auction.setTimerRunning(true);

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
            auction.setRemainingMillis(0L);
            auction.setEndTimeMillis(null);
            auction.setTimerRunning(false);
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
            auction.setRemainingMillis(0L);
            auction.setEndTimeMillis(null);
            auction.setTimerRunning(false);
            Auction saved = auctionRepository.save(auction);
            broadcastAuctionState(saved);
        }
    }

    // Admin explicitly starts/resumes the countdown timer
    @Transactional
    public Auction startTimer(Integer remainingSeconds) {
        Auction auction = getActiveAuction();
        if (auction == null) throw new RuntimeException("No active auction");
        if (auction.getStatus() == AuctionStatus.SOLD || auction.getStatus() == AuctionStatus.UNSOLD) {
            throw new RuntimeException("Cannot start timer: auction is already finalized");
        }
        long remaining = 15000L;
        if (remainingSeconds != null && remainingSeconds > 0 && remainingSeconds <= 15) {
            remaining = remainingSeconds * 1000L;
        } else if (auction.getRemainingMillis() != null && auction.getRemainingMillis() > 100 && auction.getRemainingMillis() <= 15000L) {
            remaining = auction.getRemainingMillis();
        } else if (auction.getTimerSeconds() != null && auction.getTimerSeconds() > 0 && auction.getTimerSeconds() <= 15) {
            remaining = auction.getTimerSeconds() * 1000L;
        }
        long now = System.currentTimeMillis();
        auction.setEndTimeMillis(now + remaining);
        auction.setRemainingMillis(remaining);
        auction.setTimerSeconds((int) Math.ceil(remaining / 1000.0));
        auction.setTimerRunning(true);
        auction.setStatus(AuctionStatus.LIVE);
        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
        return saved;
    }

    public Auction startTimer() {
        return startTimer(null);
    }

    @Transactional
    public Auction pauseTimer(Integer remainingSeconds) {
        Auction auction = getActiveAuction();
        if (auction == null) throw new RuntimeException("No active auction");
        long now = System.currentTimeMillis();
        long remaining = 15000L;
        if (auction.getEndTimeMillis() != null && auction.getEndTimeMillis() > now) {
            remaining = auction.getEndTimeMillis() - now;
        } else if (remainingSeconds != null && remainingSeconds > 0 && remainingSeconds <= 15) {
            remaining = remainingSeconds * 1000L;
        } else if (auction.getRemainingMillis() != null) {
            remaining = auction.getRemainingMillis();
        }
        remaining = Math.max(0L, Math.min(15000L, remaining));
        auction.setEndTimeMillis(null);
        auction.setRemainingMillis(remaining);
        auction.setTimerSeconds((int) Math.ceil(remaining / 1000.0));
        auction.setTimerRunning(false);
        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
        return saved;
    }

    public Auction pauseTimer() {
        return pauseTimer(null);
    }

    @Transactional
    public Auction resetTimer() {
        Auction auction = getActiveAuction();
        if (auction == null) throw new RuntimeException("No active auction");
        if (auction.getStatus() == AuctionStatus.SOLD || auction.getStatus() == AuctionStatus.UNSOLD) {
            throw new RuntimeException("Cannot reset timer: auction is already finalized");
        }
        auction.setEndTimeMillis(null);
        auction.setRemainingMillis(15000L);
        auction.setTimerSeconds(15);
        auction.setTimerRunning(false);
        Auction saved = auctionRepository.save(auction);
        broadcastAuctionState(saved);
        return saved;
    }

    // Server-side tick: checks expiration every 250ms with sub-second accuracy
    @Scheduled(fixedRate = 250)
    @Transactional
    public void timerTick() {
        Optional<Auction> opt = auctionRepository.findFirstByOrderByIdDesc();
        if (opt.isEmpty()) return;
        Auction auction = opt.get();
        if (!auction.isTimerRunning() || auction.getEndTimeMillis() == null) return;

        long now = System.currentTimeMillis();
        long diff = auction.getEndTimeMillis() - now;

        if (diff <= 0) {
            auction.setTimerSeconds(0);
            auction.setRemainingMillis(0L);
            auction.setEndTimeMillis(null);
            auction.setTimerRunning(false);
            // Auto-mark UNSOLD if nobody has bid yet, else leave for Admin to hammer
            if (auction.getHighestBidder() == null) {
                auction.setStatus(AuctionStatus.UNSOLD);
                if (auction.getPlayer() != null && auction.getPlayer().getStatus() != Player.PlayerStatus.SOLD) {
                    Player p = auction.getPlayer();
                    p.setStatus(Player.PlayerStatus.UNSOLD);
                    playerRepository.save(p);
                    messagingTemplate.convertAndSend("/topic/players", p);
                }
            }
            Auction saved = auctionRepository.save(auction);
            broadcastAuctionState(saved);
        }
    }

    public void broadcastAuctionState(Auction auction) {
        messagingTemplate.convertAndSend("/topic/auction-state", auction);
    }

    public void broadcastActivePlayer(Auction auction) {
        if (auction != null && auction.getPlayer() != null) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("activePlayerId", auction.getPlayer().getId());
            payload.put("player", auction.getPlayer());
            payload.put("currentBid", auction.getCurrentBid() != null ? auction.getCurrentBid() : auction.getPlayer().getBasePrice());
            payload.put("status", auction.getStatus().name());
            payload.put("timerRunning", auction.isTimerRunning());
            payload.put("timerSeconds", auction.getTimerSeconds());
            payload.put("endTimeMillis", auction.getEndTimeMillis());
            payload.put("remainingMillis", auction.getRemainingMillis());
            payload.put("serverTime", System.currentTimeMillis());
            payload.put("message", "Auction stage set to " + auction.getPlayer().getName());
            messagingTemplate.convertAndSend("/topic/auction/active", (Object) payload);
        }
    }
}

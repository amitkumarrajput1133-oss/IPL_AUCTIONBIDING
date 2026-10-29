package com.ipl.auction.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "auctions")
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne
    @JoinColumn(name = "highest_bidder_team_id")
    private Team highestBidder;

    private BigDecimal currentBid;

    @Enumerated(EnumType.STRING)
    private AuctionStatus status = AuctionStatus.WAITING;

    private Integer timerSeconds = 15;

    private boolean timerRunning = false;

    private LocalDateTime roundEndTime;

    private Long endTimeMillis;

    private Long remainingMillis = 15000L;

    @Version
    private Long version;

    public enum AuctionStatus {
        WAITING, LIVE, SOLD, UNSOLD
    }

    public Auction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Player getPlayer() { return player; }
    public void setPlayer(Player player) { this.player = player; }

    public Team getHighestBidder() { return highestBidder; }
    public void setHighestBidder(Team highestBidder) { this.highestBidder = highestBidder; }

    public BigDecimal getCurrentBid() { return currentBid; }
    public void setCurrentBid(BigDecimal currentBid) { this.currentBid = currentBid; }

    public AuctionStatus getStatus() { return status; }
    public void setStatus(AuctionStatus status) { this.status = status; }

    public Integer getTimerSeconds() { return timerSeconds; }
    public void setTimerSeconds(Integer timerSeconds) { this.timerSeconds = timerSeconds; }

    public boolean isTimerRunning() { return timerRunning; }
    public void setTimerRunning(boolean timerRunning) { this.timerRunning = timerRunning; }

    public LocalDateTime getRoundEndTime() { return roundEndTime; }
    public void setRoundEndTime(LocalDateTime roundEndTime) { this.roundEndTime = roundEndTime; }

    public Long getEndTimeMillis() { return endTimeMillis; }
    public void setEndTimeMillis(Long endTimeMillis) { this.endTimeMillis = endTimeMillis; }

    public Long getRemainingMillis() { return remainingMillis; }
    public void setRemainingMillis(Long remainingMillis) { this.remainingMillis = remainingMillis; }

    @Transient
    public Long getServerTime() {
        return System.currentTimeMillis();
    }

    public Long getVersion() { return version; }
}
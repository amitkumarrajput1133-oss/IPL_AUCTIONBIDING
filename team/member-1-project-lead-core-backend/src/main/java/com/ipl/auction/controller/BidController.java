package com.ipl.auction.controller;

import com.ipl.auction.config.TokenUtil;
import com.ipl.auction.dto.PlaceBidRequest;
import com.ipl.auction.model.Bid;
import com.ipl.auction.service.BidService;
import com.ipl.auction.model.Player;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bids")
@CrossOrigin(origins = "*")
public class BidController {

    private final BidService bidService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TokenUtil tokenUtil;

    public BidController(BidService bidService, SimpMessagingTemplate messagingTemplate, TokenUtil tokenUtil) {
        this.bidService = bidService;
        this.messagingTemplate = messagingTemplate;
        this.tokenUtil = tokenUtil;
    }

    @PostMapping
    public ResponseEntity<?> placeBid(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody PlaceBidRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid authorization token"));
        }

        String token = authHeader.substring(7);
        TokenUtil.UserTokenState tokenState = tokenUtil.validateToken(token);
        if (tokenState == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        // Rule 1: Only TEAM_OWNER or ADMIN can place bids
        if (!"TEAM_OWNER".equals(tokenState.getRole()) && !"ADMIN".equals(tokenState.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only team owners or auctioneers can place bids"));
        }

        // Rule 2: TEAM_OWNER cannot place bids on behalf of another franchise
        if ("TEAM_OWNER".equals(tokenState.getRole()) && !tokenState.getTeamId().equals(request.getTeamId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You cannot place a bid on behalf of another team!"));
        }

        Bid bid = bidService.placeBid(request.getPlayerId(), request.getTeamId(), request.getAmount());

        // Broadcast real-time update to all connected team devices
        messagingTemplate.convertAndSend("/topic/bids", bid);

        return ResponseEntity.ok(bid);
    }

    @PostMapping("/player/{playerId}/reset")
    public ResponseEntity<?> resetPlayerBids(
            @PathVariable Long playerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return handleReset(playerId, authHeader);
    }

    @DeleteMapping("/player/{playerId}")
    public ResponseEntity<?> deletePlayerBids(
            @PathVariable Long playerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return handleReset(playerId, authHeader);
    }

    private ResponseEntity<?> handleReset(Long playerId, String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid authorization token"));
        }

        String token = authHeader.substring(7);
        TokenUtil.UserTokenState tokenState = tokenUtil.validateToken(token);
        if (tokenState == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        // Only ADMIN (Auctioneer) can reset bids
        if (!"ADMIN".equals(tokenState.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the Auctioneer (Admin) can reset bids!"));
        }

        try {
            Player resetPlayer = bidService.resetBidsForPlayer(playerId);

            Map<String, Object> resetPayload = Map.of(
                    "playerId", playerId,
                    "player", resetPlayer,
                    "message", "Bids reset to base price for " + resetPlayer.getName()
            );

            // Broadcast real-time reset notifications
            messagingTemplate.convertAndSend("/topic/bids/reset", (Object) resetPayload);
            messagingTemplate.convertAndSend("/topic/players", resetPlayer);

            return ResponseEntity.ok(resetPayload);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/player/{playerId}/highest")
    public ResponseEntity<?> getHighestBid(@PathVariable Long playerId) {
        return bidService.getHighestBidForPlayer(playerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
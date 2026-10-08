package com.ipl.auction.controller;

import com.ipl.auction.config.TokenUtil;
import com.ipl.auction.model.Auction;
import com.ipl.auction.service.AuctionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auction")
@CrossOrigin(origins = "*")
public class AuctionController {

    private final AuctionService auctionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TokenUtil tokenUtil;

    public AuctionController(AuctionService auctionService, SimpMessagingTemplate messagingTemplate, TokenUtil tokenUtil) {
        this.auctionService = auctionService;
        this.messagingTemplate = messagingTemplate;
        this.tokenUtil = tokenUtil;
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveAuction() {
        return auctionService.getActiveAuction()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/active/{playerId}")
    public ResponseEntity<?> setActivePlayer(
            @PathVariable Long playerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

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

        // Only ADMIN (Auctioneer) can switch or set the active player lot
        if (!"ADMIN".equals(tokenState.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the Auctioneer (Admin) can switch or activate player lots!"));
        }

        try {
            Auction liveAuction = auctionService.setActivePlayer(playerId);

            Map<String, Object> activeLotPayload = Map.of(
                    "activePlayerId", playerId,
                    "player", liveAuction.getPlayer(),
                    "currentBid", liveAuction.getCurrentBid() != null ? liveAuction.getCurrentBid() : liveAuction.getPlayer().getBasePrice(),
                    "status", liveAuction.getStatus().name(),
                    "message", "Auction stage set to " + liveAuction.getPlayer().getName()
            );

            // Broadcast active player stage sync to all connected devices
            messagingTemplate.convertAndSend("/topic/auction/active", (Object) activeLotPayload);

            return ResponseEntity.ok(activeLotPayload);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}

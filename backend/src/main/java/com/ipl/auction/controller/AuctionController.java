package com.ipl.auction.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ipl.auction.model.Auction;
import com.ipl.auction.service.AuctionService;

@RestController
@RequestMapping("/api/auction")
@CrossOrigin(origins = "*")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @GetMapping("/active")
    public ResponseEntity<Auction> getActiveAuction() {
        Auction auction = auctionService.getActiveAuction();
        return auction != null ? ResponseEntity.ok(auction) : ResponseEntity.noContent().build();
    }

    @PostMapping("/active/{playerId}")
    public ResponseEntity<Auction> setCurrentPlayer(@PathVariable Long playerId) {
        return ResponseEntity.ok(auctionService.setCurrentPlayer(playerId));
    }

    @PostMapping("/next")
    public ResponseEntity<Auction> nextPlayer() {
        return ResponseEntity.ok(auctionService.nextPlayer());
    }

    @PostMapping("/prev")
    public ResponseEntity<Auction> prevPlayer() {
        return ResponseEntity.ok(auctionService.previousPlayer());
    }

    @PostMapping("/start-timer")
    public ResponseEntity<Auction> startTimer(@RequestBody(required = false) Map<String, Object> body) {
        Integer seconds = null;
        if (body != null && body.containsKey("timerSeconds") && body.get("timerSeconds") != null) {
            seconds = ((Number) body.get("timerSeconds")).intValue();
        }
        return ResponseEntity.ok(auctionService.startTimer(seconds));
    }

    @PostMapping("/pause-timer")
    public ResponseEntity<Auction> pauseTimer(@RequestBody(required = false) Map<String, Object> body) {
        Integer seconds = null;
        if (body != null && body.containsKey("timerSeconds") && body.get("timerSeconds") != null) {
            seconds = ((Number) body.get("timerSeconds")).intValue();
        }
        return ResponseEntity.ok(auctionService.pauseTimer(seconds));
    }

    @PostMapping("/reset-timer")
    public ResponseEntity<Auction> resetTimer() {
        return ResponseEntity.ok(auctionService.resetTimer());
    }
}

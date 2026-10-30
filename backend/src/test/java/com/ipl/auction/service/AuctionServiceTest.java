package com.ipl.auction.service;

import com.ipl.auction.model.Auction;
import com.ipl.auction.model.Auction.AuctionStatus;
import com.ipl.auction.model.Player;
import com.ipl.auction.model.Team;
import com.ipl.auction.repository.AuctionRepository;
import com.ipl.auction.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuctionServiceTest {

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AuctionService auctionService;

    private Player player;
    private Auction auction;

    @BeforeEach
    void setUp() {
        player = new Player();
        player.setId(10L);
        player.setName("MS Dhoni");
        player.setBasePrice(new BigDecimal("20000000"));
        player.setStatus(Player.PlayerStatus.UNSOLD);

        auction = new Auction();
        auction.setId(1L);
        auction.setPlayer(player);
        auction.setCurrentBid(player.getBasePrice());
        auction.setStatus(AuctionStatus.WAITING);
        auction.setTimerSeconds(15);
        auction.setTimerRunning(false);
    }

    @Test
    void testStartTimer_FreshStart() {
        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Auction result = auctionService.startTimer(15);

        assertNotNull(result);
        assertTrue(result.isTimerRunning());
        assertEquals(15, result.getTimerSeconds());
        assertEquals(AuctionStatus.LIVE, result.getStatus());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/auction-state"), any(Auction.class));
    }

    @Test
    void testPauseTimer_FreezesRemainingSeconds() {
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerRunning(true);
        auction.setTimerSeconds(9);

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Auction result = auctionService.pauseTimer(9);

        assertNotNull(result);
        assertFalse(result.isTimerRunning());
        assertEquals(9, result.getTimerSeconds());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/auction-state"), any(Auction.class));
    }

    @Test
    void testResetTimer_Sets15SecondsAndPauses() {
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerRunning(true);
        auction.setTimerSeconds(3);

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Auction result = auctionService.resetTimer();

        assertNotNull(result);
        assertFalse(result.isTimerRunning());
        assertEquals(15, result.getTimerSeconds());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/auction-state"), any(Auction.class));
    }

    @Test
    void testRecordBid_ResetsTimerTo15Seconds() {
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerRunning(true);
        auction.setTimerSeconds(4); // Was down to 4s

        Team team = new Team();
        team.setId(1L);
        team.setName("CSK");

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        auctionService.recordBid(player, team, new BigDecimal("25000000"));

        assertEquals(15, auction.getTimerSeconds());
        assertTrue(auction.isTimerRunning());
        assertEquals(AuctionStatus.LIVE, auction.getStatus());
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/auction-state"), any(Auction.class));
    }

    @Test
    void testTimerTick_StillRunningDoesNotExpire() {
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerRunning(true);
        auction.setEndTimeMillis(System.currentTimeMillis() + 5000L);

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));

        auctionService.timerTick();

        assertTrue(auction.isTimerRunning());
        verify(auctionRepository, never()).save(any());
    }

    @Test
    void testTimerTick_ExpiresAndMarksUnsoldWhenNoBids() {
        auction.setStatus(AuctionStatus.LIVE);
        auction.setTimerRunning(true);
        auction.setEndTimeMillis(System.currentTimeMillis() - 100L); // Already past end time
        auction.setHighestBidder(null);

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> invocation.getArgument(0));

        auctionService.timerTick();

        assertEquals(0, auction.getTimerSeconds());
        assertFalse(auction.isTimerRunning());
        assertEquals(AuctionStatus.UNSOLD, auction.getStatus());
        assertEquals(Player.PlayerStatus.UNSOLD, player.getStatus());
        verify(playerRepository).save(player);
        verify(messagingTemplate).convertAndSend(eq("/topic/players"), any(Player.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/auction-state"), any(Auction.class));
    }

    @Test
    void testTimerTick_DoesNothingWhenTimerNotRunning() {
        auction.setTimerRunning(false);
        auction.setTimerSeconds(15);

        when(auctionRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.of(auction));

        auctionService.timerTick();

        verify(auctionRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Auction.class));
    }
}

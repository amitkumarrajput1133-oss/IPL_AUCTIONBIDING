package com.ipl.auction.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ipl.auction.model.Bid;
import com.ipl.auction.model.Player;
import com.ipl.auction.model.Team;
import com.ipl.auction.repository.BidRepository;
import com.ipl.auction.repository.PlayerRepository;
import com.ipl.auction.repository.TeamRepository;

@ExtendWith(MockitoExtension.class)
public class PlayerServiceTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private AuctionService auctionService;

    @InjectMocks
    private PlayerService playerService;

    private Player player;
    private Team team;

    @BeforeEach
    void setUp() {
        player = new Player();
        player.setId(1L);
        player.setName("Jasprit Bumrah");
        player.setBasePrice(new BigDecimal("20000000")); // 2 Cr
        player.setOriginalBasePrice(new BigDecimal("20000000"));
        player.setStatus(Player.PlayerStatus.UNSOLD);

        team = new Team();
        team.setId(5L);
        team.setName("Mumbai Indians");
        team.setBudget(new BigDecimal("1000000000")); // 100 Cr
    }

    @Test
    void testSellPlayer_Success() {
        BigDecimal finalPrice = new BigDecimal("80000000"); // 8 Cr

        Bid winningBid = new Bid();
        winningBid.setPlayer(player);
        winningBid.setTeam(team);
        winningBid.setAmount(finalPrice);

        when(playerRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(player));
        when(bidRepository.findByPlayerIdOrderByAmountDesc(1L)).thenReturn(Collections.singletonList(winningBid));
        when(teamRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(team));
        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Player result = playerService.sellPlayer(1L, 5L, finalPrice);

        assertNotNull(result);
        assertEquals(Player.PlayerStatus.SOLD, result.getStatus());
        assertEquals(team, result.getTeam());
        assertEquals(new BigDecimal("20000000"), result.getBasePrice()); // Immutable base price preserved
        
        // Budget deduction check: 100 Cr - 8 Cr = 92 Cr
        BigDecimal expectedBudget = new BigDecimal("920000000");
        assertEquals(expectedBudget, team.getBudget());

        verify(teamRepository, times(1)).save(team);
        verify(playerRepository, times(1)).save(player);
        verify(auctionService, times(1)).recordSold(player, team, finalPrice);
    }

    @Test
    void testSellPlayer_InsufficientBudget() {
        team.setBudget(new BigDecimal("50000000")); // 5 Cr
        BigDecimal finalPrice = new BigDecimal("80000000"); // 8 Cr

        Bid winningBid = new Bid();
        winningBid.setPlayer(player);
        winningBid.setTeam(team);
        winningBid.setAmount(finalPrice);

        when(playerRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(player));
        when(bidRepository.findByPlayerIdOrderByAmountDesc(1L)).thenReturn(Collections.singletonList(winningBid));
        when(teamRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(team));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            playerService.sellPlayer(1L, 5L, finalPrice);
        });

        assertTrue(exception.getMessage().contains("does not have sufficient budget"));
        verify(teamRepository, never()).save(any(Team.class));
        verify(playerRepository, never()).save(any(Player.class));
    }

    @Test
    void testMarkUnsold_WipesBidsAndResetsPrice() {
        player.setOriginalBasePrice(new BigDecimal("20000000"));
        player.setBasePrice(new BigDecimal("95000000")); // current bumped bidding price
        player.setStatus(Player.PlayerStatus.UNSOLD);

        when(playerRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(player));
        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Player result = playerService.markUnsold(1L);

        assertNotNull(result);
        assertEquals(Player.PlayerStatus.UNSOLD, result.getStatus());
        assertEquals(new BigDecimal("20000000"), result.getBasePrice());
        assertNull(result.getTeam());

        verify(bidRepository, times(1)).deleteByPlayerId(1L);
        verify(playerRepository, times(1)).save(player);
    }
}

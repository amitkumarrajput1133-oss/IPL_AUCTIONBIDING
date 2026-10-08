package com.ipl.auction.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.ipl.auction.model.Bid;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByPlayerIdOrderByAmountDesc(Long playerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Bid b WHERE b.player.id = :playerId")
    void deleteByPlayerId(@Param("playerId") Long playerId);
}
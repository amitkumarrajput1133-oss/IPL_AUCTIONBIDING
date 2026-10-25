import { Client } from '@stomp/stompjs';
import { useEffect, useState } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';

import Login from './components/Login';
import FranchiseHeader from './components/FranchiseHeader';
import PlayerCard from './components/PlayerCard';
import BiddingConsole from './components/BiddingConsole';
import Leaderboard from './components/Leaderboard';
import OrbitArena from './components/OrbitArena';
import AddPlayerModal from './components/AddPlayerModal';
import { getTeamTheme } from './teamThemes';

const BACKEND_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeHighestBid, setActiveHighestBid] = useState(null);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  // Timer countdown state
  const [timerSeconds, setTimerSeconds] = useState(15.00);
  const [timerActive, setTimerActive] = useState(false);

  // Load user from session storage on startup
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ipl_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Timer Tick Effect
  useEffect(() => {
    const currentPlayer = players[currentIndex];
    if (!timerActive || loading || !user || !currentPlayer || currentPlayer.status === 'SOLD') {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 0.01) {
          clearInterval(interval);
          return 0;
        }
        return Number((prev - 0.01).toFixed(2));
      });
    }, 10);

    return () => clearInterval(interval);
  }, [timerActive, loading, user, players, currentIndex]);

  // Fetch initial teams, players and active auction room once user is logged in
  useEffect(() => {
    if (!user) return;
    fetchInitialData();

    // Establish WebSocket Connection
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws-auction`),
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${user.token}`
      },
      onConnect: () => {
        // 1. Subscribe to synchronized auction room state
        stompClient.subscribe('/topic/auction-state', (msg) => {
          const auction = JSON.parse(msg.body);
          if (auction.player) {
            setPlayers(prev => {
              const idx = prev.findIndex(p => p.id === auction.player.id);
              if (idx !== -1) {
                setCurrentIndex(idx);
              }
              return prev;
            });
          }

          if (auction.highestBidder) {
            setActiveHighestBid({
              amount: auction.currentBid,
              team: auction.highestBidder
            });
          } else {
            setActiveHighestBid(null);
          }

          if (auction.status === 'LIVE') {
            setTimerSeconds(15.00);
            setTimerActive(true);
          } else if (auction.status === 'SOLD') {
            setTimerActive(false);
            setTimerSeconds(0);
            setMessage(`🎉 HAMMER DOWN! Sold to ${auction.highestBidder ? auction.highestBidder.name : 'Franchise'} for ₹${Number(auction.currentBid).toLocaleString('en-IN')}!`);
          } else if (auction.status === 'UNSOLD') {
            setTimerActive(false);
            setTimerSeconds(0);
            setMessage(`🚫 Player marked UNSOLD.`);
          }
          fetchInitialData();
        });

        // 2. Subscribe to live bids
        stompClient.subscribe('/topic/bids', (msg) => {
          const newBid = JSON.parse(msg.body);
          setMessage(`🔥 Live Bid! ${newBid.team.name} raised bid to ₹${newBid.amount.toLocaleString('en-IN')}!`);
          
          setActiveHighestBid(newBid);
          setTimerSeconds(15.00);
          setTimerActive(true);

          fetchInitialData();
        });

        // 3. Subscribe to final sales
        stompClient.subscribe('/topic/players', (msg) => {
          const soldPlayer = JSON.parse(msg.body);
          if (soldPlayer.status === 'SOLD') {
            setMessage(`🎉 HAMMER DOWN! ${soldPlayer.name} SOLD to ${soldPlayer.team?.name || 'Franchise'}!`);
            setTimerActive(false);
          } else {
            setMessage(`🚫 Player ${soldPlayer.name} marked UNSOLD. Reverted to base price ₹${soldPlayer.basePrice.toLocaleString('en-IN')}.`);
            setActiveHighestBid(null);
            setTimerActive(false);
            setTimerSeconds(0);
          }
          fetchInitialData();
        });

        // 4. Subscribe to newly drafted players
        stompClient.subscribe('/topic/player-added', (msg) => {
          const newPlayer = JSON.parse(msg.body);
          setMessage(`✨ NEW DRAFT! ${newPlayer.name} (${newPlayer.role}) added to the IPL auction pool!`);
          fetchInitialData();
        });

        // Subscribe to global active player stage sync
        stompClient.subscribe('/topic/auction/active', (msg) => {
          const data = JSON.parse(msg.body);
          const targetPlayerId = data.activePlayerId || data.player?.id;

          setPlayers((currentPlayers) => {
            if (targetPlayerId) {
              const targetIdx = currentPlayers.findIndex(p => p.id === targetPlayerId);
              if (targetIdx !== -1) {
                setCurrentIndex(targetIdx);
              }
            }
            return currentPlayers;
          });

          setMessage(`🎯 BCCI STAGE SYNC: Live lot is now ${data.player?.name || 'Player'}!`);
          setTimerSeconds(15.00);
          setTimerActive(true);
          if (targetPlayerId) {
            fetchHighestBid(targetPlayerId);
          }
        });

        // Subscribe to bid resets
        stompClient.subscribe('/topic/bids/reset', (msg) => {
          const data = JSON.parse(msg.body);
          setMessage(`🔄 Bids reset for ${data.player?.name || 'player'} back to base price!`);
          setActiveHighestBid(null);
          setTimerSeconds(15.00);
          setTimerActive(false);
          fetchInitialData();
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user]);

  // Fetch active player's highest bid whenever the active player changes
  useEffect(() => {
    if (players.length > 0 && players[currentIndex]) {
      fetchHighestBid(players[currentIndex].id);
      setTimerSeconds(15.00);
      setTimerActive(true);
    } else {
      setActiveHighestBid(null);
    }
  }, [currentIndex, players]);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
<<<<<<< HEAD
      const [playersRes, teamsRes, activeAuctionRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/players`, config),
        axios.get(`${BACKEND_URL}/api/teams`, config),
        axios.get(`${BACKEND_URL}/api/auction/active`, config).catch(() => ({ data: null }))
      ]);
      const fetchedPlayers = playersRes.data || [];
      setPlayers(fetchedPlayers);
      setTeams(teamsRes.data || []);

      if (activeAuctionRes && activeAuctionRes.data && activeAuctionRes.data.player) {
        const activeId = activeAuctionRes.data.player.id;
        const activeIdx = fetchedPlayers.findIndex(p => p.id === activeId);
        if (activeIdx !== -1) {
          setCurrentIndex(activeIdx);
=======
      const [playersRes, teamsRes, auctionRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/players`, config),
        axios.get(`${BACKEND_URL}/api/teams`, config),
        axios.get(`${BACKEND_URL}/api/auction/active`, config).catch(() => null)
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);

      if (auctionRes && auctionRes.data && auctionRes.data.player) {
        const activePlayerId = auctionRes.data.player.id;
        const foundIdx = playersRes.data.findIndex(p => p.id === activePlayerId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
        }
        if (auctionRes.data.highestBidder) {
          setActiveHighestBid({
            amount: auctionRes.data.currentBid,
            team: auctionRes.data.highestBidder
          });
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        setMessage('⚠️ Could not connect to Spring Boot server.');
      }
    }
  };

  const fetchHighestBid = async (playerId) => {
    if (!user) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.get(`${BACKEND_URL}/api/bids/player/${playerId}/highest`, config);
      if (res.status === 200 && res.data) {
        setActiveHighestBid(res.data);
      } else {
        setActiveHighestBid(null);
      }
    } catch (error) {
      console.error('Error fetching highest bid:', error);
      setActiveHighestBid(null);
    }
  };

  const handleLoginSuccess = (loginData) => {
    sessionStorage.setItem('ipl_user', JSON.stringify(loginData));
    setUser(loginData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ipl_user');
    setUser(null);
    setPlayers([]);
    setTeams([]);
    setActiveHighestBid(null);
    setMessage('');
  };

  const handlePlaceBid = async (amount, isIncremental) => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

<<<<<<< HEAD
    if (currentPlayer.status === 'SOLD') {
      setMessage('⚠️ Bidding is closed. This player is already sold.');
      return;
    }

    if (timerSeconds <= 0) {
      setMessage('⏱️ Time is up! Bidding is locked for this player until auctioneer advances the lot.');
      return;
    }

    let targetBidAmount = 0;
=======
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
    const currentPrice = activeHighestBid ? activeHighestBid.amount : currentPlayer.basePrice;
    const targetBidAmount = isIncremental ? currentPrice + amount : amount;

    if (targetBidAmount <= currentPrice) {
      setMessage(`⚠️ Bid must be higher than current bid (₹${Number(currentPrice).toLocaleString('en-IN')})!`);
      return;
    }

    const previousBid = activeHighestBid;
    const bidderTeam = teams.find(t => t.id === user.teamId);

    // Optimistic UI Update
    setActiveHighestBid({
      id: Date.now(),
      amount: targetBidAmount,
      team: bidderTeam || { id: user.teamId, name: 'Bidding Team' }
    });
    setTimerSeconds(15.00);
    setTimerActive(true);

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.post(`${BACKEND_URL}/api/bids`, {
        playerId: currentPlayer.id,
        teamId: user.teamId,
        amount: targetBidAmount
      }, config);

      setMessage('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Bidding Error: ${errMsg}`);
      setActiveHighestBid(previousBid);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds <= 0) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.round((seconds % 1) * 100);
    
    const minsStr = mins.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');
    const hundStr = hundredths.toString().padStart(2, '0');
    
    return `${minsStr}:${secsStr}.${hundStr}`;
  };

  const handleTeamClick = async (clickedTeam) => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

    if (currentPlayer.status === 'SOLD') {
      setMessage('⚠️ Bidding is closed. This player is already sold.');
      return;
    }

<<<<<<< HEAD
    if (timerSeconds <= 0) {
      setMessage('⏱️ Time is up! Bidding is locked for this player until auctioneer advances the lot.');
      return;
    }

    // Role-based restrictions
    if (user.role === 'TEAM_OWNER') {
      if (user.teamId !== clickedTeam.id) {
        setMessage('⚠️ You cannot place a bid on behalf of another team!');
        return;
      }
=======
    if (user.role === 'TEAM_OWNER' && user.teamId !== clickedTeam.id) {
      setMessage('⚠️ You cannot place a bid on behalf of another team!');
      return;
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
    }

    const currentPrice = activeHighestBid ? activeHighestBid.amount : currentPlayer.basePrice;
    const incrementAmount = 2000000; // Standard 20 Lakhs increment
    const targetBidAmount = activeHighestBid ? currentPrice + incrementAmount : currentPrice;

    const previousBid = activeHighestBid;

    setActiveHighestBid({
      id: Date.now(),
      amount: targetBidAmount,
      team: clickedTeam
    });
    setTimerSeconds(15.00);
    setTimerActive(true);

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.post(`${BACKEND_URL}/api/bids`, {
        playerId: currentPlayer.id,
        teamId: clickedTeam.id,
        amount: targetBidAmount
      }, config);

      setMessage('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Bidding Error: ${errMsg}`);
      setActiveHighestBid(previousBid);
    }
  };

  const handleSellPlayer = async () => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

    if (!activeHighestBid) {
      setMessage('⚠️ No bids have been placed on this player yet. Cannot finalize sale.');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.put(`${BACKEND_URL}/api/players/${currentPlayer.id}/sell`, {
        teamId: activeHighestBid.team.id,
        finalPrice: activeHighestBid.amount
      }, config);

      setMessage('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Failed to finalize sale: ${errMsg}`);
    }
  };

  const handleUnsoldPlayer = async () => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.put(`${BACKEND_URL}/api/players/${currentPlayer.id}/unsold`, {}, config);
      setMessage('');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Failed to mark unsold: ${errMsg}`);
    }
  };

<<<<<<< HEAD
  const handleResetBid = async () => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.post(`${BACKEND_URL}/api/bids/player/${currentPlayer.id}/reset`, {}, config);
      setActiveHighestBid(null);
      setTimerSeconds(15.00);
      setTimerActive(false);
      setMessage(`🔄 Bids reset to base price for ${currentPlayer.name}`);
      fetchInitialData();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Failed to reset bid: ${errMsg}`);
    }
  };

  const broadcastActiveLot = async (targetPlayerId) => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.post(`${BACKEND_URL}/api/auction/active/${targetPlayerId}`, {}, config);
    } catch (err) {
      console.error('Error syncing active lot:', err);
      const errMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Stage Sync Error: ${errMsg}`);
    }
  };

  const handleNextPlayer = () => {
    if (currentIndex < players.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextPlayer = players[nextIdx];
      setCurrentIndex(nextIdx);
=======
  const handleNextPlayer = async () => {
    if (user && user.role === 'ADMIN') {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post(`${BACKEND_URL}/api/auction/next`, {}, config);
        setMessage('');
      } catch (err) {
        console.error('Failed to cycle next player:', err);
      }
    } else if (currentIndex < players.length - 1) {
      setCurrentIndex(prev => prev + 1);
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
      setMessage('');
      if (user.role === 'ADMIN' && nextPlayer) {
        broadcastActiveLot(nextPlayer.id);
      }
    }
  };

<<<<<<< HEAD
  const handlePrevPlayer = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      const prevPlayer = players[prevIdx];
      setCurrentIndex(prevIdx);
=======
  const handlePrevPlayer = async () => {
    if (user && user.role === 'ADMIN') {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post(`${BACKEND_URL}/api/auction/prev`, {}, config);
        setMessage('');
      } catch (err) {
        console.error('Failed to cycle prev player:', err);
      }
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
>>>>>>> 7767837 (refactor: synchronize live auction state, standardize HMAC-SHA256 tokens, and clean repository structure)
      setMessage('');
      if (user.role === 'ADMIN' && prevPlayer) {
        broadcastActiveLot(prevPlayer.id);
      }
    }
  };

  const handlePlayerAdded = (newPlayer) => {
    setPlayers(prev => {
      const updated = [...prev, newPlayer];
      setCurrentIndex(updated.length - 1);
      return updated;
    });
    if (user.role === 'ADMIN' && newPlayer?.id) {
      broadcastActiveLot(newPlayer.id);
    }
    setMessage(`✨ DRAFT SUCCESS: ${newPlayer.name} is now LIVE on the auction stage!`);
    fetchInitialData();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Connecting to IPL Auction Arena...</h2>
      </div>
    );
  }

  // Render Login Card if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_URL} />;
  }

  const currentPlayer = players[currentIndex];
  const activeTeam = teams.find(t => t.id === user.teamId);
  const teamTheme = getTeamTheme(user, activeTeam);

  const displayPlayer = currentPlayer ? {
    ...currentPlayer,
    basePrice: activeHighestBid ? activeHighestBid.amount : currentPlayer.basePrice,
    team: currentPlayer.status === 'SOLD' ? currentPlayer.team : (activeHighestBid ? activeHighestBid.team : null)
  } : null;

  const currentValuation = displayPlayer 
    ? (activeHighestBid ? activeHighestBid.amount : displayPlayer.basePrice) 
    : 0;

  return (
    <div 
      className="app-container arena-entry-anim"
      style={{
        '--team-color': teamTheme.color,
        '--team-accent': teamTheme.accent,
        '--team-gradient': teamTheme.bgGradient,
        '--team-glow': teamTheme.glow,
        '--team-bg-tint': teamTheme.bgTint,
        '--team-border-tint': teamTheme.borderTint
      }}
    >
      <FranchiseHeader
        user={user}
        activeTeam={activeTeam}
        teamTheme={teamTheme}
        totalPlayers={players.length}
        currentIndex={currentIndex}
        currentValuation={currentValuation}
        timerValue={formatTimer(timerSeconds)}
        onOpenAddPlayer={() => setIsAddPlayerModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Broadcast Message Ticker */}
      {message && (
        <div className="ticker-message">
          <span className="ticker-icon">📢</span>
          <span className="ticker-text">{message}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      {displayPlayer ? (
        <div className="hud-grid">
          {/* Middle Row: Orbit Arena visualization */}
          <div className="hud-middle-row">
            <OrbitArena 
              player={displayPlayer}
              nextPlayer={players.length > 1 ? players[(currentIndex + 1) % players.length] : null}
              teams={teams}
              activeHighestBid={activeHighestBid}
              onTeamClick={handleTeamClick}
              userTeamId={user.teamId}
              teamTheme={teamTheme}
            />
          </div>
          
          {/* Bottom Row: Left Resonance, Middle Control, Right Purse */}
          <div className="bottom-telemetry-row">
            {/* Panel 1: SQUAD RESONANCE */}
            <div className="telemetry-panel squad-resonance-panel">
              <h3 className="panel-title">📡 SQUAD RESONANCE</h3>
              <div className="resonance-display">
                <div className="oscilloscope-container">
                  <svg viewBox="0 0 100 100" className="oscilloscope-svg">
                    <circle cx="50" cy="50" r="40" className="radar-circle" />
                    <circle cx="50" cy="50" r="28" className="radar-circle-inner" />
                    <circle cx="50" cy="50" r="16" className="radar-circle-center" />
                    <path d="M 50 10 L 50 90 M 10 50 L 90 50" className="radar-cross" />
                    <line x1="50" y1="50" x2="80" y2="20" className="radar-sweep" />
                  </svg>
                </div>
                <div className="resonance-meta">
                  <div className="resonance-label font-mono">INTELLIGENCE</div>
                  <div className="resonance-value font-mono">RESONANCE: 94.2%</div>
                </div>
              </div>
            </div>

            {/* Panel 2: TACTICAL CONTROL (Bidding Console) */}
            <div className="telemetry-panel tactical-control-panel">
              <BiddingConsole
                user={user}
                player={displayPlayer}
                teamTheme={teamTheme}
                timerSeconds={timerSeconds}
                onPlaceBid={handlePlaceBid}
                onSellPlayer={handleSellPlayer}
                onUnsoldPlayer={handleUnsoldPlayer}
                onResetBid={handleResetBid}
                onPrevPlayer={handlePrevPlayer}
                onNextPlayer={handleNextPlayer}
                onOpenAddPlayer={() => setIsAddPlayerModalOpen(true)}
                currentIndex={currentIndex}
                totalPlayers={players.length}
              />
            </div>

            {/* Panel 3: PURSE CONTAINMENT */}
            <div className="telemetry-panel purse-containment-panel">
              <h3 className="panel-title">🔋 PURSE CONTAINMENT</h3>
              {user.role === 'TEAM_OWNER' && activeTeam ? (
                <div className="panel-content">
                  <div className="purse-telemetry">
                    <div className="telemetry-stat-label font-mono">FRANCHISE BUDGET</div>
                    <div className="telemetry-stat-value font-mono team-budget-value">
                      ₹{(activeTeam.budget / 10000000).toFixed(2)} Cr
                    </div>
                    <div className="telemetry-stat-sub font-mono">MAX CAPACITY: 25 PLAYERS</div>
                  </div>
                  <div className="telemetry-status-box active font-mono">
                    <span>BUDGET SAFEGUARD: ON</span>
                  </div>
                </div>
              ) : (
                <div className="panel-content">
                  <div className="telemetry-stat-label font-mono">GLOBAL ADMIN TELEMETRY</div>
                  <div className="admin-status-indicator font-mono">
                    <span className="pulse-dot"></span> MONITORING ACTIVE
                  </div>
                  
                  <div className="mini-leaderboard font-mono">
                    {teams.slice(0, 5).map(t => {
                      const alias = t.name.split(' ').map(w => w[0]).join('');
                      return (
                        <div key={t.id} className="mini-leaderboard-row">
                          <span className="team-lbl">{alias}</span>
                          <span className="budget-val">₹{(t.budget / 10000000).toFixed(2)} Cr</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="panel-footer font-mono">SYSTEM SECURITY: ACTIVE</div>
            </div>
          </div>

          {/* Global Franchise Purse Containment Leaderboard */}
          <div className="mission-leaderboard-dock">
            <Leaderboard teams={teams} activeTeamId={user.teamId} teamTheme={teamTheme} />
          </div>
        </div>
      ) : (
        <div className="empty-pool-message">
          <p>No players available in the auction pool.</p>
          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setIsAddPlayerModalOpen(true)}
              className="admin-quick-add-btn font-mono"
              style={{ marginTop: '16px' }}
            >
              ➕ DRAFT FIRST PLAYER
            </button>
          )}
        </div>
      )}

      {/* Admin Draft New Player Modal */}
      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onPlayerAdded={handlePlayerAdded}
        user={user}
        backendUrl={BACKEND_URL}
      />
    </div>
  );
}

export default App;

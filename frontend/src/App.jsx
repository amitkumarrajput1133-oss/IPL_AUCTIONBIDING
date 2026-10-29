import { Client } from '@stomp/stompjs';
import { useEffect, useState, useRef } from 'react';
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

  // Server-Synchronized Timer State
  const [timerSeconds, setTimerSeconds] = useState(15.00);
  const [timerActive, setTimerActive] = useState(false);
  const roundEndTimeRef = useRef(null);
  const serverOffsetRef = useRef(0);

  // Load user from session storage on startup
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ipl_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // High-Precision Multi-Terminal Synchronized Timer Effect
  useEffect(() => {
    const currentPlayer = players[currentIndex];
    if (!timerActive || loading || !user || !currentPlayer || currentPlayer.status === 'SOLD') {
      return;
    }

    const interval = setInterval(() => {
      if (!roundEndTimeRef.current) return;
      const nowServer = Date.now() + serverOffsetRef.current;
      const remaining = (roundEndTimeRef.current - nowServer) / 1000;

      if (remaining <= 0.02) {
        clearInterval(interval);
        roundEndTimeRef.current = null;
        setTimerSeconds(0);
        setTimerActive(false);
      } else {
        setTimerSeconds(Number(remaining.toFixed(2)));
      }
    }, 25);

    return () => clearInterval(interval);
  }, [timerActive, loading, user, currentIndex, players[currentIndex]?.status]);

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
          if (auction.serverTime) {
            serverOffsetRef.current = auction.serverTime - Date.now();
          }

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

          if (auction.status === 'LIVE' && auction.timerRunning) {
            if (auction.endTimeMillis) {
              roundEndTimeRef.current = auction.endTimeMillis;
              const nowServer = Date.now() + serverOffsetRef.current;
              const rem = Math.max(0, (auction.endTimeMillis - nowServer) / 1000);
              setTimerSeconds(Number(rem.toFixed(2)));
            } else {
              const rem = auction.remainingMillis ? auction.remainingMillis / 1000 : (auction.timerSeconds || 15.00);
              roundEndTimeRef.current = (Date.now() + serverOffsetRef.current) + rem * 1000;
              setTimerSeconds(Number(rem.toFixed(2)));
            }
            setTimerActive(true);
          } else if (auction.status === 'SOLD') {
            roundEndTimeRef.current = null;
            setTimerActive(false);
            setTimerSeconds(0);
            setMessage(`🎉 HAMMER DOWN! Sold to ${auction.highestBidder ? auction.highestBidder.name : 'Franchise'} for ₹${Number(auction.currentBid).toLocaleString('en-IN')}!`);
          } else if (auction.status === 'UNSOLD') {
            roundEndTimeRef.current = null;
            setTimerActive(false);
            setTimerSeconds(0);
            setMessage(`🚫 Player marked UNSOLD.`);
          } else {
            // WAITING or PAUSED
            roundEndTimeRef.current = null;
            setTimerActive(false);
            if (auction.timerSeconds === 0 || auction.remainingMillis === 0) {
              setTimerSeconds(0);
            } else if (auction.remainingMillis !== undefined && auction.remainingMillis !== null) {
              setTimerSeconds(Number((auction.remainingMillis / 1000).toFixed(2)));
            } else if (auction.timerSeconds !== undefined && auction.timerSeconds !== null) {
              setTimerSeconds(Number(auction.timerSeconds));
            } else {
              setTimerSeconds(15.00);
            }
          }
        });

        // 2. Subscribe to live bids
        stompClient.subscribe('/topic/bids', (msg) => {
          const newBid = JSON.parse(msg.body);
          setMessage(`🔥 Live Bid! ${newBid.team.name} raised bid to ₹${newBid.amount.toLocaleString('en-IN')}!`);
          
          setActiveHighestBid(newBid);
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
                setCurrentIndex(prevIdx => {
                  if (prevIdx !== targetIdx) {
                    setMessage(`🎯 BCCI STAGE SYNC: Live lot is now ${data.player?.name || 'Player'}!`);
                    timerEndRef.current = null;
                    setTimerSeconds(15.00);
                    setTimerActive(Boolean(data.timerRunning));
                  }
                  return targetIdx;
                });
              }
            }
            return currentPlayers;
          });

          if (targetPlayerId) {
            fetchHighestBid(targetPlayerId);
          }
        });

        // Subscribe to bid resets
        stompClient.subscribe('/topic/bids/reset', (msg) => {
          const data = JSON.parse(msg.body);
          setMessage(`🔄 Bids reset for ${data.player?.name || 'player'} back to base price!`);
          setActiveHighestBid(null);
          timerEndRef.current = null;
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

  const activePlayerId = players[currentIndex]?.id;

  // Fetch active player's highest bid whenever the active player changes
  useEffect(() => {
    if (activePlayerId) {
      fetchHighestBid(activePlayerId);
    } else {
      setActiveHighestBid(null);
    }
  }, [activePlayerId]);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const [playersRes, teamsRes, auctionRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/players`, config),
        axios.get(`${BACKEND_URL}/api/teams`, config),
        axios.get(`${BACKEND_URL}/api/auction/active`, config).catch(() => null)
      ]);
      const fetchedPlayers = playersRes.data || [];
      setPlayers(fetchedPlayers);
      setTeams(teamsRes.data || []);

      if (auctionRes && auctionRes.data && auctionRes.data.player) {
        const activePlayerId = auctionRes.data.player.id;
        const foundIdx = fetchedPlayers.findIndex(p => p.id === activePlayerId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
        }
        if (auctionRes.data.highestBidder) {
          setActiveHighestBid({
            amount: auctionRes.data.currentBid,
            team: auctionRes.data.highestBidder
          });
        }
        if (auctionRes.data.serverTime) {
          serverOffsetRef.current = auctionRes.data.serverTime - Date.now();
        }

        if (auctionRes.data.status === 'LIVE' && auctionRes.data.timerRunning && auctionRes.data.endTimeMillis) {
          roundEndTimeRef.current = auctionRes.data.endTimeMillis;
          const nowServer = Date.now() + serverOffsetRef.current;
          const rem = Math.max(0, (auctionRes.data.endTimeMillis - nowServer) / 1000);
          setTimerSeconds(Number(rem.toFixed(2)));
          setTimerActive(true);
        } else if (auctionRes.data.status === 'SOLD' || auctionRes.data.status === 'UNSOLD') {
          roundEndTimeRef.current = null;
          setTimerActive(false);
          setTimerSeconds(0);
        } else {
          roundEndTimeRef.current = null;
          setTimerActive(false);
          const rem = auctionRes.data.remainingMillis !== undefined 
            ? auctionRes.data.remainingMillis / 1000 
            : (auctionRes.data.timerSeconds !== undefined ? auctionRes.data.timerSeconds : 15.00);
          setTimerSeconds(Number(rem.toFixed(2)));
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

    if (currentPlayer.status === 'SOLD') {
      setMessage('⚠️ Bidding is closed. This player is already sold.');
      return;
    }

    if (!timerActive && timerSeconds > 0) {
      setMessage('⏳ Waiting for Auctioneer to start the timer for this lot!');
      return;
    }

    if (timerSeconds <= 0) {
      setMessage('⏱️ Time is up! Bidding is locked for this player until auctioneer advances the lot.');
      return;
    }
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
    if (!seconds || seconds <= 0) return '00:00.00';
    const totalSecs = Math.max(0, seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const hundredths = Math.min(99, Math.floor((totalSecs % 1) * 100));
    
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

    if (!timerActive && timerSeconds > 0) {
      setMessage('⏳ Waiting for Auctioneer to start the timer for this lot!');
      return;
    }

    if (timerSeconds <= 0) {
      setMessage('⏱️ Time is up! Bidding is locked for this player until auctioneer advances the lot.');
      return;
    }

    if (user.role === 'TEAM_OWNER' && user.teamId !== clickedTeam.id) {
      setMessage('⚠️ You cannot place a bid on behalf of another team!');
      return;
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

  const handleResetBid = async () => {
    const currentPlayer = players[currentIndex];
    if (!currentPlayer || !user) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.post(`${BACKEND_URL}/api/bids/player/${currentPlayer.id}/reset`, {}, config);
      setActiveHighestBid(null);
      timerEndRef.current = null;
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

  const handleStartTimer = async () => {
    if (!user || user.role !== 'ADMIN') return;
    const remaining = timerSeconds > 0.05 ? timerSeconds : 15.00;
    setMessage(remaining < 14.9 ? '⏱️ AUCTIONEER RESUMED THE TIMER!' : '⏱️ AUCTIONEER STARTED THE TIMER! Bidding is now LIVE!');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BACKEND_URL}/api/auction/start-timer`, {
        timerSeconds: Math.ceil(remaining)
      }, config);
    } catch (err) {
      console.warn('Backend start-timer call warning:', err?.message || err);
    }
  };

  const handlePauseTimer = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setMessage('⏸️ Timer paused by auctioneer.');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BACKEND_URL}/api/auction/pause-timer`, {
        timerSeconds: Math.ceil(timerSeconds)
      }, config);
    } catch (err) {
      console.error('Failed to pause timer:', err);
    }
  };

  const handleResetTimer = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setMessage('⏱️ Timer reset to 15.00s by auctioneer (ON HOLD).');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BACKEND_URL}/api/auction/reset-timer`, {}, config);
    } catch (err) {
      console.error('Failed to reset timer:', err);
    }
  };

  const handleNextPlayer = async () => {
    timerEndRef.current = null;
    setTimerSeconds(15.00);
    setTimerActive(false);
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
      setMessage('');
    }
  };

  const handlePrevPlayer = async () => {
    timerEndRef.current = null;
    setTimerSeconds(15.00);
    setTimerActive(false);
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
      setMessage('');
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
        timerActive={timerActive}
        timerSeconds={timerSeconds}
        onToggleTimer={timerActive ? handlePauseTimer : handleStartTimer}
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
                timerActive={timerActive}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
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

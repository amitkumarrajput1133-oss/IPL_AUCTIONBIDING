import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SECTORS = [
  { name: 'CHENNAI SUPER KINGS', short: 'CSK', username: 'csk_owner', password: 'csk123', clearance: 'WAR ROOM CHIEF', ceo: 'M.S. Dhoni - Director', purse: '₹100.00 Cr', retentions: '5 / 25', overseas: '02 / 08', color: '#facc15' },
  { name: 'MUMBAI INDIANS', short: 'MI', username: 'mi_owner', password: 'mi123', clearance: 'WAR ROOM CHIEF', ceo: 'Akash Ambani - Chair', purse: '₹100.00 Cr', retentions: '4 / 25', overseas: '03 / 08', color: '#00f2fe' },
  { name: 'ROYAL CHALLENGERS BENGALURU', short: 'RCB', username: 'rcb_owner', password: 'rcb123', clearance: 'WAR ROOM CHIEF', ceo: 'Prathmesh M. - Lead', purse: '₹100.00 Cr', retentions: '6 / 25', overseas: '04 / 08', color: '#ef4444' },
  { name: 'KOLKATA KNIGHT RIDERS', short: 'KKR', username: 'kkr_owner', password: 'kkr123', clearance: 'WAR ROOM CHIEF', ceo: 'Venky Mysore - CEO', purse: '₹100.00 Cr', retentions: '5 / 25', overseas: '02 / 08', color: '#a855f7' },
  { name: 'RAJASTHAN ROYALS', short: 'RR', username: 'rr_owner', password: 'rr123', clearance: 'WAR ROOM CHIEF', ceo: 'Manoj Badale - Lead', purse: '₹100.00 Cr', retentions: '4 / 25', overseas: '02 / 08', color: '#ec4899' },
  { name: 'SUNRISERS HYDERABAD', short: 'SRH', username: 'srh_owner', password: 'srh123', clearance: 'WAR ROOM CHIEF', ceo: 'Kavya Maran - CEO', purse: '₹100.00 Cr', retentions: '3 / 25', overseas: '03 / 08', color: '#f97316' },
  { name: 'DELHI CAPITALS', short: 'DC', username: 'dc_owner', password: 'dc123', clearance: 'WAR ROOM CHIEF', ceo: 'Parth Jindal - Director', purse: '₹100.00 Cr', retentions: '5 / 25', overseas: '01 / 08', color: '#3b82f6' },
  { name: 'GUJARAT TITANS', short: 'GT', username: 'gt_owner', password: 'gt123', clearance: 'WAR ROOM CHIEF', ceo: 'Alex R. - CEO', purse: '₹100.00 Cr', retentions: '4 / 25', overseas: '02 / 08', color: '#14b8a6' },
  { name: 'LUCKNOW SUPER GIANTS', short: 'LSG', username: 'lsg_owner', password: 'lsg123', clearance: 'WAR ROOM CHIEF', ceo: 'Sanjiv Goenka - Chair', purse: '₹100.00 Cr', retentions: '4 / 25', overseas: '02 / 08', color: '#06b6d4' },
  { name: 'PUNJAB KINGS', short: 'PBKS', username: 'pbks_owner', password: 'pbks123', clearance: 'WAR ROOM CHIEF', ceo: 'Preity Zinta - Director', purse: '₹100.00 Cr', retentions: '2 / 25', overseas: '02 / 08', color: '#e11d48' },
  { name: 'GLOBAL ADMIN', short: 'ADMIN', username: 'admin', password: 'admin123', clearance: 'GLOBAL AUCTIONEER', ceo: 'Auction Commissioner', purse: 'N/A', retentions: 'N/A', overseas: 'N/A', color: '#fbbf24' },
];

function Login({ onLoginSuccess, backendUrl }) {
  const [selectedSectorIndex, setSelectedSectorIndex] = useState(0);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdPercent, setHoldPercent] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentSector = SECTORS[selectedSectorIndex];
  const holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync password when sector changes
  useEffect(() => {
    setPasswordInput(currentSector.password);
    setError('');
  }, [selectedSectorIndex]);

  // Global keydown listener for keyboard typing when not focused on an input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (loading || isHolding) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        setPasswordInput((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerLogin();
      } else if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
        e.preventDefault();
        setPasswordInput((prev) => (prev.length < 15 ? prev + e.key.toLowerCase() : prev));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [loading, isHolding, currentSector, passwordInput]);

  const triggerLogin = async () => {
    setError('');
    setLoading(true);

    const credentialPassword = passwordInput || currentSector.password;

    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        username: currentSector.username,
        password: credentialPassword
      });
      onLoginSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'DECRYPTION FAILED: ACCESS DENIED');
      setLoading(false);
    }
  };

  // Hold to Authenticate (Exact 3.00 seconds)
  const handleStartHold = (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setIsHolding(true);
    setHoldPercent(0);

    const startTime = Date.now();
    const duration = 3000; // Exact 3 seconds

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setHoldPercent(pct);
    }, 20);

    holdTimeoutRef.current = setTimeout(() => {
      clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldPercent(100);
      triggerLogin();
    }, duration);
  };

  const handleCancelHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldPercent(0);
  };

  // Calculate radius and circumference for circular progress
  const radius = 58;
  const circumference = 2 * Math.PI * radius; // ~364.42
  const strokeDashoffset = circumference - (circumference * holdPercent) / 100;

  // Active dots for the bottom track (8 indicators)
  const dotCount = 8;
  const activeDotCount = isHolding
    ? Math.min(dotCount, Math.ceil((holdPercent / 100) * dotCount))
    : Math.min(dotCount, passwordInput.length);

  return (
    <div className="war-room-auth-stage">
      <div className="auth-ambient-grid"></div>

      {/* Main Glassmorphic War Room Access Container */}
      <div className="war-room-auth-card">
        {/* Header Bar */}
        <div className="auth-card-header">
          <div className="header-crest-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="crest-shield-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="auth-main-title">WAR ROOM ACCESS: BIOMETRIC LOGIN</h1>
          <p className="auth-sub-title">SECURE FRANCHISE AUTHENTICATION PROTOCOL</p>
        </div>

        {/* 3-Column Tactical Command Hub */}
        <div className="auth-tactical-grid">
          {/* Left Column: Sector Franchise Selector & Clearance */}
          <div className="auth-panel sector-panel" ref={dropdownRef}>
            <div className="panel-subhead">SECTOR FRANCHISE</div>
            
            {/* Custom Interactive Dropdown */}
            <div 
              className={`tactical-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="trigger-team-name">{currentSector.name}</span>
              <span className="trigger-chevron">{isDropdownOpen ? '▲' : '▼'}</span>
            </div>

            {isDropdownOpen && (
              <div className="tactical-dropdown-menu">
                {SECTORS.map((sec, idx) => (
                  <div
                    key={sec.name}
                    className={`menu-sector-option ${idx === selectedSectorIndex ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSectorIndex(idx);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="option-name-row">
                      <span className="opt-short" style={{ color: sec.color }}>{sec.short}</span>
                      <span className="opt-name">{sec.name}</span>
                    </div>
                    <span className="opt-clearance">{sec.clearance}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="metric-item">
              <span className="metric-label">CLEARANCE LEVEL:</span>
              <span className="metric-value gold font-mono">{currentSector.clearance}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">TOTAL PURSE:</span>
              <span className="metric-value cyan font-mono">{currentSector.purse}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">SQUAD LIMIT:</span>
              <span className="metric-value font-mono">25 MAX (8 OVERSEAS)</span>
            </div>
          </div>

          {/* Center Column: Central Biometric Scanner & Password Entry */}
          <div className="auth-panel scanner-central-panel">
            {/* Dedicated Password Input Box */}
            <div className="password-entry-deck">
              <label className="password-entry-label font-mono" htmlFor="auth-password-input">
                <span className="label-text">ENTER PASSWORD</span>
                <span className="preset-hint font-mono">(TARGET: <strong>{currentSector.password}</strong>)</span>
              </label>
              <div className="password-input-row">
                <span className="input-key-glyph">🔑</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password-input"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      triggerLogin();
                    }
                  }}
                  placeholder="Enter password..."
                  className="tactical-password-field font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="reveal-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Circular Biometric Scanner */}
            <div className="scanner-outer-frame">
              <button
                type="button"
                className={`biometric-hold-trigger ${isHolding ? 'is-holding' : ''} ${loading ? 'is-authenticating' : ''}`}
                onMouseDown={handleStartHold}
                onMouseUp={handleCancelHold}
                onMouseLeave={handleCancelHold}
                onTouchStart={handleStartHold}
                onTouchEnd={handleCancelHold}
                title="Click and hold for 3 seconds to authenticate"
              >
                {/* SVG Progress Ring (Exact 3-second fill) */}
                <svg className="biometric-progress-svg" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} className="progress-bg-track" />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    className="progress-fill-glow"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>

                {/* Internal Fingerprint Artwork and Live Numeric Readout */}
                <div className="scanner-core-content">
                  {isHolding ? (
                    <div className="holding-readout font-mono">
                      <span className="hold-percent-number">{Math.round(holdPercent)}%</span>
                      <span className="hold-pulse-text">SCANNING</span>
                    </div>
                  ) : (
                    <svg viewBox="0 0 100 100" className="fingerprint-dermal-svg">
                      <path d="M 50 18 A 32 32 0 0 1 82 45" className="dermal-ridge r1" />
                      <path d="M 18 45 A 32 32 0 0 1 50 18" className="dermal-ridge r2" />
                      <path d="M 50 26 A 24 24 0 0 1 74 48" className="dermal-ridge r3" />
                      <path d="M 26 48 A 24 24 0 0 1 50 26" className="dermal-ridge r4" />
                      <path d="M 50 34 A 16 16 0 0 1 66 50" className="dermal-ridge r5" />
                      <path d="M 34 50 A 16 16 0 0 1 50 34" className="dermal-ridge r6" />
                      <path d="M 50 42 A 8 8 0 0 1 58 50 C 58 64 42 66 42 78" className="dermal-ridge r7" />
                      <path d="M 34 52 C 34 70 58 70 58 84" className="dermal-ridge r8" />
                      <path d="M 66 52 C 66 70 42 74 42 88" className="dermal-ridge r9" />
                      <path d="M 26 52 C 26 78 74 78 74 92" className="dermal-ridge r10" />
                    </svg>
                  )}
                  {/* Glowing Laser Scanline Bar */}
                  <div className={`laser-scanner-line ${isHolding ? 'scanning' : ''}`}></div>
                </div>
              </button>
            </div>

            {/* Hold Status & Direct Submit Action */}
            <div className="scanner-action-dock">
              <div className="scanner-status-caption font-mono">
                {loading
                  ? 'AUTHENTICATING ENCRYPTED KEY...'
                  : isHolding
                  ? `DERMAL HOLD: ${Math.round(holdPercent)}% (KEEP HOLDING)`
                  : 'HOLD 3s OR HIT ENTER TO LOGIN'}
              </div>

              <button
                type="button"
                className="quick-auth-submit-btn font-mono"
                onClick={triggerLogin}
                disabled={loading}
              >
                {loading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS ➔'}
              </button>
            </div>
          </div>

          {/* Right Column: Franchise Stats Summary */}
          <div className="auth-panel stats-panel">
            <div className="panel-subhead">FRANCHISE STATS</div>
            
            <div className="stats-franchise-title" style={{ color: currentSector.color }}>
              {currentSector.short} COMMAND
            </div>

            <div className="metric-item">
              <span className="metric-label">FRANCHISE LEAD:</span>
              <span className="metric-value">{currentSector.ceo}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">RETENTIONS:</span>
              <span className="metric-value font-mono">{currentSector.retentions}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">OVERSEAS QUOTA:</span>
              <span className="metric-value font-mono">{currentSector.overseas}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">STRATEGY OPS:</span>
              <span className="metric-value green-text font-mono">ACTIVE (NOMINAL)</span>
            </div>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="auth-error-alert font-mono">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Bottom Cybernetic Authentication Indicator Dots */}
        <div className="auth-bottom-dock">
          <div className="auth-dots-track">
            {[...Array(dotCount)].map((_, i) => (
              <div
                key={i}
                className={`cyber-auth-pip ${i < activeDotCount ? 'pip-illuminated' : ''}`}
              ></div>
            ))}
          </div>
          <div className="auth-prompt-note font-mono">
            FRANCHISE SECTOR: <strong>{currentSector.name}</strong> • ENTER KEY OR HOLD SCANNER 3 SECONDS
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

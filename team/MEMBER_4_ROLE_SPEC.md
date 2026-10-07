# 🎨 Member 4: Frontend & API Integration Lead — Role Specification

| Attribute | Specification |
| :--- | :--- |
| **Role Title** | Frontend & API Integration Lead |
| **Assigned Workspace** | [`member-4-frontend-api-integration-lead/`](./member-4-frontend-api-integration-lead/) |
| **Git Branch** | `feature/frontend-ui` |
| **Local Runtime Port** | `http://localhost:5173` (Vite Dev Server) |
| **Primary Languages** | JavaScript (ES6+ / JSX), Modern Vanilla CSS3, HTML5 |
| **Primary Framework** | React 18 / Vite |

---

## 1. Role & Architectural Responsibilities

Member 4 serves as the **Lead Visual Designer, UI/UX Architect & Client-Side Realtime Integrator**.

### Core Architectural Scope
1. **Cybernetic Dark Stadium Design System:**
   - Dark carbon hues (`#0a0e17`, `#111827`) paired with luminous neon gold, cyan, and crimson accents.
   - Glassmorphism card surfaces (`backdrop-filter: blur(16px)`).
   - High-visibility badges for Overseas (✈️) and Player Roles.
2. **Circular Orbit Arena (`OrbitArena.jsx`):**
   - Renders all 10 IPL franchises positioned radially around the active player spotlight.
   - Triggers dynamic glowing neon halos around the current leading bidder in real-time.
3. **Interactive Bidding Console (`BiddingConsole.jsx`):**
   - Quick-bid increment buttons (+₹20 Lakhs, +₹50 Lakhs, +₹1 Crore).
   - Custom bid entry with instant client-side budget check.
   - Real-time purse balance health indicator.
   - Disables buttons when remaining purse is insufficient or when team already holds the highest bid.
4. **Active Player Spotlight (`PlayerCard.jsx`):**
   - Player photo, role badge, base price vs. current leading bid, and active auction countdown timer.
5. **Live Franchise Leaderboard (`Leaderboard.jsx`):**
   - Displays all 10 franchises sorted by budget or squad count.
   - Visual progress bars for 25-player maximum capacity and 8-overseas maximum limit.
6. **Client-Side Realtime & REST Integration:**
   - 1-Click quick-switch login for Admin and all 10 Team Owners (`Login.jsx`).
   - Axios HTTP client with request interceptor injecting `Authorization: Bearer <token>`.
   - StompJS / SockJS subscription to `/topic/bids` and `/topic/players`.

---

## 2. Tech Stack & Tools

* **Programming Languages:** JavaScript (ES6+ / JSX), Modern CSS3, HTML5
* **Framework:** React 18 / 19, Vite
* **HTTP Client:** Axios (with request interceptors)
* **Real-time Client:** `@stomp/stompjs`, `sockjs-client`
* **Package Manager:** Node.js, npm

---

## 3. Key Files & Modules Owned

```text
member-4-frontend-api-integration-lead/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx (Global dashboard conductor & state)
│   ├── index.css (Cybernetic design system tokens)
│   ├── App.css
│   ├── teamThemes.js (Official team colors & branding)
│   ├── playerAnalytics.js
│   └── components/
│       ├── OrbitArena.jsx (Circular stadium visualization)
│       ├── BiddingConsole.jsx (Bidding pad & increment triggers)
│       ├── PlayerCard.jsx (Active player card & timer)
│       ├── Leaderboard.jsx (Live purse & squad quota table)
│       ├── FranchiseHeader.jsx (Top navigation bar)
│       ├── Login.jsx (Role switcher & auth modal)
│       └── AddPlayerModal.jsx (Admin player entry modal)
```

---

## 4. Strict Inter-Member Boundaries

* ❌ **Must NOT Touch:**
  * Member 1: Spring Boot Java controllers, squad limit Java validations.
  * Member 2: Java Spring Security filter chains, JWT cryptographic signing.
  * Member 3: MySQL schema scripts, Docker containers, JPA pessimistic locking.
  * Member 5: JUnit 5 test suites, Mockito mocks, GitHub Actions CI scripts.

---

## 5. Execution Commands

```bash
# Navigate to workspace
cd member-4-frontend-api-integration-lead

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Open in browser: http://localhost:5173
```

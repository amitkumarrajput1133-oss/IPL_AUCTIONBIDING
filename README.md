# 🏏 Real-Time IPL Auction System (5-Member Team Project)

Welcome to the **IPL Auction System** enterprise codebase. This project simulates a live, full-scale Indian Premier League (IPL) mega auction with real-time bidding, pessimistic concurrency locking, Spring Security JWT authentication, and a cybernetic dark-neon frontend.

---

## 👥 5-Member Team Role Directories & Work Copies

Each team member has their dedicated workspace folder under [`team/`](file:///c:/Users/hp/ipl_auction_system%20complete/team/) with their isolated copy of work and step-by-step **Week 1 AI Mentor Guides**:

| Member & Role | Dedicated Folder | Git Branch | Core Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Member 1: Project Lead & Core Backend** | [`team/member-1-project-lead-core-backend`](file:///c:/Users/hp/ipl_auction_system%20complete/team/member-1-project-lead-core-backend/README.md) | `feature/core-backend` | Spring Boot base, Team CRUD, Player CRUD, Purse deduction rules, Squad caps, Global Exception Handler |
| **Member 2: Security & Authentication Specialist** | [`team/member-2-security-authentication-specialist`](file:///c:/Users/hp/ipl_auction_system%20complete/team/member-2-security-authentication-specialist/README.md) | `feature/security-auth` | Spring Security 6, JWT TokenUtil, TokenAuthenticationFilter, WebSocket security, Auth REST APIs, RBAC |
| **Member 3: Database & Bidding Engine Developer** | [`team/member-3-database-bidding-engine-developer`](file:///c:/Users/hp/ipl_auction_system%20complete/team/member-3-database-bidding-engine-developer/README.md) | `feature/database-bidding` | MySQL DDL `schema.sql`, JPA Entities, Pessimistic Row Locking (`@Lock`), Live Bidding REST APIs, Purse validation |
| **Member 4: Frontend & API Integration Lead** | [`team/member-4-frontend-api-integration-lead`](file:///c:/Users/hp/ipl_auction_system%20complete/team/member-4-frontend-api-integration-lead/README.md) | `feature/frontend-ui` | Vite + React SPA, Cybernetic Dark Cricket Design System (`index.css`), Auth UI, PlayerCard, OrbitArena, Leaderboard |
| **Member 5: QA, Testing & API Documentation Lead** | [`team/member-5-qa-testing-api-documentation-lead`](file:///c:/Users/hp/ipl_auction_system%20complete/team/member-5-qa-testing-api-documentation-lead/README.md) | `feature/qa-testing-docs` | OpenAPI 3 / Swagger UI (`OpenApiConfig`), Postman collections, JUnit 5 + Mockito tests, Edge-case suite, GitHub Actions CI |

---

## 🚀 Quick Start & How to Run

### 1. Run MySQL & Backend
```bash
# Option A: With Docker Compose
docker-compose up -d

# Option B: Run Spring Boot directly
cd backend
..\mvnw spring-boot:run
```

Backend will start on: **`http://localhost:8080`**  
Swagger API Docs: **`http://localhost:8080/swagger-ui/index.html`**

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will start on: **`http://localhost:5173`**

---

## 📖 Team Guidelines
See [`TEAM_GUIDE.md`](file:///c:/Users/hp/ipl_auction_system%20complete/TEAM_GUIDE.md) and [`TEAM_ROLES.txt`](file:///c:/Users/hp/ipl_auction_system%20complete/TEAM_ROLES.txt) for branch policies, code boundaries, and Week 1-12 workflows.

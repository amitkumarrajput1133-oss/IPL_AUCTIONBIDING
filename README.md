# 🏏 Real-Time IPL Auction System

A real-time IPL auction platform with live synchronized bidding, optimistic and pessimistic concurrency control, role-based JWT security, and interactive client dashboards.

---

## ⚡ Tech Stack

* **Backend:** Java 17, Spring Boot 3, Spring Security 6, Spring Data JPA, Hibernate, STOMP WebSockets, H2 Database (MySQL Mode).
* **Frontend:** React 18, Vite, STOMP over SockJS, Axios, CSS Modules / Custom Design System.
* **Testing & Docs:** JUnit 5, Mockito, SpringDoc OpenAPI 3 (Swagger UI).

---

## 🏗 Architecture Overview

1. **Synchronized Auction Engine:**
   - Centralized `Auction` state on the server tracks the live player on the hammer, current highest bid, leading franchise, and countdown clock.
   - Any bid or auction event automatically broadcasts via WebSocket (`/topic/auction-state`, `/topic/bids`) to keep all connected franchise consoles in sync.

2. **Concurrency & Integrity:**
   - Row-level pessimistic locking (`PESSIMISTIC_WRITE`) on teams and players ensures atomic purse deductions and bid tracking under simultaneous bidding requests.
   - Base prices are immutable; current bid pricing is isolated to active auction rounds.
   - Franchise budget validation and squad quotas (max 25 players, max 8 overseas) are enforced on the server before finalizing sales.

3. **Authentication & Authorization:**
   - Token-based HMAC-SHA256 authentication with role-based access control (RBAC).
   - Roles: `ADMIN` (Auctioneer) and `TEAM_OWNER` (Franchise Bidders).
   - Dedicated WebSocket handshake and STOMP channel security interceptors ensure only authenticated connections can interact.

---

## 🚀 Getting Started

### 1. Start the Backend
From the repository root:
```bash
cd backend
..\mvnw.cmd spring-boot:run
```
* Backend runs on **`http://localhost:8082`**
* Swagger UI documentation: **`http://localhost:8082/swagger-ui/index.html`**
* In-Memory H2 Database Console: **`http://localhost:8082/h2-console`** (`jdbc:h2:mem:ipl_auction_db`)

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on **`http://localhost:5173`**

---

## 🔑 Default Seed Credentials

On startup, the system seeds the 10 official IPL franchises, marquee player pool, and default test accounts:

| Role | Username | Password | Assigned Franchise |
| :--- | :--- | :--- | :--- |
| **Auctioneer (Admin)** | `admin` | `admin123` | *All Franchises (Global Control)* |
| **Team Owner** | `csk_owner` | `csk123` | Chennai Super Kings |
| **Team Owner** | `mi_owner` | `mi123` | Mumbai Indians |
| **Team Owner** | `rcb_owner` | `rcb123` | Royal Challengers Bengaluru |
| **Team Owner** | `kkr_owner` | `kkr123` | Kolkata Knight Riders |
| *(Other Franchises)* | `<alias>_owner` | `<alias>123` | *Respective IPL Franchise* |

---

## 🧪 Testing

To run the automated JUnit 5 and Mockito test suites:
```bash
cd backend
..\mvnw.cmd test
```

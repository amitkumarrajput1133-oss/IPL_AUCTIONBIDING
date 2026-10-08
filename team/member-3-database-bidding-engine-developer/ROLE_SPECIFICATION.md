# ⚡ Member 3: Database & Bidding Engine Developer — Role Specification

| Attribute | Specification |
| :--- | :--- |
| **Role Title** | Database & Bidding Engine Developer |
| **Assigned Workspace** | [`member-3-database-bidding-engine-developer/`](./member-3-database-bidding-engine-developer/) |
| **Git Branch** | `feature/database-bidding` |
| **Local Runtime Ports** | `http://localhost:8082` (App) / `3306` (MySQL) |
| **Primary Languages** | Java 17, SQL (MySQL 8.0) |
| **Primary Framework** | Spring Data JPA / Hibernate / Spring WebSocket STOMP |

---

## 1. Role & Architectural Responsibilities

Member 3 serves as the **Database Architect, Concurrency Specialist & Real-Time Engine Developer**.

### Core Architectural Scope
1. **Relational Database Design & Provisioning:**
   - Designs production MySQL DDL schema (`schema.sql`) for tables: `users`, `teams`, `players`, `bids`, `auctions`.
   - Provisions containerized MySQL 8.0 via `docker-compose.yml`.
2. **JPA Domain Entities & Financial Precision:**
   - Maps domain entities with proper relationships (`@ManyToOne`, `@OneToMany`).
   - Uses `java.math.BigDecimal` for all monetary columns (`budget`, `basePrice`, `amount`) to prevent IEEE 754 floating-point rounding errors.
3. **High-Concurrency Pessimistic Row Locking:**
   - Solves race conditions during millisecond bidding battles using **Pessimistic Write Locks**:
     ```java
     @Lock(LockModeType.PESSIMISTIC_WRITE)
     @Query("SELECT p FROM Player p WHERE p.id = :id")
     Optional<Player> findByIdForUpdate(@Param("id") Long id);
     ```
   - Instructs MySQL to issue a native `SELECT ... FOR UPDATE` to serialize concurrent bids.
4. **Live Bidding Algorithm (`BidService.java`):**
   - **Purse Sufficiency:** Validates `team.getBudget().compareTo(amount) >= 0`.
   - **Anti-Self Outbidding:** Prevents a franchise from bidding consecutively against its own highest bid.
   - **Strict Increment:** Validates `amount.compareTo(highestBid.getAmount()) > 0`.
   - **Base Price Floor:** Validates `amount.compareTo(player.getBasePrice()) >= 0`.
5. **Real-Time WebSocket Broadcasting:**
   - Broadcasts winning bids immediately across all connected client screens via `/topic/bids`.

---

## 2. Tech Stack & Tools

* **Programming Languages:** Java 17, SQL (MySQL 8.0 DDL/DML)
* **Framework:** Spring Boot 3, Spring Data JPA, Hibernate ORM
* **Database & Driver:** MySQL 8.0 (`mysql-connector-j`), H2 database (fallback)
* **Containerization:** Docker & Docker Compose
* **Real-time Engine:** Spring WebSocket & STOMP Message Broker
* **Precision Math:** `java.math.BigDecimal`

---

## 3. Key Files & Modules Owned

```text
member-3-database-bidding-engine-developer/
├── docker-compose.yml
├── schema.sql
├── src/main/java/com/ipl/auction/
│   ├── model/
│   │   ├── User.java
│   │   ├── Team.java
│   │   ├── Player.java
│   │   ├── Bid.java
│   │   └── Auction.java
│   ├── repository/
│   │   ├── PlayerRepository.java (findByIdForUpdate)
│   │   ├── TeamRepository.java (findByIdForUpdate)
│   │   └── BidRepository.java
│   ├── service/
│   │   └── BidService.java (Core 4-rule bidding algorithm)
│   ├── controller/
│   │   └── BidController.java
│   ├── config/
│   │   └── WebSocketConfig.java
│   └── dto/
│       └── PlaceBidRequest.java
```

---

## 4. REST API Contracts Owned

| HTTP Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bids` | Submit a new live bid & broadcast to `/topic/bids` | Team Owner / Admin |
| `GET` | `/api/bids/player/{id}/highest` | Fetch the current leading bid on a player | Bearer |

---

## 5. Strict Inter-Member Boundaries

* ❌ **Must NOT Touch:**
  * Member 1: General team/player CRUD endpoints, squad limits (25 max, 8 overseas).
  * Member 2: Spring Security filter chain and JWT generation/validation logic.
  * Member 4: React frontend UI, CSS stylesheets, Orbit Arena component.
  * Member 5: Automated JUnit 5 unit tests, Swagger UI docs, GitHub Actions CI.

---

## 6. Execution Commands

```bash
# 1. Start MySQL 8 container
docker-compose up -d

# 2. Navigate to workspace
cd member-3-database-bidding-engine-developer

# 3. Compile & Run
./mvnw clean compile
./mvnw spring-boot:run
```

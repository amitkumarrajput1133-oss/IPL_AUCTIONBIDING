# ⚡ Member 3: Database & Bidding Engine Developer
> **Workspace Folder:** `team/member-3-database-bidding-engine-developer`  
> **Git Branch:** `feature/database-bidding`

---

## 1. 🌟 Who You Are & What You Do (In Simple Words)
You are the **Engine Mechanic & Vault Keeper** of the auction.  
Your job is to build the database tables, write the live bidding algorithm, and solve the hardest engineering problem in the whole project: **Race Conditions**. You make sure that when 10 teams click "Bid" at the exact same split-second, the system handles them one by one without corrupting the money.

---

## 2. 🛑 Strict Boundaries (What You Must NOT Touch)
Other members have their own jobs. Do not write code for:
- ❌ **Member 1's job:** Team or Player CRUD business logic or squad limits.
- ❌ **Member 2's job:** Spring Security filter chains or JWT token generation.
- ❌ **Member 4's job:** Frontend HTML, CSS, JavaScript, or React code.
- ❌ **Member 5's job:** Unit tests, Postman collections, or Swagger documentation.

---

## 3. 🛠️ Tools You Use
* **MySQL 8.0**: The main relational database.
* **Docker & Docker Compose**: Runs a ready-to-use MySQL container in 1 command (`docker-compose up -d`).
* **H2 In-Memory Database**: For instant zero-setup local runs.
* **Spring Data JPA & Hibernate**: Converts Java objects into database rows automatically.

---

## 4. 📁 Your Code Files & What They Do (In Plain English)

| File Path | What It Does Simply |
| :--- | :--- |
| `src/main/java/.../model/` (`User`, `Team`, `Player`, `Bid`, `Auction`) | The database blueprints. Defines table columns, foreign keys (`@ManyToOne`, `@OneToMany`), and uses `BigDecimal` for money. |
| `src/main/java/.../repository/PlayerRepository.java` | Contains `@Lock(LockModeType.PESSIMISTIC_WRITE)`. Tells the database: *"Lock this player row so nobody else can change their price until this bid is finished."* |
| `src/main/java/.../service/BidService.java` | The bidding brain. Checks: 1) Does team have enough budget? 2) Is new bid higher than current bid? 3) Is this team trying to outbid itself? 4) Is it above the base price? |
| `src/main/java/.../controller/BidController.java` | Provides URLs (`POST /api/v1/bids/place`, `GET /api/v1/bids/live/{playerId}`) for users to place and view bids. |
| `src/main/java/.../config/DataInitializer.java` | Seeds the database on startup with all **10 official IPL franchises** (₹100 Cr each), 11 users, and 23 star players. |
| `docker-compose.yml` | Starts MySQL 8.0 on port `3306` with username `auction_user`. |

---

## 5. 📦 Your `pom.xml` Dependencies (Explained in 1 Line Each)

```xml
<dependencies>
    <!-- 1. Hibernate & JPA: handles database tables and Pessimistic Row Locking -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- 2. The official MySQL driver to connect Java to the MySQL database -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- 3. In-memory database so the project can also run without installing MySQL -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- 4. WebSocket starter to push live bid prices to all connected screens -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
</dependencies>
```

---

## 6. 🌿 Git Commands You Need to Know

```bash
# 1. Switch to your feature branch
git checkout develop
git checkout -b feature/database-bidding

# 2. Check which files you changed
git status

# 3. Add your changes
git add src/ pom.xml docker-compose.yml

# 4. Save your changes with a clear message
git commit -m "feat(database): JPA entities, pessimistic row locking, and live bidding engine"

# 5. Send your branch to GitHub
git push origin feature/database-bidding
```

---

## 7. 🗣️ What to Say to Your Mentor (Your Speaking Script)
> *"Hello Sir. As Member 3 and Database & Bidding Engine Developer:  
> 1. I designed our relational database schema and JPA domain models: `User`, `Team`, `Player`, `Bid`, and `Auction`.  
> 2. I solved the critical concurrency problem using **Pessimistic Write Locking** (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) in `PlayerRepository`. This generates a native `SELECT ... FOR UPDATE` query in SQL, locking the player row so two bids placed at the exact same millisecond are processed sequentially without dirty reads.  
> 3. I implemented `BidService.java` with 4 strict validation rules: budget checks, minimum increment checks, anti-self outbidding, and base price floors.  
> 4. I also built `DataInitializer.java` to auto-seed all 10 IPL franchises with ₹100 Crore purse each and 23 marquee players."*

---

## 8. ❓ Questions the Mentor Can Ask You & Your Answers

* **Q1: Why did you choose Pessimistic Locking over Optimistic Locking?**  
  * **Answer:** *"In an auction with 10 teams bidding rapidly at the same second, Optimistic Locking (with version numbers) would cause constant rollbacks and failed clicks for users. Pessimistic Locking (`SELECT ... FOR UPDATE`) locks the row briefly at the database level, evaluates the bid, commits, and releases the lock smoothly without throwing rollback exceptions to the user."*

* **Q2: Why did you use `BigDecimal` instead of `double` or `float` for money?**  
  * **Answer:** *"In Java, `double` and `float` suffer from binary rounding errors (e.g. `100.0 - 0.2 = 99.80000000000001`). In an auction where budgets are ₹100 Crore, `BigDecimal` provides 100% exact mathematical accuracy."*

* **Q3: What prevents a team from outbidding itself?**  
  * **Answer:** *"In `BidService.java`, we check the highest bid in the database for that player. If `highestBid.getTeam().getId().equals(teamId)`, the system immediately rejects the bid with the message: 'You already hold the highest bid!'."*

* **Q4: How do you prevent a team from bidding if they don't have enough money?**  
  * **Answer:** *"Before saving any bid, we compare `team.getBudget().compareTo(amount)`. If the remaining purse is smaller than the bid amount, an exception is thrown and the transaction is aborted."*

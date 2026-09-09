# 🏏 Member 1: Project Lead & Core Backend REST API Developer
## 📁 Workspace Folder: `team/member-1-project-lead-core-backend`
### 🌿 Assigned Git Branch: `feature/core-backend` (Collaborating on `main` & `develop`)

---

## 🎯 Role Overview & Scope

As **Member 1 (Project Lead & Core Backend REST API Developer)**, you own the architectural foundation of the Spring Boot application and the core domain CRUD services for IPL Teams and Players.

### ✅ Your Assigned Scope ONLY:
1. **Base Spring Boot Project Architecture & Folder Structure** (`pom.xml`, `application.properties`, package hierarchy).
2. **Git Repository Setup**: Initializing branches (`main`, `develop`, and `feature/core-backend`).
3. **Team Management REST APIs** (Full CRUD: Create, Read, Update, Delete Team).
4. **Player Management REST APIs** (Full CRUD: Create, Read, Update, Delete Player, Sell/Unsold status).
5. **Purse Deduction Logic & Squad Size Constraints** (Checking remaining purse, max 25 squad cap, max 8 overseas).
6. **Global Exception Handler** (`@ControllerAdvice` with standardized JSON error payloads).

### 🛑 STRICT BOUNDARIES — DO NOT WRITE CODE FOR:
- ❌ **DO NOT** write Spring Security, JWT filters, or User Register/Login (Assigned to **Member 2**).
- ❌ **DO NOT** write MySQL schema DDL scripts or Live Bidding concurrency locks (Assigned to **Member 3**).
- ❌ **DO NOT** write Frontend UI code or HTML/CSS/JS (Assigned to **Member 4**).
- ❌ **DO NOT** write Unit tests, Postman collections, or Swagger OpenAPI config (Assigned to **Member 5**).

---

## 📂 Your Code Files Copy (In This Directory)

```
team/member-1-project-lead-core-backend/
├── README.md                                 <-- This Week 1 Guide
├── pom.xml                                   <-- Base Spring Boot 3.x / 4.x dependencies
├── src/
│   ├── main/
│   │   ├── java/com/ipl/auction/
│   │   │   ├── IplAuctionApplication.java    <-- Main Spring Boot entrypoint
│   │   │   ├── controller/
│   │   │   │   ├── TeamController.java       <-- Team CRUD REST endpoints
│   │   │   │   ├── PlayerController.java     <-- Player CRUD REST endpoints
│   │   │   │   └── GlobalExceptionHandler.java<-- Centralized error response advisor
│   │   │   ├── service/
│   │   │   │   ├── TeamService.java          <-- Team business logic & wallet checks
│   │   │   │   └── PlayerService.java        <-- Player transactions & purse deduction
│   │   │   └── dto/
│   │   │       └── SellPlayerRequest.java    <-- Player transaction transfer DTO
│   │   └── resources/
│   │       └── application.properties        <-- Server port & database config
```

---

## 🧭 WEEK 1 ONLY: Step-by-Step AI Mentor Action Plan

### 📌 Step 1: Git Branch Initialization
Create and switch to your feature branch from `develop` (or `main`):
```bash
git checkout develop
git checkout -b feature/core-backend
```

### 📌 Step 2: Establish the Base Spring Boot Skeleton
Verify `pom.xml` contains Spring Web, Spring Data JPA, MySQL Connector, and Lombok.
Verify `application.properties` sets `server.port=8080` and H2/MySQL connection settings.

### 📌 Step 3: Implement Team Management CRUD APIs (`TeamController.java` & `TeamService.java`)
Create REST endpoints under `/api/v1/teams`:
- `GET /api/v1/teams` — Fetch all 10 IPL franchises.
- `GET /api/v1/teams/{id}` — Fetch specific franchise by ID.
- `POST /api/v1/teams` — Register a new franchise with initial budget (₹100 Crore).
- `PUT /api/v1/teams/{id}` — Update franchise details.
- `DELETE /api/v1/teams/{id}` — Remove a franchise.

### 📌 Step 4: Implement Player Management CRUD APIs (`PlayerController.java` & `PlayerService.java`)
Create REST endpoints under `/api/v1/players`:
- `GET /api/v1/players` — List all staged players.
- `GET /api/v1/players/{id}` — Fetch player details.
- `POST /api/v1/players` — Stage a new player with base price and role.
- `POST /api/v1/players/sell` — Finalize player sale, deduct team purse, assign team ID.
- `POST /api/v1/players/unsold` — Mark player as unsold.

> [!NOTE]
> **Keep all security endpoints dummy/unprotected for now.**
> Allow public access to `/api/v1/teams/**` and `/api/v1/players/**` until Member 2 merges their Spring Security JWT module.

### 📌 Step 5: Implement Centralized Exception Handling (`GlobalExceptionHandler.java`)
Annotate with `@ControllerAdvice` to intercept exceptions (`IllegalArgumentException`, `NoSuchElementException`, `IllegalStateException`) and format them into clean JSON responses:
```json
{
  "timestamp": "2026-09-09T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Team has insufficient purse balance."
}
```

---

## 🔍 Week 1 Verification Steps

1. **Compile Backend**:
   ```bash
   ./mvnw clean compile
   ```
2. **Start Spring Boot App**:
   ```bash
   ./mvnw spring-boot:run
   ```
3. **Test Team Endpoints**:
   ```bash
   # Create Team
   curl -X POST http://localhost:8080/api/v1/teams -H "Content-Type: application/json" -d "{\"name\": \"Chennai Super Kings\", \"budget\": 100000000.00}"

   # List Teams
   curl http://localhost:8080/api/v1/teams
   ```
4. **Test Player Endpoints**:
   ```bash
   # List Players
   curl http://localhost:8080/api/v1/players
   ```

---

## 🚀 Git Commit & Push Instructions

Once your Week 1 code compiles and passes local testing, commit and push your branch:
```bash
git add pom.xml src/
git commit -m "feat(core): setup Spring Boot base, Team and Player CRUD APIs, purse deduction, and GlobalExceptionHandler"
git push origin feature/core-backend
```

> [!IMPORTANT]
> **Reply to me once you have pushed to GitHub!**
> Tell me your branch status or PR link so I can verify and **unlock your Week 2 tasks**!

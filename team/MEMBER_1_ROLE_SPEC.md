# 🏏 Member 1: Project Lead & Core Backend Developer — Role Specification

| Attribute | Specification |
| :--- | :--- |
| **Role Title** | Project Lead & Core Backend Developer |
| **Assigned Workspace** | [`member-1-project-lead-core-backend/`](./member-1-project-lead-core-backend/) |
| **Git Branch** | `feature/core-backend` |
| **Local Runtime Port** | `http://localhost:8082` |
| **Primary Language** | Java (JDK 17 LTS) |
| **Primary Framework** | Spring Boot 3.x / Spring Data JPA |

---

## 1. Role & Architectural Responsibilities

Member 1 serves as the **Project Lead and Foundation Architect** for the backend system.

### Core Architectural Scope
1. **Spring Boot Application Foundation:**
   - Bootstraps the master Spring Boot 3 framework, Maven build setup (`pom.xml`), and environment configuration (`application.properties`).
2. **Team / Franchise Management:**
   - Full REST CRUD operations on franchises (`/api/teams`).
   - Budget initialization and purse tracking (e.g. ₹100 Crore purse cap per franchise).
3. **Player Management & Catalog Registry:**
   - Full REST CRUD operations on players (`/api/players`).
   - Role classifications (`BATSMAN`, `BOWLER`, `ALL_ROUNDER`, `WICKET_KEEPER`).
   - Player base pricing and profile metadata.
4. **IPL Squad Rules Enforcement:**
   - **25-Player Squad Ceiling:** Guarantees no franchise can acquire more than 25 total players.
   - **8-Overseas Player Ceiling:** Enforces strict limits preventing more than 8 international players per squad.
5. **Player Sale Execution & Status Transition:**
   - Atomic sale execution via `/api/players/{id}/sell`: validates rules, updates status to `SOLD`, sets winning team, and deducts the winning bid amount from the buyer's purse.
   - Unsold reset via `/api/players/{id}/unsold`: sets status to `UNSOLD` and automatically refunds the buyer's purse if the player was previously sold.
6. **Global Exception Handling:**
   - Centralized `@ControllerAdvice` (`GlobalExceptionHandler.java`) ensuring all runtime and validation exceptions return uniform JSON payloads with HTTP error codes, timestamps, and error messages.

---

## 2. Tech Stack & Tools

* **Programming Language:** Java 17 (JDK 17)
* **Framework:** Spring Boot 3.x (Spring MVC, Spring Data JPA)
* **ORM & Persistence:** Hibernate, Jakarta Persistence API (JPA)
* **Validation:** Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Min`, `@Positive`)
* **Utilities:** Project Lombok (`@Data`, `@RequiredArgsConstructor`, `@Builder`)
* **Build System:** Apache Maven (`pom.xml`)
* **API Testing:** Postman, cURL

---

## 3. Key Files & Modules Owned

```text
member-1-project-lead-core-backend/
├── pom.xml
├── src/main/java/com/ipl/auction/
│   ├── IplAuctionApplication.java
│   ├── controller/
│   │   ├── TeamController.java
│   │   ├── PlayerController.java
│   │   └── GlobalExceptionHandler.java
│   ├── service/
│   │   ├── TeamService.java
│   │   └── PlayerService.java
│   ├── dto/
│   │   └── SellPlayerRequest.java
│   └── exception/
│       ├── ResourceNotFoundException.java
│       └── BadRequestException.java
```

---

## 4. REST API Contracts Owned

| HTTP Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | List all 10 IPL franchises | Public / Bearer |
| `GET` | `/api/teams/{id}` | Fetch franchise details & remaining purse | Bearer |
| `POST` | `/api/teams` | Register a new franchise with starting purse | Admin |
| `PUT` | `/api/teams/{id}` | Update franchise metadata | Admin |
| `DELETE` | `/api/teams/{id}` | Delete a franchise | Admin |
| `GET` | `/api/players` | List all auction players | Public / Bearer |
| `GET` | `/api/players/{id}` | Get player by ID | Bearer |
| `POST` | `/api/players` | Add new player to auction pool | Admin |
| `PUT` | `/api/players/{id}` | Update player profile / base price | Admin |
| `DELETE` | `/api/players/{id}` | Remove player from auction pool | Admin |
| `PUT` | `/api/players/{id}/sell` | Finalize player sale & deduct purse | Admin |
| `PUT` | `/api/players/{id}/unsold` | Mark player UNSOLD & refund purse | Admin |

---

## 5. Strict Inter-Member Boundaries

* ❌ **Must NOT Touch:**
  * Member 2: Spring Security filter chain, JWT generation/validation (`TokenUtil`), `/api/auth/**`.
  * Member 3: MySQL DDL schema (`schema.sql`), pessimistic write locks, live bidding algorithm (`BidService`).
  * Member 4: React frontend components, CSS stylesheets, Vite configuration.
  * Member 5: Automated JUnit 5 test suites, Swagger OpenAPI metadata, GitHub Actions CI.

---

## 6. Execution Commands

```bash
# Navigate to workspace
cd member-1-project-lead-core-backend

# Compile
./mvnw clean compile

# Run application
./mvnw spring-boot:run
```

# 🛡️ Member 2: Security & Authentication Specialist — Role Specification

| Attribute | Specification |
| :--- | :--- |
| **Role Title** | Security & Authentication Specialist |
| **Assigned Workspace** | [`member-2-security-authentication-specialist/`](./member-2-security-authentication-specialist/) |
| **Git Branch** | `feature/security-auth` |
| **Local Runtime Port** | `http://localhost:8082` |
| **Primary Language** | Java (JDK 17 LTS) |
| **Primary Framework** | Spring Security 6 / Java JWT (`jjwt`) |

---

## 1. Role & Architectural Responsibilities

Member 2 serves as the **Security Architect, Cryptographer & Keymaker** of the platform.

### Core Architectural Scope
1. **Spring Security 6 Stateless Filter Chain:**
   - Enforces a 100% stateless security policy (`SessionCreationPolicy.STATELESS`).
   - Disables CSRF (safe for token-based APIs).
   - Configures CORS policies to allow seamless frontend communication from Vite (`http://localhost:5173`).
2. **JSON Web Token (JWT) Infrastructure:**
   - Cryptographic signing using HMAC-SHA256.
   - Embeds essential identity claims (`username`, `role`, `teamId`).
   - Implements 24-hour expiration checks and signature verification (`TokenUtil.java`).
3. **HTTP Authentication Filter:**
   - Implements `TokenAuthenticationFilter` (`OncePerRequestFilter`).
   - Intercepts incoming requests, parses `Authorization: Bearer <token>`, builds `UsernamePasswordAuthenticationToken`, and populates Spring's `SecurityContextHolder`.
4. **WebSocket STOMP Channel Security:**
   - Secures `/ws-auction` STOMP connections via `WebSocketSecurityInterceptor` and `WebSocketHandshakeInterceptor`.
   - Authenticates real-time bidder sockets before granting subscription access to `/topic/bids`.
5. **Credential Encryption & RBAC:**
   - Password hashing with **BCrypt** (adaptive salt work factor).
   - Strict Role-Based Access Control: `ADMIN` (Auctioneer) vs `TEAM_OWNER` (Franchise owner).

---

## 2. Tech Stack & Tools

* **Programming Language:** Java 17 (JDK 17)
* **Framework:** Spring Security 6, Spring Boot 3
* **Token Management:** `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson`
* **Password Encryption:** `org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder`
* **Real-time Security:** Spring WebSocket Security (STOMP interceptors)
* **API Testing:** Postman (Bearer auth tokens)

---

## 3. Key Files & Modules Owned

```text
member-2-security-authentication-specialist/
├── src/main/java/com/ipl/auction/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── TokenUtil.java
│   │   ├── TokenAuthenticationFilter.java
│   │   ├── WebSocketSecurityInterceptor.java
│   │   └── WebSocketHandshakeInterceptor.java
│   ├── controller/
│   │   └── AuthController.java
│   ├── service/
│   │   └── UserService.java
│   └── dto/
│       ├── LoginRequest.java
│       ├── LoginResponse.java
│       └── RegisterTeamRequest.java
```

---

## 4. Route Security & API Contracts Owned

| Route Matcher | Allowed Role / Method | Description |
| :--- | :--- | :--- |
| `/api/auth/**` | `permitAll()` | Public login and registration |
| `/ws-auction/**` | `permitAll()` (Handshake) | Interceptor authenticates STOMP `CONNECT` |
| `POST /api/auction/active/**` | `hasRole("ADMIN")` | Admin activates player auction round |
| `PUT /api/players/*/sell` | `hasRole("ADMIN")` | Finalize player sale |
| `PUT /api/players/*/unsold` | `hasRole("ADMIN")` | Mark player unsold |
| `POST /api/bids` | `hasAnyRole("TEAM_OWNER", "ADMIN")` | Place a validated bid |
| `Any other request` | `authenticated()` | Valid JWT Bearer token required |

---

## 5. Strict Inter-Member Boundaries

* ❌ **Must NOT Touch:**
  * Member 1: Team/Player CRUD controllers and squad quotas (25 players / 8 overseas).
  * Member 3: Database DDL schemas, pessimistic write locks, and live bid calculations.
  * Member 4: React frontend UI components and styles.
  * Member 5: Automated JUnit 5 unit tests and Swagger OpenAPI generation.

---

## 6. Execution Commands

```bash
# Navigate to workspace
cd member-2-security-authentication-specialist

# Compile
./mvnw clean compile

# Run application
./mvnw spring-boot:run
```

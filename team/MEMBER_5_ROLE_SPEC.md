# 🧪 Member 5: QA, Testing & API Documentation Lead — Role Specification

| Attribute | Specification |
| :--- | :--- |
| **Role Title** | QA, Testing & API Documentation Lead |
| **Assigned Workspace** | [`member-5-qa-testing-api-documentation-lead/`](./member-5-qa-testing-api-documentation-lead/) |
| **Git Branch** | `feature/qa-testing-docs` |
| **Local Runtime Ports** | `http://localhost:8082` | Swagger UI: `http://localhost:8082/swagger-ui/index.html` |
| **Primary Languages** | Java (JDK 17 LTS), YAML, JSON |
| **Primary Framework** | JUnit 5 / Mockito / SpringDoc OpenAPI 3 / GitHub Actions |

---

## 1. Role & Architectural Responsibilities

Member 5 serves as the **Quality Guardian, Test Automation Architect & API Technical Writer**.

### Core Architectural Scope
1. **Interactive OpenAPI 3 / Swagger Documentation:**
   - Exposes interactive Swagger UI at `/swagger-ui/index.html` using `springdoc-openapi-starter-webmvc-ui`.
   - Configures JWT `BearerAuth` security scheme so team members and mentors can authorize and execute live REST requests directly in the browser (`OpenApiConfig.java`).
2. **Automated Unit & Service Test Harnesses:**
   - Authors high-coverage test suites in `BidServiceTest.java` and `PlayerServiceTest.java` using **JUnit 5** and **Mockito**.
   - Validates critical edge cases:
     - `testPlaceBid_Success`
     - `testPlaceBid_InsufficientBudget` (purse overdraft prevention)
     - `testPlaceBid_ConsecutiveBiddingFromSameTeam` (anti-self outbidding)
     - `testPlaceBid_BelowCurrentHighestBid`
     - `testPlaceBid_BelowBasePrice`
     - `testSellPlayer_ExceedMaxSquadLimit` (25-player ceiling)
     - `testSellPlayer_ExceedMaxOverseasLimit` (8-overseas ceiling)
     - `testMarkUnsold_RefundsBudget` (refund integrity)
3. **End-to-End Postman Automated Test Suite:**
   - Complete Postman collection (`IPL_Auction_System.postman_collection.json`) with environment configuration (`IPL_Auction_Environment.json`).
   - Automatically stores `jwt_token` variables on login and executes automated assertions (`pm.test`).
4. **Cloud CI/CD Pipeline Automation:**
   - Builds `.github/workflows/ci.yml` targeting `push` and `pull_request` on `main` and `develop`.
   - Executes `./mvnw clean test` inside an isolated `ubuntu-latest` runner with JDK 17 and Maven caching.
5. **Branch Governance:**
   - Implements `.github/CODEOWNERS` to enforce peer reviews and prevent unverified merges.

---

## 2. Tech Stack & Tools

* **Programming Languages:** Java 17, YAML, JSON
* **Testing Frameworks:** JUnit 5 (Jupiter), Mockito, AssertJ, Spring Boot Test
* **Documentation:** SpringDoc OpenAPI 3, Swagger UI
* **API Testing Suite:** Postman Collection Runner
* **CI/CD Automation:** GitHub Actions (Cloud Ubuntu Runner)

---

## 3. Key Files & Modules Owned

```text
member-5-qa-testing-api-documentation-lead/
├── config/
│   └── OpenApiConfig.java (Swagger UI & BearerAuth setup)
├── src/test/java/com/ipl/auction/service/
│   ├── BidServiceTest.java (Bidding edge-case tests)
│   └── PlayerServiceTest.java (Squad limits & refund tests)
├── postman/
│   ├── IPL_Auction_System.postman_collection.json
│   └── IPL_Auction_Environment.json
├── .github/
│   ├── workflows/
│   │   └── ci.yml (Cloud CI build & test runner)
│   └── CODEOWNERS (Branch review policy)
```

---

## 4. Strict Inter-Member Boundaries

* ❌ **Must NOT Touch:**
  * Member 1: Core Player/Team business controllers and logic.
  * Member 2: Spring Security filters, JWT signing logic.
  * Member 3: MySQL schemas, Docker Compose, Pessimistic locking implementation.
  * Member 4: React UI components, CSS styles, Orbit Arena.

---

## 5. Execution Commands

```bash
# Navigate to workspace
cd member-5-qa-testing-api-documentation-lead

# Run all automated tests
./mvnw clean test

# Run application to inspect Swagger UI
./mvnw spring-boot:run

# Open Swagger UI in browser:
# http://localhost:8082/swagger-ui/index.html
```

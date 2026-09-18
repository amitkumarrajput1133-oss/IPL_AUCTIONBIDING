# 🏏 Member 1: Project Lead & Core Backend REST API Developer
> **Workspace Folder:** `team/member-1-project-lead-core-backend`  
> **Git Branch:** `feature/core-backend` (Collaborating on `main` and `develop`)

---

## 1. 🌟 Who You Are & What You Do (In Simple Words)
You are the **Captain and Foundation Builder** of the backend.  
Your job is to build the main skeleton of the Spring Boot application, handle **Team** and **Player** data, and enforce the official rules of the IPL (like maximum squad size and budget deductions).

---

## 2. 🛑 Strict Boundaries (What You Must NOT Touch)
Other members have their own jobs. Do not write code for:
- ❌ **Member 2's job:** Security, JWT tokens, Login or Registration APIs.
- ❌ **Member 3's job:** MySQL schema scripts, database row locking, or live bidding logic.
- ❌ **Member 4's job:** Frontend HTML, CSS, JavaScript, or React code.
- ❌ **Member 5's job:** Unit tests, Postman files, or Swagger documentation.

---

## 3. 🛠️ Tools You Use
* **Java 17 (JDK 17)**: The programming language.
* **Spring Boot 3.x / 4.x**: The backend framework that runs your web server.
* **Maven**: The build tool that downloads libraries and compiles code.
* **Postman / Browser**: To test your REST APIs.
* **VS Code / IntelliJ IDEA**: Your code editor.

---

## 4. 📁 Your Code Files & What They Do (In Plain English)

| File Path | What It Does Simply |
| :--- | :--- |
| `src/main/java/.../IplAuctionApplication.java` | The main starting point of the Spring Boot app. Contains `main()` method. |
| `src/main/java/.../controller/TeamController.java` | Provides URLs (`/api/v1/teams`) to Create, Read, Update, and Delete teams. |
| `src/main/java/.../service/TeamService.java` | Business logic for teams (checks starting budget of ₹100 Crore). |
| `src/main/java/.../controller/PlayerController.java` | Provides URLs (`/api/v1/players`) to list players, add players, or sell them. |
| `src/main/java/.../service/PlayerService.java` | Checks IPL squad rules: **max 25 players**, **max 8 overseas players**, and deducts purse on sale. |
| `src/main/java/.../controller/GlobalExceptionHandler.java` | Catches errors (like invalid input or not enough money) and sends a clean JSON error response instead of crashing the server. |
| `src/main/java/.../dto/SellPlayerRequest.java` | A small data box that transfers `playerId`, `teamId`, and `soldAmount`. |

---

## 5. 📦 Your `pom.xml` Dependencies (Explained in 1 Line Each)

```xml
<dependencies>
    <!-- 1. Lets you create REST API endpoints and controllers -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webmvc</artifactId>
    </dependency>

    <!-- 2. Checks incoming requests so team names and budgets cannot be null or negative -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- 3. Talks to the database so you can save and find Teams and Players -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- 4. Saves you from typing getters, setters, and constructors -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## 6. 🌿 Git Commands You Need to Know

```bash
# 1. Switch to your feature branch
git checkout develop
git checkout -b feature/core-backend

# 2. Check which files you changed
git status

# 3. Add your changes
git add src/ pom.xml

# 4. Save your changes with a clear message
git commit -m "feat(core): setup base Spring Boot, Team and Player CRUD, and purse deduction"

# 5. Send your branch to GitHub
git push origin feature/core-backend
```

---

## 7. 🗣️ What to Say to Your Mentor (Your Speaking Script)
> *"Hello Sir. As Member 1 and Project Lead:  
> 1. I initialized the Spring Boot project skeleton, package structure, and Maven dependencies.  
> 2. I built the complete REST APIs for Team Management and Player Management under `/api/v1/teams` and `/api/v1/players`.  
> 3. I implemented the core IPL squad validation logic in `PlayerService`: ensuring no team exceeds **25 total players** and no team signs more than **8 overseas players**.  
> 4. I also built the `GlobalExceptionHandler` with `@ControllerAdvice` so any bad request returns a clean error payload instead of a 500 server crash."*

---

## 8. ❓ Questions the Mentor Can Ask You & Your Answers

* **Q1: How do you enforce the 25-player and 8-overseas limits?**  
  * **Answer:** *"In `PlayerService`, before saving a player as SOLD, I use JPA repository count methods `countByTeamId(teamId)` and `countByTeamIdAndOverseasTrue(teamId)`. If either limit is reached, I throw an exception."*

* **Q2: Why do you need `GlobalExceptionHandler`?**  
  * **Answer:** *"Without it, Spring Boot sends ugly 500 error stack traces. With `@ControllerAdvice`, we catch exceptions and return neat JSON with a timestamp, HTTP status, and user-friendly error message."*

* **Q3: What happens to the team budget when a player is sold?**  
  * **Answer:** *"When `sellPlayer()` is called, we fetch the team, subtract the winning bid amount from `team.getBudget()`, and save the updated balance back to the database."*

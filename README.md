# TextTutor — AI-Powered Study & Active Recall Platform

TextTutor is a full-stack study assistant platform featuring document parsing, AI note generation, flashcards, interactive quizzes, context-aware AI chat assistant, study planner, and learning analytics.

---

## Architecture Overview

| Component | Technology | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.3.5, Spring Data JPA, Spring Security (JWT), MySQL | `8080` | REST API at `http://localhost:8080/api`. Handles authentication, notes, flashcards, quizzes, study plans, chat, and analytics. |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Lucide Icons, Recharts | `5173` | Modern SPA at `http://localhost:5173`. Proxies `/api/*` directly to `http://localhost:8080`. |
| **Legacy Prototype** | Node.js, Express, `server.ts` | `3000` | Prototype Express server (preserved for backward compatibility via `npm run dev:legacy`). |

> **Note on Directory Structure:**
> - The active, full-featured TextTutor React application lives in the **root** `src/` directory (launched via root `package.json` and `vite.config.ts`).
> - The `frontend/` folder contains an early landing-page skeleton. All primary development occurs from the root workspace.

---

## Prerequisites

1. **Java Development Kit (JDK 21)**
   - Verify: `java -version` (Must be Java 21)
2. **Node.js (v18+) & npm**
   - Verify: `node -v` and `npm -v`
3. **MySQL Server (8.0+)**
   - Service running on port `3306` with database `texttutor` created:
     ```sql
     CREATE DATABASE IF NOT EXISTS texttutor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

---

## Quick Start (Running Both Servers)

Run the backend and frontend concurrently in two separate terminal windows.

### Terminal 1: Start Backend (Port 8080)

```powershell
cd E:\Projects\TextTutor\backend
.\mvnw.cmd spring-boot:run
```

*Backend Health Check:* `http://localhost:8080/api/health`

### Terminal 2: Start Frontend (Port 5173)

```powershell
cd E:\Projects\TextTutor
npm run dev
```

*Frontend Application:* Open `http://localhost:5173` in your browser.

---

## npm Scripts Reference (Root `package.json`)

- `npm run dev` — Starts the primary Vite development server on `http://localhost:5173` with proxy to Spring Boot (`http://localhost:8080`).
- `npm run build` — Builds the production bundle of the React frontend (`dist/`).
- `npm run preview` — Previews the built production frontend locally.
- `npm run dev:legacy` — Runs the legacy Express prototype server on `http://0.0.0.0:3000`.
- `npm run build:legacy` — Builds both Vite and bundles `server.ts` to `dist/server.cjs`.
- `npm run start:legacy` — Starts the legacy bundled server from `dist/server.cjs`.

---

## Environment Configuration

### Backend (`backend/.env` or system environment variables)

```env
SPRING_PROFILES_ACTIVE=dev
DB_URL=jdbc:mysql://localhost:3306/texttutor?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`vite.config.ts` or root `.env`)

```env
VITE_BACKEND_URL=http://localhost:8080
```
Requests made to `/api/*` from the browser will be proxied automatically to `http://localhost:8080/api/*`.

---

## Spring Security & Password Notice

Spring Boot by default logs `Using generated security password: ...` when `spring-boot-starter-security` is on the classpath and no `UserDetailsService` bean is provided.

In TextTutor:
- Authentication is completely stateless JWT (`JwtAuthenticationFilter`).
- A `UserDetailsService` bean backed by `UserRepository.findByEmailIgnoreCase()` is configured in `SecurityConfig.java`. This suppresses the random generated password message safely without weakening or altering security.

---

## Troubleshooting & Port Conflicts

If you receive `EADDRINUSE: address already in use 0.0.0.0:3000` or `Port 24678 is already in use` or port 8080/5173 conflicts:

### 1. Identify Which Process is Holding the Port

Run in PowerShell:
```powershell
netstat -ano | Select-String ":3000|:5173|:8080|:24678"
```
The last column displays the Process ID (**PID**).

### 2. Terminate the Conflicting Process

```powershell
# Replace <PID> with the number from the netstat output
Stop-Process -Id <PID> -Force
```

### 3. Why Did Port 3000 and 24678 Collide?
- Port 3000 was used by the legacy Node/Express server (`server.ts`).
- When `server.ts` was started, it mounted Vite in middleware mode (`appType: "spa"`), which opened Vite's WebSocket HMR server on port `24678`.
- If the terminal was closed or the process kept running in the background, subsequent executions failed with `EADDRINUSE`.
- The fix is that `npm run dev` now runs standard Vite on port `5173`, avoiding `server.ts` and port 3000 entirely.

---

## Automated Tests & Build Verification

- **Run Backend Tests (21 automated tests):**
  ```powershell
  cd E:\Projects\TextTutor\backend
  .\mvnw.cmd test
  ```
- **Build Frontend Production Bundle:**
  ```powershell
  cd E:\Projects\TextTutor
  npm run build
  ```

# CAPITAL RUSH — IIIT KOTTAYAM

> **Tagline:** Think. Invest. Risk. Negotiate. Win.  
> **Organized by:** Finance & E-Cell, Indian Institute of Information Technology Kottayam  

**Live Public Deployment:** [https://society-lowest-tennessee-aircraft.trycloudflare.com](https://society-lowest-tennessee-aircraft.trycloudflare.com)  

---

## 🏆 Project Overview

**CAPITAL RUSH** is a full-stack financial strategy simulation web application custom-built for live college events (30–40 teams, ~10 administrators, 3 rounds, starting capital of ₹10,000 per team).

---

## ⚡ Live Demo Credentials

### 👥 Participant Accounts
- **Password (for all participants):** `student123`
- **Demo Emails:**
  - `rahul@iiitkottayam.ac.in` → **Team Alpha** (`CR-001`)
  - `aditya@iiitkottayam.ac.in` → **Team Alpha** (`CR-001`)
  - `rohan@iiitkottayam.ac.in` → **Team Alpha** (`CR-001`)
  - `priya@iiitkottayam.ac.in` → **Team Bravo** (`CR-002`)
  - `arjun@iiitkottayam.ac.in` → **Team Charlie** (`CR-003`)
  - `sneha@iiitkottayam.ac.in` → **Team Delta** (`CR-004`)
  - `vikram@iiitkottayam.ac.in` → **Team Titans** (`CR-005`)

*(Note: Multiple participants can belong to the same team. The financial balance belongs strictly to the TEAM, not individual users.)*

### 🛡️ Administrator Accounts
- **Password (for all admins):** `admin123`
- **Admin IDs:** `ADMIN01`, `ADMIN02`, `ADMIN03`, ... up to `ADMIN10`

---

## 🎮 3-Round Event Engine

### 📈 Round 1 — Investment Strategy
- Each team starts with **₹10,000** starting capital.
- **Rule:** Every team must keep at least **₹2,000 in Cash**.
- Allocation across 4 assets:
  - **Cash:** 0% return (liquid reserve)
  - **Bank:** Low risk with configurable fixed return (e.g. +5%)
  - **Stocks:** High-risk simulated market where administrators set market outcomes (e.g. +40%, +20%, -20%, -35%)
  - **Gold:** Commodity investment with configurable return (e.g. +8%)

### 🏅 Round 2 — Physical Challenges & Fast Scoring
- Real-world campus games conducted by organizers.
- **Sub-Second Admin Scoring:**
  - Admin scans the team's permanent QR code using mobile phone camera or enters Team ID (`CR-001`).
  - Inputs amount (e.g. ₹2,000).
  - Selects `ADD` (reward) or `SUBTRACT` (penalty).
  - Enters reason (e.g., "Round 2 Game Winner").
  - Confirms in 2 clicks.
  - Balances update atomically preventing race conditions even with 10 concurrent admins.

### 🤝 Round 3 — Direct Team-to-Team Negotiation
- Teams directly transfer capital to other teams to negotiate deals, alliances, or buyouts.
- **Mandatory Two-Step Confirmation Screen:**
  - Shows Sender Team, Receiver Team, Transfer Amount, Sender Post-Transfer Balance, and Receiver Post-Transfer Balance.
  - Overdraft protection: Prevents transfers exceeding available balance or outside Round 3.
  - Creates two linked immutable ledger records.

---

## 📊 Live Leaderboard & Projector Mode
- URL: `/leaderboard`
- Real-time WebSocket updates via Socket.IO.
- Ranked automatically by `Current Capital` descending.
- Shows Rank, Team, Capital, Net Profit/Loss, and Return %.
- Strict privacy: No participant emails, passwords, or admin tokens exposed.
- Dedicated **Projector Mode** button for campus auditorium screens.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 18, React Router v6, Tailwind CSS, Lucide Icons, HTML5-QRCode scanner, Canvas Confetti.
- **Backend:** Node.js, Express.js, Socket.IO.
- **Database:** MongoDB / Mongoose with dual-mode connection (external Atlas URI or embedded zero-config fallback engine).
- **Security:** Bcrypt password hashing, JWT stateless authentication, role-based middleware (`requireAdmin`, `requireParticipant`), atomic database increments (`$inc`).

---

## 🚀 Local Development Setup

```bash
# 1. Run Server
cd server
npm install
npm start

# 2. Run Client (Development)
cd ../client
npm install
npm run dev

# 3. Production Build
npm run build # (Server serves client/dist on port 5000)
```

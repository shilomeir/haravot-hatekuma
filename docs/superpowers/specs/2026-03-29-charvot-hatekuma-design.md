# חרבות התקומה — Design Specification
**Date:** 2026-03-29
**Status:** Approved

---

## 1. Overview

A Hebrew trivia game about IDF achievements during Operation Iron Swords (חרבות ברזל). The game is called **"חרבות התקומה"** (Swords of Revival). Players answer multiple-choice questions to earn points, level up through military ranks, unlock achievements, and compete with others.

**Core loop:** Play → Earn XP & coins → Rank up → Unlock content → Repeat

**Priority:** Multiplayer (מרובה מכשירים) is the #1 feature. The entire infrastructure — Supabase Realtime rooms, reconnection, server-authoritative sync — is built first and built robustly. All other modes are secondary.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | SSR, routing, server actions |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, consistent design system |
| Database | Supabase (Postgres + Realtime) | Auth, data, real-time multiplayer |
| State | Zustand | Lightweight client game state |
| Hosting | Vercel | Zero-config Next.js deploy |

---

## 3. Visual Design System

### Color Palette
- **Background:** `#f0f4fb` (light blue-white — Israeli flag feel)
- **Card/surface:** `#ffffff`
- **Navy (navbar, primary CTA):** `#0d2d6e`
- **Blue mid (interactive):** `#1a4b9c`
- **Blue accent:** `#2563eb`
- **Blue pale:** `#dbeafe`, `#eff6ff`
- **Success:** `#22c55e` / `#f0fdf4`
- **Error:** `#ef4444` / `#fef2f2`
- **Combo gold:** `#b45309` / `#fef3c7`
- **Text dark:** `#0f172a`
- **Text soft:** `#64748b`

### Typography
- Hebrew-first: system font stack (`-apple-system, 'Segoe UI', Arial`)
- Direction: `rtl` throughout
- Headings: weight 800–900
- Body: weight 600

### Component Language
- Cards: `border-radius: 20px`, subtle shadow, `border: 1px solid rgba(13,45,110,0.08)`
- Buttons: `border-radius: 13px`, gradient backgrounds
- Inputs/options: `border-radius: 13px`, hover lifts 2px left (RTL)
- Transitions: `0.15s` ease

---

## 4. Pages & Screens

### 4.1 Home Page (`/`)
Full-width layout with multiple columns showing:
- **Hero section:** Game title, start button, quick stats
- **Rank progression panel** (full rank ladder with face emojis)
- **Daily streak** (7-day week dots)
- **Game modes selector** (6 modes)
- **Leaderboard preview** (top 5)
- **Achievements grid** (locked/unlocked)
- **Daily challenge** card

### 4.2 Game Setup (`/game`)
- Choose game mode
- Enter name (single player) or create/join room (multiplayer)
- Select difficulty (easy / medium / hard)

### 4.3 Game Screen (`/game/[sessionId]`)
**Layout: single centered column, max 640px**

Top: compact stats bar (score, combo, correct/total, question number)

Game card contains:
- Timer bar (countdown number + progress bar)
- Question type badge (📅 תאריך, 👤 מי, 📍 איפה, ⚔️ ארגון, etc.)
- Question text (large, bold)
- 4 answer options (א, ב, ג, ד) with hover + selected + correct/wrong states
- Hints row (💡 רמז button, ❌ הסר תשובה button, progress pips)

After answer:
- Feedback banner (green correct / red wrong + explanation)
- "שאלה הבאה" button

In navbar only: small rank badge showing current rank emoji + title (e.g., "🧑‍🦱 טוראי") — no full rank panel on game screen.

### 4.4 Results Screen (`/game/[sessionId]/results`)
- Final score, accuracy, time
- XP gained, coins earned, rank-up animation if applicable
- Achievements unlocked
- Play again / back to home

### 4.5 Leaderboard (`/leaderboard`)
- Tabs: All / Easy / Medium / Hard
- Ranked list with avatar, name, score, rank title

### 4.6 Profile (`/profile`)
- Avatar (rank emoji), name, level, XP bar
- Stats: accuracy, total score, games played, rank position
- Achievements grid (all, locked/unlocked)
- Game history

### 4.7 Shop (`/shop`)
- Hints (💡): cost in coins
- Time extension (+5s): cost in coins
- Lives for Survival mode: cost in coins
- Cosmetic button skins: cost in gems
- Boosters (×2 points, slow time, partial reveal): cost in gems

---

## 5. Question System

### Data Model
```typescript
interface Question {
  id: string
  question: string         // Hebrew question text
  type: QuestionType       // date|figure|location|organization|sequence|goal|result|logic
  difficulty: 'easy' | 'medium' | 'hard'
  options: string[]        // exactly 4 options
  correctIndex: number     // 0–3
  explanation: string      // shown after answering
}

type QuestionType = 'date' | 'figure' | 'location' | 'organization' | 'sequence' | 'goal' | 'result' | 'logic'
```

### Type Distribution

All 8 types map to the 5 categories as follows:

| Category | Badge | Types Included | Share |
|---|---|---|---|
| Dates | 📅 | `date` | 40% |
| Figures | 👤 | `figure` | 20% |
| Location | 📍 | `location` | 15% |
| Organizations | ⚔️ | `organization` | 15% |
| Deep Understanding | 🧠 | `sequence`, `goal`, `result`, `logic` | 10% |

Within the Deep Understanding category the four types are served with equal weight (2.5% each).

### Initial Question Bank
Seeded from `questions.txt` (~40 questions). Structure: JSON array loaded into Supabase `questions` table.

### Distractor Engine
When generating distractors (wrong answers):
- Date questions → close dates (±2 weeks)
- Figure questions → figures from same organization
- Location questions → nearby geographic areas
- Event questions → same type of operation

---

## 6. Scoring System

### Base Points
| Result | Points |
|---|---|
| Correct answer | +100 |
| Incorrect | 0 |
| Timeout | 0 |

### Combo Multipliers
| Streak | Multiplier |
|---|---|
| 3 in a row | ×1.5 |
| 5 in a row | ×2 |

### Speed Bonus
- Answer in < 3 seconds → +50 points (flat, before combo multiplier)

### XP Awards
| Event | XP |
|---|---|
| Correct answer (easy) | +10 XP |
| Correct answer (medium) | +15 XP |
| Correct answer (hard) | +20 XP |
| Complete a full game | +25 XP bonus |
| Daily challenge completion | +50 XP bonus |
| Multiplayer victory | +40 XP bonus |

### Timer
- Easy: 30s per question
- Medium: 20s per question
- Hard: 15s per question

---

## 7. Currency System

### Coins 🪙
- Correct answer: +10 coins
- Combo multiplier applies
- Multiplayer victory: +100 coins
- Daily challenge: bonus coins

### Gems 💎
| Source | Amount |
|---|---|
| Achievement unlocked | Per achievement table (Section 13) |
| Win streak day 3 | 💎×2 |
| Win streak day 7 | 💎×5 |
| Win streak day 14 | 💎×10 |
| Multiplayer victory | 💎×3 |
| Special event (future) | Defined per event |

---

## 8. Game Modes

| Mode | Description |
|---|---|
| רגיל (Standard) | 10 questions, timer, standard scoring |
| בליץ (Blitz) | 10 questions, timer = 8s per question. Coins = `correct_streak × 5` per answer (so a 5-answer streak earns 5+10+15+20+25 = 75 coins). No combo XP multiplier in Blitz — speed is the reward. |
| הישרדות (Survival) | One wrong = game over, lives purchasable |
| זיכרון (Memory) | Card-flip matching: 8 pairs of cards face-down. Each card shows either a question or its correct answer. Player flips two cards per turn — if the question+answer pair matches, they stay face-up. Timer counts up. Score = 1000 − (time_seconds × 10). No wrong-answer penalty. Uses same question bank; only `date`+`figure` type questions used (cleaner short answers). Phase 1 scope: single-player only. |
| אתגר יומי (Daily) | One shared set of questions per day, global ranking |
| מרובה משתתפים (Multiplayer) | Real-time rooms via Supabase Realtime |

---

## 9. Multiplayer Architecture ⭐ TOP PRIORITY

**Use case:** Family members in separate safe rooms (ממדים) playing together over the internet during missile alerts — low latency, rock-solid reconnection, zero desync.

**Server-authoritative via Supabase Realtime (Postgres Changes + Broadcast)**

```
Room: {
  id: string (6-char code e.g. "ABC123")
  host_id: string
  state: 'waiting' | 'answering' | 'reveal' | 'transition' | 'finished'
  current_question_index: number
  question_ids: string[]       // pre-shuffled at room creation
  answers: { [user_id]: number } // selected option index
  transition_lock: boolean     // prevents double-trigger
  created_at: timestamp
}
```

**Room creation flow:**
1. Host clicks "מרובה מכשירים" → enters name → server creates room → receives 6-char code
2. Host shares code with family
3. Others enter code + name → join room (max 8 players)
4. Lobby shows all connected players with their rank emoji + name
5. Host clicks "התחל" → server sets state = `answering`, broadcasts question index 0

**Per-question flow:**
1. Server broadcasts: `{ type: 'question', index: N }`
2. All clients render question from pre-loaded `question_ids[N]`
3. Player selects answer → `POST /api/room/answer` → server saves to `answers`
4. Transition trigger: `Object.keys(answers).length === players.length` OR timer expires
5. Server sets `transition_lock = true` (prevents race), broadcasts reveal
6. All clients show correct answer + scores for 3 seconds
7. Server increments `current_question_index`, clears `answers`, sets state = `answering`

**Reconnection:**
- On reconnect, client calls `GET /api/room/[code]/state` → server returns full current state
- Client re-renders at correct question/phase without user intervention
- Player slot preserved for 60s disconnect grace period

**Resilience rules:**
- All answer submissions go through server route (never client-to-client)
- Buttons disabled immediately on click (debounce 300ms)
- `transition_lock` boolean in DB prevents double question-advance
- Heartbeat ping every 15s; server marks player inactive after 3 missed pings

**Scoring in multiplayer:**
- Same base points (+100 correct) + combo multiplier
- Speed bonus: fastest correct answer in the room gets extra +50 pts
- Final results screen: ranked list of all players with scores

---

## 10. Personalization Engine

Track per-user:
- Error rate per question type
- Average response time per type

Adjust:
- Weight question selection toward weak categories
- Slightly increase difficulty in weak areas after consistent correct answers

Storage: Supabase `user_stats` table, updated after each game.

---

## 11. Military Rank Progression

Ranks unlock via XP. Each rank has a distinct face emoji (younger → older).

| Rank (Hebrew) | XP Required | Face Emoji |
|---|---|---|
| טירון | 0 | 🧒 |
| טוראי | 100 | 🧑‍🦱 |
| רב טוראי | 300 | 👨 |
| סמל | 600 | 👨‍🦱 |
| רב סמל | 1,000 | 🧔 |
| סגן | 1,600 | 👮 |
| סרן | 2,400 | 👨‍✈️ |
| רב"ם | 3,500 | 🧔‍♂️ |
| סגן אלוף | 5,000 | 👨‍💼 |
| אלוף משנה | 7,000 | 🧓 |
| תת אלוף | 9,500 | 👴 |
| אלוף | 12,500 | 👴 (+ star) |
| רב אלוף | 16,000 | 🎖️ |

Rank shown in:
- Navbar: emoji + title only (compact)
- Home page: full rank panel with progress bar and next rank
- Profile: full detail

---

## 12. Daily Streak & Rewards

- Play at least 1 game per day to maintain streak
- Day 7 bonus: major reward (gems + coins)
- Visual: 7-day week dots in home and game screen mini-card
- Reset at midnight Israel time

---

## 13. Achievements

| Achievement | Condition | Reward |
|---|---|---|
| לוחם ראשון | Complete first game | 💎×2 |
| רצף של 5 | 5 correct in a row | 💎×3 |
| גיבור קרב | Complete hard difficulty | 💎×5 |
| מצטיין בסיסי | 10 correct on easy | 🪙×50 |
| אלוף בינוני | 10 correct on medium | 🪙×100 |
| היסטוריון | Answer 50 questions correctly | 💎×10 |
| מהיר כברק | Finish game in < 60s | 💎×5 |
| בלי עזרה | Complete game with no hints | 💎×5 |
| אלף ניצחונות | Earn 1000+ points in one game | 💎×8 |

---

## 14. Data Models (Supabase)

```sql
users          (id, name, email, xp, coins, gems, streak, last_played)
questions      (id, question, type, difficulty, options jsonb, correct_index, explanation)
game_sessions  (id, user_id, mode, difficulty, score, accuracy, created_at)
game_answers   (id, session_id, question_id, selected_index, correct, time_taken_ms)
rooms          (id, host_id, state, current_question_index, created_at)
room_players   (room_id, user_id, score, answers jsonb)
achievements   (id, user_id, achievement_key, unlocked_at, gems_reward int, coins_reward int)
user_stats     (user_id, question_type, total_attempts, correct_attempts, avg_time_ms)
leaderboard    (user_id, difficulty, score, created_at)  -- view/materialized
```

---

## 15. File Structure

```
/app
  /page.tsx                  ← Home
  /game
    /page.tsx                ← Setup (mode, difficulty, name)
    /[sessionId]
      /page.tsx              ← Game screen
      /results/page.tsx      ← Results
  /leaderboard/page.tsx
  /profile/page.tsx
  /shop/page.tsx
  /api
    /game/route.ts           ← Start session, get questions
    /answer/route.ts         ← Submit answer, score
    /room/route.ts           ← Create/join multiplayer room

/components
  /game
    /GameCard.tsx            ← Timer + question + options
    /AnswerOption.tsx
    /TimerBar.tsx
    /FeedbackBanner.tsx
    /StatsRow.tsx
    /HintsRow.tsx
  /home
    /HeroSection.tsx
    /RankPanel.tsx
    /StreakCard.tsx
    /ModesGrid.tsx
    /AchievementsGrid.tsx
  /layout
    /Navbar.tsx
    /RankBadge.tsx           ← Compact rank (game screen only)
  /ui                        ← shadcn/ui components

/lib
  /questions.ts              ← Question bank + selection logic
  /scoring.ts                ← Points, combos, coins
  /ranks.ts                  ← Rank thresholds + emoji map
  /supabase.ts               ← Client + server clients

/store
  /gameStore.ts              ← Zustand: active session state

/data
  /questions.json            ← Seeded from questions.txt
```

---

## 16. Authentication & Identity

**Supabase Auth — anonymous + Google sign-in**

- On first visit: Supabase `signInAnonymously()` creates a guest session. User enters a display name (stored in `users.name`). This name is used for leaderboard and multiplayer rooms.
- Optional upgrade: user can sign in with Google OAuth to persist progress across devices.
- Anonymous users get a stable UUID from Supabase Auth — used as `user_id` in all tables.
- Multiplayer rooms use this `user_id` for room attribution and reconnection.
- Auth state managed via `@supabase/ssr` in Next.js middleware.

---

## 17. Key Constraints

- All text Hebrew, direction RTL
- No open-ended answers — always exactly 4 options
- Buttons debounced + disabled after selection (no double-click)
- Server-authoritative for multiplayer (no local state for progression)
- Mobile-friendly (max-width 640px centered on game screen)
- Questions seeded from provided `questions.txt` file (~40 questions)

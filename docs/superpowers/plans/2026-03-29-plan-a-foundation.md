# חרבות התקומה — Plan A: Foundation + Single-Player Game

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fully deployable Next.js trivia game with Hebrew UI, Supabase backend, anonymous auth, single-player game modes (Standard, Blitz, Survival, Memory, Daily), scoring with combos, rank progression, and Vercel deployment.

**Architecture:** Next.js 15 App Router with Tailwind + shadcn/ui for UI; Supabase for auth (anonymous + Google), Postgres data, and Realtime (used in Plan B); Zustand for client game state. Game logic lives in `/lib`; all mutations go through Server Actions or Route Handlers.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase (`@supabase/ssr`), Zustand, Vitest (unit tests)

**Design system:** Blue/white military palette. Background `#f0f4fb`, navy navbar `#0d2d6e`, interactive blue `#1a4b9c`. RTL Hebrew throughout. See spec §3.

---

## File Map

```
app/
  layout.tsx                        ← Root layout, Navbar, RTL dir
  page.tsx                          ← Home page
  game/
    page.tsx                        ← Setup: mode + difficulty + name
    [sessionId]/
      page.tsx                      ← Game screen (client component)
      results/page.tsx              ← Results screen
  leaderboard/page.tsx              ← Leaderboard
  api/
    auth/callback/route.ts          ← Supabase OAuth callback
    game/route.ts                   ← POST: start session → returns sessionId + questions
    answer/route.ts                 ← POST: submit answer → returns correct, score delta

components/
  layout/
    Navbar.tsx                      ← Top nav with logo, links, RankBadge
    RankBadge.tsx                   ← Compact rank emoji + title for navbar
  home/
    HeroSection.tsx                 ← Title, CTA buttons
    RankPanel.tsx                   ← Full rank ladder (home only)
    StreakCard.tsx                  ← 7-day streak dots
    ModesGrid.tsx                   ← 6 mode buttons
    AchievementsGrid.tsx            ← Locked/unlocked grid
    LeaderboardPreview.tsx          ← Top 5
  game/
    StatsRow.tsx                    ← Score / combo / correct / Q number
    GameCard.tsx                    ← Wraps timer + question + options + hints
    TimerBar.tsx                    ← Countdown number + progress bar
    QuestionDisplay.tsx             ← Type badge + question text
    AnswerOption.tsx                ← Single option button (א/ב/ג/ד)
    HintsRow.tsx                    ← Hint + remove buttons + pip progress
    FeedbackBanner.tsx              ← Correct/wrong result + explanation + next btn

lib/
  supabase/
    client.ts                       ← createBrowserClient()
    server.ts                       ← createServerClient() for Server Components
    middleware.ts                   ← refreshSession helper for proxy.ts
  questions.ts                      ← selectQuestions(mode, difficulty, n) → Question[]
  scoring.ts                        ← calcScore(), calcCombo(), calcCoins(), calcXP()
  ranks.ts                          ← getRank(xp), RANKS array, nextRank(xp)
  modes.ts                          ← MODES config (timer, questionCount per mode)

store/
  gameStore.ts                      ← Zustand: sessionId, questions[], currentIndex,
                                       answers[], score, combo, coins, timeLeft

data/
  questions.json                    ← ~40 questions seeded from questions.txt

middleware.ts                        ← Auth session refresh (Next.js 15 standard location)
supabase/
  migrations/
    001_initial.sql                 ← All tables + RLS policies
  seed.sql                          ← Question data from questions.json

__tests__/
  lib/scoring.test.ts
  lib/ranks.test.ts
  lib/questions.test.ts
```

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `proxy.ts`

- [ ] **Step 1.1: Create Next.js app**
```bash
cd "C:/Users/nerya/OneDrive/שולחן העבודה/עבודות שילה AI/Claude/חרבות התקומה"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 1.2: Install dependencies**
```bash
npm install @supabase/ssr @supabase/supabase-js zustand
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 1.3: Install shadcn/ui**
```bash
npx shadcn@latest init --yes --base-color slate
npx shadcn@latest add button card badge progress separator tabs
```

- [ ] **Step 1.4: Set RTL + Hebrew font in `app/layout.tsx`**
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'חרבות התקומה',
  description: 'משחק טריוויה על ניצחונות חרבות ברזל',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-[#f0f4fb] text-[#0f172a] min-h-screen antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 1.5: Add `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 1.6: Add `__tests__/setup.ts`**
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 1.7: Add test script to `package.json`**
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 1.8: Commit**
```bash
git add -A && git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn, Supabase, Vitest"
```

---

## Task 2: Core Business Logic (TDD)

**Files:**
- Create: `data/questions.json`
- Create: `lib/ranks.ts`, `lib/scoring.ts`, `lib/questions.ts`, `lib/modes.ts`
- Create: `__tests__/lib/ranks.test.ts`, `__tests__/lib/scoring.test.ts`, `__tests__/lib/questions.test.ts`

- [ ] **Step 2.1: Create `data/questions.json`** — convert `questions.txt` to full JSON with type, difficulty, explanation

```json
[
  {
    "id": "q001",
    "question": "מתי החל התמרון הקרקעי בעזה?",
    "type": "date",
    "difficulty": "easy",
    "options": ["27.10.23", "25.10.23", "30.10.23", "01.11.23"],
    "correctIndex": 0,
    "explanation": "התמרון הקרקעי של צה\"ל ברצועת עזה החל בלילה שבין ה-27 ל-28 באוקטובר 2023."
  },
  {
    "id": "q002",
    "question": "מי חוסל בביירות בינואר 2024?",
    "type": "figure",
    "difficulty": "easy",
    "options": ["סאלח אל-עארורי", "יחיא סינוואר", "חסן נסראללה", "מרואן עיסא"],
    "correctIndex": 0,
    "explanation": "סאלח אל-עארורי, סגן ראש הלשכה המדינית של חמאס, חוסל בביירות ב-2 בינואר 2024."
  },
  {
    "id": "q003",
    "question": "איזה ארגון שולט בעזה?",
    "type": "organization",
    "difficulty": "easy",
    "options": ["חמאס", "חיזבאללה", "איראן", "סוריה"],
    "correctIndex": 0,
    "explanation": "חמאס שולט ברצועת עזה מאז 2007."
  },
  {
    "id": "q004",
    "question": "איפה חוסל איסמעיל הנייה?",
    "type": "location",
    "difficulty": "medium",
    "options": ["טהרן", "דמשק", "עזה", "ביירות"],
    "correctIndex": 0,
    "explanation": "איסמעיל הנייה, ראש הלשכה המדינית של חמאס, חוסל בטהרן ביולי 2024."
  },
  {
    "id": "q005",
    "question": "איזה מבצע חילץ 4 חטופים ביוני 2024?",
    "type": "goal",
    "difficulty": "medium",
    "options": ["ארנון", "עם כלביא", "חץ הבשן", "שאגת הארי"],
    "correctIndex": 0,
    "explanation": "מבצע ארנון שחרר 4 חטופים מנוסיירת ב-8 ביוני 2024."
  },
  {
    "id": "q006",
    "question": "מי היה מנהיג חמאס שחוסל באוקטובר 2024?",
    "type": "figure",
    "difficulty": "easy",
    "options": ["יחיא סינוואר", "אבו מאזן", "חסן נסראללה", "מוחמד דף"],
    "correctIndex": 0,
    "explanation": "יחיא סינוואר, ראש חמאס ברצועת עזה, חוסל על ידי צה\"ל ב-17 באוקטובר 2024."
  },
  {
    "id": "q007",
    "question": "מה קרה קודם?",
    "type": "sequence",
    "difficulty": "hard",
    "options": ["חיסול עיסא", "חיסול נסראללה", "מתקפת איראן", "שאגת הארי"],
    "correctIndex": 0,
    "explanation": "מרואן עיסא חוסל במרץ 2024, לפני מתקפת הטילים האיראנית באפריל 2024."
  },
  {
    "id": "q008",
    "question": "איזה ארגון קשור לכוח רדואן?",
    "type": "organization",
    "difficulty": "medium",
    "options": ["חיזבאללה", "חמאס", "איראן", "דאעש"],
    "correctIndex": 0,
    "explanation": "כוח רדואן הוא היחידה העילית של ארגון חיזבאללה."
  },
  {
    "id": "q009",
    "question": "איפה ממוקמת חאן יונס?",
    "type": "location",
    "difficulty": "easy",
    "options": ["רצועת עזה", "לבנון", "סוריה", "איראן"],
    "correctIndex": 0,
    "explanation": "חאן יונס היא עיר בדרום רצועת עזה."
  },
  {
    "id": "q010",
    "question": "מה הייתה מטרת מבצע 'עם כלביא'?",
    "type": "goal",
    "difficulty": "hard",
    "options": ["פגיעה במשגרי טילים", "חילוץ חטופים", "הגנה אווירית", "אימון כוחות"],
    "correctIndex": 0,
    "explanation": "מבצע 'עם כלביא' כוון להשמדת תשתיות משגרי טילים של חיזבאללה בלבנון."
  },
  {
    "id": "q011",
    "question": "איזה מבצע תקף מטרות בתימן?",
    "type": "goal",
    "difficulty": "hard",
    "options": ["יד ארוכה", "ארנון", "חיצי הצפון", "שאגת הארי"],
    "correctIndex": 0,
    "explanation": "ישראל תקפה מטרות חות'ים בתימן במסגרת מבצע 'יד ארוכה'."
  },
  {
    "id": "q012",
    "question": "מי חוסל בדמשק באפריל 2024?",
    "type": "figure",
    "difficulty": "hard",
    "options": ["מוחמד רזא זאהדי", "יחיא סינוואר", "איסמעיל הנייה", "חסן נסראללה"],
    "correctIndex": 0,
    "explanation": "מוחמד רזא זאהדי, מפקד בכיר של משמרות המהפכה האיראנית, חוסל בדמשק באפריל 2024."
  },
  {
    "id": "q013",
    "question": "באיזה תאריך נקרא 'ליל הכטבמים'?",
    "type": "date",
    "difficulty": "hard",
    "options": ["14.04.24", "10.04.24", "01.05.24", "20.04.24"],
    "correctIndex": 0,
    "explanation": "בליל ה-14 באפריל 2024 יירטה ישראל מאות כטב\"מים וטילים שנורו מאיראן."
  },
  {
    "id": "q014",
    "question": "באיזה אזור פועל חיזבאללה בעיקר?",
    "type": "location",
    "difficulty": "easy",
    "options": ["לבנון", "עזה", "סיני", "ירדן"],
    "correctIndex": 0,
    "explanation": "חיזבאללה הוא ארגון טרור לבנוני הפועל בעיקר בלבנון."
  },
  {
    "id": "q015",
    "question": "איזה מבצע כלל פיצוץ מכשירי ביפר?",
    "type": "goal",
    "difficulty": "medium",
    "options": ["מבצע הביפרים", "עם כלביא", "חץ הבשן", "ארנון"],
    "correctIndex": 0,
    "explanation": "במבצע חסר תקדים פוצצו אלפי מכשירי ביפר של חיזבאללה בספטמבר 2024."
  },
  {
    "id": "q016",
    "question": "מי חוסל בטהרן ביולי 2024?",
    "type": "figure",
    "difficulty": "medium",
    "options": ["איסמעיל הנייה", "מרואן עיסא", "סאלח אל-עארורי", "מוחמד קובייסי"],
    "correctIndex": 0,
    "explanation": "איסמעיל הנייה, ראש הלשכה המדינית של חמאס, חוסל בטהרן ב-31 ביולי 2024."
  },
  {
    "id": "q017",
    "question": "מה הייתה תוצאה המרכזית של מבצע 'עם כלביא'?",
    "type": "result",
    "difficulty": "hard",
    "options": ["השמדת מערך משגרי טילים", "כיבוש עזה", "הסכם שלום", "נסיגה ישראלית"],
    "correctIndex": 0,
    "explanation": "מבצע 'עם כלביא' השמיד אלפי משגרי טילים של חיזבאללה בלבנון."
  },
  {
    "id": "q018",
    "question": "מהו שמו של הגוף הצבאי האיראני הבכיר?",
    "type": "organization",
    "difficulty": "medium",
    "options": ["משמרות המהפכה האסלאמית", "חמאס", "חיזבאללה", "פת\"ח"],
    "correctIndex": 0,
    "explanation": "משמרות המהפכה האסלאמית (פסד\"ר) הוא הגוף הצבאי הבכיר של איראן."
  },
  {
    "id": "q019",
    "question": "מה קרה קודם?",
    "type": "sequence",
    "difficulty": "hard",
    "options": ["עסקת חטופים נובמבר 2023", "חיסול הנייה", "שאגת הארי", "מלחמת 12 ימים"],
    "correctIndex": 0,
    "explanation": "עסקת החטופים הראשונה הושלמה בנובמבר 2023, לפני כל שאר האירועים."
  },
  {
    "id": "q020",
    "question": "איזה אזור בתימן הותקף על ידי ישראל?",
    "type": "location",
    "difficulty": "hard",
    "options": ["חודיידה", "ביירות", "טהרן", "דמשק"],
    "correctIndex": 0,
    "explanation": "ישראל תקפה את נמל חודיידה בתימן בתגובה להתקפות החות'ים."
  },
  {
    "id": "q021",
    "question": "איזה מבצע גדול בוצע בלבנון ב-2024?",
    "type": "goal",
    "difficulty": "medium",
    "options": ["חיצי הצפון", "ארנון", "עם כלביא", "יד זהב"],
    "correctIndex": 0,
    "explanation": "מבצע 'חיצי הצפון' כלל מבצעים נרחבים נגד חיזבאללה בלבנון."
  },
  {
    "id": "q022",
    "question": "מי היה ראש ארגון חיזבאללה שחוסל ב-2024?",
    "type": "figure",
    "difficulty": "easy",
    "options": ["חסן נסראללה", "יחיא סינוואר", "איסמעיל הנייה", "סאלח אל-עארורי"],
    "correctIndex": 0,
    "explanation": "חסן נסראללה, מנהיג חיזבאללה כ-30 שנה, חוסל ב-27 בספטמבר 2024."
  },
  {
    "id": "q023",
    "question": "באיזה תאריך חוסל יחיא סינוואר?",
    "type": "date",
    "difficulty": "medium",
    "options": ["17.10.24", "10.10.24", "20.10.24", "01.11.24"],
    "correctIndex": 0,
    "explanation": "יחיא סינוואר חוסל ב-17 באוקטובר 2024 ברפיח."
  },
  {
    "id": "q024",
    "question": "מה הייתה מטרת מבצע ארנון?",
    "type": "goal",
    "difficulty": "medium",
    "options": ["חילוץ חטופים", "השמדת טילים", "תקיפת איראן", "כיבוש שטח"],
    "correctIndex": 0,
    "explanation": "מבצע ארנון שחרר 4 חטופים ישראלים שהוחזקו בנוסיירת."
  },
  {
    "id": "q025",
    "question": "באיזה אזור בלבנון ממוקם מטה חיזבאללה?",
    "type": "location",
    "difficulty": "medium",
    "options": ["הדאחייה בדרום ביירות", "צפון לבנון", "הבקעה", "צור"],
    "correctIndex": 0,
    "explanation": "הדאחייה היא הפרוור הדרומי של ביירות, ומשמשת כמטה חיזבאללה."
  },
  {
    "id": "q026",
    "question": "איזה מבצע השמיד מערכי משגרים?",
    "type": "result",
    "difficulty": "hard",
    "options": ["עם כלביא", "ארנון", "חץ הבשן", "יד ארוכה"],
    "correctIndex": 0,
    "explanation": "מבצע 'עם כלביא' השמיד את מרבית מערך המשגרים של חיזבאללה."
  },
  {
    "id": "q027",
    "question": "מי מהבאים קשור לחמאס ולא לחיזבאללה?",
    "type": "organization",
    "difficulty": "medium",
    "options": ["יחיא סינוואר", "חסן נסראללה", "חמינאי", "נעים קאסם"],
    "correctIndex": 0,
    "explanation": "יחיא סינוואר היה מנהיג חמאס. האחרים קשורים לחיזבאללה או לאיראן."
  },
  {
    "id": "q028",
    "question": "באיזה תאריך הוחל עסקת החטופים הראשונה?",
    "type": "date",
    "difficulty": "medium",
    "options": ["24.11.23", "20.11.23", "30.11.23", "01.12.23"],
    "correctIndex": 0,
    "explanation": "עסקת החטופים הראשונה נכנסה לתוקף ב-24 בנובמבר 2023."
  },
  {
    "id": "q029",
    "question": "מה היה הישג מבצע 'שאגת הארי'?",
    "type": "result",
    "difficulty": "hard",
    "options": ["פגיעה בכלי שיט חות'י", "חילוץ חטופים", "תקיפת גרעין", "כיבוש עזה"],
    "correctIndex": 0,
    "explanation": "מבצע 'שאגת הארי' כלל תקיפה ישראלית-אמריקאית של כלי שיט חות'ים בים האדום."
  },
  {
    "id": "q030",
    "question": "מי מנהיג איראן?",
    "type": "figure",
    "difficulty": "easy",
    "options": ["עלי חמינאי", "יחיא סינוואר", "חסן נסראללה", "איסמעיל הנייה"],
    "correctIndex": 0,
    "explanation": "עלי חמינאי הוא המנהיג העליון של איראן מאז 1989."
  },
  {
    "id": "q031",
    "question": "באיזה מבצע פעלה ישראל בסוריה?",
    "type": "goal",
    "difficulty": "hard",
    "options": ["חץ הבשן", "ארנון", "עם כלביא", "שאגת הארי"],
    "correctIndex": 0,
    "explanation": "ישראל ביצעה מבצעי תקיפה בסוריה במסגרת מבצע 'חץ הבשן'."
  },
  {
    "id": "q032",
    "question": "מה קרה קודם?",
    "type": "sequence",
    "difficulty": "hard",
    "options": ["חיסול אל-עארורי (ינואר 2024)", "חיסול הנייה (יולי 2024)", "שאגת הארי", "מלחמת 12 ימים"],
    "correctIndex": 0,
    "explanation": "אל-עארורי חוסל בינואר 2024, לפני הנייה (יולי 2024) ושאר האירועים."
  },
  {
    "id": "q033",
    "question": "באיזה אזור ממוקמת רפיח?",
    "type": "location",
    "difficulty": "easy",
    "options": ["דרום רצועת עזה", "ביירות", "טהרן", "דמשק"],
    "correctIndex": 0,
    "explanation": "רפיח ממוקמת בדרום רצועת עזה, על הגבול עם מצרים."
  },
  {
    "id": "q034",
    "question": "מי חוסל בדרום לבנון מקרב כוח רדואן?",
    "type": "figure",
    "difficulty": "hard",
    "options": ["פואד שוקר", "יחיא סינוואר", "מרואן עיסא", "איסמעיל הנייה"],
    "correctIndex": 0,
    "explanation": "פואד שוקר, מפקד כוח רדואן, חוסל בביירות ביולי 2024."
  },
  {
    "id": "q035",
    "question": "מה הייתה תוצאת 'מלחמת 12 הימים' עם לבנון?",
    "type": "result",
    "difficulty": "medium",
    "options": ["הסכם הפסקת אש", "כיבוש לבנון", "נסיגה ישראלית", "ניצחון חיזבאללה"],
    "correctIndex": 0,
    "explanation": "מלחמת 12 הימים הסתיימה בהסכם הפסקת אש שנחתם בנובמבר 2024."
  },
  {
    "id": "q036",
    "question": "איזה ארגון חות'י מאיים על ישראל מתימן?",
    "type": "organization",
    "difficulty": "medium",
    "options": ["אנסאר אללה (החות'ים)", "חמאס", "חיזבאללה", "פת\"ח"],
    "correctIndex": 0,
    "explanation": "אנסאר אללה, הידועים כחות'ים, ירו טילים וכטב\"מים לעבר ישראל מתימן."
  },
  {
    "id": "q037",
    "question": "מה קרה קודם — מבצע ארנון או חיסול סינוואר?",
    "type": "sequence",
    "difficulty": "medium",
    "options": ["מבצע ארנון (יוני 2024)", "חיסול סינוואר (אוקטובר 2024)", "שניהם יחד", "חיסול סינוואר קודם"],
    "correctIndex": 0,
    "explanation": "מבצע ארנון בוצע ביוני 2024, לפני חיסול סינוואר באוקטובר 2024."
  },
  {
    "id": "q038",
    "question": "מהו הישג ה'ליל הכטבמים'?",
    "type": "result",
    "difficulty": "medium",
    "options": ["יירוט של מעל 300 כטב\"מים וטילים", "חיסול מנהיג", "תקיפת גרעין", "כיבוש שטח"],
    "correctIndex": 0,
    "explanation": "בלילה של 14 באפריל 2024 יירטה ישראל מעל 300 כטב\"מים וטילים בליסטיים שנורו מאיראן."
  },
  {
    "id": "q039",
    "question": "מהו שמו של מבצע פיצוץ הביפרים?",
    "type": "goal",
    "difficulty": "hard",
    "options": ["לא קיבל שם רשמי", "מבצע ארנון", "מבצע עם כלביא", "מבצע חיצי הצפון"],
    "correctIndex": 0,
    "explanation": "מבצע פיצוץ הביפרים של חיזבאללה לא קיבל שם מבצעי רשמי שפורסם."
  },
  {
    "id": "q040",
    "question": "מה קרה קודם?",
    "type": "sequence",
    "difficulty": "hard",
    "options": ["חיסול עיסא (מרץ 2024)", "חיסול הנייה (יולי 2024)", "שאגת הארי (2025)", "מלחמת 12 ימים (2024)"],
    "correctIndex": 0,
    "explanation": "מרואן עיסא חוסל במרץ 2024 — הראשון בסדרת החיסולים."
  }
]
```

- [ ] **Step 2.2: Write failing tests for `lib/ranks.ts`**

Create `__tests__/lib/ranks.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getRank, getNextRank, RANKS } from '@/lib/ranks'

describe('getRank', () => {
  it('returns טירון for 0 XP', () => {
    expect(getRank(0).title).toBe('טירון')
    expect(getRank(0).emoji).toBe('🧒')
  })
  it('returns טוראי for 150 XP', () => {
    expect(getRank(150).title).toBe('טוראי')
  })
  it('returns רב אלוף for max XP', () => {
    expect(getRank(20000).title).toBe('רב אלוף')
  })
})

describe('getNextRank', () => {
  it('returns next rank for non-max XP', () => {
    const next = getNextRank(0)
    expect(next?.title).toBe('טוראי')
    expect(next?.xpRequired).toBe(100)
  })
  it('returns null at max rank', () => {
    expect(getNextRank(20000)).toBeNull()
  })
})

describe('RANKS', () => {
  it('has 13 ranks', () => { expect(RANKS).toHaveLength(13) })
  it('is sorted ascending by xpRequired', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].xpRequired).toBeGreaterThan(RANKS[i-1].xpRequired)
    }
  })
})
```

- [ ] **Step 2.3: Run — expect FAIL**
```bash
npm test
```
Expected: FAIL — `Cannot find module '@/lib/ranks'`

- [ ] **Step 2.4: Implement `lib/ranks.ts`**
```ts
export interface Rank {
  title: string
  emoji: string
  xpRequired: number
}

export const RANKS: Rank[] = [
  { title: 'טירון',       emoji: '🧒',      xpRequired: 0      },
  { title: 'טוראי',       emoji: '🧑‍🦱',  xpRequired: 100    },
  { title: 'רב טוראי',   emoji: '👨',      xpRequired: 300    },
  { title: 'סמל',         emoji: '👨‍🦱',  xpRequired: 600    },
  { title: 'רב סמל',     emoji: '🧔',      xpRequired: 1000   },
  { title: 'סגן',         emoji: '👮',      xpRequired: 1600   },
  { title: 'סרן',         emoji: '👨‍✈️', xpRequired: 2400   },
  { title: 'רב״ם',        emoji: '🧔‍♂️', xpRequired: 3500   },
  { title: 'סגן אלוף',   emoji: '👨‍💼',  xpRequired: 5000   },
  { title: 'אלוף משנה',  emoji: '🧓',      xpRequired: 7000   },
  { title: 'תת אלוף',    emoji: '👴',      xpRequired: 9500   },
  { title: 'אלוף',        emoji: '🎖️',    xpRequired: 12500  },
  { title: 'רב אלוף',    emoji: '🎖️',    xpRequired: 16000  },
]

export function getRank(xp: number): Rank {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (xp >= rank.xpRequired) current = rank
    else break
  }
  return current
}

export function getNextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (rank.xpRequired > xp) return rank
  }
  return null
}

export function getXpProgress(xp: number): { current: number; target: number; pct: number } {
  const rank = getRank(xp)
  const next = getNextRank(xp)
  if (!next) return { current: xp - rank.xpRequired, target: 1, pct: 100 }
  return {
    current: xp - rank.xpRequired,
    target: next.xpRequired - rank.xpRequired,
    pct: Math.round(((xp - rank.xpRequired) / (next.xpRequired - rank.xpRequired)) * 100),
  }
}
```

- [ ] **Step 2.5: Write failing tests for `lib/scoring.ts`**

Create `__tests__/lib/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calcScore, calcCombo, calcCoins, calcXP, COMBO_MULTIPLIER } from '@/lib/scoring'

describe('calcCombo', () => {
  it('returns ×1 for streak < 3', () => expect(calcCombo(2)).toBe(1))
  it('returns ×1.5 for streak 3-4', () => expect(calcCombo(3)).toBe(1.5))
  it('returns ×2 for streak ≥ 5', () => expect(calcCombo(5)).toBe(2))
  it('returns ×2 for streak 10', () => expect(calcCombo(10)).toBe(2))
})

describe('calcScore', () => {
  it('returns 100 for correct, no speed bonus, combo 1', () => {
    expect(calcScore({ correct: true, timeTakenMs: 5000, streak: 1 })).toBe(100)
  })
  it('applies speed bonus for < 3s answer', () => {
    expect(calcScore({ correct: true, timeTakenMs: 2000, streak: 1 })).toBe(150)
  })
  it('applies combo multiplier', () => {
    expect(calcScore({ correct: true, timeTakenMs: 5000, streak: 3 })).toBe(150)
  })
  it('applies both speed + combo', () => {
    expect(calcScore({ correct: true, timeTakenMs: 2000, streak: 3 })).toBe(225)
  })
  it('returns 0 for wrong answer', () => {
    expect(calcScore({ correct: false, timeTakenMs: 1000, streak: 5 })).toBe(0)
  })
})

describe('calcXP', () => {
  it('returns 10 for easy correct', () => expect(calcXP('easy', true)).toBe(10))
  it('returns 15 for medium correct', () => expect(calcXP('medium', true)).toBe(15))
  it('returns 20 for hard correct', () => expect(calcXP('hard', true)).toBe(20))
  it('returns 0 for wrong', () => expect(calcXP('easy', false)).toBe(0))
})

describe('calcCoins', () => {
  it('returns 10 for correct, combo 1', () => {
    expect(calcCoins({ correct: true, streak: 1 })).toBe(10)
  })
  it('applies combo to coins', () => {
    expect(calcCoins({ correct: true, streak: 3 })).toBe(15)
  })
  it('returns 0 for wrong', () => {
    expect(calcCoins({ correct: false, streak: 5 })).toBe(0)
  })
})

describe('calcBlitzCoins', () => {
  it('returns streak×5 coins', () => {
    expect(calcBlitzCoins(1)).toBe(5)
    expect(calcBlitzCoins(3)).toBe(15)
    expect(calcBlitzCoins(5)).toBe(25)
  })
  it('returns 0 for streak 0', () => {
    expect(calcBlitzCoins(0)).toBe(0)
  })
})
```

- [ ] **Step 2.6: Implement `lib/scoring.ts`**
```ts
export const COMBO_MULTIPLIER = { 1: 1, 3: 1.5, 5: 2 } as const
const SPEED_BONUS_MS = 3000
const SPEED_BONUS_PTS = 50
const BASE_POINTS = 100
const BASE_COINS = 10

export function calcCombo(streak: number): number {
  if (streak >= 5) return 2
  if (streak >= 3) return 1.5
  return 1
}

export function calcScore(params: { correct: boolean; timeTakenMs: number; streak: number }): number {
  if (!params.correct) return 0
  const combo = calcCombo(params.streak)
  const speed = params.timeTakenMs < SPEED_BONUS_MS ? SPEED_BONUS_PTS : 0
  return Math.round((BASE_POINTS + speed) * combo)
}

export function calcXP(difficulty: 'easy' | 'medium' | 'hard', correct: boolean): number {
  if (!correct) return 0
  return { easy: 10, medium: 15, hard: 20 }[difficulty]
}

export function calcCoins(params: { correct: boolean; streak: number }): number {
  if (!params.correct) return 0
  return Math.round(BASE_COINS * calcCombo(params.streak))
}

export function calcBlitzCoins(streak: number): number {
  // Blitz: streak * 5 coins per correct answer
  return streak * 5
}
```

- [ ] **Step 2.7: Write failing tests for `lib/questions.ts`**

Create `__tests__/lib/questions.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { selectQuestions, getQuestionsByType } from '@/lib/questions'

describe('selectQuestions', () => {
  it('returns exactly n questions', () => {
    const qs = selectQuestions({ difficulty: 'easy', n: 5 })
    expect(qs).toHaveLength(5)
  })
  it('filters by difficulty', () => {
    const qs = selectQuestions({ difficulty: 'hard', n: 5 })
    qs.forEach(q => expect(q.difficulty).toBe('hard'))
  })
  it('each question has exactly 4 options', () => {
    const qs = selectQuestions({ n: 10 })
    qs.forEach(q => expect(q.options).toHaveLength(4))
  })
  it('returns no duplicates', () => {
    const qs = selectQuestions({ n: 10 })
    const ids = qs.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getDailyQuestions', () => {
  it('returns exactly 10 questions', () => {
    expect(getDailyQuestions()).toHaveLength(10)
  })
  it('returns the same questions when called twice on same day', () => {
    const a = getDailyQuestions().map(q => q.id)
    const b = getDailyQuestions().map(q => q.id)
    expect(a).toEqual(b)
  })
  it('returns no duplicates', () => {
    const ids = getDailyQuestions().map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2.8: Implement `lib/questions.ts`**
```ts
import allQuestions from '@/data/questions.json'

export interface Question {
  id: string
  question: string
  type: 'date' | 'figure' | 'location' | 'organization' | 'sequence' | 'goal' | 'result' | 'logic'
  difficulty: 'easy' | 'medium' | 'hard'
  options: string[]
  correctIndex: number
  explanation: string
}

const QUESTIONS: Question[] = allQuestions as Question[]

export function selectQuestions(params: {
  difficulty?: 'easy' | 'medium' | 'hard'
  n?: number
  excludeIds?: string[]
}): Question[] {
  const { difficulty, n = 10, excludeIds = [] } = params
  let pool = QUESTIONS.filter(q => !excludeIds.includes(q.id))
  if (difficulty) pool = pool.filter(q => q.difficulty === difficulty)
  // Fisher-Yates shuffle
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

export function getQuestionsByType(type: Question['type']): Question[] {
  return QUESTIONS.filter(q => q.type === type)
}

// Mulberry32 — fast seeded PRNG (avoids j=0 bug of naive modulo)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getDailyQuestions(): Question[] {
  const today = new Date().toISOString().slice(0, 10) // "2024-10-17"
  const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = mulberry32(seed)
  const shuffled = [...QUESTIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 10)
}
```

- [ ] **Step 2.9: Run tests — expect all PASS**
```bash
npm test
```

- [ ] **Step 2.10: Create `lib/modes.ts`**
```ts
export interface ModeConfig {
  id: string
  label: string
  emoji: string
  description: string
  timerSeconds: number
  questionCount: number
  blitz: boolean
  survival: boolean
}

export const MODES: ModeConfig[] = [
  { id: 'standard', label: 'רגיל',    emoji: '📚', description: '10 שאלות, טיימר סטנדרטי', timerSeconds: 20, questionCount: 10, blitz: false, survival: false },
  { id: 'blitz',    label: 'בליץ',    emoji: '⚡', description: 'שאלות מהירות, 8 שניות',   timerSeconds: 8,  questionCount: 10, blitz: true,  survival: false },
  { id: 'survival', label: 'הישרדות', emoji: '❤️', description: 'טעות אחת = סיום',        timerSeconds: 20, questionCount: 999, blitz: false, survival: true  },
  { id: 'memory',   label: 'זיכרון',  emoji: '🃏', description: 'התאמת זוגות',            timerSeconds: 0,  questionCount: 8,  blitz: false, survival: false },
  { id: 'daily',    label: 'אתגר יומי', emoji: '📅', description: 'שאלות יומיות משותפות', timerSeconds: 20, questionCount: 10, blitz: false, survival: false },
  { id: 'multi',    label: 'מרובה',   emoji: '🌐', description: 'שחק עם חברים',           timerSeconds: 20, questionCount: 10, blitz: false, survival: false },
]
```

- [ ] **Step 2.11: Commit**
```bash
git add -A && git commit -m "feat: add question bank, scoring, ranks, modes — all tests passing"
```

---

## Task 3: Supabase Setup

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- Create: `proxy.ts`
- Create: `supabase/migrations/001_initial.sql`
- Create: `.env.local.example`

- [ ] **Step 3.1: Create Supabase project**

Go to https://supabase.com → New project → copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`

- [ ] **Step 3.2: Create `.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 3.3: Create `lib/supabase/client.ts`**
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3.4: Create `lib/supabase/server.ts`**
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3.5: Create `middleware.ts`** at project root (Next.js 15 — NOT proxy.ts)
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 3.6: Create `supabase/migrations/001_initial.sql`**
```sql
-- Enable UUID
create extension if not exists "uuid-ossp";

-- Users (extended profile on top of auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'שחקן',
  xp integer not null default 0,
  coins integer not null default 0,
  gems integer not null default 0,
  streak integer not null default 0,
  last_played date,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
create policy "Users can insert own data" on public.users for insert with check (auth.uid() = id);
create policy "Public leaderboard read" on public.users for select using (true);

-- Game sessions
create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null,
  difficulty text not null default 'mixed',
  score integer not null default 0,
  correct_count integer not null default 0,
  total_count integer not null default 0,
  xp_earned integer not null default 0,
  coins_earned integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.game_sessions enable row level security;
create policy "Users can manage own sessions" on public.game_sessions for all using (auth.uid() = user_id);

-- Game answers
create table if not exists public.game_answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id text not null,
  selected_index integer,
  correct boolean not null,
  time_taken_ms integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.game_answers enable row level security;
create policy "Users can manage own answers" on public.game_answers
  for all using (
    auth.uid() = (select user_id from public.game_sessions where id = session_id)
  );

-- Multiplayer rooms
create table if not exists public.rooms (
  id text primary key,                            -- 6-char code
  host_id uuid not null references public.users(id),
  state text not null default 'waiting',          -- waiting|answering|reveal|transition|finished
  current_question_index integer not null default 0,
  question_ids text[] not null default '{}',
  difficulty text not null default 'mixed',
  transition_lock boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "Anyone can read rooms" on public.rooms for select using (true);
create policy "Hosts can manage rooms" on public.rooms for all using (auth.uid() = host_id);

-- Room players
create table if not exists public.room_players (
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  score integer not null default 0,
  answers jsonb not null default '{}',
  connected boolean not null default true,
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_players enable row level security;
create policy "Anyone can read room players" on public.room_players for select using (true);
create policy "Players can manage own row" on public.room_players for all using (auth.uid() = user_id);

-- Achievements
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  gems_reward integer not null default 0,
  coins_reward integer not null default 0,
  unique(user_id, achievement_key)
);
alter table public.achievements enable row level security;
create policy "Users can manage own achievements" on public.achievements for all using (auth.uid() = user_id);

-- User stats per question type
create table if not exists public.user_stats (
  user_id uuid not null references public.users(id) on delete cascade,
  question_type text not null,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  avg_time_ms integer not null default 0,
  primary key (user_id, question_type)
);
alter table public.user_stats enable row level security;
create policy "Users can manage own stats" on public.user_stats for all using (auth.uid() = user_id);

-- Function: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'שחקן'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3.7: Run migration in Supabase dashboard**

Copy content of `001_initial.sql` → Supabase Dashboard → SQL Editor → Run

- [ ] **Step 3.8: Commit**
```bash
git add -A && git commit -m "feat: Supabase schema — users, sessions, answers, rooms, achievements, stats"
```

---

## Task 4: Auth Flow

**Files:**
- Create: `app/api/auth/callback/route.ts`
- Create: `components/auth/AuthGate.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 4.1: Create auth callback route**
```ts
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 4.2: Create `components/auth/AuthGate.tsx`** — anonymous sign-in on mount
```tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        supabase.auth.signInAnonymously()
      }
    })
  }, [])
  return <>{children}</>
}
```

- [ ] **Step 4.3: Wrap layout in AuthGate**
```tsx
// app/layout.tsx — add AuthGate wrapper around children
import { AuthGate } from '@/components/auth/AuthGate'
// ... inside body:
<AuthGate>{children}</AuthGate>
```

- [ ] **Step 4.4: Commit**
```bash
git add -A && git commit -m "feat: anonymous auth via Supabase signInAnonymously"
```

---

## Task 5: Navbar + Layout Components

**Files:**
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/RankBadge.tsx`

- [ ] **Step 5.1: Implement `components/layout/RankBadge.tsx`**
```tsx
'use client'
import { getRank } from '@/lib/ranks'

export function RankBadge({ xp, name }: { xp: number; name: string }) {
  const rank = getRank(xp)
  return (
    <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
      <span className="text-base leading-none">{rank.emoji}</span>
      <div className="text-right">
        <div className="text-xs font-bold text-white leading-none">{name}</div>
        <div className="text-[10px] text-white/50 leading-none mt-0.5">{rank.title}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Implement `components/layout/Navbar.tsx`**
```tsx
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'ראשי', emoji: '🏠' },
  { href: '/game', label: 'משחק', emoji: '⚔️' },
  { href: '/leaderboard', label: 'מובילים', emoji: '🏆' },
  { href: '/shop', label: 'חנות', emoji: '🛒' },
  { href: '/profile', label: 'פרופיל', emoji: '👤' },
]

export function Navbar() {
  return (
    <nav className="bg-[#0d2d6e] h-14 flex items-center justify-between px-7 shadow-lg sticky top-0 z-50">
      {/* Nav links */}
      <div className="flex gap-1">
        {NAV_LINKS.map(({ href, label, emoji }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-base">✡️</div>
        <div>
          <div className="text-white font-black text-[15px] leading-none">חרבות התקומה</div>
          <div className="text-white/40 text-[10px] font-semibold tracking-widest">חרבות ברזל</div>
        </div>
      </Link>

      {/* User rank — placeholder; hydrated client-side */}
      <div className="w-32" /> {/* spacer — RankBadge added in Plan C */}
    </nav>
  )
}
```

- [ ] **Step 5.3: Commit**
```bash
git add -A && git commit -m "feat: Navbar and RankBadge layout components"
```

---

## Task 6: Home Page

**Files:**
- Create: `app/page.tsx`
- Create: `components/home/HeroSection.tsx`
- Create: `components/home/RankPanel.tsx`
- Create: `components/home/StreakCard.tsx`
- Create: `components/home/ModesGrid.tsx`
- Create: `components/home/AchievementsGrid.tsx`

- [ ] **Step 6.1: Implement `components/home/HeroSection.tsx`**
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/10 shadow-sm p-8 text-center">
      <div className="text-4xl mb-3">⚔️</div>
      <h1 className="text-3xl font-black text-[#0d2d6e] mb-1">חרבות התקומה</h1>
      <p className="text-[#64748b] text-sm font-semibold mb-6">משחק טריוויה על ניצחונות חרבות ברזל</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/game">
          <Button className="bg-[#1a4b9c] hover:bg-[#0d2d6e] text-white font-bold px-6 py-3 rounded-xl text-sm h-auto">
            🎮 התחל לשחק
          </Button>
        </Link>
        <Link href="/game?mode=multi">
          <Button variant="outline" className="border-[#1a4b9c] text-[#1a4b9c] font-bold px-6 py-3 rounded-xl text-sm h-auto hover:bg-[#eff6ff]">
            🌐 מרובה מכשירים
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="outline" className="border-[#1a4b9c] text-[#1a4b9c] font-bold px-6 py-3 rounded-xl text-sm h-auto hover:bg-[#eff6ff]">
            🏆 לוח מובילים
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Implement `components/home/RankPanel.tsx`**
```tsx
import { RANKS } from '@/lib/ranks'

export function RankPanel({ currentXp = 0 }: { currentXp?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/10 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#eff6ff] to-[#f0f5ff] border-b border-[#0d2d6e]/10 px-4 py-3 flex items-center gap-2">
        <span>🎖️</span>
        <h3 className="text-[13px] font-black text-[#0d2d6e]">סולם הדרגות</h3>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-1 overflow-x-auto pb-1">
          {RANKS.map((rank, i) => {
            const isActive = i === RANKS.filter(r => currentXp >= r.xpRequired).length - 1
            const isDone = currentXp >= rank.xpRequired && !isActive
            return (
              <div key={rank.title} className="flex items-center gap-0.5 flex-shrink-0">
                <div className="text-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg mx-auto mb-1 border-2 ${
                    isActive ? 'bg-[#eff6ff] border-[#1a4b9c] shadow-sm' :
                    isDone   ? 'bg-[#0d2d6e] border-[#0d2d6e]' :
                               'bg-[#f1f5f9] border-[#e2e8f0]'
                  }`}>
                    {rank.emoji}
                  </div>
                  <div className={`text-[9px] font-bold whitespace-nowrap ${isActive ? 'text-[#1a4b9c]' : 'text-[#94a3b8]'}`}>
                    {rank.title}
                  </div>
                </div>
                {i < RANKS.length - 1 && <span className="text-[#cbd5e1] text-xs pb-4">›</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.3: Implement `components/home/StreakCard.tsx`**
```tsx
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export function StreakCard({ streak = 0 }: { streak?: number }) {
  const today = new Date().getDay() // 0=Sun
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/10 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#eff6ff] to-[#f0f5ff] border-b border-[#0d2d6e]/10 px-4 py-3 flex items-center gap-2">
        <span>🔥</span>
        <h3 className="text-[13px] font-black text-[#0d2d6e]">רצף יומי</h3>
      </div>
      <div className="p-4 text-center">
        <div className="text-5xl font-black text-[#1a4b9c] leading-none">{streak}</div>
        <div className="text-[11px] text-[#94a3b8] font-semibold mt-1">ימים ברצף</div>
        <div className="flex gap-1 justify-center mt-3">
          {DAYS.map((day, i) => {
            const dayIndex = (i + 0) % 7
            const isToday = dayIndex === today
            const isDone = streak > (6 - i) && !isToday
            return (
              <div key={day} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                isToday ? 'bg-[#1a4b9c] text-white' :
                isDone  ? 'bg-[#eff6ff] text-[#1a4b9c] border border-[#dbeafe]' :
                          'bg-[#f1f5f9] text-[#cbd5e1] border border-[#e2e8f0]'
              }`}>{day}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.4: Implement `components/home/ModesGrid.tsx`**
```tsx
import Link from 'next/link'
import { MODES } from '@/lib/modes'

export function ModesGrid() {
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/10 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#eff6ff] to-[#f0f5ff] border-b border-[#0d2d6e]/10 px-4 py-3 flex items-center gap-2">
        <span>🎮</span>
        <h3 className="text-[13px] font-black text-[#0d2d6e]">מצבי משחק</h3>
      </div>
      <div className="p-4 grid grid-cols-3 gap-2">
        {MODES.map(mode => (
          <Link key={mode.id} href={`/game?mode=${mode.id}`}>
            <div className="border-[1.5px] border-[#e2e8f0] rounded-xl p-2.5 text-center cursor-pointer hover:border-[#1a4b9c] hover:bg-[#eff6ff] transition-all group">
              <div className="text-xl mb-1">{mode.emoji}</div>
              <div className="text-[10px] font-black text-[#475569] group-hover:text-[#0d2d6e]">{mode.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.5: Implement `components/home/AchievementsGrid.tsx`**
```tsx
const ACHIEVEMENTS = [
  { key: 'first_game',   emoji: '⚔️',  name: 'לוחם ראשון' },
  { key: 'streak_5',     emoji: '🔥',  name: 'רצף של 5' },
  { key: 'hard_complete',emoji: '👑',  name: 'גיבור קרב' },
  { key: 'no_hints',     emoji: '🎯',  name: 'בלי עזרה' },
  { key: 'historian',    emoji: '📜',  name: 'היסטוריון' },
  { key: 'speed_demon',  emoji: '⚡',  name: 'מהיר כברק' },
]

export function AchievementsGrid({ unlocked = [] }: { unlocked?: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/10 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#eff6ff] to-[#f0f5ff] border-b border-[#0d2d6e]/10 px-4 py-3 flex items-center gap-2">
        <span>🏅</span>
        <h3 className="text-[13px] font-black text-[#0d2d6e]">הישגים</h3>
      </div>
      <div className="p-4 grid grid-cols-3 gap-2">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlocked.includes(ach.key)
          return (
            <div key={ach.key} className={`rounded-xl p-2.5 text-center border ${
              isUnlocked ? 'bg-[#eff6ff] border-[#dbeafe]' : 'bg-[#f8faff] border-[#e2e8f0]'
            }`}>
              <div className="text-xl mb-1">{isUnlocked ? ach.emoji : '🔒'}</div>
              <div className={`text-[10px] font-bold ${isUnlocked ? 'text-[#0d2d6e]' : 'text-[#94a3b8]'}`}>{ach.name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.6: Assemble `app/page.tsx`**
```tsx
import { HeroSection } from '@/components/home/HeroSection'
import { RankPanel } from '@/components/home/RankPanel'
import { StreakCard } from '@/components/home/StreakCard'
import { ModesGrid } from '@/components/home/ModesGrid'
import { AchievementsGrid } from '@/components/home/AchievementsGrid'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-5">
      <HeroSection />
      <RankPanel />
      <div className="grid grid-cols-2 gap-5">
        <StreakCard />
        <ModesGrid />
      </div>
      <AchievementsGrid />
    </div>
  )
}
```

- [ ] **Step 6.7: Run dev server and verify home page renders**
```bash
npm run dev
```
Open http://localhost:3000 — expect: navbar, hero section, rank ladder, streak, modes, achievements

- [ ] **Step 6.8: Commit**
```bash
git add -A && git commit -m "feat: home page with hero, rank panel, streak, modes, achievements"
```

---

## Task 7: Game API Routes

**Files:**
- Create: `app/api/game/route.ts`
- Create: `app/api/answer/route.ts`

- [ ] **Step 7.1: Implement `app/api/game/route.ts`** — start a session
```ts
import { createClient } from '@/lib/supabase/server'
import { selectQuestions, getDailyQuestions } from '@/lib/questions'
import { MODES } from '@/lib/modes'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { mode = 'standard', difficulty = 'mixed' } = body
  const modeConfig = MODES.find(m => m.id === mode) ?? MODES[0]

  const questions = mode === 'daily'
    ? getDailyQuestions()
    : selectQuestions({
        difficulty: difficulty === 'mixed' ? undefined : difficulty as 'easy' | 'medium' | 'hard',
        n: modeConfig.questionCount === 999 ? 30 : modeConfig.questionCount,
      })

  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert({ user_id: user.id, mode, difficulty, total_count: questions.length })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sessionId: session.id, questions })
}
```

- [ ] **Step 7.2: Implement `app/api/answer/route.ts`** — submit an answer
```ts
import { createClient } from '@/lib/supabase/server'
import { calcScore, calcXP, calcCoins, calcBlitzCoins } from '@/lib/scoring'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { sessionId, questionId, selectedIndex, correctIndex, difficulty, timeTakenMs, streak, mode } = body
  const correct = selectedIndex === correctIndex

  const score = calcScore({ correct, timeTakenMs, streak })
  const xp = calcXP(difficulty, correct)
  const coins = mode === 'blitz' ? calcBlitzCoins(streak) : calcCoins({ correct, streak })

  // Save answer
  await supabase.from('game_answers').insert({
    session_id: sessionId, question_id: questionId,
    selected_index: selectedIndex, correct, time_taken_ms: timeTakenMs,
  })

  // Update session totals (read-then-write — supabase-js does not support rpc() as .update() value)
  if (correct) {
    const { data: sess } = await supabase.from('game_sessions').select('score, correct_count').eq('id', sessionId).single()
    if (sess) {
      await supabase.from('game_sessions').update({
        score: sess.score + score,
        correct_count: sess.correct_count + 1,
      }).eq('id', sessionId)
    }
  }

  // Update user XP + coins
  if (correct) {
    const { data: userData } = await supabase.from('users').select('xp, coins').eq('id', user.id).single()
    if (userData) {
      await supabase.from('users').update({
        xp: userData.xp + xp,
        coins: userData.coins + coins,
      }).eq('id', user.id)
    }
  }

  return NextResponse.json({ correct, score, xp, coins, correctIndex })
}
```

- [ ] **Step 7.3: Commit**
```bash
git add -A && git commit -m "feat: game session start and answer submission API routes"
```

---

## Task 8: Zustand Game Store

**Files:**
- Create: `store/gameStore.ts`

- [ ] **Step 8.1: Implement `store/gameStore.ts`**
```ts
import { create } from 'zustand'
import { Question } from '@/lib/questions'

interface GameState {
  sessionId: string | null
  mode: string
  difficulty: string
  questions: Question[]
  currentIndex: number
  score: number
  streak: number
  correct: number
  coins: number
  xp: number
  hintsUsed: number
  startTime: number | null
  answered: boolean
  lastResult: { correct: boolean; correctIndex: number; explanation: string; scoreGained: number } | null

  // Actions
  startGame: (sessionId: string, questions: Question[], mode: string, difficulty: string) => void
  submitAnswer: (result: { correct: boolean; correctIndex: number; explanation: string; scoreGained: number; coinsGained: number; xpGained: number }) => void
  nextQuestion: () => void
  useHint: () => void
  resetGame: () => void
  setStartTime: () => void
  getTimeTaken: () => number
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  mode: 'standard',
  difficulty: 'mixed',
  questions: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  correct: 0,
  coins: 0,
  xp: 0,
  hintsUsed: 0,
  startTime: null,
  answered: false,
  lastResult: null,

  startGame: (sessionId, questions, mode, difficulty) =>
    set({ sessionId, questions, mode, difficulty, currentIndex: 0, score: 0, streak: 0, correct: 0, coins: 0, xp: 0, hintsUsed: 0, answered: false, lastResult: null }),

  submitAnswer: (result) =>
    set(state => ({
      answered: true,
      lastResult: result,
      score: state.score + result.scoreGained,
      streak: result.correct ? state.streak + 1 : 0,
      correct: result.correct ? state.correct + 1 : state.correct,
      coins: state.coins + result.coinsGained,
      xp: state.xp + result.xpGained,
    })),

  nextQuestion: () =>
    set(state => ({ currentIndex: state.currentIndex + 1, answered: false, lastResult: null, startTime: Date.now() })),

  useHint: () => set(state => ({ hintsUsed: state.hintsUsed + 1 })),

  resetGame: () =>
    set({ sessionId: null, questions: [], currentIndex: 0, score: 0, streak: 0, correct: 0, coins: 0, xp: 0, hintsUsed: 0, answered: false, lastResult: null }),

  setStartTime: () => set({ startTime: Date.now() }),

  getTimeTaken: () => {
    const { startTime } = get()
    return startTime ? Date.now() - startTime : 5000
  },
}))
```

- [ ] **Step 8.2: Commit**
```bash
git add -A && git commit -m "feat: Zustand game store"
```

---

## Task 9: Game Components

**Files:**
- Create: `components/game/StatsRow.tsx`
- Create: `components/game/TimerBar.tsx`
- Create: `components/game/QuestionDisplay.tsx`
- Create: `components/game/AnswerOption.tsx`
- Create: `components/game/HintsRow.tsx`
- Create: `components/game/FeedbackBanner.tsx`
- Create: `components/game/GameCard.tsx`

- [ ] **Step 9.1: `components/game/StatsRow.tsx`**
```tsx
import { calcCombo } from '@/lib/scoring'

interface Props { score: number; streak: number; correct: number; total: number; currentIndex: number }
export function StatsRow({ score, streak, correct, total, currentIndex }: Props) {
  const combo = calcCombo(streak)
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm px-5 py-3 flex items-center justify-between">
      <div className="text-center">
        <div className="text-xl font-black text-[#1a4b9c]">{score}</div>
        <div className="text-[10px] text-[#94a3b8] font-semibold">ניקוד</div>
      </div>
      <div className="w-px h-8 bg-[#e2e8f0]" />
      {combo > 1 ? (
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-full px-3 py-1 text-[13px] font-black text-[#b45309]">
          🔥 קומבו ×{combo}
        </div>
      ) : (
        <div className="text-[13px] text-[#94a3b8] font-semibold">רצף: {streak}</div>
      )}
      <div className="w-px h-8 bg-[#e2e8f0]" />
      <div className="text-center">
        <div className="text-xl font-black text-[#1a4b9c]">{correct}/{total}</div>
        <div className="text-[10px] text-[#94a3b8] font-semibold">נכון</div>
      </div>
      <div className="w-px h-8 bg-[#e2e8f0]" />
      <div className="text-center">
        <div className="text-xl font-black text-[#94a3b8]">{currentIndex + 1}/{total}</div>
        <div className="text-[10px] text-[#94a3b8] font-semibold">שאלה</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.2: `components/game/TimerBar.tsx`**
```tsx
'use client'
import { useEffect, useRef } from 'react'

interface Props { total: number; onTimeout: () => void; disabled: boolean }
export function TimerBar({ total, onTimeout, disabled }: Props) {
  const [timeLeft, setTimeLeft] = [0, () => {}] // placeholder — use state
  // Full implementation:
  return null // replaced below
}
```

Actually implement fully:
```tsx
'use client'
import { useEffect, useState } from 'react'

interface Props { totalSeconds: number; onTimeout: () => void; disabled: boolean; onTick?: (t: number) => void }
export function TimerBar({ totalSeconds, onTimeout, disabled, onTick }: Props) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds)

  useEffect(() => {
    setTimeLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (disabled || timeLeft <= 0) return
    const id = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1
        onTick?.(next)
        if (next <= 0) { onTimeout(); return 0 }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [disabled, totalSeconds])

  const pct = (timeLeft / totalSeconds) * 100
  const danger = pct < 30

  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-[#94a3b8] font-semibold">⏱ זמן שנותר</span>
        <span className={`text-3xl font-black leading-none ${danger ? 'text-[#ef4444]' : 'text-[#1a4b9c]'} tabular-nums`}>
          {timeLeft}
        </span>
      </div>
      <div className="h-2 bg-[#dbeafe] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${danger ? 'bg-[#ef4444]' : 'bg-gradient-to-l from-[#1a4b9c] to-[#2563eb]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 9.3: `components/game/QuestionDisplay.tsx`**
```tsx
import { Question } from '@/lib/questions'

const TYPE_LABELS: Record<Question['type'], string> = {
  date: '📅 תאריך ↔ אירוע',
  figure: '👤 מי זה?',
  location: '📍 איפה זה קרה?',
  organization: '⚔️ איזה ארגון?',
  sequence: '🧠 מה קרה קודם?',
  goal: '🎯 מה הייתה המטרה?',
  result: '📊 מה הייתה התוצאה?',
  logic: '🔄 השלמה לוגית',
}

export function QuestionDisplay({ question }: { question: Question }) {
  return (
    <div className="px-5 pt-1 pb-4">
      <div className="inline-flex items-center gap-1.5 bg-[#eff6ff] border border-[#dbeafe] rounded-md px-2.5 py-1 text-[11px] font-bold text-[#1a4b9c] mb-3">
        {TYPE_LABELS[question.type]}
      </div>
      <h2 className="text-xl font-black text-[#0f172a] leading-snug">{question.question}</h2>
    </div>
  )
}
```

- [ ] **Step 9.4: `components/game/AnswerOption.tsx`**
```tsx
'use client'
const LETTERS = ['א', 'ב', 'ג', 'ד']

interface Props {
  index: number
  text: string
  state: 'idle' | 'selected' | 'correct' | 'wrong'
  onClick: () => void
  disabled: boolean
}

export function AnswerOption({ index, text, state, onClick, disabled }: Props) {
  const styles = {
    idle:     'bg-[#f8faff] border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#eff6ff]',
    selected: 'bg-[#eff6ff] border-[#1a4b9c] shadow-md',
    correct:  'bg-[#f0fdf4] border-[#22c55e]',
    wrong:    'bg-[#fef2f2] border-[#ef4444] opacity-60',
  }
  const badgeStyles = {
    idle:     'bg-[#e2e8f0] border-[#cbd5e1] text-[#64748b]',
    selected: 'bg-[#1a4b9c] border-[#1a4b9c] text-white',
    correct:  'bg-[#22c55e] border-[#22c55e] text-white',
    wrong:    'bg-[#ef4444] border-[#ef4444] text-white',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 border-[1.5px] rounded-2xl px-4 py-3.5 w-full text-right transition-all duration-150 ${styles[state]} ${
        !disabled && state === 'idle' ? 'hover:-translate-x-0.5 cursor-pointer' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center text-[13px] font-black flex-shrink-0 transition-all ${badgeStyles[state]}`}>
        {LETTERS[index]}
      </div>
      <span className="text-[14px] font-semibold text-[#1e293b] leading-snug">{text}</span>
    </button>
  )
}
```

- [ ] **Step 9.5: `components/game/HintsRow.tsx`**
```tsx
'use client'
interface Props {
  hintsLeft: number
  total: number
  currentIndex: number
  onHint: () => void
  onRemoveOption: () => void
  disabled: boolean
}
export function HintsRow({ hintsLeft, total, currentIndex, onHint, onRemoveOption, disabled }: Props) {
  return (
    <div className="px-4 pb-4 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={onHint}
          disabled={disabled || hintsLeft === 0}
          className="flex items-center gap-1.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[#64748b] hover:border-[#93c5fd] hover:text-[#1a4b9c] hover:bg-[#eff6ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          💡 רמז ({hintsLeft})
        </button>
        <button
          onClick={onRemoveOption}
          disabled={disabled}
          className="flex items-center gap-1.5 bg-[#f8faff] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[#64748b] hover:border-[#93c5fd] hover:text-[#1a4b9c] hover:bg-[#eff6ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ❌ הסר תשובה
        </button>
      </div>
      <div className="flex gap-1 items-center">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${
            i < currentIndex ? 'w-2 bg-[#1a4b9c]' :
            i === currentIndex ? 'w-4 bg-[#2563eb]' :
            'w-2 bg-[#dbeafe]'
          }`} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9.6: `components/game/FeedbackBanner.tsx`**
```tsx
'use client'
import { Button } from '@/components/ui/button'

interface Props {
  correct: boolean
  explanation: string
  scoreGained: number
  onNext: () => void
  isLast: boolean
}
export function FeedbackBanner({ correct, explanation, scoreGained, onNext, isLast }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-3.5 ${
        correct ? 'bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] border-b border-[#bbf7d0]'
                : 'bg-gradient-to-r from-[#fef2f2] to-[#fee2e2] border-b border-[#fca5a5]'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{correct ? '✅' : '❌'}</span>
          <div>
            <div className={`text-[14px] font-black ${correct ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>
              {correct ? 'תשובה נכונה!' : 'תשובה שגויה'}
              {correct && scoreGained > 100 && ' קומבו!'}
            </div>
            <div className={`text-[11px] mt-0.5 ${correct ? 'text-[#16a34a]' : 'text-[#dc2626]/80'}`}>{explanation}</div>
          </div>
        </div>
        {correct && <div className="text-2xl font-black text-[#22c55e]">+{scoreGained}</div>}
      </div>
      <div className="px-4 py-3">
        <Button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-[#1a4b9c] to-[#0d2d6e] hover:opacity-90 text-white font-black rounded-xl py-3 h-auto text-[15px] shadow-md"
        >
          {isLast ? 'סיום המשחק 🎉' : 'שאלה הבאה ←'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.7: Commit**
```bash
git add -A && git commit -m "feat: all game UI components (StatsRow, Timer, Question, Options, Hints, Feedback)"
```

---

## Task 10: Game Setup Page

**Files:**
- Create: `app/game/page.tsx`

- [ ] **Step 10.1: Implement game setup page**
```tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MODES } from '@/lib/modes'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'

const DIFFICULTIES = [
  { id: 'easy',   label: 'קל',    emoji: '🛡️', seconds: 30, pts: 10,  color: 'border-[#22c55e] bg-[#f0fdf4]' },
  { id: 'medium', label: 'בינוני', emoji: '⚔️', seconds: 20, pts: 20,  color: 'border-[#f59e0b] bg-[#fffbeb]' },
  { id: 'hard',   label: 'קשה',   emoji: '👑', seconds: 15, pts: 30,  color: 'border-[#ef4444] bg-[#fef2f2]' },
]

export default function GameSetupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { startGame } = useGameStore()
  const defaultMode = searchParams.get('mode') ?? 'standard'

  const [selectedMode, setSelectedMode] = useState(defaultMode)
  const [selectedDiff, setSelectedDiff] = useState('easy')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: selectedMode, difficulty: selectedDiff }),
    })
    const data = await res.json()
    if (data.sessionId) {
      startGame(data.sessionId, data.questions, selectedMode, selectedDiff)
      router.push(`/game/${data.sessionId}`)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-[#0d2d6e]">⚔️ משחק חדש</h1>
        <p className="text-[#64748b] text-sm mt-1">בחר מצב ורמת קושי</p>
      </div>

      {/* Mode selector */}
      <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm p-4">
        <div className="text-[11px] font-bold text-[#94a3b8] mb-3 tracking-wide">מצב משחק</div>
        <div className="grid grid-cols-3 gap-2">
          {MODES.filter(m => m.id !== 'multi').map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`border-[1.5px] rounded-xl p-2.5 text-center transition-all ${
                selectedMode === mode.id
                  ? 'border-[#1a4b9c] bg-[#eff6ff]'
                  : 'border-[#e2e8f0] bg-[#f8faff] hover:border-[#93c5fd]'
              }`}
            >
              <div className="text-xl mb-1">{mode.emoji}</div>
              <div className={`text-[10px] font-black ${selectedMode === mode.id ? 'text-[#0d2d6e]' : 'text-[#475569]'}`}>
                {mode.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      {selectedMode !== 'memory' && selectedMode !== 'daily' && (
        <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm p-4">
          <div className="text-[11px] font-bold text-[#94a3b8] mb-3 tracking-wide">רמת קושי</div>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map(diff => (
              <button
                key={diff.id}
                onClick={() => setSelectedDiff(diff.id)}
                className={`border-[1.5px] rounded-xl p-3 text-center transition-all ${
                  selectedDiff === diff.id ? diff.color + ' shadow-sm' : 'border-[#e2e8f0] bg-[#f8faff]'
                }`}
              >
                <div className="text-2xl mb-1">{diff.emoji}</div>
                <div className="text-[12px] font-black text-[#0f172a]">{diff.label}</div>
                <div className="text-[10px] text-[#64748b]">{diff.seconds} שניות</div>
                <div className="text-[10px] text-[#64748b]">+{diff.pts} XP</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#1a4b9c] to-[#0d2d6e] hover:opacity-90 text-white font-black rounded-xl py-4 h-auto text-[16px] shadow-lg"
      >
        {loading ? '⏳ טוען...' : '🚀 יאללה!'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 10.2: Commit**
```bash
git add -A && git commit -m "feat: game setup page with mode and difficulty selection"
```

---

## Task 11: Game Screen

**Files:**
- Create: `app/game/[sessionId]/page.tsx`

- [ ] **Step 11.1: Implement game screen**
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { StatsRow } from '@/components/game/StatsRow'
import { TimerBar } from '@/components/game/TimerBar'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
import { AnswerOption } from '@/components/game/AnswerOption'
import { HintsRow } from '@/components/game/HintsRow'
import { FeedbackBanner } from '@/components/game/FeedbackBanner'
import { MODES } from '@/lib/modes'

const MAX_HINTS = 2

export default function GamePage() {
  const router = useRouter()
  const store = useGameStore()
  const { questions, currentIndex, score, streak, correct, answered, lastResult, submitAnswer, nextQuestion, useHint, hintsUsed, mode, difficulty } = store

  const [removedOptions, setRemovedOptions] = useState<number[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const question = questions[currentIndex]
  const modeConfig = MODES.find(m => m.id === mode) ?? MODES[0]
  const isLast = currentIndex >= questions.length - 1

  useEffect(() => {
    if (!question) return
    store.setStartTime()
    setRemovedOptions([])
    setSelectedIndex(null)
    setTimerKey(k => k + 1)
  }, [currentIndex])

  useEffect(() => {
    // Redirect if no active game
    if (!store.sessionId && typeof window !== 'undefined') {
      router.push('/game')
    }
  }, [])

  const handleAnswer = async (optionIndex: number) => {
    if (answered) return
    setSelectedIndex(optionIndex)
    const timeTakenMs = store.getTimeTaken()

    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: store.sessionId,
        questionId: question.id,
        selectedIndex: optionIndex,
        correctIndex: question.correctIndex,
        difficulty,
        timeTakenMs,
        streak,
        mode,
      }),
    })
    const data = await res.json()
    submitAnswer({
      correct: data.correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      scoreGained: data.score,
      coinsGained: data.coins,
      xpGained: data.xp,
    })
  }

  const handleTimeout = () => {
    if (!answered) handleAnswer(-1) // -1 = timeout
  }

  const handleNext = () => {
    if (isLast) {
      router.push(`/game/${store.sessionId}/results`)
    } else {
      nextQuestion()
    }
  }

  const handleHint = () => {
    if (hintsUsed >= MAX_HINTS) return
    // Show explanation hint in an alert (simple implementation)
    alert(`💡 רמז: ${question.explanation.slice(0, 60)}...`)
    useHint()
  }

  const handleRemoveOption = () => {
    // Remove a random wrong option
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== question.correctIndex && !removedOptions.includes(i))
    if (wrongOptions.length > 0) {
      const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
      setRemovedOptions(prev => [...prev, toRemove])
    }
  }

  const getOptionState = (i: number): 'idle' | 'selected' | 'correct' | 'wrong' => {
    if (!answered) return selectedIndex === i ? 'selected' : 'idle'
    if (i === question.correctIndex) return 'correct'
    if (i === selectedIndex) return 'wrong'
    return 'idle'
  }

  if (!question) return (
    <div className="text-center py-20 text-[#64748b]">טוען שאלה...</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-4">
      <StatsRow score={score} streak={streak} correct={correct} total={questions.length} currentIndex={currentIndex} />

      <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm overflow-hidden">
        <TimerBar
          key={timerKey}
          totalSeconds={modeConfig.timerSeconds || 20}
          onTimeout={handleTimeout}
          disabled={answered || modeConfig.timerSeconds === 0}
        />
        <QuestionDisplay question={question} />
        <div className="px-4 pb-2 flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            if (removedOptions.includes(i)) return null
            return (
              <AnswerOption
                key={i}
                index={i}
                text={opt}
                state={getOptionState(i)}
                onClick={() => handleAnswer(i)}
                disabled={answered}
              />
            )
          })}
        </div>
        <HintsRow
          hintsLeft={MAX_HINTS - hintsUsed}
          total={questions.length}
          currentIndex={currentIndex}
          onHint={handleHint}
          onRemoveOption={handleRemoveOption}
          disabled={answered}
        />
      </div>

      {answered && lastResult && (
        <FeedbackBanner
          correct={lastResult.correct}
          explanation={lastResult.explanation}
          scoreGained={lastResult.scoreGained}
          onNext={handleNext}
          isLast={isLast}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 11.2: Commit**
```bash
git add -A && git commit -m "feat: complete game screen with timer, answers, feedback, and navigation"
```

---

## Task 12: Results Screen

**Files:**
- Create: `app/game/[sessionId]/results/page.tsx`

- [ ] **Step 12.1: Implement results page**
```tsx
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { getRank } from '@/lib/ranks'
import { Button } from '@/components/ui/button'

export default function ResultsPage() {
  const router = useRouter()
  const { score, correct, questions, xp, coins, mode, resetGame } = useGameStore()
  const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const rank = getRank(xp)

  const handlePlayAgain = () => {
    resetGame()
    router.push('/game')
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm p-8 text-center">
        <div className="text-5xl mb-3">
          {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⚔️' : '🛡️'}
        </div>
        <h1 className="text-2xl font-black text-[#0d2d6e] mb-1">
          {accuracy >= 80 ? 'מצוין!' : accuracy >= 50 ? 'כל הכבוד!' : 'נסה שוב!'}
        </h1>
        <p className="text-[#64748b] text-sm">
          {correct} מתוך {questions.length} תשובות נכונות
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'ניקוד', value: score, emoji: '⭐' },
          { label: 'דיוק', value: `${accuracy}%`, emoji: '🎯' },
          { label: 'XP שנצברו', value: `+${xp}`, emoji: '📈' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-xl font-black text-[#1a4b9c]">{value}</div>
            <div className="text-[10px] text-[#94a3b8] font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {coins > 0 && (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🪙</div>
          <div className="text-lg font-black text-[#b45309]">+{coins} מטבעות</div>
          <div className="text-[11px] text-[#92400e] mt-0.5">נוספו לחשבונך</div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handlePlayAgain}
          className="flex-1 bg-gradient-to-r from-[#1a4b9c] to-[#0d2d6e] text-white font-black rounded-xl py-3 h-auto"
        >
          🎮 שחק שוב
        </Button>
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full border-[#1a4b9c] text-[#1a4b9c] font-bold rounded-xl py-3 h-auto">
            🏠 ראשי
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.2: Commit**
```bash
git add -A && git commit -m "feat: results screen with score, accuracy, XP, coins summary"
```

---

## Task 13: Leaderboard Page

**Files:**
- Create: `app/leaderboard/page.tsx`

- [ ] **Step 13.1: Implement leaderboard**
```tsx
import { createClient } from '@/lib/supabase/server'
import { getRank } from '@/lib/ranks'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: players } = await supabase
    .from('users')
    .select('id, name, xp, coins')
    .order('xp', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-[#0d2d6e]">🏆 לוח מובילים</h1>
        <p className="text-[#64748b] text-sm mt-1">הלוחמים הטובים ביותר</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#0d2d6e]/08 shadow-sm overflow-hidden">
        {!players?.length && (
          <div className="py-16 text-center text-[#94a3b8]">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-semibold">אין תוצאות עדיין</div>
            <div className="text-sm mt-1">היה הראשון בלוח!</div>
          </div>
        )}
        {players?.map((player, i) => {
          const rank = getRank(player.xp)
          const medals = ['🥇', '🥈', '🥉']
          return (
            <div key={player.id} className={`flex items-center gap-4 px-5 py-4 ${i < players.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}>
              <div className="text-xl w-8 text-center font-black text-[#94a3b8]">
                {medals[i] ?? `#${i + 1}`}
              </div>
              <div className="text-2xl">{rank.emoji}</div>
              <div className="flex-1">
                <div className="font-black text-[#0f172a] text-[14px]">{player.name}</div>
                <div className="text-[11px] text-[#94a3b8]">{rank.title}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-[#1a4b9c] text-[15px]">{player.xp} XP</div>
                <div className="text-[11px] text-[#94a3b8]">🪙 {player.coins}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 13.2: Commit**
```bash
git add -A && git commit -m "feat: leaderboard page with XP ranking and rank emojis"
```

---

## Task 14: Push to GitHub + Deploy to Vercel

- [ ] **Step 14.1: Create GitHub repo**

Go to https://github.com/new → Name: `charvot-hatekuma` → Private → Create

- [ ] **Step 14.2: Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/charvot-hatekuma.git
git branch -M main
git push -u origin main
```

- [ ] **Step 14.3: Add `.gitignore` entries**
```
.env.local
.env*.local
.superpowers/
```

- [ ] **Step 14.4: Deploy to Vercel**

Option A (via Vercel MCP if available):
- Use `deploy_to_vercel` MCP tool

Option B (via Vercel dashboard):
- Go to https://vercel.com/new → Import from GitHub → Select repo
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy

- [ ] **Step 14.5: Verify deployment**

Open the Vercel URL → check home page, game setup, game screen work

- [ ] **Step 14.6: Final commit**
```bash
git add -A && git commit -m "chore: add .gitignore, prepare for production"
git push
```

---

---

## Task 15: Sound Effects & Background Music

**Approach:** Web Audio API for synthesized sound effects (zero external files, zero copyright issues) + `howler.js` for background music loop from a self-hosted royalty-free CC0 MP3.

**Files:**
- Install: `howler` + `@types/howler`
- Create: `lib/audio.ts` — singleton audio manager (Web Audio API + Howler)
- Create: `public/audio/game-music.mp3` — royalty-free action loop (added manually, CC0)
- Create: `components/game/AudioController.tsx` — client component wiring audio to game events
- Modify: `app/game/[sessionId]/page.tsx` — mount AudioController

**Sound design:**

| Event | Sound | Character |
|---|---|---|
| Correct answer | Ascending 3-note chime (C→E→G) | Bright, rewarding |
| Wrong answer | Descending buzz (G→E, distorted) | Clear but not harsh |
| Combo ×1.5 | Short fanfare (4 notes, major) | Exciting |
| Combo ×2 | Full fanfare (6 notes, triumphant) | Victory feel |
| Timer tick (≤5s) | Short sharp click per second | Urgency |
| Timer expiry | Low descending tone | Neutral end |
| Button click | Subtle soft click (50ms) | Responsive |
| Question transition | Whoosh (100ms noise burst) | Motion feel |
| Game start | Intro sting (500ms) | Opening |
| Game end — win (≥70%) | Ascending fanfare (1s) | Triumph |
| Game end — lose (<70%) | Neutral resolution (500ms) | Encouraging |
| Background music | Rhythmic electronic loop (Kahoot-style) | Energy, focus |

- [ ] **Step 15.1: Install howler**
```bash
npm install howler
npm install -D @types/howler
```

- [ ] **Step 15.2: Add CC0 background music**

Download a royalty-free action loop (CC0 license) from https://opengameart.org or https://freemusicarchive.org.
Recommended search: "action loop CC0 electronic" — pick a 30–60s loop, save as `public/audio/game-music.mp3`.

Alternatively use any CC0 track from https://pixabay.com/music/ (free for commercial use).

- [ ] **Step 15.3: Implement `lib/audio.ts`**

```ts
'use client'
// All audio is synthesized via Web Audio API — no external sound files except background music.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

// Play a sequence of tones
function playTones(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.4) {
  const c = getCtx()
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    const start = c.currentTime + i * duration
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.start(start)
    osc.stop(start + duration + 0.01)
  })
}

// White noise burst (for whoosh/transition)
function playNoise(durationSec: number, volume = 0.15) {
  const c = getCtx()
  const bufSize = c.sampleRate * durationSec
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  const gain = c.createGain()
  src.buffer = buf
  src.connect(gain)
  gain.connect(c.destination)
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationSec)
  src.start()
  src.stop(c.currentTime + durationSec)
}

export const SFX = {
  correct:    () => playTones([523, 659, 784], 0.12, 'sine', 0.4),          // C5→E5→G5
  wrong:      () => playTones([330, 247], 0.18, 'sawtooth', 0.25),          // E4→B3 descending
  comboMid:   () => playTones([523, 587, 659, 784], 0.1, 'sine', 0.35),     // 4-note fanfare
  comboMax:   () => playTones([523, 587, 659, 784, 880, 1047], 0.1, 'sine', 0.4), // 6-note triumph
  tick:       () => playTones([1200], 0.05, 'square', 0.2),                  // Sharp click
  timeout:    () => playTones([220, 175], 0.25, 'sine', 0.3),               // Low descend
  click:      () => playTones([800], 0.04, 'square', 0.15),                  // Soft click
  transition: () => playNoise(0.1, 0.12),                                    // Whoosh
  gameStart:  () => playTones([392, 523, 659, 784], 0.12, 'sine', 0.4),     // G4→C5→E5→G5
  winEnd:     () => playTones([523, 659, 784, 1047, 1047], 0.15, 'sine', 0.5),
  loseEnd:    () => playTones([392, 330, 294], 0.2, 'sine', 0.3),
}

// Background music via Howler (separate module to avoid SSR issues)
let bgMusic: import('howler').Howl | null = null
let musicEnabled = true
let sfxEnabled = true

export function setMusicEnabled(v: boolean) {
  musicEnabled = v
  if (!v) bgMusic?.pause()
  else bgMusic?.play()
}
export function setSfxEnabled(v: boolean) { sfxEnabled = v }

export async function startBgMusic() {
  if (!musicEnabled || typeof window === 'undefined') return
  if (bgMusic) { bgMusic.play(); return }
  const { Howl } = await import('howler')
  bgMusic = new Howl({
    src: ['/audio/game-music.mp3'],
    loop: true,
    volume: 0.3,
    autoplay: true,
    html5: true,
  })
}

export function stopBgMusic() {
  bgMusic?.stop()
  bgMusic = null
}

export function playSfx(name: keyof typeof SFX) {
  if (!sfxEnabled || typeof window === 'undefined') return
  try {
    SFX[name]()
  } catch {
    // AudioContext may be suspended before user interaction — ignore
  }
}

// Resume AudioContext after user gesture (required by browsers)
export function resumeAudio() {
  ctx?.resume()
}
```

- [ ] **Step 15.4: Create `components/game/AudioController.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { playSfx, startBgMusic, stopBgMusic, resumeAudio } from '@/lib/audio'
import { useGameStore } from '@/store/gameStore'
import { calcCombo } from '@/lib/scoring'

export function AudioController() {
  const { answered, lastResult, streak, score, currentIndex, questions } = useGameStore()
  const prevAnswered = useRef(false)
  const prevIndex = useRef(-1)

  // Resume audio context on first mount (user has interacted by navigating here)
  useEffect(() => {
    resumeAudio()
    startBgMusic()
    playSfx('gameStart')
    return () => stopBgMusic()
  }, [])

  // Question transition sound
  useEffect(() => {
    if (currentIndex > 0 && currentIndex !== prevIndex.current) {
      playSfx('transition')
      prevIndex.current = currentIndex
    }
  }, [currentIndex])

  // Answer result sounds
  useEffect(() => {
    if (answered && !prevAnswered.current) {
      prevAnswered.current = true
      if (lastResult?.correct) {
        const combo = calcCombo(streak)
        if (combo >= 2) playSfx('comboMax')
        else if (combo >= 1.5) playSfx('comboMid')
        else playSfx('correct')
      } else {
        playSfx('wrong')
      }
    }
    if (!answered) prevAnswered.current = false
  }, [answered, lastResult, streak])

  return null // pure side-effect component
}
```

- [ ] **Step 15.5: Wire `TimerBar` to tick sound**

In `components/game/TimerBar.tsx`, update the `onTick` callback usage:

In the `GamePage` (`app/game/[sessionId]/page.tsx`), pass `onTick` to `TimerBar`:
```tsx
// Add to handleTimeout area — pass onTick prop:
onTick={(t) => { if (t <= 5 && t > 0) playSfx('tick') }}
```

Import `playSfx` at top of game page:
```tsx
import { playSfx } from '@/lib/audio'
```

- [ ] **Step 15.6: Play click sound on AnswerOption**

In `components/game/AnswerOption.tsx`:
```tsx
import { playSfx } from '@/lib/audio'
// In onClick handler:
onClick={() => { playSfx('click'); onClick() }}
```

- [ ] **Step 15.7: Play end sounds from results page**

In `app/game/[sessionId]/results/page.tsx`:
```tsx
import { playSfx, stopBgMusic } from '@/lib/audio'

useEffect(() => {
  stopBgMusic()
  if (accuracy >= 70) playSfx('winEnd')
  else playSfx('loseEnd')
}, [])
```

- [ ] **Step 15.8: Add mute toggle button to Navbar**

In `components/layout/Navbar.tsx`, add a client-side mute button (🔊/🔇):
```tsx
'use client'
import { useState } from 'react'
import { setMusicEnabled, setSfxEnabled } from '@/lib/audio'

// Inside Navbar component:
const [muted, setMuted] = useState(false)
const toggleMute = () => {
  const next = !muted
  setMuted(next)
  setMusicEnabled(!next)
  setSfxEnabled(!next)
}
// Add button in nav:
<button onClick={toggleMute} className="nav-item text-lg" title={muted ? 'הפעל שמע' : 'השתק'}>
  {muted ? '🔇' : '🔊'}
</button>
```

- [ ] **Step 15.9: Mount AudioController in game screen**

In `app/game/[sessionId]/page.tsx`, add at the top of the returned JSX:
```tsx
import { AudioController } from '@/components/game/AudioController'
// Inside return:
<AudioController />
```

- [ ] **Step 15.10: Test audio in browser**
```bash
npm run dev
```
- Start a game → verify background music plays
- Answer correctly → hear chime
- Answer wrong → hear buzz
- Get 3 in a row → hear combo fanfare
- Last 5 seconds → hear tick per second
- Finish game → music stops, win/lose sting plays
- Click mute → music + sounds stop

- [ ] **Step 15.11: Commit**
```bash
git add -A && git commit -m "feat: Web Audio API SFX + Howler background music (correct, wrong, combo, tick, transitions)"
```

---

## Plan B (next): Multiplayer (Supabase Realtime rooms)
## Plan C (next): Profile, Shop, Achievements

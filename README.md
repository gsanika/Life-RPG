# Life RPG

Turn real-life goals into an RPG. Complete quests, earn XP and gold, level up,
grow six character attributes, and keep a daily streak alive — all backed by
a server-authoritative MERN stack so nothing can be spoofed from the client.

```
             LIFE RPG
                 │
       ┌─────────┼─────────┐
       ↓         ↓         ↓
    QUESTS    CHARACTER   ECONOMY
   (Quest       (XP,       (Gold,
    Engine)   Level,      Shop)
              Attributes)
       │         │         │
       └────── Streaks ────┘
            (Consistency
               Engine)
```

## Stack

- **Frontend:** React 18 (Vite), React Router, Framer Motion, Recharts, Axios
- **Backend:** Node.js, Express, JWT auth, bcrypt
- **Database:** MongoDB (Mongoose) — database name: `database`

## Project structure

```
life-rpg/
├── backend/          Express API — auth, quests, character, shop
│   ├── controllers/  Route handlers, including the reward-calculation logic
│   ├── models/       User, Quest, QuestLog (Mongoose schemas)
│   ├── utils/        levelCurve.js (XP/level math), streak.js (Consistency Engine)
│   └── server.js
└── frontend/         React app — quest board, character sheet, shop, history
    └── src/
        ├── pages/       Login, Register, Dashboard, Shop, History
        └── components/  CharacterPanel, QuestCard, XPBar, LevelUpModal, ...
```

## Setup

### 1. Database

Make sure MongoDB is running locally (or point `MONGO_URI` at Atlas). The
app connects to a database named **`database`**:

```
mongodb://127.0.0.1:27017/database
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET at minimum
npm install
npm run dev                # nodemon on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # points at the backend API
npm install
npm run dev                 # http://localhost:5173
```

Register a character, add a few quests, and complete one — the dashboard
animates the XP bar, attribute bars, and pops a level-up modal when you cross
a threshold.

## How the four engines work

- **Quest Engine** (`Quest` model + `questController`): create, edit, retire,
  and complete quests. Quests can be one-off or daily-recurring.
- **Progression Engine** (`utils/levelCurve.js`): a non-linear XP curve —
  `totalXpForLevel(n) = 100·(n-1)^1.5 + 100·(n-1)` — so later levels take
  meaningfully longer than early ones. Attribute points are derived from the
  quest's `attribute` field and its difficulty reward.
- **Economy Engine** (`shopController`): gold earned from quests and streak
  milestones can be spent on cosmetic themes, frames, and badges. Prices and
  ownership are validated server-side.
- **Consistency Engine** (`utils/streak.js`): tracks daily activity, resets
  on a missed day, and pays out bonus gold at 3/7/14/30-day milestones.

## Security notes

Every reward (`xpEarned`, `goldEarned`, attribute gain, level-up) is computed
in `questController.completeQuest` on the server — the client only ever sends
"I completed quest X." Ownership of the quest is checked against the JWT's
user id before anything is modified, so one player can never touch another's
character or claim rewards for a quest they don't own.

## Next ideas

- Push notifications / reminders for unfinished daily quests
- Guild or friends leaderboard (shared XP totals)
- Boss-fight quests: a multi-day quest chain with a big payout at the end

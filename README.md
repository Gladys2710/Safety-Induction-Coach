# SitePass — Safety Induction Coach for Construction Crews

**SitePass** is an interactive, kiosk-ready flashcard and quiz training application designed for construction sites. It allows workers to rapidly study high-risk topics (PPE, Fall Protection, Electrical Safety, Excavation, Scaffolding, Hazard Communication, Emergency Response, Tools, Manual Handling, and Fire Safety) and verify comprehension before entering active job sites.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18 with TypeScript, Vite 7
- **Styling**: Tailwind CSS with custom design tokens (steel and safety orange palettes)
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security)
- **Offline / Local Mode**: Resilient local-first fallback via `localStorage` and embedded induction seed decks when database environment variables are omitted or unreachable.

---

## 🔍 Comprehensive Audit & Manual Edits

### 1. Bug Audit & Fixes
| Issue | Severity | Status | Fix Details |
|---|---|---|---|
| **Unhandled Startup Crash on Missing Env** | High | **Resolved** | `supabase.ts` previously threw an uncaught error at import time if `VITE_SUPABASE_URL` was undefined, white-screening the entire app. Refactored to make the client optional and enable automatic local offline kiosk mode with built-in seed flashcards. |
| **Quiz Option Duplication & Key Collisions** | High | **Resolved** | In `buildOptions()`, identical answers across cards caused duplicate options, duplicate React keys, and UI selection glitches. Fixed by gathering distinct answer strings via a `Set` and returning 4 unique options. |
| **Biased Sorting Algorithm** | Medium | **Resolved** | Replaced `sort(() => Math.random() - 0.5)` with an unbiased Fisher-Yates shuffle algorithm (`shuffleArray`) across both quiz question selection and multiple choice option distribution. |
| **Unimplemented Keyboard Hinting** | Medium | **Resolved** | `FlashCard.tsx` showed visual keyboard navigation labels (`flip back`, `reset`, etc.) but lacked keyboard listeners. Implemented full keyboard event listeners (`Space`/`Enter` to flip, `1`/`←` to mark review, `2`/`→` to mark known, `R` to reset). In `QuizSession.tsx`, added `1-4` number key selection and `Enter`/`Space` next-question navigation. |
| **Quiz Progress & Seen Cards Metric Bug** | Medium | **Resolved** | `seenIds` in `App.tsx` filtered strictly on `mode === 'study'`, meaning cards encountered during quizzes never updated the "Seen" metric. Updated to include all reviews. Progress bars were also updated from 0-based offset to reflect active card/question progress. |
| **Missing Favicon Asset** | Low | **Resolved** | `index.html` referenced `/vite.svg` which was absent. Created `/public/favicon.svg` with a dedicated safety hardhat icon. |

---

### 2. Security Audit & Hardening
| Issue | Severity | Status | Fix Details |
|---|---|---|---|
| **Overly Permissive Supabase RLS Policies** | Critical | **Resolved** | Original migration granted anonymous clients `DELETE` and `UPDATE` permissions on `flashcards`, `workers`, and `reviews`. Created `supabase/migrations/20261021200000_secure_rls_policies.sql` to revoke anonymous delete/update access to flashcards and prohibit arbitrary worker/review purging. |
| **Input Validation & Payload Size** | Medium | **Resolved** | Added `maxLength={60}` and trimming on the worker name input in `Welcome.tsx` to prevent database and UI layout distortion. |
| **Worker Impersonation in Kiosk Mode** | Medium | **Documented** | In single-tenant open kiosk mode, name lookups are case-insensitive. For regulated enterprise audit logs, email/badge authentication or kiosk supervisor PINs should be integrated. |

---

### 3. Accessibility (a11y) & WCAG AA Compliance
| Area | Issue | Status | Fix Details |
|---|---|---|---|
| **Screen Reader Spoiler** | Critical | **Resolved** | Both front (Question) and back (Answer) faces of the 3D flip card were rendered in the DOM without hiding the inactive face. Added `aria-hidden={flipped}` on front and `aria-hidden={!flipped}` on back, plus `aria-expanded` and an informative `aria-label`. |
| **Screen Reader Feedback** | High | **Resolved** | Added `aria-live="polite"` live announcement regions to announce question vs. answer status, review markings, and instant quiz feedback. |
| **Keyboard Accessibility** | High | **Resolved** | Added visible focus indicator rings (`focus-visible:ring-4 focus-visible:ring-safety-400 focus-visible:ring-offset-2`) so keyboard tabbing is prominent and clear. |
| **Color Contrast (WCAG AA)** | High | **Resolved** | Replaced low-contrast safety orange text (`text-safety-500` / `text-safety-600` on white) with high-contrast `text-safety-700` / `text-safety-800` (exceeding the 4.5:1 ratio requirement). Adjusted muted steel labels from `text-steel-400` to `text-steel-600`. |
| **Form Accessibility** | Medium | **Resolved** | Linked name input in `Welcome.tsx` to error feedback via `aria-invalid` and `aria-describedby="worker-name-error"` with `role="alert"`. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/Gladys2710/Safety-Induction-Coach.git
cd Safety-Induction-Coach
npm install
npm run dev
```

### Environment Variables (Optional)
To connect to an active Supabase project, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*Note: If no `.env` is provided, the application runs automatically in local/offline kiosk mode.*

### Running Development Server
```bash
npm run dev
```

### Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)
To deploy the database schema to Supabase:
1. Run `supabase/migrations/20261021185326_create_flashcard_coach_schema.sql` to establish tables and seed induction cards.
2. Run `supabase/migrations/20261021200000_secure_rls_policies.sql` to enforce secure Row Level Security policies.

---

## 💡 What I Learned

- **Designing deterministic spaced-repetition logic**:
  Card mastery cannot rely on a simple static counter or instantaneous score. Evaluating true safety retention requires analyzing the worker's chronological review trajectory—specifically requiring at least two consecutive correct reviews without subsequent failures before marking a topic as mastered.

- **`localStorage` as a zero-backend persistence layer**:
  By decoupling the application's runtime state from strict database availability and writing to local storage concurrently, the application achieves high availability. Even with zero environment variables or completely unprovisioned backends, workers can log in, take quizzes, and resume their induction seamlessly.

- **Building for offline and low-connectivity site conditions**:
  Construction sites and remote job trailers frequently suffer from poor or fluctuating cellular connectivity. Designing the client with embedded offline seed decks, local caching, and non-blocking asynchronous sync guarantees that compliance safety drills are never interrupted by network dropouts.


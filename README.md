# 🚀 OpportunityPulse AI — Agentic Opportunity Radar & Career Growth Platform

> **HEC ACT-AI Capstone Project Report — Phase 4: Career Execution Command Center**
>
> **Author / Maintainer**: Arsalan Qasim
>
> **Release**: Phase 4 — Career Execution Command Center, Action Task System, Smart Prioritization
> **Current Build Status**: Active (Phase 4 Career Workspace, Application Kanban, Action Tasks, Deadline Timeline, Smart Prioritization, Notification History, Supabase RLS Migration)

---

## 📌 1. Project Context & Purpose

**OpportunityPulse AI** is an Agentic AI-powered Opportunity Radar & Career Growth Platform built for the **HEC ACT-AI Capstone Project**. It cuts through social media noise to help university students, fresh graduates, and tech youth discover, match, and apply for high-signal career opportunities (AI Hackathons, International Scholarships, Remote Internships, and Tech Grants).

Phase 2 upgrades the raw "text paste" prototype into a production-grade **Trusted Ingestion & Provenance Workflow**, featuring strict SSRF security controls, an approved source registry allowlist, deterministic trust scores, duplicate opportunity detection, and honest verification badges.

---

## 🏗️ 2. Agentic Architecture & Security Model

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      OPPORTUNITYPULSE AI ENGINE                        │
 ├────────────────────────────────────────────────────────────────────────┤
 │                                                                        │
 │  1. Ingestion Agent     │ Extracts structured JSON from raw posts/URLs │
 │  2. Matching Agent      │ Computes 0-100% Match Index & Rationale      │
 │  3. Copilot Agent       │ Generates custom 1-page proposals & pitches   │
 │  4. Dispatcher Agent    │ Prepares notification payloads               │
 └────────────────────────────────────────────────────────────────────────┘
```

### Trusted URL Ingestion & SSRF Defense Model (`api/utils/urlSecurity.ts` & `api/ingest.ts`)
- **HTTPS Enforcement**: Ingestion requests permit HTTPS URLs only (`https:` protocol).
- **Credentials & Port Filtering**: Rejects URLs containing embedded user credentials (`username:password@host`) and non-standard ports (allowed: standard 443).
- **Network Isolation & SSRF Prevention**: Rejects loopback addresses (`127.0.0.1`, `::1`), private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), AWS metadata endpoints (`169.254.169.254`), and internal hostnames (`localhost`, `*.local`, `*.internal`).
- **Approved Registry Allowlist**: Validates target hostnames against an explicit registry of approved opportunity domains (`devpost.com`, `mlh.io`, `hec.gov.pk`, `fulbright.org`, `kaggle.com`, `lablab.ai`, etc.).
- **Redirect Re-Validation**: Intercepts HTTP redirects (301/302/307/308) and re-evaluates the redirect target against the full SSRF and domain security rules before following (max 3 redirects).
- **Resource Constraints**: Implements short request timeouts (6s), payload size limits (500KB max HTML body), safe User-Agent headers, and HTML tag sanitization.
- **Client Security Isolation**: Unauthenticated guests use keyless local heuristic parsing for text. Server-side URL fetching is strictly restricted to authenticated users.

---

## 🛡️ 3. Approved Sources Registry (`src/config/approvedSources.ts`)

| Domain | Source Name | Source Type | Trust Tier | Fetch Supported |
| :--- | :--- | :--- | :--- | :--- |
| `devpost.com` | Devpost | Approved Platform | Tier 2 Verified | Yes |
| `mlh.io` | Major League Hacking (MLH) | Official Source | Tier 1 Official | Yes |
| `github.com` | GitHub Education & Grants | Approved Platform | Tier 2 Verified | Yes |
| `hec.gov.pk` | Higher Education Commission Pakistan | Official Source | Tier 1 Official | Yes |
| `fulbright.org` | Fulbright Program | Official Source | Tier 1 Official | Yes |
| `usefp.org` | USEFP Pakistan | Official Source | Tier 1 Official | Yes |
| `erasmus-plus.ec.europa.eu` | Erasmus+ European Commission | Official Source | Tier 1 Official | Yes |
| `lablab.ai` | Lablab.ai | Approved Platform | Tier 2 Verified | Yes |
| `kaggle.com` | Kaggle Competitions | Approved Platform | Tier 2 Verified | Yes |
| `unstop.com` | Unstop Competitions | Approved Platform | Tier 2 Verified | Yes |
| `hackerearth.com` | HackerEarth | Approved Platform | Tier 2 Verified | Yes |
| `ycombinator.com` | Y Combinator | Official Source | Tier 1 Official | Yes |

*Unapproved external domains cannot be fetched by the server; the UI instructs users to paste raw listing text instead for safe parsing.*

---

## 📊 4. Deterministic Trust Score & Verification Rules (`src/utils/trustScore.ts`)

Trust scores (0–100) are evaluated deterministically without relying on opaque AI scores:

1. **Registry Domain Tier (+35 max points)**:
   - Tier 1 Official Domain: **+35 pts**
   - Tier 2 Approved Platform Domain: **+25 pts**
   - Community Submitted / Unapproved Domain: **+10 pts**
2. **HTTPS & Application URL (+15 points)**: Valid secure application link matching HTTPS.
3. **Deadline & Freshness (+15 points)**: Active future deadline format (+15 pts). Expired deadlines cap total trust score at 40 max.
4. **Metadata Completeness (+25 points)**: Title >= 5 chars, Organization, Eligibility tags, and Description >= 40 chars.

### Verification States & Labels Legend
- **`Official Source` (`source-confirmed`)**: Fetched directly from a Tier 1 official domain with high trust score (>= 75).
- **`Approved Platform` (`source-confirmed`)**: Fetched directly from a Tier 2 approved platform with high trust score (>= 75).
- **`Community Submitted` (`unverified`)**: Pasted text or community listing without direct server URL fetch confirmation.
- **`Needs Review` (`needs-review`)**: Trust score < 50 or incomplete metadata fields.
- **`Expired` (`expired`)**: Past specified deadline.

*Honest Verification Policy: An opportunity is labeled "Verified / Source Confirmed" ONLY when fetched directly from an approved registry domain.*

---

## 📅 5. Expiry & Freshness Handling (`src/utils/dateUtils.ts`)

Calculates standardized status:
- **`Open`**: Active deadline with > 7 days remaining.
- **`Closing soon`**: Active deadline with <= 7 days remaining.
- **`Expired`**: Past specified deadline.
- **`Date unknown`**: Flexible or unspecified deadline string.

*Expired opportunities remain viewable if saved by a user, but are marked with a red Expired badge, trust score capped at 40, and excluded from high-priority top match promotion.*

---

## 🔄 6. Duplicate Opportunity Prevention (`src/utils/duplicateHash.ts`)

- **URL Normalization**: Lowercases scheme/host, strips tracking parameters (`utm_source`, `utm_medium`, `ref`, `fbclid`), fragment IDs, and trailing slashes.
- **Deterministic Content Hash**: Generates an FNV-1a hash key based on `normalizedTitle|normalizedOrg|normalizedUrl`.
- **Database Indexing**: Unique conditional indexes on `(user_id, normalized_url)` and `(user_id, content_hash)` in Supabase Postgres.
- **Duplicate Result UI**: If a duplicate exists, the modal alerts the user with an option to view or update the existing opportunity record.

---

## 💾 7. Database Migration (`supabase/migrations/002_phase2_opportunity_provenance.sql`)

Applies Phase 2 schema extensions:
```sql
ALTER TABLE public.custom_opportunities
  ADD COLUMN IF NOT EXISTS normalized_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('official', 'approved-platform', 'community-submitted', 'user-pasted')) DEFAULT 'user-pasted',
  ADD COLUMN IF NOT EXISTS trust_tier TEXT DEFAULT 'tier-3-community',
  ADD COLUMN IF NOT EXISTS trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS extraction_engine TEXT DEFAULT 'Local Heuristic Engine',
  ADD COLUMN IF NOT EXISTS extraction_confidence INTEGER CHECK (extraction_confidence BETWEEN 0 AND 100) DEFAULT 70,
  ADD COLUMN IF NOT EXISTS verification_state TEXT CHECK (verification_state IN ('unverified', 'source-confirmed', 'needs-review', 'expired')) DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS source_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_opps_user_normalized_url
  ON public.custom_opportunities(user_id, normalized_url)
  WHERE normalized_url IS NOT NULL AND normalized_url <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_opps_user_content_hash
  ON public.custom_opportunities(user_id, content_hash)
  WHERE content_hash IS NOT NULL AND content_hash <> '';
```

---

## 💻 8. Automated Testing & Verification Commands

```bash
# Run unit test suite (Vitest)
npm test

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

**Test Suite Coverage (`src/__tests__/`)**:
- `urlSecurity.test.ts`: SSRF private IP blocking, HTTPS validation, credentials rejection, approved domain allowlist matching, HTML text extraction.
- `trustScore.test.ts`: Trust score calculation, verification state assignment, explanation reasons.
- `dateUtils.test.ts`: Deadline status parser (Open, Closing soon, Expired, Date unknown).
- `duplicateHash.test.ts`: Tracking parameter stripping, FNV-1a content hash stability.

---

## ⚙️ 9. Owner Setup & Manual Supabase Actions

1. Log in to [Supabase Console](https://supabase.com) -> Select your project -> **SQL Editor**.
2. Run `supabase/migrations/001_phase1_core.sql` (if not already applied).
3. Run `supabase/migrations/002_phase2_opportunity_provenance.sql`.
4. Verify under **Table Editor** -> `custom_opportunities` that provenance columns and unique indexes are active.

---

## ⚠️ 10. Limitations & Exclusions

- **No Unrestricted Web Scraping**: URL fetching is strictly limited to approved registry domains.
- **No Automatic Truth Guarantee**: AI extraction parses text, but official status requires registry domain verification.
- **Out of Scope for Phase 2**: Resend email alerts, social media scraping, PDF/DOCX parsing, public moderation queues, automatic GitHub pushing.

---

## 🎓 11. Step-by-Step Evaluator Walkthrough

1. **Dual Ingestion Modes**: Click **Ingest Opportunity** in the top navigation. Switch between **Fetch Approved Source URL** and **Paste Raw Listing Text**.
2. **Approved Domain Real-time Verification**: Type `https://devpost.com/hackathons/agentic-ai-2026` -> Observe green check badge for approved platform. Type `https://unapproved.com` -> Observe informative warning asking user to paste text.
3. **Editable Preview & Trust Score Breakdown**: Click **Extract & Review Listing**. Review extracted fields (Title, Org, Deadline, Tech Stack, Description), edit any field, and view the Trust Score & Rationale panel.
4. **Duplicate Prevention**: Ingest the same URL twice -> Observe the Duplicate Opportunity Warning Banner preventing duplicate creation.
5. **Card Provenance Badges**: Observe opportunity cards rendering domain tags (`devpost.com`), verification state badges (`Verified Source` vs `Community`), and deadline status pills (`Closing soon` / `Expired`).

---

## 🖥️ 12. Phase 4: Career Execution Command Center

Phase 4 transforms OpportunityPulse AI from an opportunity discovery tool into a **complete career workflow hub**.

### Features Added

#### My Career Workspace
Open via the **Career Workspace** button in the navbar (or the user dropdown menu). The full-screen workspace contains five tabs:

| Tab | Description |
| :--- | :--- |
| **Today's Actions** | Deterministic action queue ordered by urgency, with "Why this is next" explanations per item |
| **Kanban Board** | 9-column application pipeline (Saved → Archived). Use ‹ › buttons to move cards between stages. |
| **Deadline Timeline** | All tracked applications and saved opportunities ordered by days remaining. Expired items never promoted. |
| **Progress** | Metrics: Active, Submitted, Interview, Offers, Pending Tasks, Overdue Actions, Completion Rate bar. |
| **Notifications** | Read-only audit log of notification_deliveries for authenticated users. |

#### Action Task System
- Create tasks manually or from any application/opportunity card (`+` button on Kanban card).
- Set title, description, priority (low / medium / high / urgent), and due date.
- Complete ✓ or reopen tasks.
- Delete with explicit confirmation step.
- Guest users: tasks saved to `localStorage` under key `opp_pulse_action_tasks_v1`.
- Authenticated users: tasks persisted in Supabase `action_tasks` table with full RLS.

#### Smart Prioritization (`src/utils/actionPrioritization.ts`)
Fully deterministic — no opaque AI. Each action is scored and explained:
- `"Deadline in 2 days"` — urgency from opportunity deadline
- `"High match score: 88%"` — from existing match results
- `"Application is ready to submit"` — from application status
- `"Official source"` — from trust tier (tier-1-official)
- `"Your next action date has passed"` — from nextActionAt field
- `"You saved this opportunity but have not started an application"` — from saved IDs vs applications
- Expired opportunities are **never promoted** in the queue.
- Low-trust/community listings are labeled accordingly.

---

## 💾 13. Phase 4 Database Migration

### Migration file: `supabase/migrations/005_career_action_tasks.sql`

```sql
-- Creates action_tasks table with strict RLS and automatic timestamps
CREATE TABLE IF NOT EXISTS public.action_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  opportunity_id TEXT,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  description TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- + RLS policies (SELECT/INSERT/UPDATE/DELETE for auth.uid() = user_id)
-- + Trigger: auto-sets updated_at, completed_at on completion, clears it on reopen
```

### Manual Supabase Action Required

> [!IMPORTANT]
> After pulling this branch, run the migration in your Supabase project:
>
> 1. Log in to [Supabase Console](https://supabase.com) → Your project → **SQL Editor**.
> 2. Open `supabase/migrations/005_career_action_tasks.sql`.
> 3. Copy the full SQL and execute it.
> 4. Verify under **Table Editor** that `action_tasks` appears with the correct columns and RLS enabled.
>
> **Guest mode** (no Supabase) works automatically via `localStorage` — no migration needed.

---

## 🧪 14. Phase 4 Automated Tests

**Test Files added:**
- `src/__tests__/actionPrioritization.test.ts` — 24 tests covering:
  - Priority ordering (score descending)
  - Expired opportunity exclusion
  - High-match / high-trust score boosts
  - Task overdue/today/future urgency
  - Application status tiers (ready_to_submit > drafting > saved)
  - Integration: combined tasks + applications + saved opportunities
- `src/__tests__/actionTaskStorage.test.ts` — 22 tests covering:
  - Load/save/upsert/delete CRUD
  - Empty-state safety (empty localStorage, invalid JSON, non-array)
  - Serialization round-trip
  - Lifecycle integration (create → update → complete → delete)

**Full test suite: 8 test files, 87 tests pass.**

```bash
npm test
# Test Files  8 passed (8)
#      Tests  87 passed (87)
```

---

## 🎓 15. Phase 4 Evaluator Walkthrough

1. **Open Career Workspace**: Click **Career Workspace** button in navbar (visible on desktop). Or click your user avatar → **My Career Workspace** in the dropdown.

2. **Today's Actions tab** (opens by default):
   - Observe the deterministic action queue with urgency badges.
   - Expand any item to read the "Why this is next" chip reasons.
   - Click **New Task** → fill title, priority, due date → click **Create Task**.
   - Complete a task using the circle toggle; reopen with the checkmark toggle.
   - Delete a task using the trash icon + confirmation.

3. **Kanban Board tab**:
   - Find an application card in the Saved column.
   - Click `›` to move it to Researching.
   - Click the `+` icon on any card to create a linked task.
   - Click the card title to open its full Application Workspace modal.

4. **Deadline Timeline tab**:
   - Observe applications and saved opportunities ordered by days remaining.
   - Items with ≤7 days remaining appear with amber highlights.
   - Expired items are de-emphasized and never promoted.

5. **Progress tab**:
   - View Active / Submitted / Interview / Offer / Task metrics.
   - Completion rate bar tracks applications that reached submission or beyond.
   - If overdue tasks exist, a red warning banner provides a quick-link to the Actions tab.

6. **Notifications tab**:
   - If authenticated: see the `notification_deliveries` audit log (sent/queued/failed/suppressed).
   - If guest: displays a "Sign in to view" gate.

7. **Keyboard accessibility**:
   - Tab through all controls; all buttons have descriptive `aria-label` attributes.

---

## 16. Phase 5 Production Readiness

### Performance and deferred features

The opportunity feed, filters, matching engine, and core navigation remain in the initial bundle. Career Workspace, Application Workspace, Decision Analytics, ingestion, Copilot, Profile, and Notification Preferences load with `React.lazy` only when opened. Modal fallbacks expose a live loading status and preserve Escape/focus behavior after the deferred dialog mounts.

Measured with `npm run build` on the same base and Phase 5 source trees:

| Measurement | Base commit `34357c3` | Phase 5 | Change |
| :--- | ---: | ---: | ---: |
| Initial JavaScript entry, minified | 593.44 KB | 487.08 KB | -106.36 KB (-17.9%) |
| Initial JavaScript entry, gzip | 156.22 KB | 135.28 KB | -20.94 KB (-13.4%) |
| CSS, minified | 36.50 KB | 37.81 KB | +1.31 KB |

The Phase 5 build also emits separate deferred chunks, including Career Workspace (46.24 KB minified / 11.69 KB gzip), Decision Analytics (21.20 KB / 5.55 KB), and Application Workspace (15.61 KB / 4.35 KB). These are build measurements, not Lighthouse scores or deployment claims.

### PWA and offline behavior

- Production builds include `/manifest.webmanifest`, dark theme metadata, mobile/Apple metadata, and SVG application icons.
- The service worker caches the app shell and static hashed assets for a repeat visit/offline shell. It does not cache `/api/*`, Supabase responses, authentication state, resumes, tokens, or provider secrets.
- The app shows an offline banner when browser connectivity is unavailable. Guest bookmarks, custom opportunities, applications, and tasks continue to use local storage. Authenticated cloud reads retain the local snapshot when a fetch fails and expose a retry control; cloud writes may require a later retry.
- A deployed service-worker update displays a keyboard-accessible refresh prompt. Service-worker registration is skipped in development, so local Vite runs do not depend on it.

Install from a production HTTPS deployment using the browser’s install icon or **Install OpportunityPulse** menu item. Service-worker installability cannot be verified from `localhost` alone; verify it manually after deployment.

### Quality commands

```bash
npm.cmd run lint
npm.cmd test
npm.cmd run typecheck:server
npm.cmd run build
npm.cmd run test:e2e
git diff --check
```

The browser suite uses Playwright against the production preview on port `4173` and requires Chromium (`npx playwright install chromium`). It runs without Gemini, Resend, or Supabase secrets. CI runs lint, the 87-test Vitest unit suite, server-route type checking, a production build, and the six-workflow Playwright suite.

### Manual browser verification still required

Before release, manually verify at 360 px, 768 px, and desktop widths: navbar no-overflow, feed filters, touch targets, each deferred modal, all Career Workspace tabs, notification sign-in gate, offline banner, retry states, service-worker install, and the update-available refresh flow after a second deployment. Also verify authenticated Supabase/RLS behavior with a non-production test account; automated tests intentionally use guest/local mode.

### Client-safe diagnostics and server errors

`src/services/errorReporting.ts` provides local-only, metadata-only diagnostics. It does not transmit personal content, resumes, access tokens, or API keys, and no paid monitoring service is required. API routes return a consistent `{ success, error, data? }` JSON shape for the covered responses, use appropriate HTTP status codes, and keep provider/internal error details server-side.
   - Press `Escape` anywhere in the modal to close it.
   - Kanban move buttons (`‹`/`›`) are keyboard-focusable and announce the action via `aria-label`.


# 🚀 OpportunityPulse AI — Agentic Opportunity Radar & Career Growth Platform

> **HEC ACT-AI Capstone Project Report — Phase 2 Trusted Opportunity Ingestion, Source Provenance, & Verification Workflow**
>
> **Author / Maintainer**: Arsalan Qasim
>
> **Release**: Phase 2 Trusted Ingestion & Source Provenance Architecture
> **Current Build Status**: Active (Phase 2 URL Ingestion & SSRF Protection, Approved Source Registry, Deterministic Trust Score Engine, Duplicate Prevention, Supabase Provenance RLS Schema)

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

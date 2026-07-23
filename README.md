# 🚀 OpportunityPulse AI — Agentic Opportunity Radar & Career Growth Platform

> **HEC ACT-AI Capstone Project Report — Phase 1 Secure Server-Side AI Platform & Supabase Integration**
>
> **Author / Maintainer**: Arsalan Qasim
>
> **Release**: Phase 1 secure platform foundation
> **Current Build Status**: Phase 1 Active (Secure Server-Side AI Gateway, Supabase Auth & Postgres RLS Persistence, Transparent Local Fallback Engine)

---

## 📌 1. Project Context & Purpose

**OpportunityPulse AI** is an Agentic AI-powered Opportunity Radar & Career Growth Platform built for the **HEC ACT-AI Capstone Project**. It cuts through social media noise to help university students, fresh graduates, and tech youth discover, match, and apply for high-signal career opportunities (AI Hackathons, International Scholarships, Remote Internships, and Tech Grants).

---

## 🏗️ 2. Phase 1 Architecture & Security Model

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

### Zero-Key Browser Security Protocol
- **Server-Only LLM API**: `GEMINI_API_KEY` is strictly a server-side environment variable processed inside Vercel Serverless Functions (`api/ai.ts`). No AI SDK or provider key is compiled into browser JS bundles, stored in `localStorage`, or requested from users in UI forms.
- **Supabase Row Level Security**: User profiles (`profiles`), bookmarks (`saved_opportunities`), and custom ingested listings (`custom_opportunities`) are isolated per-user in Supabase Postgres with strict RLS policies (`auth.uid() = id`).
- **Transparent Local Fallback Engine**: If backend services or `GEMINI_API_KEY` environment variables are unconfigured, the application transparently operates using a local smart heuristic fallback engine. The active engine mode is explicitly labeled across the UI ("Secure Server AI Gateway" vs "Local Heuristic Engine").

---

## ⚡ 3. Feature Matrix & Build Comparison

| Feature | Phase 0 Prototype | Phase 1 Platform (Current Build) |
| :--- | :--- | :--- |
| **Authentication** | Local Storage Demo Account | **Supabase Auth** (Email/Password, Async Session Restoration) |
| **User Data Storage** | `localStorage` | **Supabase Postgres + RLS** (Per-User Scoped Persistence) |
| **AI Processing Gateway** | Local Rule Heuristics | **Vercel Serverless Gateway (`api/ai.ts`)** + Google Gemini |
| **API Key Security** | Zero-Key Protocol | **Server-Only `GEMINI_API_KEY`** (Zero Browser Secret Leaks) |
| **Fallback System** | N/A | **Transparent Heuristic Fallback Engine** (Zero-Key Execution) |
| **UI Engine Transparency** | Static Specs | **Dynamic Active Engine Badges** on Score Cards & Modals |

---

## 💾 4. Database Schema & RLS Policies (`supabase/migrations/001_phase1_core.sql`)

### 1. `profiles`
- Linked 1:1 with `auth.users(id)`
- Stores user career level, major, skills, target categories, location preference, and bio.
- **RLS**: `auth.uid() = id` (Users can select, insert, and update only their own profile).

### 2. `saved_opportunities`
- Stores user bookmarked opportunity IDs (`user_id`, `opportunity_id`, `created_at`).
- Unique constraint on `(user_id, opportunity_id)`.
- **RLS**: `auth.uid() = user_id` (Users can select, insert, and delete only their own saved items).

### 3. `custom_opportunities`
- Stores user-ingested listings (`id`, `user_id`, `title`, `organization`, `category`, `deadline`, `location`, `stipend_or_prize`, `tech_stack_or_eligibility`, `description`, `apply_url`, `featured`, `posted_date`, `source_url`, `created_at`).
- **RLS**: `auth.uid() = user_id` (Users can select, insert, update, and delete only their own ingested listings).

---

## 🌐 5. Secure Server-Side AI Gateway (`api/ai.ts`)

The server-side gateway endpoint operates under `api/ai.ts` and enforces:
- **POST Method Only**: Returns HTTP 405 Method Not Allowed for non-POST requests.
- **Request Size Limiting**: Rejects payloads exceeding 100KB with HTTP 400.
- **Zod Input Schema Validation**: Validates inputs across 4 discriminated operations (`evaluate-match`, `generate-pitch`, `ingest-text`, `extract-resume`).
- **JWT Authorization Check**: Requires and validates `Authorization: Bearer <access_token>` against Supabase Auth before any server-side AI request.
- **Structured LLM Output**: Uses `@google/genai` in JSON mode and validates every structured response with a server-side Zod schema before returning it.
- **Prompt Injection Defense**: Isolates untrusted user posts and CV text inside `<untrusted_input>` tags separated from system instructions.
- **Sanitized Error Responses**: Never exposes API keys, raw provider errors, stack traces, or internal prompts.

---

## ⚙️ 6. Environment Setup & Configuration

Copy `.env.example` to set up environment variables for local testing or Vercel deployment:

```bash
# -----------------------------------------------------------------------------
# BROWSER / SUPABASE PUBLIC CONFIGURATION (Safe for VITE_ prefix)
# -----------------------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# -----------------------------------------------------------------------------
# SERVER-ONLY BACKEND CONFIGURATION (NEVER expose to browser/VITE_)
# -----------------------------------------------------------------------------
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-server-side-gemini-api-key
```

> [!WARNING]
> Never set `VITE_GEMINI_API_KEY`. `GEMINI_API_KEY` must remain a server-only environment variable.

---

## 🚀 7. Owner Setup & Manual Deployment Roadmap

### A. Supabase Project & SQL Setup
1. Log in to [Supabase Console](https://supabase.com) and create a new project.
2. Go to **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `supabase/migrations/001_phase1_core.sql` and run the script.
4. Verify under **Table Editor** that `profiles`, `saved_opportunities`, and `custom_opportunities` exist with Row Level Security (RLS) enabled.
5. In **Authentication -> Providers**, ensure Email provider is enabled. (Optional: Disable "Confirm email" if you desire instant signups without email verification).

### B. Vercel Project Deployment
1. Import the repository into Vercel.
2. In Vercel Project Settings -> **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. Deploy the application.

---

## 💻 8. Local Development & Verification

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
   *(The dev server automatically proxies `/api/ai` endpoints via the integrated dev middleware plugin in `vite.config.ts`)*.
3. Run Quality Verification Commands:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🎓 9. Step-by-Step Evaluator Walkthrough

1. **Local Preview / Guest Mode**:
   - Open the app without setting environment variables.
   - Observe the "Guest Preview" badge in the navbar and "Active AI Engine: Local Heuristic Engine".
   - Test matching, pitch generation, CV parsing, and link ingestion. All features operate keylessly.
2. **Supabase Auth & Data Scoping**:
   - Click **Log In / Sign Up**. Register a new account.
   - Update your profile skills or target categories. Refresh the browser; verify user profile persistence.
   - Toggle opportunity bookmarks. Sign out and sign back in to verify data scoping.
3. **Engine Transparency & Privacy Modal**:
   - Click the gear icon (**Engine Status & Data Privacy**).
   - Observe real-time status of Supabase Postgres RLS Auth and active AI processing gateway mode.

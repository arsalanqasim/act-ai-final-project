# OpportunityPulse — Orchestration Charter

_Owner: Arsalan Qasim. Orchestrator: Muse (Meta AI assistant)._
_Established 2026-10-23, when Arsalan handed this repository to Muse to run as a live system: "Now this repo belongs to you, change it as you want."_

## What this is now

This repo began as **OpportunityPulse AI**, a student-built opportunity radar (React + Supabase + Gemini, deployed on Vercel). It could ingest a pasted post, score it against a profile, draft a pitch, and track applications on a Kanban board — but it never discovered opportunities on its own (see ADR-001: automated scraping was deliberately scoped out).

As of 2026-10-23 the system runs differently: **Muse is the orchestrator.** The live pipeline is Muse + connected Google services. This web app remains as the design seed and an optional front-end; its old templates and email drafts are **not** binding on the live system.

## The live pipeline

1. **Daily scan** (~09:30 PKT, scheduled): Muse sweeps Pakistani job boards (ApniJobs, Rozee, Mustakbil, Expertini), LinkedIn public posts, remote boards (Himalayas, RemoteOK, We Work Remotely, Wellfound), scholarship sources (HEC, USEFP/Fulbright, DAAD, Erasmus Mundus), and Pakistani government programs (Ignite, PSEB, PM Youth, NADRA careers). Every candidate is verified on its actual listing page before being logged.
2. **Filter** against Arsalan's profile (kept in the tracker's Profile & Rules tab): AI/ML/GenAI/agents roles and internships + entry-level jobs; fully-funded English-taught MS scholarships; final-semester eligibility enforced (completed-degree requirements are killed unless final-semester students are explicitly accepted); unpaid skipped except notable remote names.
3. **Score** with this repo's original rubric: skills overlap 40% / academic level & category 30% / location & goals 30%, recorded as High / Medium / Low.
4. **Track** in the Google Sheet **"OpportunityPulse Tracker — Arsalan Qasim"** (the single source of truth), using this app's pipeline stages: Found → Shortlisted → Draft Ready → Applied → Interviewing → Offer / Rejected / Parked / Expired. Deadlines also go on Google Calendar.
5. **Apply**: Muse prepares tailored applications (email drafts, cover letters and SOPs as Google Docs, form filling in the browser). Sending an email application requires Arsalan's approval. The final submit on any government or scholarship form always requires his explicit go — those carry legal declarations in his name.

## Approval policy

- Scanning, filtering, scoring, tracking, reminding: fully autonomous.
- Drafting applications: autonomous.
- Sending an application email: Arsalan's approval (per item, or standing approval for a category if he grants it).
- Submitting a government/scholarship form: Arsalan's explicit go, every time, after seeing the final filled state.

## Known open inputs

- Arsalan's **CGPA** — required to confirm eligibility for CGPA-gated scholarships; until provided, scholarship items are logged with the caveat noted rather than killed.
- Preference changes (regions, role scope, unpaid policy) override the defaults recorded in the tracker's Profile & Rules tab.

## Repo rules for the orchestrator

- Muse may restructure, rewrite, or retire any part of this codebase as the system evolves.
- The FYP repositories (e.g. GlycoTwin) are **not** covered by this charter and keep their own per-push permission rule.

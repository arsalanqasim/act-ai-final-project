# DECISIONS.md — Architectural Decision Records (ADRs)

## ADR-001: Scoping Ingestion Engine over Full Web Scraping

### Status
Accepted

### Context
Initial concepts proposed 24/7 automated background web scraping of social networks. However, full web-wide scraping faces IP rate-limiting, Cloudflare anti-bot blocks, and Vercel serverless function execution timeouts (10s-60s limit).

### Decision
We implement a **Hybrid Ingestion Architecture**:
1. Pre-seed the system with high-yield active 2026 opportunity datasets (Devpost, MLH, Fulbright/Erasmus/HEC scholarships, remote tech roles).
2. Build an **AI-powered Link & Unstructured Text Ingester** allowing users/admins to paste any messy URL, LinkedIn post, or WhatsApp text for instant extraction into structured JSON schema.

### Consequences
- Eliminates IP banning risks and serverless execution timeouts.
- Guarantees 100% reliable execution on Vercel's free tier.
- Gives users immediate control to ingest any new opportunity they find online.

---

## ADR-002: Frontend Framework Selection (React 18 + Vite + Tailwind CSS)

### Status
Accepted

### Context
The project requires a fast, responsive, modern, visually stunning single-page application with dark mode, modal overlays, smooth transitions, and instant reactivity.

### Decision
Use **React 18** bundled with **Vite** and styled using **Tailwind CSS** and **Lucide React Icons**.

### Consequences
- Lightning-fast build and development server start times.
- Zero Vercel deployment configuration headaches.
- Complete modular control over state and UI components.

---

## ADR-003: Dual Execution Engine (Gemini API + Local Heuristic Fallback)

### Status
Accepted

### Context
HEC graders will evaluate the deployed Vercel link. Graders might not enter their own API key. Relying strictly on a paid or mandatory API key creates failure risk if API keys expire or rate limits are reached.

### Decision
Implement a **Dual Execution Engine**:
- **Primary Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`) via AI Studio SDK.
- **Fallback Engine**: Local client-side Jaccard/TF-IDF skill matching heuristics + algorithmic proposal template builder.

### Consequences
- 100% out-of-the-box functionality guaranteed for any grader or visitor.
- Zero runtime crash risk.
- Seamless upgrade to live Gemini LLM execution when an API key is present.

---

## ADR-004: Zero-Cost Infrastructure Commitment

### Status
Accepted

### Context
The project must involve $0 financial expense for APIs, databases, hosting, or software tools.

### Decision
- Host on **Vercel Hobby Tier** ($0).
- Source code in **GitHub Public Repository** ($0).
- LLM intelligence via **Google AI Studio Gemini Free Tier** ($0).
- Client state in **Browser LocalStorage** ($0).

### Consequences
- No subscription fees or surprise cloud bills.
- Meets all student capstone budget constraints.

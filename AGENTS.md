# AGENTS.md — Agentic AI Coding & Architecture Conventions

## 1. Project Context & Purpose
**OpportunityPulse AI** is an Agentic AI-powered Opportunity Radar & Career Growth Platform built for the **HEC ACT-AI Capstone Project**. It helps university students, fresh graduates, and tech youth cut through social media noise to discover, match, and apply for high-signal opportunities (AI Hackathons, International Scholarships, Remote Internships, and Tech Grants).

---

## 2. Core Agent Roles & System Architecture

The application uses an **Agentic Multi-Agent State Machine**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      OPPORTUNITYPULSE AI ENGINE                        │
 ├────────────────────────────────────────────────────────────────────────┤
 │                                                                        │
 │  1. Ingestion Agent     │ Extracts structured JSON from raw posts/URLs │
 │  2. Matching Agent      │ Computes 0-100% Match Index & Rationale      │
 │  3. Copilot Agent       │ Generates custom 1-page proposals & pitches   │
 │  4. Dispatcher Agent    │ Prepares email alert summaries & notifications │
 └────────────────────────────────────────────────────────────────────────┘
```

### Agent Definitions & Responsibilities:

1. **Ingestion & Parsing Agent (`IngestionAgent.ts`)**:
   - **Role**: Structured Data Extractor.
   - **Input**: Raw text, URL, LinkedIn post, or pre-seeded JSON feed.
   - **Output**: Standardized `Opportunity` object (`id`, `title`, `organization`, `category`, `deadline`, `eligibility`, `techStack`, `location`, `applyUrl`, `reward`).

2. **Semantic Matching Agent (`MatchingAgent.ts`)**:
   - **Role**: Profile Compatibility Evaluator.
   - **Input**: User `UserProfile` + `Opportunity`.
   - **Output**: `MatchResult` (`score`: 0-100, `keyMatches`: string[], `missingSkills`: string[], `verdict`: string).

3. **Application Copilot Agent (`CopilotAgent.ts`)**:
   - **Role**: AI Proposal & Pitch Writer.
   - **Input**: `UserProfile` + `Opportunity` + `ApplicationType` (Cover Letter, Upwork Proposal, Hackathon Team Pitch).
   - **Output**: Markdown-formatted custom application draft ready to copy/export.

4. **Alert Dispatcher Agent (`DispatcherAgent.ts`)**:
   - **Role**: Notification & Digest Manager.
   - **Input**: Matched opportunities with score > 80%.
   - **Output**: Formatted email payload (via Resend API) and UI notification state.

---

## 3. Technology Stack & Hard Constraints

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom Glassmorphism CSS utilities
- **Icons**: `lucide-react`
- **LLM Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`) via `@google/generative-ai` SDK
- **Fallback Engine**: Local Heuristic & Rules-based Match Engine (Zero-Key execution guaranteed)
- **Deployment**: Vercel (Hobby Tier — $0 Cost)
- **State Management**: React Context API + Browser `localStorage`

---

## 4. Coding Conventions for AI Agents

1. **Strict TypeScript Types**:
   - Every domain object must be fully typed in `src/types/index.ts`.
   - Do NOT use `any` types.

2. **Component Rules**:
   - Build modular, atomic components in `src/components/`.
   - Keep state mutation contained to Context or custom hooks in `src/context/` and `src/hooks/`.
   - All interactive elements MUST have unique, descriptive `id` attributes.

3. **Zero-Cost Security Protocol**:
   - NEVER hardcode API keys in source files.
   - API keys must be loaded from `import.meta.env.VITE_GEMINI_API_KEY` or entered dynamically via UI Settings modal (stored in `localStorage`).

4. **UI/UX Aesthetics Standard**:
   - Deep dark futuristic theme (`#0B0F19` background, cyan/indigo accent gradients).
   - Smooth hover micro-interactions (`transition-all duration-200`).
   - Clean typography with clear visual hierarchy.

---

## 5. File & Directory Structure

```
act-ai-final-project/
├── AGENTS.md                # Agentic instructions & coding conventions
├── ARCHITECTURE.md          # System architecture & component specs
├── CONTEXT.md               # Product Requirements Document (PRD)
├── DECISIONS.md             # Architectural Decision Records (ADRs)
├── implementation_plan.md   # Step-by-step build & verification roadmap
├── README.md                # HEC ACT-AI Capstone Project Report
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts
    ├── context/
    │   └── AppContext.tsx
    ├── services/
    │   ├── geminiService.ts
    │   ├── fallbackService.ts
    │   └── mockData.ts
    ├── components/
    │   ├── Navbar.tsx
    │   ├── HeroHeader.tsx
    │   ├── ProfileModal.tsx
    │   ├── OpportunityCard.tsx
    │   ├── OpportunityFeed.tsx
    │   ├── LinkIngesterModal.tsx
    │   ├── CopilotModal.tsx
    │   ├── SettingsModal.tsx
    │   └── StatsOverview.tsx
    └── utils/
        └── helpers.ts
```

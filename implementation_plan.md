# implementation_plan.md — OpportunityPulse AI Execution Plan

Build an end-to-end, zero-cost Agentic Opportunity Radar & Application Copilot app (**OpportunityPulse AI**) for Pakistani university students and tech youth for the **HEC ACT-AI Capstone Project**.

---

## Proposed Changes

### Phase 1: Environment Setup & Foundation
- Initialize React 18 + Vite + TypeScript project structure.
- Configure Tailwind CSS with custom Glassmorphism utilities and dark theme color tokens (`#0B0F19` void background, cyan `#06B6D4` and indigo `#6366F1` accents).
- Install `lucide-react` icons and `@google/generative-ai` SDK.

### Phase 2: Core Data Types & Services
- Build `src/types/index.ts` with `UserProfile`, `Opportunity`, `MatchResult`, and `FilterState` interfaces.
- Create `src/services/mockData.ts` pre-seeded with 12+ real active 2026 opportunities (Devpost AI Hackathons, Fulbright/Erasmus/HEC Scholarships, Remote Tech Internships, and Pakistani Tech Grants).
- Create `src/services/fallbackService.ts` for local zero-key heuristic matching & fallback proposal drafting.
- Create `src/services/geminiService.ts` implementing Gemini 1.5/2.0 Flash API integration for Ingestion, Matching, and Copilot drafting.

### Phase 3: Application Context & State Management
- Create `src/context/AppContext.tsx` providing global state for:
  - `userProfile` (with local storage persistence)
  - `opportunities` (with ability to add new ingested items)
  - `apiKey` (stored in settings)
  - `savedOpportunities`
  - `activeFilters`

### Phase 4: UI Components & Interactive Views
- `Navbar.tsx`: Brand logo, stats summary, "Ingest Link", "Settings", "Profile" buttons.
- `HeroHeader.tsx`: Eye-catching hero section highlighting active opportunities matched for Pakistani tech youth.
- `ProfileModal.tsx`: Interactive modal to set skills, major, target categories, and location.
- `OpportunityCard.tsx`: Glassmorphism card rendering match score badge (0-100%), matching skills tags, deadline countdown, and action buttons ("View Details", "Copilot Pitch", "Save").
- `OpportunityFeed.tsx`: Category tabs, search input, sort options, and responsive grid layout.
- `LinkIngesterModal.tsx`: Unstructured text/link parser modal (paste LinkedIn post/text $\rightarrow$ AI extracts structured opportunity).
- `CopilotModal.tsx`: AI Pitch Generator modal rendering markdown cover letter / pitch with 1-click copy & export.
- `SettingsModal.tsx`: API key manager, model selection, and zero-key fallback indicator.

### Phase 5: Verification & Capstone README Report
- Verify all interactive user flows end-to-end.
- Ensure fallback engine works when no API key is set.
- Prepare comprehensive `README.md` meeting all HEC ACT-AI rubric requirements.

---

## Verification Plan

### Automated Build Tests
```bash
npm run build
```
Verify zero TypeScript or Vite bundle errors.

### Manual Verification Flows
1. **Profile Setup**: Change skills/major $\rightarrow$ verify match scores recalculate instantly across all cards.
2. **AI Ingestion**: Paste sample LinkedIn hackathon post $\rightarrow$ verify Ingestion Agent creates structured Opportunity Card.
3. **Application Copilot**: Click "Copilot Pitch" $\rightarrow$ verify custom pitch draft renders formatted markdown with 1-click copy.
4. **Zero-Key Fallback**: Remove API key $\rightarrow$ verify all features run smoothly using the local engine.

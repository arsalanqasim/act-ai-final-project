# ARCHITECTURE.md — System Architecture & Component Specification

## 1. Executive Summary
**OpportunityPulse AI** is designed as a client-side agentic application powered by React 18, Vite, Tailwind CSS, and the Google Gemini API. It implements a zero-cost architecture with dual execution engines: a **Live Gemini AI Engine** and a **Smart Heuristic Fallback Engine**, ensuring 100% operational reliability regardless of API key availability.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        React 18 Single Page App                         │   │
│   │   (Vite + Tailwind CSS + Lucide Icons + Glassmorphism UI Components)    │   │
│   └────────────────────────────────────┬────────────────────────────────────┘   │
│                                        │                                        │
│                                        ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          AppContext & State Sync                        │   │
│   │          (User Profile, Opportunity Feed, Saved Items, Filters)         │   │
│   └────────────────────────────────────┬────────────────────────────────────┘   │
│                                        │                                        │
└────────────────────────────────────────┼────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                ENGINE SELECTOR LAYER                            │
│                                                                                 │
│          Has User / Env Gemini API Key?                                         │
│              ├── YES ──► Live Gemini 1.5 / 2.0 Flash SDK Engine                │
│              └── NO  ──► Local Smart Heuristic & Rules Engine                   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 EXECUTION AGENTS                                │
│                                                                                 │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐  │
│  │   Ingestion Agent     │ │    Matching Agent     │ │    Copilot Agent      │  │
│  │ (Raw Post Parser)     │ │ (0-100% Score Engine) │ │  (Pitch & CV Writer)  │  │
│  └───────────────────────┘ └───────────────────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models & TypeScript Schemas

### `UserProfile`
```typescript
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  major: string; // e.g. "Computer Science", "Software Engineering"
  academicLevel: 'Undergraduate' | 'Postgraduate' | 'Fresh Graduate' | 'High School';
  skills: string[]; // e.g. ["React", "Python", "Machine Learning", "Tailwind"]
  targetCategories: ('Hackathon' | 'Scholarship' | 'Internship' | 'Grant' | 'Tech Event')[];
  preferredLocation: 'Remote' | 'Pakistan' | 'Global' | 'Hybrid';
  bio: string;
  emailNotifications: boolean;
}
```

### `Opportunity`
```typescript
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: 'Hackathon' | 'Scholarship' | 'Internship' | 'Grant' | 'Tech Event';
  deadline: string; // YYYY-MM-DD
  location: string;
  stipendOrPrize: string;
  techStackOrEligibility: string[];
  description: string;
  applyUrl: string;
  featured?: boolean;
  postedDate: string;
}
```

### `MatchResult`
```typescript
export interface MatchResult {
  opportunityId: string;
  score: number; // 0 to 100
  verdict: 'Excellent Match' | 'Good Match' | 'Moderate Match' | 'Low Compatibility';
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
}
```

---

## 4. AI Engine Specifications & System Prompts

### 4.1 Ingestion Agent System Prompt
```text
You are an expert Opportunity Data Extractor.
Task: Given raw unstructured text (LinkedIn post, tweet, flyer, or article), extract clean JSON containing:
- title: string
- organization: string
- category: "Hackathon" | "Scholarship" | "Internship" | "Grant" | "Tech Event"
- deadline: string (YYYY-MM-DD format if found, otherwise "TBD")
- location: string
- stipendOrPrize: string
- techStackOrEligibility: array of strings
- description: concise 2-sentence summary
- applyUrl: valid URL or "N/A"

Output ONLY valid JSON matching this schema.
```

### 4.2 Matching Agent System Prompt
```text
You are a Senior Academic & Career Match Specialist evaluating an candidate profile against an opportunity listing.
Evaluate the profile against the opportunity based on:
1. Skill overlap (40%)
2. Academic level & Category alignment (30%)
3. Location & goal suitability (30%)

Calculate a 0-100 score, identify matching skills, missing requirements, and a 2-sentence justification.
```

### 4.3 Copilot Agent System Prompt
```text
You are an Executive Tech Career Coach and Proposal Writer.
Write a compelling, professional, customized 1-page application pitch for the specified candidate targeting the specified opportunity.
Structure:
- Hook & Motivation
- Relevant Technical Achievements & Stack Alignment
- Project Proposal / Value Proposition
- Call to Action & Professional Closing
```

---

## 5. Security & Zero-Cost Infrastructure
- **Phase 0** runs entirely in the browser using local heuristics, with state persisted in `localStorage`.
- **Phase 1** will introduce server-side API routes and persistent storage for production capabilities.
- Provider API keys must remain server-side only and must never be exposed through `VITE_*` variables or browser storage.
- Free Vercel hosting deployment.

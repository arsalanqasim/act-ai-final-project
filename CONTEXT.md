# CONTEXT.md — Product Requirements Document (PRD)

## 1. Problem Statement
In 2026, social media platforms (LinkedIn, Twitter/X, Instagram, Discord, and university WhatsApp groups) are saturated with engagement-driven noise, viral posts, and irrelevant marketing fluff. 

As a result:
- **80% of university students and fresh graduates in Pakistan** miss out on fully funded international scholarships (Fulbright, Erasmus Mundus, HEC grants), global AI hackathons (Devpost, MLH, Lablab.ai), and remote tech internships.
- Information is fragmented across dozens of unorganized platforms.
- Students waste hours reading posts only to realize they don't meet eligibility criteria or missed the deadline.

---

## 2. Product Vision & Target Audience

### Product Vision
**OpportunityPulse AI** is an intelligent, zero-noise Opportunity Radar & Application Copilot that continuously filters, matches, and assists candidates in securing high-yield academic and career opportunities.

### Primary Target Audience
- **Undergraduate & Postgraduate Students** in Computer Science, Software Engineering, AI, Electrical Engineering, and Business Administration across Pakistani universities.
- **Fresh Graduates & Young Freelancers** seeking remote tech roles, international scholarships, global hackathons, and tech grants.

---

## 3. Core Capabilities & User Workflows

### Flow 1: Profile Customization & Smart Feed Matching
1. User sets up profile (Major, Academic Level, Skills, Preferred Opportunities, Target Location).
2. The system computes real-time **0-100% Match Scores** for every opportunity in the database.
3. User filters opportunities by **Category**, **Match Tier** ("High Fit", "Good Match"), and **Location**.

### Flow 2: Live Unstructured Link / Text Parsing (Ingestion Agent)
1. User encounters a messy LinkedIn post, tweet, or WhatsApp text about an internship/hackathon.
2. User pastes the text/URL into OpportunityPulse AI.
3. The **Ingestion Agent** parses the post into a clean, structured opportunity card with deadline countdown, eligibility checklist, and apply link.

### Flow 3: 1-Click Application Copilot (Copilot Agent)
1. User clicks "Generate Application Pitch" on a high-match opportunity card.
2. The **Copilot Agent** drafts a customized cover letter / proposal pitch highlighting user's exact skills matching the opportunity.
3. User previews, edits, copies, or exports the draft.

### Flow 4: Alert Notifications & Offline Fallback Engine
1. User toggles email digest alerts.
2. If no API key is provided, the **Smart Heuristic Engine** computes scores and pitch drafts locally.
3. If a Gemini API key is provided, live Gemini LLM execution powers all agent workflows.

---

## 4. Success Metrics for HEC ACT-AI Evaluation
1. **Originality**: Addresses a verified real-world problem for university youth.
2. **Completion**: 100% functional, responsive UI without stub features.
3. **Deployment**: Deployed live on Vercel with a working public URL.
4. **Report & Documentation**: Exemplary GitHub README with system prompt, architecture diagrams, and usage instructions.

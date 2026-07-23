# 🚀 OpportunityPulse AI — Agentic Opportunity Radar & Application Copilot

> **HEC ACT-AI Skill Bridge Gap Course — Final Project Capstone**  
> **Student**: Arsalan (Individual Submission)  
> **Live Application URL**: [https://opportunitypulse-ai.vercel.app](https://opportunitypulse-ai.vercel.app) *(Deploy link placeholder)*  
> **Public GitHub Repository**: [https://github.com/arsalan/act-ai-final-project](https://github.com/arsalan/act-ai-final-project)

---

## 📌 1. App Name, Problem Statement & Target Audience

### App Name
**OpportunityPulse AI** — Autonomous Agentic Opportunity Discovery & Application Copilot.

### The Real World Problem
Every year, thousands of university students, fresh graduates, and tech youth across Pakistan miss out on high-yield international scholarships (Fulbright, Erasmus Mundus, HEC grants), global AI hackathons (Devpost, MLH), remote software engineering internships, and tech grants.

**Why?**
1. **Social Media Noise & Algorithms**: LinkedIn, Twitter/X, and WhatsApp groups are flooded with engagement bait, viral memes, and unorganized posts. High-signal opportunity posts get buried within hours.
2. **Scattered Information**: Opportunities are siloed across dozens of different websites with varying formatting and complex eligibility criteria.
3. **Application Friction**: Students often don't know how to tailor their skills to pitch themselves effectively for global hackathons or remote internships.

### Who It Solves It For
- **Undergraduate & Postgraduate Students** in Computer Science, Software Engineering, AI, Data Science, and Business Administration across public & private Pakistani universities.
- **Fresh Graduates & Young Freelancers** aiming for global remote internships, international study scholarships, and tech competitions.

---

## ⚡ 2. Features List — What OpportunityPulse AI Can Do

- 🎯 **Personalized 0-100% Match Scoring**: Computes real-time compatibility scores based on candidate skills, major, academic level, and location preferences.
- 📥 **Unstructured Text & Link AI Ingester**: Paste ANY raw LinkedIn post, WhatsApp message, or tweet $\rightarrow$ the AI Ingestion Agent parses it into a clean, structured opportunity card with deadline countdown and apply links.
- ✍️ **1-Click Application Copilot Pitch Writer**: Generates customized cover letters, Upwork/hackathon proposals, and skill-matching pitches formatted in clean Markdown.
- 🔍 **Multi-Dimensional Category Filtering**: Filter opportunities by Category (*Hackathon, Scholarship, Internship, Grant, Tech Event*), Match Tier (*Excellent, Good, Moderate*), and Location (*Remote, Pakistan, Global*).
- 💾 **Local Persistence & Bookmark Hub**: Bookmark high-priority opportunities and persist user profile metrics locally.
- ⚡ **Dual Execution Engine (Gemini AI + Zero-Key Fallback)**: Runs 100% reliably out-of-the-box using local heuristic matching, or upgrades to live Google Gemini 1.5/2.0 Flash AI execution when an API key is set.

---

## 🤖 3. The AI Feature & Custom System Prompts

OpportunityPulse AI uses a multi-agent orchestration architecture driven by 3 custom-crafted System Prompts:

### A. Ingestion Agent System Prompt
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
```

### B. Matching Agent System Prompt
```text
You are a Senior Academic & Career Match Specialist evaluating a candidate profile against an opportunity listing.
Evaluate the profile against the opportunity based on:
1. Skill overlap (40%)
2. Academic level & Category alignment (30%)
3. Location & goal suitability (30%)
Output a 0-100 score, matching skills, missing skills, and a 2-sentence recommendation.
```

### C. Copilot Pitch Writer System Prompt
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

## 🛠️ 4. Tools, Services & AI Models Used

- **AI Model**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`) via Google AI Studio (Free Tier - $0 Cost)
- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling & UI**: Tailwind CSS + Custom Glassmorphism Theme + Lucide React Icons
- **Deployment**: Vercel (Hobby Tier - $0 Cost)
- **State Management**: React Context API + LocalStorage
- **Agentic Harness**: `AGENTS.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `DECISIONS.md`

---

## 📸 5. Screenshots of OpportunityPulse AI

*(Screenshots will be captured and added once deployed live)*
1. **Hero & Opportunity Feed View**: Showing match scores, category tabs, and active 2026 listings.
2. **AI Ingestion Modal**: Pasting unstructured LinkedIn text and generating structured JSON card.
3. **Application Copilot Pitch Modal**: Rendered markdown cover letter draft ready for 1-click copy.

---

## 💻 6. How to Run the Project Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/arsalan/act-ai-final-project.git
   cd act-ai-final-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables (Optional)**:
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_free_gemini_api_key_here
   ```
   *(Note: If no API key is provided, the application automatically uses the built-in Smart Fallback Engine)*

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

### 🎓 HEC ACT-AI Course Compliance
- **100% Original Idea**: Solves opportunity discovery for Pakistani youth.
- **100% Completed**: Fully functional React SPA with dual AI engines.
- **100% Zero Cost**: Uses free Gemini API & free Vercel hosting.

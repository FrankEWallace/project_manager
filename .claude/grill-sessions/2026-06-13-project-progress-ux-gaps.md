---
date: 2026-06-13
topic: "project manager UX gaps + progress % implementation"
outcome: "Add per-project progress bar (slim bar + % number) to both the dashboard recent-projects table and /projects list, replacing the 'Created' column."
---

# Grill Session: Project Manager UX Gaps & Clean UI

## Q&A

1. **Q:** Who is the primary user of this app right now — you personally, or are you building it for other people to use?  
   **A:** Me personally but I want even my friends to use it, and later maybe other people will use it.

2. **Q:** When you open the app right now, what's the first thing you wish you could see that you currently can't — or what feels most broken/missing on the dashboard home screen?  
   **A:** A summary of all active projects with their status.

3. **Q:** For each project card in that summary, what 3–4 pieces of information matter most to you at a glance?  
   **A:** Name + health indicator + progress % + next deadline (as recommended).

4. **Q:** The dashboard already has KPI cards, status breakdown, overdue alerts, due-in-14-days sidebar, and upcoming payments. The biggest missing piece is per-project progress % in the project list — should that be a progress bar (visual), a percentage number, or both?  
   **A:** Both — slim progress bar + % number, on both dashboard home and /projects list page (as recommended).

5. **Q:** The /projects list page has 6+ columns. With progress % added, should progress replace one existing column, or add a card/grid view option?  
   **A:** Replace "Created" column with progress. No card view yet.

## Key Decisions

- Progress % displayed as: slim horizontal bar + numeric % label beneath it
- Shown in: dashboard "recent projects" table + /projects list table
- In /projects table: "Created" column replaced by "Progress"
- Per-project progress is milestone-derived (completed milestones / total milestones)
- API needs to return `progress` per project in both `/api/projects` and `/api/analytics/dashboard`
- Efficient implementation: single batch SQL GROUP BY query, not N+1 `computeProjectProgress()` calls
- No card/grid view — out of scope for this session
- Primary user: personal + small friend group → onboarding matters but not P0

## Open Questions

- None — implementation proceeding immediately.

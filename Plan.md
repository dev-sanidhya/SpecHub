# SpecHub - Plan.md

## What we're building
GitHub for PRDs. Propose, review, and approve changes to product requirement documents using a PR-style workflow. Full version history, AI-written changelogs, contradiction detection, and shareable diff links.

## Current Status
**Phase 3 - AI Features COMPLETE**

- Phase 1 complete: all screens built with Tiptap editor, diff view, suggestion/review flows
- Phase 2 complete: all API routes live, Supabase queries replacing demo data everywhere
- Phase 3 complete: Claude API integration for changelog, contradiction detection, diff summary
- ANTHROPIC_API_KEY still needs to be swapped in `.env.local` (placeholder set)
- Build passes clean - ready for local testing via `npm run dev`

## Architecture

### Stack
- **Frontend:** Next.js 16, TypeScript, TailwindCSS v4, Framer Motion
- **Editor:** Tiptap (rich text, extensible)
- **Diff:** diff-match-patch (Google's open source diff algorithm)
- **Auth:** Clerk (Google OAuth + GitHub OAuth)
- **Database:** Supabase (PostgreSQL + RLS)
- **AI:** Claude API (Anthropic SDK)
- **Deploy:** Vercel

### Core Entities
```
Workspace -> Documents -> Versions (immutable snapshots)
                       -> Suggestions (proposed changes, like PRs)
                            -> Reviews (approve/reject)
                            -> Comments (discussion thread)
```

### Key Design Decisions
1. **No direct edits** - all changes go through a suggestion/approval flow
2. **Versions are immutable** - once created, never modified
3. **AI changelog** - Claude writes the summary when a suggestion merges
4. **Shareable diff link** - view diffs without auth (public routes)

## File Structure
```
src/
  app/
    page.tsx                          - Landing page
    layout.tsx                        - Root layout with ClerkProvider
    middleware.ts                     - Auth protection
    sign-in/[[...sign-in]]/page.tsx   - Clerk sign-in
    sign-up/[[...sign-up]]/page.tsx   - Clerk sign-up
    dashboard/
      layout.tsx                      - Sidebar + nav
      page.tsx                        - Doc list
      docs/[id]/page.tsx              - Document editor (read/suggest/history modes)
      docs/[id]/suggestions/[sid]/page.tsx - Suggestion detail + approval
  components/
    ui/Button.tsx, Badge.tsx, Input.tsx
    editor/DocEditor.tsx, Toolbar.tsx
    diff/DiffView.tsx
  lib/supabase.ts, utils.ts
  types/database.ts
supabase-schema.sql                   - SQL to run in Supabase dashboard
```

## Screens

### Landing Page (`/`)
- Marketing page with hero, diff demo, features grid, CTA
- Links to /sign-up and /sign-in

### Sign In / Sign Up (`/sign-in`, `/sign-up`)
- Clerk components with dark theme styling
- Google OAuth + GitHub OAuth enabled

### Dashboard (`/dashboard`)
- List of documents with search
- Version number, open suggestions count, last updated
- Link to create new doc

### Document Page (`/dashboard/docs/[id]`)
Three modes toggled in the header:
- **Read mode** - read-only Tiptap view of current version
- **Suggest mode** - editable Tiptap, submit as a PR-style suggestion with title + reason
- **History mode** - version timeline sidebar + read-only view of selected version with AI changelog

Right sidebar shows open/merged suggestions for that doc.

### Suggestion Page (`/dashboard/docs/[id]/suggestions/[sid]`)
- DiffView of old vs new text
- Discussion thread (comments)
- Review panel: approve, reject, merge buttons
- AI summary of what the change does

## Completed Features

### Phase 1 - UI Scaffolding
- Landing page with marketing copy and live diff demo
- Sign in / Sign up via Clerk (Google + GitHub OAuth)
- Dashboard doc list with search
- Document page with 3 modes: Read, Suggest, History
- Suggestion detail page with diff view, comments, reviews

### Phase 2 - Supabase Integration
- All API routes live under `/api/`
- Real document create/read/update via Supabase
- Real suggestion create/approve/reject/merge flow
- Version history stored as immutable snapshots
- Comments and reviews fully wired

### Phase 3 - AI Features (Claude `claude-sonnet-4-6`)
- **Changelog on merge** - auto-generated 2-4 sentence summary stored in `versions.ai_summary`
- **Contradiction detection** - on every document edit (3s debounce), surfaces conflicting statements in sidebar
- **Diff summary** - on suggestion detail page load, bullet-point summary of what changed

## Phase 4 - UI Polish + Settings (COMPLETE)

- Spacing overhaul across all functional pages (dashboard, doc editor, suggestion review):
  - `space-y-4` upgraded to `space-y-6` on all main content areas
  - Panel headers and stats cells now use `px-7 py-6` / `px-7 py-8` for breathing room
  - Sidebar panel interiors: `p-5` upgraded to `p-6` throughout
  - Document list rows: taller, wider icon, more comfortable row padding
  - Empty states: larger icons, more vertical padding
- Settings page added at `/dashboard/settings`:
  - Workspace rename (live PATCH to `/api/workspace`, Enter to save)
  - Appearance (theme toggle in context)
  - AI features overview (contradiction detection, changelog, diff summary)
  - Account details (read-only Clerk data)
- Sidebar: Settings nav item added, nav `exact` matching prevents false active states
- Header: now context-aware - shows the current section label and a relevant subtitle per route
- Workspace API: `PATCH /api/workspace` added for name updates

## Next Steps

### Phase 5 - Integrations
- Slack webhook on suggestion opened/merged
- Notion import (paste Notion URL, fetch content)
- Shareable public diff links (no auth required)

### Phase 6 - Production
- Real-time updates (Supabase realtime subscriptions)
- Keyboard shortcuts
- Mobile responsive tweaks
- Deploy to Vercel

## Free vs Paid
**Free:** 3 docs, 3 members, full history, suggest/approve flow, 10 AI changelogs/month
**Paid ($18/user/month):** Unlimited docs, unlimited AI, Slack integration, audit export, custom approval chains

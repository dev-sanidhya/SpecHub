# SpecHub - Plan.md

## What we're building
GitHub for PRDs. Propose, review, and approve changes to product requirement documents using a PR-style workflow. Full version history, AI-written changelogs, contradiction detection, and shareable diff links.

## Current Status
**Phase 2 - Supabase Integration (UP NEXT)**

- Phase 1 complete: all screens built with demo data
- Clerk auth wired (Google + GitHub OAuth) - keys in .env.local
- Supabase project live: https://yretxiadimbytyjqaszw.supabase.co (ap-south-1)
- All 7 tables created with RLS, indexes, FK constraints, and updated_at triggers
- Next: replace demo data with real Supabase queries + API routes

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

## What's Using Demo Data (to be replaced with Supabase)
- Dashboard doc list
- Document content and versions
- Suggestions list
- Reviews and comments

## Next Steps

### Phase 2 - Supabase Integration
1. Set up Supabase project, run `supabase-schema.sql`
2. Fill in `.env.local` with real Supabase + Clerk keys
3. Wire up Clerk's `userId` to Supabase `user_id` fields
4. Replace demo data with real API routes:
   - `POST /api/documents` - create doc
   - `GET /api/documents/[id]` - fetch doc + current version
   - `POST /api/versions` - save new version
   - `POST /api/suggestions` - create suggestion
   - `PATCH /api/suggestions/[id]` - approve/reject/merge
5. On merge: call Claude API to generate ai_summary
6. On save: call Claude to run contradiction detection

### Phase 3 - AI Features
- Changelog generation on merge (Claude Sonnet)
- Contradiction detection on document save (Claude Opus)
- Plain-English diff summary between any two versions

### Phase 4 - Integrations
- Slack webhook on suggestion opened/merged
- Notion import (paste Notion URL, fetch content)
- Shareable public diff links (no auth required)

### Phase 5 - Polish + Deploy
- Real-time updates (Supabase realtime subscriptions)
- Keyboard shortcuts
- Mobile responsive tweaks
- Deploy to Vercel

## Free vs Paid
**Free:** 3 docs, 3 members, full history, suggest/approve flow, 10 AI changelogs/month
**Paid ($18/user/month):** Unlimited docs, unlimited AI, Slack integration, audit export, custom approval chains

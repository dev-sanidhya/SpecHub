# SpecHub - Plan.md

## What we're building
GitHub for PRDs. Propose, review, and approve changes to product requirement documents using a PR-style workflow. Full version history, AI-written changelogs, contradiction detection, and shareable diff links.

## Current Status
**Phase 5 - Team Collaboration COMPLETE**

- Phase 1 complete: all screens built with Tiptap editor, diff view, suggestion/review flows
- Phase 2 complete: all API routes live, Supabase queries replacing demo data everywhere
- Phase 3 complete: Claude API integration for changelog, contradiction detection, diff summary
- Phase 4 complete: spacing overhaul, settings page, dynamic header, workspace rename API
- Phase 4b complete: real user identity, on-demand AI checks, self-approval blocked, draft autosave
- Phase 5 complete: invite system, member management, notification bell, workspace membership for non-owners
- ANTHROPIC_API_KEY still needs to be swapped in `.env.local` (placeholder set)
- **Run Phase 5 SQL additions** in Supabase dashboard (bottom of supabase-schema.sql)
- Build passes clean - ready for local testing via `npm run dev`

---

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
4. **Shareable diff link** - view diffs without auth (public routes, planned)

## File Structure
```
src/
  app/
    page.tsx                                    - Landing page
    layout.tsx                                  - Root layout with ClerkProvider
    middleware.ts                               - Auth protection
    sign-in/[[...sign-in]]/page.tsx             - Clerk sign-in
    sign-up/[[...sign-up]]/page.tsx             - Clerk sign-up
    dashboard/
      layout.tsx                                - Sidebar + nav (context-aware header)
      page.tsx                                  - Doc list / overview
      settings/page.tsx                         - Settings page
      docs/[id]/page.tsx                        - Document editor (read/suggest/history)
      docs/[id]/suggestions/[sid]/page.tsx      - Suggestion detail + approval
    api/
      workspace/route.ts                        - GET + PATCH workspace
      documents/route.ts                        - GET + POST documents
      documents/[id]/route.ts                   - GET + PATCH + DELETE document
      documents/[id]/versions/route.ts          - GET + POST versions
      documents/[id]/versions/[vid]/route.ts    - GET specific version
      documents/[id]/suggestions/route.ts       - GET + POST suggestions
      documents/[id]/check/route.ts             - POST contradiction check (AI)
      suggestions/[id]/route.ts                 - GET + PATCH suggestion status
      suggestions/[id]/reviews/route.ts         - GET + POST reviews
      suggestions/[id]/comments/route.ts        - GET + POST comments
      suggestions/[id]/summary/route.ts         - POST AI diff summary
  components/
    ui/Button.tsx, Badge.tsx, Input.tsx
    editor/DocEditor.tsx, Toolbar.tsx
    diff/DiffView.tsx
    ThemeToggle.tsx
  lib/supabase.ts, utils.ts, claude.ts, api.ts
  types/database.ts
supabase-schema.sql                             - SQL to run in Supabase dashboard
```

---

## Completed Phases

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

### Phase 3 - AI Features (Claude `claude-haiku-4-5`)
- **Changelog on merge** - auto-generated 2-4 sentence summary stored in `versions.ai_summary`
- **Contradiction detection** - on every document edit (3s debounce), surfaces conflicting statements in sidebar
- **Diff summary** - on suggestion detail page load, bullet-point summary of what changed

### Phase 4 - UI Polish + Settings
- Spacing overhaul across all functional pages (dashboard, doc editor, suggestion review):
  - `space-y-4` upgraded to `space-y-6` on all main content areas
  - Panel headers use `px-7 py-7/py-8` for breathing room
  - Sidebar panel interiors: `p-5` upgraded to `p-6` throughout
  - Document list rows: taller, wider icon, more comfortable row padding
  - Empty states: larger icons, more vertical padding
- Settings page added at `/dashboard/settings`:
  - Workspace rename (live PATCH to `/api/workspace`, Enter to save)
  - Appearance (theme toggle in context)
  - AI features overview (contradiction detection, changelog, diff summary)
  - Account details (read-only Clerk data)
- Sidebar: Settings nav item added, `exact` matching prevents false active states on nested routes
- Header: now context-aware - shows the correct section label and subtitle per route
- Workspace API: `PATCH /api/workspace` added for name updates

---

## Honest Product Assessment

### What works well
- The concept is solid and differentiated - treating specs like code with PR-style reviews is the right mental model
- Visual design is clean and consistent - the panel system, indigo accent, dark/light theming
- AI integrations are real and genuinely useful (contradiction detection is actually valuable for PRDs)
- Tech stack is production-grade: Clerk auth, Supabase RLS, Claude API, Vercel-ready

### What is actually broken (not just missing)
1. **This is a single-player app pretending to be a collaboration tool.** The `workspace_members` table exists in the DB schema but there is zero UI to invite anyone. A product whose core value is "route changes through explicit review" fails completely if only one person can ever use it. *(Phase 5 - not yet fixed)*
2. ~~**Reviewer identity is meaningless.** Every action shows `@userId.slice(0,8)` - truncated noise.~~ **FIXED** - Real names and avatars now shown everywhere via `/api/users/[id]` Clerk lookup, `useUserInfo` hook, and `UserChip` component. Module-level cache prevents duplicate fetches.
3. ~~**The contradiction check is a cost bomb.**~~ **FIXED** - Removed auto-debounce. Now on-demand via a "Run" button in the Checks panel. Shows last-checked timestamp. No more API calls on every keystroke.
4. ~~**No separation between author and reviewer.** You can approve your own suggestions.~~ **FIXED** - Approve button is hidden when the current user is the suggestion author. Review state panel shows a clear "Another team member needs to approve this" message to the author.
5. ~~**The `docs/new` route loses drafts.**~~ **FIXED** - Autosaves to `localStorage` every 5 seconds of inactivity. On page load, detects drafts under 24 hours old and shows a restore/discard banner. Draft is cleared on successful version save.

---

## Roadmap

### Phase 5 - Team Collaboration - COMPLETE

**What was built:**
- `workspace_invites` table + `notifications` table added to schema (run Phase 5 SQL in Supabase)
- Token-based invite links: owner generates link in Settings, sends it out-of-band
- `/invite/[token]` page - shows workspace name + inviter, handles sign-in redirect, join on click
- `GET /api/workspace` updated to support non-owner members (checks `workspace_members` too)
- Settings page Team section: member list with avatars + roles, invite form, pending invites with revoke
- Notification bell in header: unread dot, dropdown with last 30 notifications, mark-all-read
- Notification triggers on: suggestion opened, review posted, suggestion merged/rejected, comment posted
- `src/lib/notifications.ts` - fire-and-forget helper used by all trigger points

---

### Phase 6 - Core Workflow Improvements

**Document templates**
- Template picker modal on new document creation
- Pre-built templates: Feature Spec, API Contract, Bug Report, Roadmap Item, RFC, Architecture Decision Record
- Stored as static Tiptap JSON - no DB changes needed
- Template selector replaces the blank editor on the `/docs/new` route

**On-demand AI contradiction check**
- Remove the auto-debounce firing on every edit
- Replace with a "Run checks" button in the sidebar that triggers on click
- Cache the result against the current content hash until the doc is next saved
- Fixes the API cost problem, makes the feature feel deliberate and trustworthy

**Rich editor additions**
- Tables - critical for spec work (comparison tables, API parameter tables, feature matrices). Tiptap has `@tiptap/extension-table` ready to add
- Slash command menu - type `/` to get a popover: `/heading`, `/table`, `/code block`, `/bullet list`, `/callout`
- Image paste/upload - drag or paste images into the editor, upload to Supabase Storage
- Callout/note blocks - highlighted boxes for warnings, notes, and important callouts in specs

**Activity feed**
- A dedicated page or collapsible sidebar panel showing recent events across the workspace
- Events: suggestion opened, suggestion merged/rejected, comment posted, version saved, member joined
- Replaces the need to manually check each document for activity
- Powered by the same `notifications` table from Phase 5, scoped to workspace not just user

**Full-text document search**
- Search inside document content, not just titles
- Supabase has built-in `to_tsvector` full-text search on JSONB - no external service needed
- Search bar in the dashboard that queries across all docs in the workspace
- Results show matching doc title + a snippet of the matching content

**Draft autosave**
- Autosave editor content to `localStorage` every 10 seconds
- On page load, detect if a saved draft exists and offer to restore it
- Prevents losing work when accidentally closing the tab
- Key: `spechub:draft:[docId]` for existing docs, `spechub:draft:new` for new docs

---

### Phase 7 - Power Features and Differentiation

**Custom approval policies**
- Per-document setting: minimum approvals required before merge (1, 2, or all reviewers)
- Specific required reviewer - designate a person whose approval is mandatory
- The merge button should reflect policy: "2/3 approvals" progress indicator
- Stored in a `document_settings` table or as a JSONB column on documents

**Public shareable diff links**
- A URL that shows a suggestion's diff, rationale, and approval state without requiring login
- Useful for external stakeholder reviews, design reviews, contractor handoffs
- Route: `/share/[token]` - a signed token that resolves to a suggestion ID
- Read-only: viewers can see everything but cannot approve, comment, or merge
- Mentioned in the original roadmap - genuinely differentiating

**Document locking**
- When a suggestion is open and under review, soft-lock the base document from direct edits
- Prevents the base version from shifting under an active review (makes the diff stale)
- Lock indicator in the doc header: "Locked - suggestion #3 is under review"
- Owner can force-unlock with a confirmation dialog

**Slack integration**
- Webhook URL configurable per workspace in Settings
- Triggers: suggestion opened, suggestion merged, suggestion rejected
- Payload: doc title, suggestion title, author, link back to SpecHub
- Standard for B2B tools - makes SpecHub part of an existing team's workflow

**Export**
- Export the current version of a doc as clean Markdown
- Export as PDF (headless browser render via a Vercel serverless function)
- Specs should not be trapped inside the app - export is a trust signal for real teams

---

### Phase 8 - Polish and Scale

**Keyboard shortcuts and command palette**
- `Cmd+S` to save a version
- `Cmd+K` command palette: jump to document, create new doc, run AI checks, open suggestion
- Shortcut hints shown in tooltips on buttons
- Essential feel for a developer-facing tool

**Real-time presence**
- Supabase Realtime subscriptions showing who else is viewing a document
- "2 people viewing" indicator in the doc header with avatar stack
- Live suggestion updates - if someone approves while you're on the page, the count updates without refresh
- Full live cursors are complex and probably not worth it for a spec tool

**Archive instead of delete**
- Soft delete: archive a doc rather than destroying it permanently
- Archived docs hidden from the main list but accessible via an "Archived" filter
- Matches how real teams work - specs don't truly die, they become stale
- Removes the scary "Danger zone" from everyday use

**Mobile navigation**
- The sidebar disappears on mobile with no replacement
- A bottom tab bar on mobile: Overview, Docs, Settings
- The Tiptap editor is usable on mobile with some CSS tweaks to toolbar wrapping

**Multiple workspaces**
- Currently one workspace per user, personal only
- Allow creating additional named workspaces (e.g., one per product team or client)
- Workspace switcher in the sidebar header
- Relevant for agencies, contractors, or users working across multiple products

---

## Free vs Paid Tiers

| Feature | Free | Paid ($18/user/month) |
|---|---|---|
| Documents | 3 | Unlimited |
| Workspace members | 3 | Unlimited |
| Version history | Full | Full |
| Suggest/approve flow | Yes | Yes |
| AI changelogs | 10/month | Unlimited |
| AI contradiction checks | On-demand | On-demand |
| Custom approval policies | No | Yes |
| Slack integration | No | Yes |
| Public shareable links | No | Yes |
| Export (Markdown + PDF) | Markdown only | Both |
| Audit log export | No | Yes |
| Priority support | No | Yes |

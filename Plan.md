# SpecHub - Plan.md

## What we're building
GitHub for PRDs. Propose, review, and approve changes to product requirement documents using a PR-style workflow. Full version history, AI-written changelogs, contradiction detection, shareable diff links, real-time presence, and team collaboration.

---

## Current Status
**Phase 11 complete - review flow hardening**

Phase 10 shipped friction reduction (ghost editing, AI title generation, protection modes, inline suggest, dashboard changelog). Phase 11 tightened the review workflow with 7 targeted fixes to eliminate gaps and UX papercuts.

### Phase 10 completed
- Ghost editing / auto-suggestion capture (non-owners redirected from "Save" to "Submit for review")
- AI pre-fills suggestion title and description from the diff - zero paperwork
- Per-document protection modes: Open / Review suggested / Hard-protected (enforced on both frontend + backend)
- Inline highlight-to-suggest: select text in the editor, floating "Suggest change" toolbar opens suggest mode
- Dashboard changelog: "Recent changes" section shows AI-written summaries of every merged edit

### Phase 11 completed - review flow hardening
Seven targeted fixes to close gaps discovered in review:

1. **Wire `is_auto` flag** - auto-captured ghost-edit suggestions now stored with `is_auto: true` in DB (was constructed but not sent in POST body)
2. **Lazy AI diff summary** - summary no longer auto-loads on every suggestion page visit (was burning AI credits for every viewer). Now shows a "Generate / Regenerate" button; only calls Claude when explicitly clicked
3. **Member dropdown for required reviewer** - policy editor now fetches `/api/workspace/members` and renders a `<select>` with real names instead of a raw Clerk user ID text input
4. **Request changes review action** - third review decision alongside Approve/Reject; backend already supported it, frontend now has the button + badge rendering + sidebar state message
5. **Stale merge conflict detection** - PATCH merge route checks `doc.current_version_id !== suggestion.base_version_id`; returns 409 with `code: "stale_base"`; frontend shows amber warning + "Force merge anyway" escape hatch
6. **My Suggestions page** - new `GET /api/suggestions/mine?workspace_id=xxx` route returns all suggestions by the current user across all docs in the workspace; new `/dashboard/suggestions/page.tsx` with stats panel + list; added to sidebar nav and mobile nav
7. **Plan.md updated** (this entry)

### What still needs to be done before going live
- Swap `ANTHROPIC_API_KEY` placeholder in `.env.local` with a real key
- Set `RESEND_API_KEY` in `.env.local` if you want email digests to actually send (optional - falls back to console log)
- Run the Phase 5 SQL additions in the Supabase dashboard (bottom of `supabase-schema.sql`) if not already done
- **Run Phase 10 SQL additions** (bottom of `supabase-schema.sql`) - adds `protection_mode` and `is_auto` columns
- Deploy to Vercel: `vercel --prod`

---

## Architecture

### Stack
- **Frontend:** Next.js 16 App Router, TypeScript, TailwindCSS v4
- **Editor:** Tiptap v3 (rich text, extensible - tables, slash commands, heading, lists, code blocks, blockquotes)
- **Diff:** diff-match-patch (Google's open-source algorithm)
- **Auth:** Clerk v7 (Google + GitHub OAuth), middleware at `src/proxy.ts`
- **Database:** Supabase (PostgreSQL + RLS), service-role client in API routes only
- **AI:** Claude API via Anthropic SDK (`claude-haiku-4-5`)
- **Realtime:** Supabase Realtime channels (presence + postgres_changes)
- **PDF export:** @react-pdf/renderer v4
- **Email:** Resend (optional, gracefully degraded)
- **Deploy:** Vercel-ready

### Core Data Model
```
Workspace
  -> Documents (tags[], min_approvals, required_reviewer_id, archived)
       -> Versions (immutable snapshots, ai_summary)
       -> Suggestions (status: draft|open|approved|rejected|merged, share_token)
            -> Reviews (approved|rejected|changes_requested)
            -> Comments (body, anchor_text for quoted inline comments)
  -> workspace_members (role: owner|editor)
  -> workspace_invites (token, email, expires_at)
  -> notifications (type, payload, read)
```

### Key Design Decisions
1. **No silent rewrites** - all changes go through a suggestion/review flow; direct edits stay on the source doc, suggestions create a separate reviewable diff
2. **Versions are immutable** - once a version snapshot is created it is never modified; merge creates a new version
3. **AI changelog on merge** - Claude generates a 2-4 sentence summary stored in `versions.ai_summary`
4. **Shareable diff links** - `/share/[token]` is fully public (no auth), showing the diff + review state for external stakeholder review
5. **Approval policies per document** - owners set `min_approvals` and optionally a `required_reviewer_id`; the merge route enforces both with a 403 and readable error
6. **Rate-limited AI** - 20 AI calls per user per hour per endpoint (in-memory, swappable for Upstash Redis)

---

## File Structure (current)

```
src/
  app/
    page.tsx                                       Landing page with live diff demo
    layout.tsx                                     Root layout with ClerkProvider
    proxy.ts                                       Clerk auth middleware (public routes: /share, /invite, /api/share)
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
    invite/[token]/page.tsx                        Invite acceptance page
    share/[token]/page.tsx                         Public read-only diff view
    dashboard/
      layout.tsx                                   Sidebar + WorkspaceProvider + mobile bottom nav + ShortcutOverlay
      page.tsx                                     Doc list, tag filter, archive toggle, search
      activity/page.tsx                            Activity feed (workspace notifications)
      suggestions/page.tsx                         My suggestions - all PRs opened by current user
      settings/page.tsx                            Workspace, members, invites, Slack, audit log, digest, AI, account
      docs/
        new/                                       Redirects to docs/[id] with id=new
        [id]/page.tsx                              Doc editor (read/suggest/history), ToC, presence, tags, policy editor
        [id]/suggestions/[sid]/page.tsx            Suggestion review, @mention comments, inline quotes, merge policy
    api/
      workspace/route.ts                           GET + PATCH (name, slack_webhook_url)
      workspace/members/route.ts                   GET members with Clerk info
      workspace/members/[userId]/route.ts          DELETE member
      workspace/invites/route.ts                   GET + POST invites
      workspace/invites/[token]/route.ts           DELETE (revoke)
      workspace/audit/route.ts                     GET audit log as JSON or CSV (owner only)
      workspace/digest/route.ts                    POST send email digest via Resend (owner only)
      workspace/changelog/route.ts                 GET recent AI summaries across workspace docs
      workspaces/route.ts                          GET all workspaces for user + POST create workspace
      invite/[token]/route.ts                      GET invite info
      invite/[token]/accept/route.ts               POST accept invite
      documents/route.ts                           GET list (tags, archived, search) + POST create
      documents/[id]/route.ts                      GET + PATCH (title, archived, tags, min_approvals, required_reviewer_id) + DELETE
      documents/[id]/versions/route.ts             GET + POST
      documents/[id]/versions/[vid]/route.ts       GET specific version content
      documents/[id]/suggestions/route.ts          GET (drafts filtered) + POST (draft flag supported)
      documents/[id]/check/route.ts                POST contradiction check (rate-limited, 20/hr)
      documents/[id]/suggestions/generate/route.ts POST AI draft title+description from diff
      documents/[id]/export/route.ts               GET Markdown export
      documents/[id]/pdf/route.ts                  GET PDF export via @react-pdf/renderer
      suggestions/[id]/route.ts                    GET + PATCH (status, approval policy + stale-base 409 on merge)
      suggestions/[id]/reviews/route.ts            GET + POST (approved | rejected | changes_requested)
      suggestions/[id]/comments/route.ts           GET + POST (anchor_text, @mention notifications)
      suggestions/[id]/summary/route.ts            POST AI diff summary (rate-limited, button-triggered only)
      suggestions/[id]/share/route.ts              POST generate share token
      suggestions/mine/route.ts                    GET all suggestions by current user in workspace
      share/[token]/route.ts                       GET public suggestion view (no auth)
      activity/route.ts                            GET workspace activity feed
      notifications/route.ts                       GET + PATCH (read)
      notifications/read-all/route.ts              POST mark all read
      users/[id]/route.ts                          GET Clerk user info (name + avatar)
  components/
    ui/Button.tsx, Badge.tsx, Input.tsx
    editor/DocEditor.tsx, Toolbar.tsx              Tiptap editor with slash commands, tables, etc.
    diff/DiffView.tsx                              Inline word-level diff using diff-match-patch
    CommandPalette.tsx                             Cmd+K palette (doc search + nav commands)
    NotificationBell.tsx                           Bell icon + dropdown + mark-all-read
    ShortcutOverlay.tsx                            ? key shortcut reference modal
    TableOfContents.tsx                            Auto-generated from Tiptap headings
    ThemeToggle.tsx
    UserChip.tsx                                   Avatar + name via useUserInfo hook
  contexts/
    WorkspaceContext.tsx                           WorkspaceProvider, useWorkspace() - active workspace in localStorage
  hooks/
    useUserInfo.ts                                 Clerk user info with module-level cache
    useDocPresence.ts                              Supabase Realtime presence (who else is viewing)
    useRealtimeSuggestions.ts                      Supabase postgres_changes subscription for live suggestion updates
  lib/
    supabase.ts                                    Browser client + createServerClient() (service role)
    api.ts                                         getAuthAndClient(), ok(), err() helpers
    claude.ts                                      generateChangelog(), detectContradictions(), summarizeDiff()
    notifications.ts                               createNotification() fire-and-forget helper
    slack.ts                                       notifySlack() Block Kit webhook, fire-and-forget
    rateLimit.ts                                   In-memory sliding window rate limiter
    tiptapToMarkdown.ts                            Tiptap JSON -> Markdown string
    tiptapToText.ts                                Tiptap JSON -> plain text (for full-text search column)
    tiptapToPDF.tsx                                Tiptap JSON -> @react-pdf/renderer Document
    templates.ts                                   6 built-in doc templates (Feature Spec, RFC, etc.)
    utils.ts                                       cn(), formatRelativeTime()
supabase-schema.sql                                Full DB schema including Phase 5 additions
```

---

## Completed Phases

### Phase 1 - UI Scaffolding
Landing page, Clerk auth (Google + GitHub), dashboard doc list, document page with 3 modes (Read / Suggest / History), suggestion detail page with diff view, comments, reviews.

### Phase 2 - Supabase Integration
All API routes live. Real documents, suggestions, versions, comments, reviews - all via Supabase with RLS. Suggestion create/approve/reject/merge flow fully wired.

### Phase 3 - AI Features
- **Changelog on merge** - Claude writes a 2-4 sentence summary stored in `versions.ai_summary`
- **Contradiction detection** - on-demand via "Run" button in the Checks sidebar panel; was changed from auto-debounce to avoid API cost bombs
- **Diff summary** - plain-English bullet points generated on suggestion detail page load

### Phase 4 - UI Polish + Settings
Spacing overhaul, settings page (workspace rename, theme, AI overview, account), context-aware header, `PATCH /api/workspace` for name updates.

### Phase 5 - Team Collaboration
- Token-based invite links, `/invite/[token]` acceptance page
- Settings Team section: member list with Clerk avatars + roles, invite form, pending invites with revoke
- Notification bell: unread dot, dropdown, mark-all-read
- Notifications trigger on: suggestion opened, review posted, suggestion merged/rejected, comment posted
- `src/lib/notifications.ts` fire-and-forget helper

### Phase 6 - Core Workflow Improvements
- 6 document templates (Feature Spec, API Contract, Bug Report, Roadmap Item, RFC, ADR)
- Full-text search via `content_text` column + `ilike` query
- Tables, slash command menu (/heading, /table, /code, /bullet, /quote), fixed member doc visibility

### Phase 7 - Power Features
- Markdown export (`GET /api/documents/[id]/export`)
- Activity feed (`/dashboard/activity`)
- Cmd+S save version, Cmd+K command palette
- Archive instead of delete (archived filter on dashboard)
- Public shareable diff links (`/share/[token]`, fully public route)
- Document locking warning (save blocked if open suggestions exist, with confirmation banner)
- Version comparison (Compare mode in history tab - pick BASE and TARGET, shows DiffView)
- Share button on suggestion page (generates token, copies URL to clipboard)

### Phase 8 - Deferred Infrastructure
- **Slack integration** - webhook URL per workspace in Settings, Block Kit messages for suggestion opened/merged/rejected
- **Multiple workspaces** - `GET/POST /api/workspaces`, `WorkspaceContext` with localStorage persistence, `WorkspaceSwitcher` dropdown in sidebar
- **Real-time presence** - `useDocPresence` hook, Supabase Realtime presence channel per doc, avatar stack in doc header
- **PDF export** - `src/lib/tiptapToPDF.tsx`, `GET /api/documents/[id]/pdf`, PDF button alongside Markdown in doc header

### Phase 10 - Friction Reduction
The biggest product risk was that the review flow required conscious intent before starting. Phase 10 flips this: you edit naturally, the system decides what to do with your edits based on who you are.

**Ghost editing / auto-capture**
Non-owners who click "Save version" are intercepted. The page opens an auto-capture panel that calls `POST /api/documents/[id]/suggestions/generate` with old and new content; Claude generates a suggestion title and description in under a second. The user sees pre-filled fields, can edit them, and submits. The editor resets to the saved state so it's clear the doc hasn't changed - their proposal is now in the review queue.

**Protection modes**
Three levels selectable by the owner in the management sidebar:
- `open`: non-owners are auto-captured but can choose to save directly (old behaviour preserved)
- `soft`: a banner tells non-owners review is suggested; auto-capture still fires
- `hard`: non-owners see "Submit for review" instead of "Save version"; the backend also enforces this with a 403 on `POST /versions`

**Inline highlight-to-suggest**
In read mode, selecting any text (5-500 chars) shows a fixed floating pill: "Suggest change." Clicking it switches to suggest mode with the current content pre-loaded - no mode switching required before you start. A `mousedown` listener and scroll listener keep the pill from drifting.

**Dashboard changelog**
`GET /api/workspace/changelog` fetches the 8 most recent versions with `ai_summary` across all docs. Displayed as a prominent "Recent changes" section above the document list. Shows doc name, version badge, timestamp, and the full AI summary - making the history visible and valuable so people want their work to appear there.

**DB additions (run in Supabase)**
```sql
alter table documents add column if not exists protection_mode text not null default 'open' check (protection_mode in ('open', 'soft', 'hard'));
alter table suggestions add column if not exists is_auto boolean not null default false;
```

### Phase 9 - Polish and Collaboration
- **Keyboard shortcut overlay** - `?` key opens modal with all shortcuts grouped by category
- **Table of contents** - auto-generated from Tiptap headings, sticky in read-mode sidebar, click to scroll
- **Mobile bottom nav** - fixed bottom tab bar (Overview / Activity / New / Settings), replaces the old missing mobile sidebar
- **Live suggestion updates** - `useRealtimeSuggestions` subscribes to `postgres_changes` on the suggestions table; sidebar count updates without refresh
- **Draft suggestions** - `status: 'draft'` added to DB constraint; drafts visible only to author; "Save draft" button alongside Submit in the suggestion form
- **Document tags** - `tags text[]` column with GIN index; tag editor in management sidebar (Enter/comma to add, x to remove, max 10); indigo chips in doc header and dashboard rows; tag filter bar on dashboard
- **Custom approval policies** - `min_approvals` + `required_reviewer_id` on documents; merge route enforces both with readable 403 errors; policy editor in management sidebar; merge error shown inline
- **@mention autocomplete** - typing `@` in comments shows a member picker dropdown; selected name inserted; mentions trigger notifications; `@word` tokens render in indigo in the comment thread
- **Audit log export** - `GET /api/workspace/audit?format=csv` (owner only); reads workspace notifications as a chronological event log; CSV download in Settings
- **AI rate limiting** - `src/lib/rateLimit.ts` in-memory sliding window, 20 calls/user/hour; hard 429 on `/check`, soft null on `/summary`
- **Email digests** - `POST /api/workspace/digest`; builds HTML email from last 7 days of events; sends via Resend if `RESEND_API_KEY` set, logs to console otherwise; "Send digest now" button in Settings (owner only)
- **Inline/quoted comments** - `anchor_text text` column on comments; select text in the diff view to quote it; quote shown as indigo-bordered blockquote in rendered comments; `anchor_text` stored with the comment

---

## DB Schema Changes by Phase (cumulative)

| Column / Table | Added in |
|---|---|
| `workspace_invites`, `notifications` | Phase 5 |
| `documents.content_text` (full-text) | Phase 6 |
| `documents.archived` | Phase 7 |
| `suggestions.share_token` | Phase 7 |
| `workspaces` multi-row, `workspace_members.role` | Phase 8 |
| `documents.tags text[]` | Phase 9 |
| `documents.min_approvals int`, `documents.required_reviewer_id text` | Phase 9 |
| `suggestions.status` extended to include `'draft'` | Phase 9 |
| `comments.anchor_text text` | Phase 9 |
| `documents.protection_mode text` (open/soft/hard) | Phase 10 |
| `suggestions.is_auto boolean` | Phase 10 |

---

## Free vs Paid Tiers (planned)

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
| Email digests | No | Yes |
| Priority support | No | Yes |

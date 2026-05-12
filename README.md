# SpecHub

**GitHub for PRDs.** Propose, review, and merge changes to product requirement documents with a pull-request workflow, AI-powered changelogs, and real-time team collaboration.

---

## What is SpecHub?

SpecHub brings software engineering discipline to product documentation. Every edit goes through a suggestion and review cycle - nobody silently rewrites a spec. Changes are diffed, discussed, approved, and merged into an immutable version history. Claude writes the changelog.

---

## Features

### Document Editing
- **Rich PRD editor** - Tiptap v3 with headings, lists, tables, code blocks, blockquotes, and a `/` slash command menu
- **Template picker** - 6 built-in templates: Feature Spec, API Contract, Bug Report, Roadmap Item, RFC, ADR
- **Table of contents** - auto-generated from headings, sticky in the sidebar, click to scroll
- **Autosave drafts** - localStorage draft recovery on page load
- **Document tags** - tag editor with filter bar on the dashboard
- **Full-text search** - searches across all document content in the workspace

### Version Control
- **Immutable version snapshots** - every save creates a new version
- **Version comparison** - pick any two versions, see a word-level diff between them
- **Word-level diff viewer** - green additions, red removals, unchanged context

### Suggestion and Review Flow
- **Ghost editing / auto-capture** - non-owners edit freely; clicking Save intercepts the change and opens a suggestion panel instead of writing directly
- **AI-prefilled suggestions** - Claude generates the suggestion title and description from the actual diff; zero paperwork for the author
- **Inline highlight-to-suggest** - select any text in read mode, a floating pill appears: "Suggest change." One click switches to suggest mode
- **Draft suggestions** - save a suggestion privately before submitting for review
- **Review decisions** - Approve / Request changes / Reject; one review per reviewer per suggestion (upsert)
- **@mention autocomplete** - type `@` in comments to mention teammates; mentions trigger notifications
- **Inline quoted comments** - select text in the diff to quote it in a comment; quote renders as an indigo blockquote
- **Merge policy enforcement** - per-document `min_approvals` and `required_reviewer_id`; the merge route enforces both with readable errors
- **Stale merge detection** - if the document was updated after the suggestion was opened, merge returns a 409 with a "Force merge" escape hatch
- **Share links** - generate a public `/share/[token]` link for any suggestion; read-only, no auth required

### Protection Modes (per document)
| Mode | Behaviour |
|---|---|
| `open` | Non-owners are auto-captured but can bypass |
| `soft` | Banner nudges non-owners toward suggestions |
| `hard` | Backend enforces suggestions-only; direct saves blocked with 403 |

### AI (Claude Haiku 4.5)
- **Changelog on merge** - 2-4 sentence summary stored in `versions.ai_summary`
- **Contradiction detection** - on-demand scan for internal conflicts in the active PRD
- **Diff summary** - button-triggered plain-English summary of what changed in a suggestion (not auto-loaded - saves API credits)
- **Auto-fill suggestion title/description** - generated from the diff when ghost-editing is captured
- **Rate limiting** - 20 AI calls per user per hour per endpoint (in-memory, swappable for Upstash Redis)

### Team Collaboration
- **Multiple workspaces** - create and switch between workspaces; active workspace persisted in localStorage
- **Token-based invites** - generate invite links in Settings; link expires, single-use, adds member to workspace
- **Real-time presence** - avatar stack in the doc header showing who else is viewing (Supabase Realtime)
- **Live suggestion updates** - suggestion sidebar updates without refresh via `postgres_changes` subscription
- **Notifications** - bell icon with unread dot; triggers on: suggestion opened, review posted, suggestion merged/rejected, comment posted, @mention
- **Activity feed** - `/dashboard/activity` shows recent workspace events
- **My Suggestions** - `/dashboard/suggestions` shows all suggestions opened by the current user across all docs

### Integrations and Export
- **Slack** - per-workspace webhook; Block Kit messages on suggestion opened/merged/rejected
- **Markdown export** - one-click download of the current doc as `.md`
- **PDF export** - rendered via `@react-pdf/renderer`
- **Audit log** - owner-only CSV export of all workspace events from Settings
- **Email digests** - "Send digest now" in Settings; HTML email via Resend (or console log if key not set)

### UX
- **Cmd+K command palette** - search docs and navigate from anywhere
- **Cmd+S** - save version keyboard shortcut
- **`?` keyboard shortcut overlay** - grouped reference of all shortcuts
- **Dark mode** - system-aware with manual toggle
- **Mobile bottom nav** - fixed tab bar on small screens
- **Archive** - soft-delete with archived filter on dashboard; history preserved

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Editor | Tiptap v3 |
| Diff engine | diff-match-patch |
| Auth | Clerk v7 |
| Database | Supabase (Postgres + Realtime + RLS) |
| AI | Claude Haiku 4.5 (Anthropic SDK) |
| PDF | @react-pdf/renderer v4 |
| Email | Resend |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Data Model

```
workspaces
  - id, name, owner_id, slack_webhook_url

workspace_members
  - workspace_id, user_id, role (owner | editor), joined_at

workspace_invites
  - workspace_id, token, email, expires_at, used

documents
  - workspace_id, title, content_text, current_version_id, current_version_number
  - tags[], archived, protection_mode (open | soft | hard)
  - min_approvals, required_reviewer_id

versions
  - document_id, content (Tiptap JSON), version_number, ai_summary, created_by

suggestions
  - document_id, base_version_id, proposed_content, title, description
  - status (draft | open | approved | rejected | merged)
  - created_by, is_auto, share_token

reviews
  - suggestion_id, reviewer_id, decision (approved | rejected | changes_requested), comment

comments
  - suggestion_id, author_id, body, anchor_text

notifications
  - user_id, workspace_id, type, payload (JSON), read
```

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/documents` | List (search, tags, archived filter) + create |
| GET/PATCH/DELETE | `/api/documents/[id]` | Fetch, update (title, tags, policy, protection, archive), delete |
| GET/POST | `/api/documents/[id]/versions` | List versions + save new version (hard-mode enforced) |
| GET/POST | `/api/documents/[id]/suggestions` | List + create suggestion (draft flag, is_auto flag) |
| POST | `/api/documents/[id]/suggestions/generate` | AI-generate suggestion title + description from diff |
| POST | `/api/documents/[id]/check` | Contradiction detection (rate-limited) |
| GET | `/api/documents/[id]/export` | Markdown export |
| GET | `/api/documents/[id]/pdf` | PDF export |
| GET/PATCH | `/api/suggestions/[id]` | Full suggestion + base version; update status (merge enforces policy + stale check) |
| GET/POST | `/api/suggestions/[id]/reviews` | List reviews + submit (approved/rejected/changes_requested) |
| GET/POST | `/api/suggestions/[id]/comments` | List + post comments (anchor_text, @mention notifications) |
| POST | `/api/suggestions/[id]/summary` | AI diff summary (rate-limited, on-demand) |
| POST | `/api/suggestions/[id]/share` | Generate public share token |
| GET | `/api/suggestions/mine` | All suggestions by current user in workspace |
| GET | `/api/share/[token]` | Public suggestion view (no auth) |
| GET/PATCH | `/api/workspace` | Workspace info + update (name, slack_webhook_url) |
| GET | `/api/workspace/members` | Members list with Clerk profile info |
| DELETE | `/api/workspace/members/[userId]` | Remove member |
| GET/POST | `/api/workspace/invites` | List + create invite links |
| DELETE | `/api/workspace/invites/[token]` | Revoke invite |
| GET | `/api/workspace/changelog` | Recent AI summaries across workspace docs |
| GET | `/api/workspace/audit` | Audit log (JSON or CSV, owner only) |
| POST | `/api/workspace/digest` | Send email digest via Resend |
| GET/POST | `/api/workspaces` | List all workspaces for user + create workspace |
| GET | `/api/activity` | Workspace activity feed |
| GET/PATCH | `/api/notifications` | List notifications + mark read |
| POST | `/api/notifications/read-all` | Mark all notifications read |
| GET | `/api/invite/[token]` | Invite info (public) |
| POST | `/api/invite/[token]/accept` | Accept invite |
| GET | `/api/users/[id]` | Clerk user info (name + avatar) |

---

## Local Setup

**Prerequisites:** Node 20+, Clerk account, Supabase project, Anthropic API key.

1. **Clone and install**
   ```bash
   git clone https://github.com/dev-sanidhya/SpecHub
   cd SpecHub
   npm install
   ```

2. **Environment variables** - create `.env.local`:
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Anthropic
   ANTHROPIC_API_KEY=sk-ant-...

   # App URL (used for share link generation)
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Optional - Resend for email digests
   RESEND_API_KEY=re_...
   ```

3. **Database** - run `supabase-schema.sql` in your Supabase SQL editor

4. **Start dev server**
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`, sign up, and create your first workspace

---

## Built by

**Sanidhya Shishodia** - [@iisanidhya](https://x.com/iisanidhya) - [github.com/dev-sanidhya](https://github.com/dev-sanidhya)

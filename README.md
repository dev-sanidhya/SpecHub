# SpecHub

**GitHub for PRDs.** Version control, collaborative review, and AI-powered analysis for product requirement documents.

---

## What is SpecHub?

SpecHub is a full-stack SaaS platform that brings software engineering workflows to product documentation. Teams write PRDs in a rich editor, propose and review suggestions just like pull requests, and get AI-powered insights on every change.

---

## Features

### Core

- **Rich PRD editor** - Tiptap-based editor with full formatting (headings, lists, code blocks, quotes, tables)
- **Version history** - Every save creates a snapshot; browse and diff any two versions
- **Suggestion system** - Propose edits with a title and description; owners accept or reject
- **Three-mode diff viewer** - Switch between Unified, Side-by-side, and Inline diff views
- **Role-based access** - Owner vs. viewer permissions per document

### AI (Claude Haiku 4.5 with prompt caching)

- **Changelog generation** - When a suggestion is merged, Claude writes a concise changelog entry describing what changed and why it matters
- **Contradiction detection** - Scans the active PRD for internal conflicts (e.g. two sections that say opposite things) and surfaces them as warnings
- **Diff summary** - Plain-English bullet-point summary of what changed between two versions of a document

### Auth and Data

- **Clerk authentication** - Email/password and OAuth sign-in with dark-themed UI
- **Supabase backend** - Postgres database with row-level security
- **Real-time feel** - Optimistic updates and instant feedback throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| Editor | Tiptap |
| Diff engine | diff-match-patch |
| AI | Claude Haiku 4.5 (Anthropic SDK) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Architecture

```
Browser
  |
  +-- Next.js App Router (RSC + Client Components)
        |
        +-- /app/dashboard        <- authenticated app shell
        |     +-- /docs           <- PRD list, create
        |     +-- /docs/[id]      <- PRD view, edit, version history
        |     +-- /docs/[id]/suggestions      <- suggestion list
        |     +-- /docs/[id]/suggestions/[sid] <- suggestion detail + diff
        |
        +-- /api                  <- Route Handlers (server-side only)
              +-- /api/docs
              +-- /api/suggestions
              +-- /api/versions
              +-- /api/ai/*       <- Claude integration

Supabase (Postgres)
  - docs, doc_versions, suggestions, suggestion_versions
  - changelogs, collaborators

Clerk
  - Identity, session management
  - User IDs linked to Supabase rows
```

---

## Data Model

| Table | Purpose |
|---|---|
| `docs` | PRD records - title, content (Tiptap JSON), owner_id |
| `doc_versions` | Immutable snapshots on every save |
| `suggestions` | Proposed edits - title, description, proposed_content, status |
| `suggestion_versions` | Version history for suggestions themselves |
| `changelogs` | AI-generated changelog entries per merge |
| `collaborators` | Per-doc user roles (owner, viewer) |

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/docs` | List docs for current user |
| POST | `/api/docs` | Create new doc |
| GET | `/api/docs/[id]` | Fetch single doc |
| PUT | `/api/docs/[id]` | Save doc (creates version snapshot) |
| DELETE | `/api/docs/[id]` | Delete doc |
| GET | `/api/docs/[id]/versions` | List all versions |
| GET | `/api/suggestions?docId=` | List suggestions for a doc |
| POST | `/api/suggestions` | Create suggestion |
| PATCH | `/api/suggestions/[id]` | Accept or reject suggestion |
| POST | `/api/suggestions/[id]/summary` | AI diff summary |
| POST | `/api/ai/contradictions` | AI contradiction scan |

---

## Project Structure

```
src/
  app/
    (marketing)/          <- landing page
    dashboard/
      docs/
        [id]/
          suggestions/
            [sid]/        <- suggestion detail with diff viewer
    sign-in/
    sign-up/
    api/
      docs/
      suggestions/
      ai/
  components/
    ui/                   <- shared primitives (Button, Badge, etc.)
    TiptapEditor.tsx      <- rich text editor
    DiffViewer.tsx        <- three-mode diff viewer
  lib/
    claude.ts             <- all AI functions (changelog, contradictions, summary)
    supabase.ts           <- client and server Supabase instances
    utils.ts
```

---

## Local Setup

**Prerequisites:** Node 20+, a Clerk account, a Supabase project, an Anthropic API key.

1. **Clone and install**
   ```bash
   git clone https://github.com/dev-sanidhya/spechub
   cd spechub
   npm install
   ```

2. **Environment variables** - create `.env.local`:
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Database schema** - run the SQL from `supabase/schema.sql` in your Supabase SQL editor

4. **Start dev server**
   ```bash
   npm run dev
   ```

5. **Open** `http://localhost:3000`

6. **Sign up**, create your first doc, and start writing PRDs

---

## Screens

| Screen | Description |
|---|---|
| Landing | Marketing page with feature highlights and CTA |
| Dashboard | Paginated list of your docs with search |
| Editor | Full-screen Tiptap editor with save/autosave |
| Version History | Timeline of all snapshots with diff button |
| Suggestions | Kanban-style list of open, accepted, rejected suggestions |
| Suggestion Detail | Side-by-side or unified diff with AI summary and merge controls |
| AI Insights | Contradiction detection panel inline on the editor page |

---

## Roadmap

- [ ] Real-time multiplayer editing (Yjs + Supabase Realtime)
- [ ] Comments and threads on specific text ranges
- [ ] Export to PDF, Notion, Confluence
- [ ] Org-level workspaces and team management
- [ ] Webhook notifications on suggestion events
- [ ] Public read-only share links for docs

---

## Built by

**Sanidhya Shishodia** - [@iisanidhya](https://x.com/iisanidhya) - [github.com/dev-sanidhya](https://github.com/dev-sanidhya)

-- SpecHub Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Workspaces
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id text not null,
  created_at timestamptz default now()
);

-- Workspace members
create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'reviewer', 'viewer')),
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null default 'Untitled',
  current_version_id uuid,
  current_version_number integer default 0,
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Versions
create table versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade,
  content jsonb not null,
  version_number integer not null,
  ai_summary text,
  created_by text not null,
  created_at timestamptz default now()
);

-- Add FK from documents to versions (after versions table exists)
alter table documents
  add constraint fk_current_version
  foreign key (current_version_id)
  references versions(id)
  on delete set null;

-- Suggestions
create table suggestions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade,
  base_version_id uuid references versions(id),
  proposed_content jsonb not null,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'approved', 'rejected', 'merged')),
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  suggestion_id uuid references suggestions(id) on delete cascade,
  reviewer_id text not null,
  decision text not null check (decision in ('approved', 'rejected', 'changes_requested')),
  comment text,
  created_at timestamptz default now(),
  unique(suggestion_id, reviewer_id)
);

-- Comments
create table comments (
  id uuid primary key default uuid_generate_v4(),
  suggestion_id uuid references suggestions(id) on delete cascade,
  version_id uuid references versions(id) on delete cascade,
  author_id text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Indexes
create index on documents(workspace_id);
create index on versions(document_id);
create index on suggestions(document_id);
create index on suggestions(status);
create index on reviews(suggestion_id);
create index on comments(suggestion_id);

-- RLS (Row Level Security) - basic setup
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table documents enable row level security;
alter table versions enable row level security;
alter table suggestions enable row level security;
alter table reviews enable row level security;
alter table comments enable row level security;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create trigger suggestions_updated_at
  before update on suggestions
  for each row execute function update_updated_at();

-- ============================================================
-- Phase 5: Team Collaboration (run these additions separately)
-- ============================================================

-- Workspace invites
create table workspace_invites (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  token text unique not null,
  invited_by text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

-- In-app notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  workspace_id uuid references workspaces(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz default now()
);

-- Indexes
create index on workspace_invites(token);
create index on workspace_invites(workspace_id);
create index on notifications(user_id);
create index on notifications(workspace_id);
create index on notifications(read);

-- RLS
alter table workspace_invites enable row level security;
alter table notifications enable row level security;

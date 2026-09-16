begin;

create table if not exists public.ai_ux_audits (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  scope_type text not null check (scope_type in ('single-screen','multi-screen','user-flow','page-sequence','product-workflow')),
  status text not null default 'draft' check (status in ('draft','ready','analyzing','in-review','finalized','archived')),
  target_user text check (target_user is null or char_length(target_user) <= 240),
  product_context text check (product_context is null or char_length(product_context) <= 2000),
  task_description text check (task_description is null or char_length(task_description) <= 1200),
  business_objective text check (business_objective is null or char_length(business_objective) <= 1200),
  expected_outcome text check (expected_outcome is null or char_length(expected_outcome) <= 1200),
  archived_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, reviewer_id),
  check ((status = 'archived') = (archived_at is not null)),
  check (finalized_at is null or finalized_at >= created_at)
);

create table if not exists public.ai_ux_audit_evidence (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null,
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  evidence_type text not null check (evidence_type = 'screenshot'),
  label text not null check (char_length(label) between 1 and 160),
  sequence_index integer not null check (sequence_index >= 0 and sequence_index <= 199),
  object_key text not null check (char_length(object_key) between 1 and 500),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  created_at timestamptz not null default now(),
  unique (audit_id, sequence_index),
  unique (object_key),
  foreign key (audit_id, reviewer_id) references public.ai_ux_audits(id, reviewer_id) on delete cascade
);

create table if not exists public.ai_ux_audit_runs (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null,
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 80),
  model text,
  result_version text not null default '1.0',
  summary jsonb not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (id, reviewer_id),
  foreign key (audit_id, reviewer_id) references public.ai_ux_audits(id, reviewer_id) on delete cascade,
  check (jsonb_typeof(summary) = 'object')
);

create table if not exists public.ai_ux_audit_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  audit_id uuid not null,
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  source_finding_id text not null check (char_length(source_finding_id) between 1 and 160),
  title text not null check (char_length(title) between 1 and 240),
  dimension text not null check (dimension in (
    'usability','interaction-design','navigation','information-architecture','visual-hierarchy',
    'content-clarity','forms','error-prevention-recovery','accessibility','responsive-behavior',
    'cognitive-load','task-completion','workflow-friction','consistency','trust',
    'feedback-system-status','empty-loading-error-states'
  )),
  observation text not null,
  impact text not null,
  recommendation text not null,
  ai_severity text not null check (ai_severity in ('critical','high','medium','low')),
  confidence text not null check (confidence in ('high','medium','low')),
  evidence_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (run_id, source_finding_id),
  unique (id, reviewer_id),
  foreign key (audit_id, reviewer_id) references public.ai_ux_audits(id, reviewer_id) on delete cascade,
  foreign key (run_id, reviewer_id) references public.ai_ux_audit_runs(id, reviewer_id) on delete cascade
);

create table if not exists public.ai_ux_audit_reviews (
  finding_id uuid primary key,
  audit_id uuid not null,
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  status text not null default 'unreviewed' check (status in ('unreviewed','accepted','dismissed')),
  severity_override text check (severity_override is null or severity_override in ('critical','high','medium','low')),
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 2000),
  approved_recommendation text check (approved_recommendation is null or char_length(approved_recommendation) <= 4000),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (finding_id, reviewer_id) references public.ai_ux_audit_findings(id, reviewer_id) on delete cascade,
  foreign key (audit_id, reviewer_id) references public.ai_ux_audits(id, reviewer_id) on delete cascade,
  check ((status = 'unreviewed') = (reviewed_at is null))
);

create table if not exists public.ai_ux_audit_versions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null,
  reviewer_id uuid not null references public.product_lab_reviewers(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  label text not null check (char_length(label) between 1 and 160),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (audit_id, version_number),
  foreign key (audit_id, reviewer_id) references public.ai_ux_audits(id, reviewer_id) on delete cascade,
  check (jsonb_typeof(snapshot) = 'object')
);

create index if not exists ai_ux_audits_reviewer_updated_idx on public.ai_ux_audits(reviewer_id, updated_at desc);
create index if not exists ai_ux_audits_reviewer_status_idx on public.ai_ux_audits(reviewer_id, status);
create index if not exists ai_ux_audit_evidence_audit_idx on public.ai_ux_audit_evidence(audit_id, sequence_index);
create index if not exists ai_ux_audit_runs_audit_idx on public.ai_ux_audit_runs(audit_id, created_at desc);
create index if not exists ai_ux_audit_findings_audit_idx on public.ai_ux_audit_findings(audit_id);
create index if not exists ai_ux_audit_versions_audit_idx on public.ai_ux_audit_versions(audit_id, version_number desc);

alter table public.ai_ux_audits enable row level security;
alter table public.ai_ux_audit_evidence enable row level security;
alter table public.ai_ux_audit_runs enable row level security;
alter table public.ai_ux_audit_findings enable row level security;
alter table public.ai_ux_audit_reviews enable row level security;
alter table public.ai_ux_audit_versions enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-ux-audit-evidence',
  'ai-ux-audit-evidence',
  false,
  5242880,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

-- No browser database or storage policies are intentionally created. The product server uses
-- the service role only after validating the Product Lab session and the `ai-ux-audit` grant.
-- Every query and object-storage operation must additionally scope ownership from reviewer_id
-- in that trusted context. Composite foreign keys defend against cross-reviewer relationships
-- even if application code regresses. This migration requires the Product Lab foundation first.

commit;

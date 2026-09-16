begin;

create or replace function public.update_ai_ux_audit_review(
  p_audit_id uuid,
  p_reviewer_id uuid,
  p_finding_id uuid,
  p_status text,
  p_severity_override text,
  p_reviewer_note text,
  p_approved_recommendation text
)
returns setof public.ai_ux_audit_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit public.ai_ux_audits%rowtype;
  v_latest_run_id uuid;
begin
  if p_status not in ('unreviewed', 'accepted', 'dismissed') then
    raise exception 'AUDIT_REVIEW_STATUS_INVALID';
  end if;
  if p_severity_override is not null and p_severity_override not in ('critical', 'high', 'medium', 'low') then
    raise exception 'AUDIT_REVIEW_SEVERITY_INVALID';
  end if;
  if p_status = 'unreviewed' and (
    p_severity_override is not null
    or nullif(btrim(coalesce(p_reviewer_note, '')), '') is not null
    or nullif(btrim(coalesce(p_approved_recommendation, '')), '') is not null
  ) then
    raise exception 'AUDIT_UNREVIEWED_DECISION_INVALID';
  end if;

  select * into v_audit
  from public.ai_ux_audits
  where id = p_audit_id
    and reviewer_id = p_reviewer_id
  for update;

  if v_audit.id is null then
    raise exception 'AUDIT_NOT_FOUND';
  end if;
  if v_audit.status <> 'in-review' then
    raise exception 'AUDIT_NOT_REVIEWABLE';
  end if;

  select id into v_latest_run_id
  from public.ai_ux_audit_runs
  where audit_id = p_audit_id
    and reviewer_id = p_reviewer_id
  order by created_at desc, id desc
  limit 1;

  if v_latest_run_id is null then
    raise exception 'AUDIT_RUN_REQUIRED';
  end if;

  perform 1
  from public.ai_ux_audit_findings
  where id = p_finding_id
    and run_id = v_latest_run_id
    and audit_id = p_audit_id
    and reviewer_id = p_reviewer_id;

  if not found then
    raise exception 'AUDIT_FINDING_NOT_REVIEWABLE';
  end if;

  return query
  update public.ai_ux_audit_reviews
  set status = p_status,
      severity_override = p_severity_override,
      reviewer_note = nullif(btrim(coalesce(p_reviewer_note, '')), ''),
      approved_recommendation = nullif(btrim(coalesce(p_approved_recommendation, '')), ''),
      reviewed_at = case when p_status = 'unreviewed' then null else now() end,
      updated_at = now()
  where finding_id = p_finding_id
    and audit_id = p_audit_id
    and reviewer_id = p_reviewer_id
  returning *;
end;
$$;

revoke all on function public.update_ai_ux_audit_review(uuid, uuid, uuid, text, text, text, text) from public;
revoke all on function public.update_ai_ux_audit_review(uuid, uuid, uuid, text, text, text, text) from anon;
revoke all on function public.update_ai_ux_audit_review(uuid, uuid, uuid, text, text, text, text) from authenticated;
grant execute on function public.update_ai_ux_audit_review(uuid, uuid, uuid, text, text, text, text) to service_role;

commit;

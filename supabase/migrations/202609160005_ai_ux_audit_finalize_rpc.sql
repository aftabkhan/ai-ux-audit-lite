begin;

create or replace function public.finalize_ai_ux_audit(
  p_audit_id uuid,
  p_reviewer_id uuid,
  p_version_label text
)
returns setof public.ai_ux_audit_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit public.ai_ux_audits%rowtype;
  v_run_id uuid;
  v_total_findings integer;
  v_unreviewed integer;
begin
  select * into v_audit
  from public.ai_ux_audits
  where id = p_audit_id
    and reviewer_id = p_reviewer_id
  for update;

  if v_audit.id is null then
    raise exception 'AUDIT_NOT_FOUND';
  end if;
  if v_audit.status = 'archived' then
    raise exception 'AUDIT_ARCHIVED';
  end if;
  if v_audit.status = 'finalized' then
    raise exception 'AUDIT_ALREADY_FINALIZED';
  end if;

  select id into v_run_id
  from public.ai_ux_audit_runs
  where audit_id = p_audit_id
    and reviewer_id = p_reviewer_id
  order by created_at desc, id desc
  limit 1;

  if v_run_id is null then
    raise exception 'AUDIT_RUN_REQUIRED';
  end if;

  select count(*)
  into v_total_findings
  from public.ai_ux_audit_findings
  where run_id = v_run_id
    and audit_id = p_audit_id
    and reviewer_id = p_reviewer_id;

  if v_total_findings = 0 then
    raise exception 'AUDIT_FINDINGS_REQUIRED';
  end if;

  select count(*)
  into v_unreviewed
  from public.ai_ux_audit_findings finding
  left join public.ai_ux_audit_reviews review
    on review.finding_id = finding.id
   and review.reviewer_id = p_reviewer_id
  where finding.run_id = v_run_id
    and finding.audit_id = p_audit_id
    and finding.reviewer_id = p_reviewer_id
    and coalesce(review.status, 'unreviewed') = 'unreviewed';

  if v_unreviewed > 0 then
    raise exception 'AUDIT_REVIEW_INCOMPLETE';
  end if;

  update public.ai_ux_audits
  set status = 'finalized',
      finalized_at = now(),
      archived_at = null,
      updated_at = now()
  where id = p_audit_id
    and reviewer_id = p_reviewer_id;

  return query
  select *
  from public.create_ai_ux_audit_version(
    p_audit_id,
    p_reviewer_id,
    p_version_label
  );
end;
$$;

revoke all on function public.finalize_ai_ux_audit(uuid, uuid, text) from public;
revoke all on function public.finalize_ai_ux_audit(uuid, uuid, text) from anon;
revoke all on function public.finalize_ai_ux_audit(uuid, uuid, text) from authenticated;
grant execute on function public.finalize_ai_ux_audit(uuid, uuid, text) to service_role;

commit;

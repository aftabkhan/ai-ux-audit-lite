begin;

create or replace function public.persist_ai_ux_audit_run(
  p_audit_id uuid,
  p_reviewer_id uuid,
  p_provider text,
  p_model text,
  p_result_version text,
  p_summary jsonb,
  p_generated_at timestamptz,
  p_findings jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_finding jsonb;
  v_finding_id uuid;
  v_evidence_ids uuid[];
begin
  if jsonb_typeof(p_summary) <> 'object' then
    raise exception 'AUDIT_SUMMARY_INVALID';
  end if;
  if jsonb_typeof(p_findings) <> 'array' or jsonb_array_length(p_findings) = 0 then
    raise exception 'AUDIT_FINDINGS_INVALID';
  end if;

  perform 1
  from public.ai_ux_audits
  where id = p_audit_id
    and reviewer_id = p_reviewer_id
    and status not in ('archived', 'finalized')
  for update;

  if not found then
    raise exception 'AUDIT_NOT_WRITABLE';
  end if;

  insert into public.ai_ux_audit_runs (
    audit_id,
    reviewer_id,
    provider,
    model,
    result_version,
    summary,
    generated_at
  )
  values (
    p_audit_id,
    p_reviewer_id,
    p_provider,
    nullif(p_model, ''),
    p_result_version,
    p_summary,
    p_generated_at
  )
  returning id into v_run_id;

  for v_finding in select value from jsonb_array_elements(p_findings)
  loop
    select coalesce(array_agg(value::uuid), '{}'::uuid[])
    into v_evidence_ids
    from jsonb_array_elements_text(coalesce(v_finding->'evidenceIds', '[]'::jsonb));

    if exists (
      select 1
      from unnest(v_evidence_ids) as evidence_id
      left join public.ai_ux_audit_evidence evidence
        on evidence.id = evidence_id
       and evidence.audit_id = p_audit_id
       and evidence.reviewer_id = p_reviewer_id
      where evidence.id is null
    ) then
      raise exception 'AUDIT_EVIDENCE_OWNERSHIP_INVALID';
    end if;

    insert into public.ai_ux_audit_findings (
      run_id,
      audit_id,
      reviewer_id,
      source_finding_id,
      title,
      dimension,
      observation,
      impact,
      recommendation,
      ai_severity,
      confidence,
      evidence_ids
    )
    values (
      v_run_id,
      p_audit_id,
      p_reviewer_id,
      v_finding->>'sourceFindingId',
      v_finding->>'title',
      v_finding->>'dimension',
      v_finding->>'observation',
      v_finding->>'impact',
      v_finding->>'recommendation',
      v_finding->>'aiSeverity',
      v_finding->>'confidence',
      v_evidence_ids
    )
    returning id into v_finding_id;

    insert into public.ai_ux_audit_reviews (
      finding_id,
      audit_id,
      reviewer_id,
      status,
      reviewed_at
    )
    values (
      v_finding_id,
      p_audit_id,
      p_reviewer_id,
      'unreviewed',
      null
    );
  end loop;

  update public.ai_ux_audits
  set status = 'in-review',
      updated_at = now()
  where id = p_audit_id
    and reviewer_id = p_reviewer_id;

  return v_run_id;
end;
$$;

revoke all on function public.persist_ai_ux_audit_run(uuid, uuid, text, text, text, jsonb, timestamptz, jsonb) from public;
revoke all on function public.persist_ai_ux_audit_run(uuid, uuid, text, text, text, jsonb, timestamptz, jsonb) from anon;
revoke all on function public.persist_ai_ux_audit_run(uuid, uuid, text, text, text, jsonb, timestamptz, jsonb) from authenticated;
grant execute on function public.persist_ai_ux_audit_run(uuid, uuid, text, text, text, jsonb, timestamptz, jsonb) to service_role;

commit;

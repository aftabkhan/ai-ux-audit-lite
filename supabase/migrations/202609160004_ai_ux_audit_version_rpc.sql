begin;

create or replace function public.create_ai_ux_audit_version(
  p_audit_id uuid,
  p_reviewer_id uuid,
  p_label text
)
returns setof public.ai_ux_audit_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit public.ai_ux_audits%rowtype;
  v_run_id uuid;
  v_version_number integer;
  v_snapshot jsonb;
begin
  if p_label is null or char_length(btrim(p_label)) < 1 or char_length(btrim(p_label)) > 160 then
    raise exception 'AUDIT_VERSION_LABEL_INVALID';
  end if;

  select * into v_audit
  from public.ai_ux_audits
  where id = p_audit_id
    and reviewer_id = p_reviewer_id
  for update;

  if v_audit.id is null then
    raise exception 'AUDIT_NOT_FOUND';
  end if;

  select id into v_run_id
  from public.ai_ux_audit_runs
  where audit_id = p_audit_id
    and reviewer_id = p_reviewer_id
  order by created_at desc, id desc
  limit 1;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.ai_ux_audit_versions
  where audit_id = p_audit_id
    and reviewer_id = p_reviewer_id;

  v_snapshot := jsonb_build_object(
    'audit', jsonb_strip_nulls(jsonb_build_object(
      'id', v_audit.id,
      'reviewerId', v_audit.reviewer_id,
      'title', v_audit.title,
      'scopeType', v_audit.scope_type,
      'status', v_audit.status,
      'targetUser', v_audit.target_user,
      'productContext', v_audit.product_context,
      'taskDescription', v_audit.task_description,
      'businessObjective', v_audit.business_objective,
      'expectedOutcome', v_audit.expected_outcome,
      'archivedAt', v_audit.archived_at,
      'finalizedAt', v_audit.finalized_at,
      'createdAt', v_audit.created_at,
      'updatedAt', v_audit.updated_at
    )),
    'evidence', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', evidence.id,
          'auditId', evidence.audit_id,
          'reviewerId', evidence.reviewer_id,
          'evidenceType', evidence.evidence_type,
          'label', evidence.label,
          'sequenceIndex', evidence.sequence_index,
          'objectKey', evidence.object_key,
          'mimeType', evidence.mime_type,
          'byteSize', evidence.byte_size,
          'createdAt', evidence.created_at
        ) order by evidence.sequence_index asc
      )
      from public.ai_ux_audit_evidence evidence
      where evidence.audit_id = p_audit_id
        and evidence.reviewer_id = p_reviewer_id
    ), '[]'::jsonb),
    'runId', v_run_id,
    'findings', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'findingId', finding.id,
          'sourceFindingId', finding.source_finding_id,
          'dimension', finding.dimension,
          'aiSeverity', finding.ai_severity,
          'reviewStatus', coalesce(review.status, 'unreviewed'),
          'severityOverride', review.severity_override,
          'reviewerNote', review.reviewer_note,
          'approvedRecommendation', review.approved_recommendation
        )) order by finding.created_at asc, finding.id asc
      )
      from public.ai_ux_audit_findings finding
      left join public.ai_ux_audit_reviews review
        on review.finding_id = finding.id
       and review.reviewer_id = p_reviewer_id
      where finding.run_id = v_run_id
        and finding.audit_id = p_audit_id
        and finding.reviewer_id = p_reviewer_id
    ), '[]'::jsonb)
  );

  return query
  insert into public.ai_ux_audit_versions (
    audit_id,
    reviewer_id,
    version_number,
    label,
    snapshot
  )
  values (
    p_audit_id,
    p_reviewer_id,
    v_version_number,
    btrim(p_label),
    v_snapshot
  )
  returning *;
end;
$$;

revoke all on function public.create_ai_ux_audit_version(uuid, uuid, text) from public;
revoke all on function public.create_ai_ux_audit_version(uuid, uuid, text) from anon;
revoke all on function public.create_ai_ux_audit_version(uuid, uuid, text) from authenticated;
grant execute on function public.create_ai_ux_audit_version(uuid, uuid, text) to service_role;

commit;

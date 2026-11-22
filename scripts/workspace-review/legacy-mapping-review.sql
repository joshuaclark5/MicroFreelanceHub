-- REVIEW ONLY. No INSERT/UPDATE/DELETE; no identity inference and no production execution.
-- Populate explicit UUID triples only after independent owner approval. Never match by name/email.
-- Empty input is intentional. Review output is not authorization to apply anything.
begin read only;
with proposed(agreement_id, owner_id, project_id) as (
  select null::uuid, null::uuid, null::uuid where false
), reviewed as (
  select p.*,
    case
      when p.agreement_id is null or p.owner_id is null or p.project_id is null then 'UNRESOLVED: missing explicit identity'
      when count(*) over (partition by p.agreement_id) <> 1 then 'UNRESOLVED: duplicate/ambiguous proposal'
      when s.id is null then 'UNRESOLVED: agreement missing or wrong owner'
      when w.id is null then 'UNRESOLVED: project missing or wrong owner'
      when c.id is null or st.id is null then 'UNRESOLVED: client/stage ownership mismatch'
      when m.id is not null then 'UNRESOLVED: agreement already mapped'
      else 'REVIEWABLE: explicit same-owner references; not applied'
    end as review_status
  from proposed p
  left join public.sow_documents s on s.id=p.agreement_id and s.user_id=p.owner_id
  left join public.workspace_projects w on w.id=p.project_id and w.owner_id=p.owner_id
  left join public.workspace_clients c on c.id=w.client_id and c.owner_id=p.owner_id
  left join public.workspace_stages st on st.id=w.stage_id and st.owner_id=p.owner_id
  left join public.workspace_agreements m on m.agreement_id=p.agreement_id
)
select * from reviewed order by owner_id,agreement_id;
rollback;

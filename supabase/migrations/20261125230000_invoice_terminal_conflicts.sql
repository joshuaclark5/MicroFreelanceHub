-- Permanent invoice conflicts must not request a serialization retry.
-- Preserve the existing function, owner, grants, locks, validation and data.
begin;
do $migration$
declare
  target oid := to_regprocedure('public.workspace_invoice_mutate(jsonb)');
  before_definition text;
  before_source text;
  normalized_source text;
  before_metadata jsonb;
  after_metadata jsonb;
  old_code constant text := 'errcode=''40001''';
  new_code constant text := 'errcode=''P0001''';
begin
  if target is null then
    raise exception 'Expected invoice mutation function is missing';
  end if;

  select p.prosrc, pg_get_functiondef(p.oid),
    jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,
      'language',p.prolang,'kind',p.prokind,'arguments',p.proargtypes::text,
      'result',p.prorettype,'set',p.proretset,'security',p.prosecdef,
      'config',p.proconfig,'volatility',p.provolatile,'strict',p.proisstrict,
      'parallel',p.proparallel)
    into before_source, before_definition, before_metadata
    from pg_proc p join pg_language l on l.oid=p.prolang
    where p.oid=target and p.prokind='f' and p.pronargs=1
      and p.proargtypes[0]='jsonb'::regtype and p.prorettype='jsonb'::regtype
      and not p.proretset and p.prosecdef and l.lanname='plpgsql'
      and p.proconfig=array['search_path=public, pg_temp'];
  if not found then
    raise exception 'Unexpected invoice mutation identity or security configuration';
  end if;

  -- Hosted copies differ in indentation. Normalize only line-edge spaces/tabs
  -- and CRLF, retaining all tokens and string contents on each line.
  select string_agg(btrim(line, E' \t'), E'\n' order by position)
    into normalized_source
    from regexp_split_to_table(replace(before_source,E'\r\n',E'\n'),E'\n')
      with ordinality as source_lines(line,position);
  if md5(normalized_source)<>'141be60a568ba22aab9080f0be19a32e'
    or (length(before_source)-length(replace(before_source,old_code,'')))/length(old_code)<>6 then
    raise exception 'Invoice mutation body differs from the reviewed baseline';
  end if;

  -- pg_get_functiondef emits CREATE OR REPLACE and preserves the hosted header.
  -- PostgreSQL retains the existing function OID, ownership and ACL.
  execute replace(before_definition,old_code,new_code);

  select jsonb_build_object('oid',p.oid,'owner',p.proowner,'acl',p.proacl,
      'language',p.prolang,'kind',p.prokind,'arguments',p.proargtypes::text,
      'result',p.prorettype,'set',p.proretset,'security',p.prosecdef,
      'config',p.proconfig,'volatility',p.provolatile,'strict',p.proisstrict,
      'parallel',p.proparallel)
    into after_metadata from pg_proc p where p.oid=target;
  if after_metadata is distinct from before_metadata
    or pg_get_functiondef(target) is distinct from replace(before_definition,old_code,new_code) then
    raise exception 'Invoice conflict migration changed unexpected function attributes';
  end if;
end $migration$;
commit;

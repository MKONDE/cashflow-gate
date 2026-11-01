-- Static/integration assertions for CFG operational state compatibility V1.
-- Run only in an isolated disposable database after applying the Treasury foundation
-- and compatibility migrations. This file is not executed against production.

do $$
declare
  platform_constraint text;
  country_constraint text;
  legacy_count integer;
begin
  select pg_get_constraintdef(oid) into platform_constraint
  from pg_constraint
  where conrelid = 'public.cfg_platform_control'::regclass
    and conname = 'cfg_platform_control_operational_state_check';

  select pg_get_constraintdef(oid) into country_constraint
  from pg_constraint
  where conrelid = 'public.cfg_countries'::regclass
    and conname = 'cfg_countries_operational_state_check';

  if platform_constraint is null or position('COMPLIANCE_REVIEW' in platform_constraint) = 0 then
    raise exception 'Platform operational-state constraint is missing COMPLIANCE_REVIEW';
  end if;
  if country_constraint is null or position('COMPLIANCE_REVIEW' in country_constraint) = 0 then
    raise exception 'Country operational-state constraint is missing COMPLIANCE_REVIEW';
  end if;

  select count(*) into legacy_count
  from public.cfg_countries
  where operational_state = 'COUNTRY_READINESS';
  if legacy_count <> 0 then
    raise exception 'Legacy COUNTRY_READINESS state was not migrated';
  end if;

  if exists (
    select 1 from public.cfg_platform_control where real_money_enabled is distinct from false
  ) then
    raise exception 'Platform real-money switch must remain disabled';
  end if;
  if exists (
    select 1 from public.cfg_countries where real_money_enabled is distinct from false
  ) then
    raise exception 'Country real-money switch must remain disabled';
  end if;
end;
$$;

-- Run only after cfg_international_foundation_v1 migration in an isolated test database.
do $$
declare
  control_row public.cfg_platform_control%rowtype;
begin
  select * into strict control_row from public.cfg_platform_control where singleton_id=1;
  if control_row.operational_state <> 'DEVELOPMENT' then
    raise exception 'Platform must default to DEVELOPMENT';
  end if;
  if control_row.authorized_supply_ceiling <> 1000000000 then
    raise exception 'CFG supply ceiling mismatch';
  end if;
  if control_row.reference_value_usd <> 1 then
    raise exception 'CFG reference value mismatch';
  end if;
  if control_row.required_reserve_ratio <> 1 then
    raise exception 'CFG reserve ratio must be 100 percent';
  end if;
  if control_row.real_money_enabled then
    raise exception 'Real-money functionality must remain disabled';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.cfg_wallets'::regclass) then
    raise exception 'CFG wallet RLS must be enabled';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.cfgg_wallets'::regclass) then
    raise exception 'CFGG wallet RLS must be enabled';
  end if;
  if has_table_privilege('authenticated','public.cfg_ledger_entries','select')
     or has_table_privilege('anon','public.cfg_ledger_entries','select') then
    raise exception 'Financial ledger must not be exposed to browser roles';
  end if;
end $$;

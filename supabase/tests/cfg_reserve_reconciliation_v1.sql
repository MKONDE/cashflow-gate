-- Catalog/privilege assertions; execute only after migrations in an isolated database.
do $$
begin
 if to_regclass('public.cfg_supply_position') is null then raise exception 'Missing supply position'; end if;
 if to_regclass('public.cfg_reserve_reconciliations') is null then raise exception 'Missing reserve snapshots'; end if;
 if to_regprocedure('public.cfg_run_reserve_reconciliation(text,interval)') is null then raise exception 'Missing reconciliation function'; end if;
 if has_function_privilege('anon','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE')
 or has_function_privilege('authenticated','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE') then
  raise exception 'Browser roles must not execute reconciliation';
 end if;
 if not has_function_privilege('service_role','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE') then
  raise exception 'service_role must execute reconciliation';
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.cfg_reserve_assets'::regclass
  and conname='cfg_reserve_assets_synthetic_never_eligible') then raise exception 'Synthetic reserve guard missing'; end if;
end $$;

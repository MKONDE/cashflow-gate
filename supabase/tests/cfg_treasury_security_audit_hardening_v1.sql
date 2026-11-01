-- CFG Treasury Security & Audit Hardening V1 catalog/privilege assertions.
-- Execute only in a disposable isolated DB after the full Treasury migration chain.
do $audit$
declare t text;
begin
 foreach t in array array['cfg_platform_control','cfg_admin_roles','cfg_reserve_assets','cfg_issuance_requests','cfg_reserve_reconciliations','cfg_countries','cfg_country_readiness_checks','cfg_country_live_authorizations','cfg_ledger_transactions','cfg_ledger_entries'] loop
  if not exists(select 1 from pg_trigger where tgrelid=to_regclass('public.'||t) and tgname=t||'_audit_event' and not tgisinternal) then
   raise exception 'Missing audit trigger on %',t;
  end if;
 end loop;
 if to_regclass('public.cfg_treasury_audit_events') is null then raise exception 'Missing Treasury audit event table'; end if;
 if not exists(select 1 from pg_trigger where tgname='cfg_treasury_audit_append_only' and not tgisinternal) then raise exception 'Audit append-only trigger missing'; end if;
 if not exists(select 1 from pg_trigger where tgname='cfg_reserve_reconciliation_append_only' and not tgisinternal) then raise exception 'Reconciliation append-only trigger missing'; end if;
 if not exists(select 1 from pg_trigger where tgname='cfg_reserve_asset_no_delete' and not tgisinternal) then raise exception 'Reserve evidence delete guard missing'; end if;
 if has_table_privilege('service_role','public.cfg_supply_position','INSERT')
  or has_table_privilege('service_role','public.cfg_supply_position','UPDATE')
  or has_table_privilege('service_role','public.cfg_supply_position','DELETE') then
  raise exception 'Service role must not directly mutate supply counters'; end if;
 if has_table_privilege('service_role','public.cfg_reserve_reconciliations','INSERT')
  or has_table_privilege('service_role','public.cfg_reserve_reconciliations','UPDATE')
  or has_table_privilege('service_role','public.cfg_reserve_reconciliations','DELETE') then
  raise exception 'Service role must not directly mutate reconciliation snapshots'; end if;
 if not has_table_privilege('service_role','public.cfg_treasury_audit_events','SELECT') then
  raise exception 'Service role should have read-only audit access'; end if;
 if has_table_privilege('service_role','public.cfg_treasury_audit_events','INSERT')
  or has_table_privilege('service_role','public.cfg_treasury_audit_events','UPDATE')
  or has_table_privilege('service_role','public.cfg_treasury_audit_events','DELETE') then
  raise exception 'Service role must not directly mutate audit events'; end if;
 if has_table_privilege('authenticated','public.cfg_treasury_audit_events','SELECT')
  or has_table_privilege('anon','public.cfg_treasury_audit_events','SELECT') then
  raise exception 'Browser roles must not read Treasury audit events'; end if;
 if not has_function_privilege('service_role','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE') then
  raise exception 'Controlled reconciliation RPC must remain executable by service role'; end if;
 if has_function_privilege('authenticated','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE')
  or has_function_privilege('anon','public.cfg_run_reserve_reconciliation(text,interval)','EXECUTE') then
  raise exception 'Browser roles must not execute reconciliation'; end if;
end $audit$;

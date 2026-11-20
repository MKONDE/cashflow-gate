-- CFG International Payment Engine V1 catalog and privilege assertions.
-- Run only in the disposable PostgreSQL 17 CI database after all prerequisite migrations.

do $$
declare
  t text;
begin
  foreach t in array array[
    'cfg_country_compliance_requirements','cfg_country_payment_policies',
    'cfg_payment_provider_registry','cfg_payment_intents','cfg_payment_attempts',
    'cfg_payment_webhook_events'
  ] loop
    if to_regclass('public.' || t) is null then
      raise exception 'Required payment table is missing: %', t;
    end if;
    if not (select relrowsecurity from pg_class where oid=to_regclass('public.' || t)) then
      raise exception 'RLS is not enabled on %', t;
    end if;
    if has_table_privilege('anon','public.' || t,'select')
       or has_table_privilege('authenticated','public.' || t,'select')
       or has_table_privilege('anon','public.' || t,'insert')
       or has_table_privilege('authenticated','public.' || t,'insert') then
      raise exception 'Browser roles must not access payment table %', t;
    end if;
  end loop;

  if not exists (
    select 1 from pg_proc
    where oid='public.cfg_list_payment_route_candidates(char,text,char,text)'::regprocedure
      and prosecdef = false
  ) then
    raise exception 'Sandbox route preview function is missing or not SECURITY INVOKER';
  end if;

  if not exists (
    select 1 from pg_proc
    where oid='public.cfg_payment_fallback_is_safe(uuid)'::regprocedure
      and prosecdef = false
  ) then
    raise exception 'Payment fallback safety function is missing or not SECURITY INVOKER';
  end if;

  if has_function_privilege('anon','public.cfg_list_payment_route_candidates(char,text,char,text)','EXECUTE')
     or has_function_privilege('authenticated','public.cfg_list_payment_route_candidates(char,text,char,text)','EXECUTE')
     or has_function_privilege('anon','public.cfg_payment_fallback_is_safe(uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.cfg_payment_fallback_is_safe(uuid)','EXECUTE') then
    raise exception 'Browser roles must not execute payment routing functions';
  end if;

  if not has_function_privilege('service_role','public.cfg_list_payment_route_candidates(char,text,char,text)','EXECUTE')
     or not has_function_privilege('service_role','public.cfg_payment_fallback_is_safe(uuid)','EXECUTE') then
    raise exception 'Trusted service role is missing payment routing function access';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='cfg_payment_intent_terms_immutable' and not tgisinternal
  ) then
    raise exception 'Payment intent identity and terms must be immutable';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='cfg_payment_attempt_insert_guard' and not tgisinternal
  ) then
    raise exception 'Provider attempt insert must enforce sequential safe fallback';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='cfg_payment_success_guard' and not tgisinternal
  ) then
    raise exception 'Payment success must require a verified settlement event and posted ledger journal';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='cfg_payment_attempts_append_only' and not tgisinternal
  ) then
    raise exception 'Payment attempts must be append-only';
  end if;

  if exists (select 1 from public.cfg_payment_provider_registry where is_enabled=true and environment='LIVE') then
    raise exception 'Live payment providers must remain disabled in V1';
  end if;
  if exists (select 1 from public.cfg_country_payment_policies where enabled=true) then
    raise exception 'Country payment policies must remain disabled until formally approved';
  end if;

  if (select real_money_enabled from public.cfg_platform_control where singleton_id=1) then
    raise exception 'CFG global real-money hard stop must remain enabled';
  end if;
  if (select authorized_supply_ceiling from public.cfg_platform_control where singleton_id=1) <> 1000000000 then
    raise exception 'CFG authorized supply ceiling changed';
  end if;
  if (select required_reserve_ratio from public.cfg_platform_control where singleton_id=1) <> 1 then
    raise exception 'CFG 100 percent reserve requirement changed';
  end if;
end $$;

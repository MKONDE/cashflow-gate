-- CFG payment fallback and settlement safety integration checks.
-- Disposable PostgreSQL 17 CI only. All rows are rolled back.
begin;

insert into public.cfg_countries(country_code,country_name,local_currency_code,operational_state,real_money_enabled)
values ('TZ','Tanzania','TZS','DEVELOPMENT',false)
on conflict (country_code) do nothing;

insert into auth.users(id,email)
values ('20000000-0000-0000-0000-000000000001','cfg-payment-test@example.invalid')
on conflict (id) do nothing;

insert into public.cfg_wallets(id,user_id,country_code,currency_code,status)
values (
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'TZ','TZS','RESTRICTED'
)
on conflict (id) do nothing;

insert into public.cfg_payment_provider_registry(
  id,provider_code,display_name,country_code,rail_code,currency_code,direction,
  priority,environment,is_enabled,sandbox_only,supports_idempotency,
  supports_status_lookup,credential_secret_name
) values (
  '20000000-0000-0000-0000-000000000003',
  'CI_SANDBOX','CI Sandbox Provider','TZ','TEST_BANK','TZS','INBOUND',
  10,'SANDBOX',false,true,true,true,null
)
on conflict (id) do nothing;

insert into public.cfg_payment_intents(
  id,payment_reference,idempotency_key,country_code,cfg_wallet_id,direction,
  rail_code,currency_code,amount,status,request_fingerprint,created_by
) values (
  '20000000-0000-0000-0000-000000000004',
  'CI-PAYMENT-INTENT-001','CI-PAYMENT-IDEMPOTENCY-001','TZ',
  '20000000-0000-0000-0000-000000000002','INBOUND',
  'TEST_BANK','TZS',1000,'PENDING','ci-fingerprint-001',
  '20000000-0000-0000-0000-000000000001'
);

insert into public.cfg_payment_attempts(
  id,payment_intent_id,provider_id,attempt_number,outcome,request_idempotency_key
) values (
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000003',
  1,'PRE_DISPATCH_FAILURE','CI-PAYMENT-IDEMPOTENCY-001'
);

set role service_role;
do $$
begin
  if public.cfg_payment_fallback_is_safe('20000000-0000-0000-0000-000000000004') is distinct from true then
    raise exception 'A confirmed pre-dispatch failure should permit a safe fallback';
  end if;
end $$;
reset role;

insert into public.cfg_payment_attempts(
  id,payment_intent_id,provider_id,attempt_number,outcome,request_idempotency_key
) values (
  '20000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000003',
  2,'AMBIGUOUS','CI-PAYMENT-IDEMPOTENCY-001'
);

set role service_role;
do $$
begin
  if public.cfg_payment_fallback_is_safe('20000000-0000-0000-0000-000000000004') is distinct from false then
    raise exception 'An ambiguous provider result must block fallback';
  end if;
end $$;
reset role;

do $$
begin
  begin
    update public.cfg_payment_intents
      set status='SUCCEEDED'
      where id='20000000-0000-0000-0000-000000000004';
    raise exception 'Expected payment-success guard to reject missing settlement and ledger proof';
  exception when others then
    if sqlerrm = 'Expected payment-success guard to reject missing settlement and ledger proof' then
      raise;
    end if;
  end;

  begin
    update public.cfg_payment_attempts
      set outcome='DECLINED_FINAL'
      where id='20000000-0000-0000-0000-000000000005';
    raise exception 'Expected append-only payment attempt guard';
  exception when others then
    if sqlerrm = 'Expected append-only payment attempt guard' then raise; end if;
  end;
end $$;

rollback;

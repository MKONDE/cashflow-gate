-- CFG Treasury transactional integration tests.
-- Disposable PostgreSQL 17 CI only. Never run against connected/production Supabase.
begin;

do $$
declare
  v_fc uuid := '10000000-0000-0000-0000-000000000001';
  v_sa uuid := '10000000-0000-0000-0000-000000000002';
  v_request uuid;
  v_recon uuid;
  v_tx uuid;
  v_account_debit uuid;
  v_account_credit uuid;
  v_total numeric(30,8);
  v_status text;
  v_asset_count integer;
  v_pass_recon uuid;
  v_expiry_count integer;
begin
  insert into auth.users(id,email) values
    (v_fc,'cfg-fc-test@example.invalid'),
    (v_sa,'cfg-sa-test@example.invalid')
  on conflict (id) do nothing;

  insert into public.cfg_admin_roles(user_id,role_name,is_active)
  values (v_fc,'FINANCIAL_CONTROLLER',true),(v_sa,'SUPER_ADMIN',true)
  on conflict (user_id) do update set role_name=excluded.role_name,is_active=true;

  -- Eligible company reserve is counted; synthetic test assets are excluded.
  insert into public.cfg_reserve_assets(
    asset_type,funding_source,reserve_eligible,institution_name,asset_reference,
    currency_code,face_value,verified_usd_value,verification_status,verified_by,
    verified_at,evidence_reference,evidence_observed_at,verification_reference
  ) values (
    'BANK_CASH','COMPANY_CAPITAL',true,'CI test bank','CI-ELIGIBLE-001',
    'USD',250,250,'VERIFIED',v_fc,now(),'CI-EVIDENCE-001',now(),'CI-VERIFY-001'
  );
  insert into public.cfg_reserve_assets(
    asset_type,funding_source,reserve_eligible,institution_name,asset_reference,
    currency_code,face_value,verification_status
  ) values (
    'BANK_CASH','SYNTHETIC_TEST',false,'Synthetic test fixture','CI-SYNTHETIC-001',
    'USD',900,'PENDING'
  );

  v_recon := public.cfg_run_reserve_reconciliation('CI-RESERVE-TEST-0001',interval '7 days');
  v_pass_recon := v_recon;
  select status,reserve_gross_usd into v_status,v_total
    from public.cfg_reserve_reconciliations where id=v_recon;
  if v_status <> 'PASS' or v_total <> 250 then
    raise exception 'Reserve reconciliation did not exclude synthetic assets; status %, gross %',v_status,v_total;
  end if;

  -- A future-dated verification must be excluded and flagged as insufficient evidence.
  insert into public.cfg_reserve_assets(
    asset_type,funding_source,reserve_eligible,institution_name,asset_reference,
    currency_code,face_value,verified_usd_value,verification_status,verified_by,
    verified_at,evidence_reference,evidence_observed_at,verification_reference
  ) values (
    'BANK_CASH','COMPANY_CAPITAL',true,'CI future-date bank','CI-FUTURE-VERIFICATION-001',
    'USD',500,500,'VERIFIED',v_fc,now()+interval '1 day',
    'CI-FUTURE-EVIDENCE-001',now(),'CI-FUTURE-VERIFY-001'
  );
  v_recon := public.cfg_run_reserve_reconciliation('CI-RESERVE-TEST-0002',interval '7 days');
  select status,reserve_gross_usd,stale_asset_count
    into v_status,v_total,v_asset_count
    from public.cfg_reserve_reconciliations where id=v_recon;
  if v_status <> 'INSUFFICIENT_EVIDENCE' or v_total <> 250 or v_asset_count <> 1 then
    raise exception 'Future-dated verification was not excluded and flagged; status %, gross %, stale %',
      v_status,v_total,v_asset_count;
  end if;

  -- Dual approval must be from two distinct, correctly assigned active people.
  v_request := public.cfg_create_issuance_request('CI-ISSUANCE-TEST-0001',50,v_fc);
  perform public.cfg_submit_issuance_controller_approval(v_request,v_fc,v_pass_recon);
  perform public.cfg_submit_issuance_super_admin_approval(v_request,v_sa);
  if not exists(select 1 from public.cfg_issuance_requests
    where id=v_request and status='APPROVED'
      and financial_controller_id=v_fc and super_admin_id=v_sa
      and financial_controller_id<>super_admin_id) then
    raise exception 'Dual-control issuance approval did not complete';
  end if;
  if (select issued_total from public.cfg_supply_position where singleton_id=1) <> 0 then
    raise exception 'Approval must not issue CFG or change supply counters';
  end if;

  -- Simulate an elapsed approved reservation in the disposable test DB.
  perform set_config('session_replication_role','replica',true);
  insert into public.cfg_issuance_requests(
    request_reference,requested_cfg_amount,required_reserve_usd,status,
    financial_controller_id,financial_controller_approved_at,
    super_admin_id,super_admin_approved_at,created_by,
    approved_reserve_reconciliation_id,approval_expires_at
  ) values (
    'CI-ISSUANCE-EXPIRED-0001',100,100,'APPROVED',
    v_fc,now()-interval '2 days',v_sa,now()-interval '2 days',v_fc,
    v_pass_recon,now()-interval '1 minute'
  );
  perform set_config('session_replication_role','origin',true);
  v_expiry_count := public.cfg_expire_issuance_requests();
  if v_expiry_count <> 1 or not exists(
    select 1 from public.cfg_issuance_requests
    where request_reference='CI-ISSUANCE-EXPIRED-0001' and status='EXPIRED'
  ) then
    raise exception 'Elapsed approved reservation was not transitioned to EXPIRED; count %',v_expiry_count;
  end if;

  -- Expired reservations no longer consume reserve capacity: 50 + 190 <= 250.
  v_request := public.cfg_create_issuance_request('CI-ISSUANCE-TEST-0003',190,v_fc);
  perform public.cfg_submit_issuance_controller_approval(v_request,v_fc,v_pass_recon);
  perform public.cfg_submit_issuance_super_admin_approval(v_request,v_sa);
  if not exists(select 1 from public.cfg_issuance_requests where id=v_request and status='APPROVED') then
    raise exception 'Expired reservation continued to consume reserve capacity';
  end if;

  -- Same-person dual approval is rejected.
  begin
    v_request := public.cfg_create_issuance_request('CI-ISSUANCE-TEST-0002',10,v_fc);
    perform public.cfg_submit_issuance_controller_approval(v_request,v_fc,v_recon);
    perform public.cfg_submit_issuance_super_admin_approval(v_request,v_fc);
    raise exception 'Expected same-person dual approval to fail';
  exception when others then
    if sqlerrm = 'Expected same-person dual approval to fail' then raise; end if;
  end;

  -- Issuance execution remains an explicit hard stop.
  begin
    perform public.cfg_execute_issuance_request(
      (select id from public.cfg_issuance_requests where request_reference='CI-ISSUANCE-TEST-0001')
    );
    raise exception 'Expected issuance execution hard-stop';
  exception when others then
    if sqlerrm = 'Expected issuance execution hard-stop' then raise; end if;
  end;

  -- Balanced reconciliation journal posts exactly once and becomes immutable.
  insert into public.cfg_ledger_accounts(account_code,account_class,currency_code)
  values ('CI-LEDGER-DEBIT','COMPANY_TREASURY','USD')
  returning id into v_account_debit;
  insert into public.cfg_ledger_accounts(account_code,account_class,currency_code)
  values ('CI-LEDGER-CREDIT','VERIFIED_RESERVE','USD')
  returning id into v_account_credit;
  insert into public.cfg_ledger_transactions(
    transaction_reference,idempotency_key,transaction_type,created_by
  ) values ('CI-LEDGER-TX-0001','CI-IDEMPOTENCY-0001','RESERVE_RECONCILIATION',v_fc)
  returning id into v_tx;
  insert into public.cfg_ledger_entries(transaction_id,account_id,direction,currency_code,amount,usd_equivalent)
  values
    (v_tx,v_account_debit,'DEBIT','USD',25,25),
    (v_tx,v_account_credit,'CREDIT','USD',25,25);
  perform public.cfg_post_ledger_transaction(v_tx);
  perform public.cfg_post_ledger_transaction(v_tx);
  if not exists(select 1 from public.cfg_ledger_transactions where id=v_tx and status='POSTED' and posted_at is not null) then
    raise exception 'Balanced journal did not post';
  end if;

  begin
    update public.cfg_ledger_transactions set metadata='{"tampered":true}'::jsonb where id=v_tx;
    raise exception 'Expected posted transaction immutability';
  exception when others then
    if sqlerrm = 'Expected posted transaction immutability' then raise; end if;
  end;

  begin
    update public.cfg_ledger_entries set amount=26 where transaction_id=v_tx;
    raise exception 'Expected posted entry immutability';
  exception when others then
    if sqlerrm = 'Expected posted entry immutability' then raise; end if;
  end;

  -- An unbalanced journal must fail closed and remain DRAFT.
  insert into public.cfg_ledger_transactions(
    transaction_reference,idempotency_key,transaction_type,created_by
  ) values ('CI-LEDGER-TX-0002','CI-IDEMPOTENCY-0002','RESERVE_RECONCILIATION',v_fc)
  returning id into v_tx;
  insert into public.cfg_ledger_entries(transaction_id,account_id,direction,currency_code,amount,usd_equivalent)
  values
    (v_tx,v_account_debit,'DEBIT','USD',25,25),
    (v_tx,v_account_credit,'CREDIT','USD',24,24);
  begin
    perform public.cfg_post_ledger_transaction(v_tx);
    raise exception 'Expected unbalanced journal to fail';
  exception when others then
    if sqlerrm = 'Expected unbalanced journal to fail' then raise; end if;
  end;
  if not exists(select 1 from public.cfg_ledger_transactions where id=v_tx and status='DRAFT') then
    raise exception 'Failed unbalanced posting must remain DRAFT';
  end if;

  -- A normal money-moving transaction remains blocked outside LIVE_AUTHORIZED.
  insert into public.cfg_ledger_transactions(
    transaction_reference,idempotency_key,transaction_type,created_by
  ) values ('CI-LEDGER-TX-0003','CI-IDEMPOTENCY-0003','DEPOSIT',v_fc)
  returning id into v_tx;
  insert into public.cfg_ledger_entries(transaction_id,account_id,direction,currency_code,amount,usd_equivalent)
  values
    (v_tx,v_account_debit,'DEBIT','USD',5,5),
    (v_tx,v_account_credit,'CREDIT','USD',5,5);
  begin
    perform public.cfg_post_ledger_transaction(v_tx);
    raise exception 'Expected pre-live money movement gate to block posting';
  exception when others then
    if sqlerrm = 'Expected pre-live money movement gate to block posting' then raise; end if;
  end;

  if not exists(select 1 from public.cfg_treasury_audit_events
    where entity_table='cfg_issuance_requests' and entity_id is not null) then
    raise exception 'Treasury issuance audit events were not recorded';
  end if;
end $$;

rollback;

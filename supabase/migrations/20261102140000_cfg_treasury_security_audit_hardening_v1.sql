-- CFG Treasury Security & Audit Hardening V1
-- Append-only audit trail, immutable reserve snapshots and no direct supply-counter writes.
-- Apply only in an isolated disposable database after the complete Treasury migration chain.
begin;

create table if not exists public.cfg_treasury_audit_events (
 id uuid primary key default gen_random_uuid(),
 entity_table text not null,
 entity_id text not null,
 operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
 actor_user_id uuid,
 actor_db_role text,
 occurred_at timestamptz not null default clock_timestamp(),
 old_record jsonb,
 new_record jsonb
);
create index if not exists cfg_treasury_audit_entity_idx
 on public.cfg_treasury_audit_events(entity_table,entity_id,occurred_at desc);
create index if not exists cfg_treasury_audit_time_idx
 on public.cfg_treasury_audit_events(occurred_at desc);
alter table public.cfg_treasury_audit_events enable row level security;
revoke all on table public.cfg_treasury_audit_events from public,anon,authenticated,service_role;
grant select on table public.cfg_treasury_audit_events to service_role;

create or replace function public.cfg_append_treasury_audit_event()
returns trigger language plpgsql security definer
set search_path=public,pg_temp
as $$
declare
 v_old jsonb;
 v_new jsonb;
 v_id text;
 v_actor text;
begin
 if tg_op='INSERT' then
  v_new:=to_jsonb(new);
  v_id:=coalesce(v_new->>'id',v_new->>'singleton_id',v_new->>'user_id','unknown');
 elsif tg_op='UPDATE' then
  v_old:=to_jsonb(old); v_new:=to_jsonb(new);
  v_id:=coalesce(v_new->>'id',v_new->>'singleton_id',v_new->>'user_id','unknown');
 else
  v_old:=to_jsonb(old);
  v_id:=coalesce(v_old->>'id',v_old->>'singleton_id',v_old->>'user_id','unknown');
 end if;
 v_actor:=nullif(current_setting('request.jwt.claim.sub',true),'');
 insert into public.cfg_treasury_audit_events(
  entity_table,entity_id,operation,actor_user_id,actor_db_role,old_record,new_record
 ) values (
  tg_table_name,v_id,tg_op,v_actor::uuid,
  nullif(current_setting('request.jwt.claim.role',true),''),v_old,v_new
 );
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function public.cfg_append_treasury_audit_event() from public,anon,authenticated,service_role;

create or replace function public.cfg_reject_audit_mutation()
returns trigger language plpgsql
security definer set search_path=public,pg_temp
as $$
begin
 raise exception 'Treasury audit records are append-only' using errcode='55000';
end;
$$;
revoke all on function public.cfg_reject_audit_mutation() from public,anon,authenticated,service_role;
drop trigger if exists cfg_treasury_audit_append_only on public.cfg_treasury_audit_events;
create trigger cfg_treasury_audit_append_only
before update or delete on public.cfg_treasury_audit_events
for each row execute function public.cfg_reject_audit_mutation();

-- Audit all privileged changes to key Treasury control and evidence records.
do $$
declare t text;
begin
 foreach t in array array[
  'cfg_platform_control','cfg_admin_roles','cfg_reserve_assets',
  'cfg_issuance_requests','cfg_reserve_reconciliations'
 ] loop
  execute format('drop trigger if exists %I on public.%I',t||'_audit_event',t);
  execute format(
   'create trigger %I after insert or update or delete on public.%I for each row execute function public.cfg_append_treasury_audit_event()',
   t||'_audit_event',t
  );
 end loop;
end $$;

-- Reserve evidence is never physically deleted; mark it EXPIRED/REJECTED and retain its history.
create or replace function public.cfg_prevent_reserve_asset_delete()
returns trigger language plpgsql security definer
set search_path=public,pg_temp
as $$
begin
 raise exception 'Reserve evidence cannot be physically deleted; change its verification status and retain the audit trail'
  using errcode='55000';
end;
$$;
revoke all on function public.cfg_prevent_reserve_asset_delete() from public,anon,authenticated,service_role;
drop trigger if exists cfg_reserve_asset_no_delete on public.cfg_reserve_assets;
create trigger cfg_reserve_asset_no_delete
before delete on public.cfg_reserve_assets
for each row execute function public.cfg_prevent_reserve_asset_delete();

-- A reconciliation is a point-in-time evidence snapshot: no UPDATE or DELETE.
drop trigger if exists cfg_reserve_reconciliation_append_only on public.cfg_reserve_reconciliations;
create trigger cfg_reserve_reconciliation_append_only
before update or delete on public.cfg_reserve_reconciliations
for each row execute function public.cfg_reject_audit_mutation();

-- Supply counters are frozen at their initialized values until a separately reviewed,
-- narrowly scoped issuance/redemption writer is introduced. No service-role direct DML.
revoke insert,update,delete,truncate,references,trigger
 on table public.cfg_supply_position from public,anon,authenticated,service_role;
grant select on table public.cfg_supply_position to service_role;

-- Reconciliation runs through the controlled SECURITY DEFINER function. The service role
-- may read snapshots, but cannot insert or rewrite them directly.
revoke insert,update,delete,truncate,references,trigger
 on table public.cfg_reserve_reconciliations from public,anon,authenticated,service_role;
grant select on table public.cfg_reserve_reconciliations to service_role;
create or replace function public.cfg_run_reserve_reconciliation(
 p_reconciliation_reference text,p_evidence_max_age interval default interval '7 days'
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_id uuid; v_gross numeric(38,8); v_encumbered numeric(38,8); v_net numeric(38,8);
 v_issued numeric(30,8); v_outstanding numeric(30,8); v_required numeric(38,8);
 v_asset_count integer; v_stale_count integer; v_excluded_count integer;
 v_coverage numeric(38,12); v_status text;
begin
 if p_reconciliation_reference is null or length(trim(p_reconciliation_reference))<6 then
  raise exception 'A unique reconciliation reference of at least 6 characters is required' using errcode='22023';
 end if;
 if p_evidence_max_age<=interval '0' or p_evidence_max_age>interval '30 days' then
  raise exception 'Evidence age must be greater than zero and no more than 30 days' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtext('cfg-reserve-reconciliation-v1'));
 perform 1 from public.cfg_platform_control where singleton_id=1 for update;
 perform 1 from public.cfg_supply_position where singleton_id=1 for update;
 select issued_total,outstanding_supply into strict v_issued,v_outstanding
 from public.cfg_supply_position where singleton_id=1;
 if v_issued>1000000000 then raise exception 'Supply exceeds authorized ceiling' using errcode='23514'; end if;
 select
  coalesce(sum(verified_usd_value) filter(where verification_status='VERIFIED' and reserve_eligible
   and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
   and asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')
   and verified_at is not null and evidence_observed_at>=now()-p_evidence_max_age and evidence_observed_at<=now()
   and (evidence_valid_until is null or evidence_valid_until>now())),0),
  coalesce(sum(encumbered_usd_value) filter(where verification_status='VERIFIED' and reserve_eligible
   and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
   and asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')
   and verified_at is not null and evidence_observed_at>=now()-p_evidence_max_age and evidence_observed_at<=now()
   and (evidence_valid_until is null or evidence_valid_until>now())),0),
  count(*) filter(where verification_status='VERIFIED' and reserve_eligible
   and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
   and asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')
   and verified_at is not null and evidence_observed_at>=now()-p_evidence_max_age and evidence_observed_at<=now()
   and (evidence_valid_until is null or evidence_valid_until>now())),
  count(*) filter(where verification_status='VERIFIED' and (evidence_observed_at is null
   or evidence_observed_at<now()-p_evidence_max_age or evidence_observed_at>now()
   or (evidence_valid_until is not null and evidence_valid_until<=now()))),
  count(*) filter(where not (verification_status='VERIFIED' and reserve_eligible
   and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
   and asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')
   and verified_at is not null and evidence_observed_at>=now()-p_evidence_max_age and evidence_observed_at<=now()
   and (evidence_valid_until is null or evidence_valid_until>now())))
 into v_gross,v_encumbered,v_asset_count,v_stale_count,v_excluded_count
 from public.cfg_reserve_assets;
 v_net:=greatest(v_gross-v_encumbered,0);
 v_required:=v_outstanding;
 v_coverage:=case when v_required=0 then null else v_net/v_required end;
 v_status:=case when v_stale_count>0 then 'INSUFFICIENT_EVIDENCE'
  when v_net>=v_required then 'PASS' else 'FAIL' end;
 insert into public.cfg_reserve_reconciliations(
  reconciliation_reference,status,reserve_gross_usd,reserve_encumbered_usd,reserve_eligible_net_usd,
  outstanding_cfg,required_reserve_usd,coverage_ratio,reserve_asset_count,stale_asset_count,
  excluded_asset_count,evidence_max_age,details
 ) values(trim(p_reconciliation_reference),v_status,v_gross,v_encumbered,v_net,v_outstanding,
  v_required,v_coverage,v_asset_count,v_stale_count,v_excluded_count,p_evidence_max_age,
  jsonb_build_object('reserve_policy','COMPANY_CAPITAL_AND_OPERATING_SURPLUS_ONLY',
   'synthetic_test_assets_counted',false,'customer_and_third_party_funds_counted',false,
   'cfg_reference_value_usd',1,'authorized_supply_ceiling',1000000000))
 returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.cfg_run_reserve_reconciliation(text,interval) from public,anon,authenticated;
grant execute on function public.cfg_run_reserve_reconciliation(text,interval) to service_role;

commit;

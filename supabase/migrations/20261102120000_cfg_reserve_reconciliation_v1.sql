-- CFG Reserve Reconciliation Engine V1
-- Additive only; not applied to any database by this change.
begin;
alter table public.cfg_reserve_assets drop constraint if exists cfg_reserve_assets_funding_source_check;
alter table public.cfg_reserve_assets add constraint cfg_reserve_assets_funding_source_check
 check (funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS','CUSTOMER_INVESTMENT','THIRD_PARTY_FUNDS','SYNTHETIC_TEST'));
alter table public.cfg_reserve_assets
 add column if not exists evidence_observed_at timestamptz,
 add column if not exists evidence_valid_until timestamptz,
 add column if not exists encumbered_usd_value numeric(30,8) not null default 0,
 add column if not exists verification_reference text;

-- Legacy VERIFIED rows lack the new provenance fields; fail closed until re-verified.
update public.cfg_reserve_assets
 set verification_status='PENDING', reserve_eligible=false
 where verification_status='VERIFIED'
   and (evidence_observed_at is null or verification_reference is null);
alter table public.cfg_reserve_assets
 add constraint cfg_reserve_assets_encumbrance_nonnegative check (encumbered_usd_value >= 0),
 add constraint cfg_reserve_assets_encumbrance_within_value check (verified_usd_value is null or encumbered_usd_value <= verified_usd_value),
 add constraint cfg_reserve_assets_synthetic_never_eligible check (funding_source <> 'SYNTHETIC_TEST' or reserve_eligible = false),
 add constraint cfg_reserve_assets_verified_evidence_complete check (verification_status <> 'VERIFIED' or (
  evidence_observed_at is not null and evidence_reference is not null and verification_reference is not null
  and verified_by is not null and verified_at is not null
 ));
create index if not exists cfg_reserve_assets_evidence_freshness_idx
 on public.cfg_reserve_assets(verification_status,reserve_eligible,evidence_observed_at);

create table if not exists public.cfg_supply_position (
 singleton_id smallint primary key default 1 check(singleton_id=1),
 issued_total numeric(30,8) not null default 0 check(issued_total>=0),
 outstanding_supply numeric(30,8) not null default 0 check(outstanding_supply>=0),
 redeemed_total numeric(30,8) not null default 0 check(redeemed_total>=0),
 encumbered_supply numeric(30,8) not null default 0 check(encumbered_supply>=0),
 updated_at timestamptz not null default now(),
 check(issued_total<=1000000000),
 check(issued_total=outstanding_supply+redeemed_total),
 check(encumbered_supply<=outstanding_supply)
);
insert into public.cfg_supply_position(singleton_id) values(1) on conflict(singleton_id) do nothing;

create table if not exists public.cfg_reserve_reconciliations (
 id uuid primary key default gen_random_uuid(),
 reconciliation_reference text not null unique,
 status text not null check(status in ('PASS','FAIL','INSUFFICIENT_EVIDENCE')),
 reserve_gross_usd numeric(38,8) not null check(reserve_gross_usd>=0),
 reserve_encumbered_usd numeric(38,8) not null check(reserve_encumbered_usd>=0),
 reserve_eligible_net_usd numeric(38,8) not null check(reserve_eligible_net_usd>=0),
 outstanding_cfg numeric(30,8) not null check(outstanding_cfg>=0),
 required_reserve_usd numeric(38,8) not null check(required_reserve_usd>=0),
 coverage_ratio numeric(38,12),
 reserve_asset_count integer not null check(reserve_asset_count>=0),
 stale_asset_count integer not null check(stale_asset_count>=0),
 excluded_asset_count integer not null check(excluded_asset_count>=0),
 evidence_max_age interval not null,
 policy_version text not null default 'CFG_RESERVE_POLICY_V1',
 created_by text not null default current_user,
 created_at timestamptz not null default now(),
 details jsonb not null default '{}'::jsonb,
 check(reserve_encumbered_usd<=reserve_gross_usd),
 check(reserve_eligible_net_usd=reserve_gross_usd-reserve_encumbered_usd)
);
create index if not exists cfg_reserve_reconciliations_created_idx on public.cfg_reserve_reconciliations(created_at desc);
alter table public.cfg_supply_position enable row level security;
alter table public.cfg_reserve_reconciliations enable row level security;
revoke all on table public.cfg_supply_position,public.cfg_reserve_reconciliations from anon,authenticated;
grant all on table public.cfg_supply_position,public.cfg_reserve_reconciliations to service_role;

create or replace function public.cfg_run_reserve_reconciliation(
 p_reconciliation_reference text,p_evidence_max_age interval default interval '7 days'
) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
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
 v_required:=v_outstanding; -- Fixed CFG reference value: USD 1.
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
comment on table public.cfg_supply_position is 'Trusted-service-maintained CFG supply counters; approvals are not issuance.';
comment on table public.cfg_reserve_reconciliations is 'Immutable reserve snapshots; synthetic, customer and third-party funds are excluded.';
commit;

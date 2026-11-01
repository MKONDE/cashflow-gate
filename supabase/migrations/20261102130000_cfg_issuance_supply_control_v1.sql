-- CFG Issuance & Supply Control Engine V1
-- Dual-control request/approval workflow. Actual issuance remains hard-disabled.
-- Apply only after the foundation, state, ledger and reserve migrations, in an isolated DB first.
begin;

-- Keep request records auditable and prevent changing the requested amount after workflow starts.
alter table public.cfg_issuance_requests
 add column if not exists approved_reserve_reconciliation_id uuid
   references public.cfg_reserve_reconciliations(id) on delete restrict,
 add column if not exists approval_expires_at timestamptz,
 add column if not exists rejection_reason text;

create or replace function public.cfg_guard_issuance_approval()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
 v_reserve numeric(38,8);
 v_encumbered numeric(38,8);
 v_outstanding numeric(30,8);
 v_already_reserved numeric(38,8);
 v_ceiling numeric(30,8);
 v_fresh_count bigint;
begin
 if tg_op='INSERT' then
  if new.status<>'DRAFT' then
   raise exception 'Issuance requests must start as DRAFT' using errcode='23514';
  end if;
  return new;
 end if;

 if old.status in ('APPROVED','REJECTED','CANCELLED') then
  raise exception 'Terminal issuance requests are immutable' using errcode='23514';
 end if;

 if new.requested_cfg_amount is distinct from old.requested_cfg_amount
  or new.required_reserve_usd is distinct from old.required_reserve_usd
  or new.request_reference is distinct from old.request_reference
  or new.created_by is distinct from old.created_by
  or new.created_at is distinct from old.created_at then
  raise exception 'Issuance request terms are immutable after creation' using errcode='23514';
 end if;

 if new.status not in ('DRAFT','PENDING_CONTROLLER','PENDING_SUPER_ADMIN','APPROVED','REJECTED','CANCELLED') then
  raise exception 'Unsupported issuance request state' using errcode='23514';
 end if;

 if new.status='APPROVED' and old.status<>'APPROVED' then
  -- Serialize all issuance approvals against each other and reserve/supply reconciliation.
  perform pg_advisory_xact_lock(hashtext('cfg-issuance-approval-v1'));
  perform 1 from public.cfg_platform_control where singleton_id=1 for update;
  perform 1 from public.cfg_supply_position where singleton_id=1 for update;

  select authorized_supply_ceiling into strict v_ceiling
  from public.cfg_platform_control where singleton_id=1;
  select outstanding_supply into strict v_outstanding
  from public.cfg_supply_position where singleton_id=1;

  if new.required_reserve_usd < new.requested_cfg_amount then
   raise exception 'Required reserve must cover 100 percent at USD 1 per CFG' using errcode='23514';
  end if;

  select coalesce(sum(verified_usd_value),0),coalesce(sum(encumbered_usd_value),0),count(*)
   into v_reserve,v_encumbered,v_fresh_count
  from public.cfg_reserve_assets
  where verification_status='VERIFIED' and reserve_eligible=true
   and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
   and asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')
   and verified_at is not null
   and evidence_observed_at>=now()-interval '7 days'
   and evidence_observed_at<=now()
   and (evidence_valid_until is null or evidence_valid_until>now());

  select coalesce(sum(required_reserve_usd),0) into v_already_reserved
  from public.cfg_issuance_requests
  where status='APPROVED' and id<>new.id
   and (approval_expires_at is null or approval_expires_at>now());

  if greatest(v_reserve-v_encumbered,0) < v_outstanding+v_already_reserved+new.required_reserve_usd then
   raise exception 'Approval blocked: fresh eligible net reserves do not cover outstanding CFG plus approved and requested issuance'
    using errcode='23514';
  end if;

  if v_outstanding + v_already_reserved + new.requested_cfg_amount > v_ceiling then
   raise exception 'Approval blocked: issuance would exceed authorized supply ceiling'
    using errcode='23514';
  end if;

  if new.financial_controller_id is null or new.super_admin_id is null
    or new.financial_controller_id=new.super_admin_id
    or new.financial_controller_approved_at is null or new.super_admin_approved_at is null then
   raise exception 'Two distinct approvals are required' using errcode='23514';
  end if;
  if not exists(select 1 from public.cfg_admin_roles r
    where r.user_id=new.financial_controller_id and r.role_name='FINANCIAL_CONTROLLER'
     and r.is_active and (r.expires_at is null or r.expires_at>now())) then
   raise exception 'Financial Controller approval is not assigned or active' using errcode='23514';
  end if;
  if not exists(select 1 from public.cfg_admin_roles r
    where r.user_id=new.super_admin_id and r.role_name='SUPER_ADMIN'
     and r.is_active and (r.expires_at is null or r.expires_at>now())) then
   raise exception 'Super Admin approval is not assigned or active' using errcode='23514';
  end if;
  if new.approved_reserve_reconciliation_id is null or not exists(
    select 1 from public.cfg_reserve_reconciliations rr
    where rr.id=new.approved_reserve_reconciliation_id and rr.status='PASS'
     and rr.created_at>=now()-interval '24 hours'
     and rr.reserve_eligible_net_usd>=rr.outstanding_cfg
  ) then
   raise exception 'A recent passing reserve reconciliation is required' using errcode='23514';
  end if;
 end if;

 if new.status='PENDING_SUPER_ADMIN' and old.status<>'PENDING_SUPER_ADMIN' then
  if new.financial_controller_id is null or new.financial_controller_approved_at is null then
   raise exception 'Financial Controller approval required before Super Admin review' using errcode='23514';
  end if;
  if not exists(select 1 from public.cfg_admin_roles r where r.user_id=new.financial_controller_id
    and r.role_name='FINANCIAL_CONTROLLER' and r.is_active
    and (r.expires_at is null or r.expires_at>now())) then
   raise exception 'Financial Controller role is not active' using errcode='23514';
  end if;
 end if;
 return new;
end;
$$;

drop trigger if exists cfg_issuance_approval_guard on public.cfg_issuance_requests;
create trigger cfg_issuance_approval_guard
before insert or update on public.cfg_issuance_requests
for each row execute function public.cfg_guard_issuance_approval();

create or replace function public.cfg_create_issuance_request(
 p_request_reference text,p_requested_cfg_amount numeric,p_actor_user_id uuid
) returns uuid
language plpgsql security definer
set search_path=public,pg_temp
as $$
declare v_id uuid;
begin
 if p_actor_user_id is null or not exists(
  select 1 from public.cfg_admin_roles r where r.user_id=p_actor_user_id
   and r.role_name in ('FINANCIAL_CONTROLLER','SUPER_ADMIN')
   and r.is_active and (r.expires_at is null or r.expires_at>now())
 ) then raise exception 'Active Treasury initiator role required' using errcode='42501'; end if;
 if p_requested_cfg_amount is null or p_requested_cfg_amount<=0
  or p_requested_cfg_amount>1000000000 then
  raise exception 'Requested CFG amount must be positive and within authorized ceiling' using errcode='22023';
 end if;
 insert into public.cfg_issuance_requests(
  request_reference,requested_cfg_amount,required_reserve_usd,created_by,status
 ) values(
  trim(p_request_reference),p_requested_cfg_amount,p_requested_cfg_amount,p_actor_user_id,'DRAFT'
 ) returning id into v_id;
 return v_id;
end;
$$;

create or replace function public.cfg_submit_issuance_controller_approval(
 p_request_id uuid,p_controller_user_id uuid,p_reserve_reconciliation_id uuid
) returns uuid
language plpgsql security definer
set search_path=public,pg_temp
as $$
declare v_request public.cfg_issuance_requests%rowtype;
begin
 perform pg_advisory_xact_lock(hashtext('cfg-issuance-approval-v1'));
 select * into strict v_request from public.cfg_issuance_requests where id=p_request_id for update;
 if v_request.status not in ('DRAFT','PENDING_CONTROLLER') then
  raise exception 'Request is not awaiting Controller approval' using errcode='55000';
 end if;
 if not exists(select 1 from public.cfg_admin_roles r where r.user_id=p_controller_user_id
  and r.role_name='FINANCIAL_CONTROLLER' and r.is_active
  and (r.expires_at is null or r.expires_at>now())) then
  raise exception 'Active Financial Controller role required' using errcode='42501';
 end if;
 if not exists(select 1 from public.cfg_reserve_reconciliations rr
  where rr.id=p_reserve_reconciliation_id and rr.status='PASS'
   and rr.created_at>=now()-interval '24 hours') then
  raise exception 'Recent passing reserve reconciliation required' using errcode='23514';
 end if;
 update public.cfg_issuance_requests set
  financial_controller_id=p_controller_user_id,
  financial_controller_approved_at=now(),
  approved_reserve_reconciliation_id=p_reserve_reconciliation_id,
  status='PENDING_SUPER_ADMIN',
  updated_at=now()
 where id=p_request_id;
 return p_request_id;
end;
$$;

create or replace function public.cfg_submit_issuance_super_admin_approval(
 p_request_id uuid,p_super_admin_user_id uuid
) returns uuid
language plpgsql security definer
set search_path=public,pg_temp
as $$
declare v_request public.cfg_issuance_requests%rowtype;
begin
 perform pg_advisory_xact_lock(hashtext('cfg-issuance-approval-v1'));
 select * into strict v_request from public.cfg_issuance_requests where id=p_request_id for update;
 if v_request.status<>'PENDING_SUPER_ADMIN' then
  raise exception 'Request is not awaiting Super Admin approval' using errcode='55000';
 end if;
 if p_super_admin_user_id is null or p_super_admin_user_id=v_request.financial_controller_id then
  raise exception 'Super Admin must be a different person from Financial Controller' using errcode='23514';
 end if;
 if not exists(select 1 from public.cfg_admin_roles r where r.user_id=p_super_admin_user_id
  and r.role_name='SUPER_ADMIN' and r.is_active
  and (r.expires_at is null or r.expires_at>now())) then
  raise exception 'Active Super Admin role required' using errcode='42501';
 end if;
 update public.cfg_issuance_requests set
  super_admin_id=p_super_admin_user_id,
  super_admin_approved_at=now(),
  status='APPROVED',
  approval_expires_at=now()+interval '24 hours',
  updated_at=now()
 where id=p_request_id;
 return p_request_id;
end;
$$;

-- Approved means authorized request only. Issuance itself remains disabled in this release.
create or replace function public.cfg_execute_issuance_request(p_request_id uuid)
returns uuid
language plpgsql security definer
set search_path=public,pg_temp
as $$
begin
 raise exception 'CFG issuance execution is disabled in V1. No CFG may be issued before a separately reviewed LIVE_AUTHORIZED release.'
  using errcode='55000';
end;
$$;

revoke all on function public.cfg_guard_issuance_approval() from public,anon,authenticated,service_role;
revoke all on function public.cfg_create_issuance_request(text,numeric,uuid) from public,anon,authenticated;
revoke all on function public.cfg_submit_issuance_controller_approval(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.cfg_submit_issuance_super_admin_approval(uuid,uuid) from public,anon,authenticated;
revoke all on function public.cfg_execute_issuance_request(uuid) from public,anon,authenticated;
grant execute on function public.cfg_create_issuance_request(text,numeric,uuid) to service_role;
grant execute on function public.cfg_submit_issuance_controller_approval(uuid,uuid,uuid) to service_role;
grant execute on function public.cfg_submit_issuance_super_admin_approval(uuid,uuid) to service_role;
grant execute on function public.cfg_execute_issuance_request(uuid) to service_role;

comment on function public.cfg_execute_issuance_request(uuid) is
'Intentionally disabled hard-stop. Dual approval authorizes a request only; it does not mint CFG or update supply.';
commit;

-- CFG Issuance Reservation Expiry V1
-- Additive only. Expired approvals stop reserving reserve/supply capacity and remain auditable.
begin;

alter table public.cfg_issuance_requests
  drop constraint if exists cfg_issuance_requests_status_check;
alter table public.cfg_issuance_requests
  add constraint cfg_issuance_requests_status_check
  check (status in ('DRAFT','PENDING_CONTROLLER','PENDING_SUPER_ADMIN','APPROVED','EXPIRED','REJECTED','CANCELLED'));

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
 v_issued_total numeric(30,8);
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

 -- The only permitted mutation of an approved request is an automatic expiry transition.
 if old.status='APPROVED' and new.status='EXPIRED' then
  if old.approval_expires_at is null or old.approval_expires_at>now() then
   raise exception 'An approval cannot expire before its expiry timestamp' using errcode='23514';
  end if;
  if (to_jsonb(new)-'status'-'updated_at') is distinct from (to_jsonb(old)-'status'-'updated_at') then
   raise exception 'Expiry transition cannot alter approved request terms or approvals' using errcode='23514';
  end if;
  return new;
 end if;

 if old.status in ('APPROVED','EXPIRED','REJECTED','CANCELLED') then
  raise exception 'Terminal issuance requests are immutable' using errcode='23514';
 end if;

 if new.requested_cfg_amount is distinct from old.requested_cfg_amount
  or new.required_reserve_usd is distinct from old.required_reserve_usd
  or new.request_reference is distinct from old.request_reference
  or new.created_by is distinct from old.created_by
  or new.created_at is distinct from old.created_at then
  raise exception 'Issuance request terms are immutable after creation' using errcode='23514';
 end if;

 if new.status not in ('DRAFT','PENDING_CONTROLLER','PENDING_SUPER_ADMIN','APPROVED','EXPIRED','REJECTED','CANCELLED') then
  raise exception 'Unsupported issuance request state' using errcode='23514';
 end if;
 if new.status='EXPIRED' then
  raise exception 'Only an elapsed APPROVED reservation may transition to EXPIRED' using errcode='23514';
 end if;

 if new.status='APPROVED' and old.status<>'APPROVED' then
  perform pg_advisory_xact_lock(hashtext('cfg-issuance-approval-v1'));
  perform 1 from public.cfg_platform_control where singleton_id=1 for update;
  perform 1 from public.cfg_supply_position where singleton_id=1 for update;

  select authorized_supply_ceiling into strict v_ceiling
  from public.cfg_platform_control where singleton_id=1;
  select issued_total,outstanding_supply into strict v_issued_total,v_outstanding
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
   and verified_at is not null and verified_at<=now()
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

  if v_issued_total + v_already_reserved + new.requested_cfg_amount > v_ceiling then
   raise exception 'Approval blocked: cumulative issued supply plus reservations would exceed authorized supply ceiling'
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

create or replace function public.cfg_expire_issuance_requests()
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_expired integer;
begin
 perform pg_advisory_xact_lock(hashtext('cfg-issuance-approval-v1'));
 update public.cfg_issuance_requests
 set status='EXPIRED',updated_at=now()
 where status='APPROVED'
   and approval_expires_at is not null
   and approval_expires_at<=now();
 get diagnostics v_expired = row_count;
 return v_expired;
end;
$$;

revoke all on function public.cfg_guard_issuance_approval() from public,anon,authenticated,service_role;
revoke all on function public.cfg_expire_issuance_requests() from public,anon,authenticated;
grant execute on function public.cfg_expire_issuance_requests() to service_role;

comment on function public.cfg_expire_issuance_requests() is
'Transitions elapsed approved issuance reservations to EXPIRED; no CFG issuance or money movement occurs.';
commit;

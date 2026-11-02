-- CFG operational state compatibility V1
-- Additive compatibility: preserve all country-readiness evidence and existing launch guard.
-- This migration does not authorize live operations or enable real-money functionality.

begin;

alter table public.cfg_platform_control
  drop constraint if exists cfg_platform_control_operational_state_check;

alter table public.cfg_countries
  drop constraint if exists cfg_countries_operational_state_check;

-- Preserve country readiness records; map only the legacy workflow state name.
update public.cfg_countries
set operational_state = 'COMPLIANCE_REVIEW',
    updated_at = now()
where operational_state = 'COUNTRY_READINESS';

update public.cfg_platform_control
set operational_state = 'COMPLIANCE_REVIEW',
    updated_at = now()
where operational_state = 'COUNTRY_READINESS';

alter table public.cfg_platform_control
  add constraint cfg_platform_control_operational_state_check
  check (operational_state in (
    'DEVELOPMENT','INTERNAL_TEST','COMPLIANCE_REVIEW','LIVE_AUTHORIZED'
  ));

alter table public.cfg_countries
  add constraint cfg_countries_operational_state_check
  check (operational_state in (
    'DEVELOPMENT','INTERNAL_TEST','COMPLIANCE_REVIEW','LIVE_AUTHORIZED'
  ));

comment on column public.cfg_platform_control.operational_state is
  'Approved CFG lifecycle: DEVELOPMENT, INTERNAL_TEST, COMPLIANCE_REVIEW, LIVE_AUTHORIZED. Live remains gated by independent approvals.';
comment on column public.cfg_countries.operational_state is
  'Country lifecycle. COMPLIANCE_REVIEW replaces legacy COUNTRY_READINESS; readiness evidence remains in cfg_country_readiness_checks.';

-- Retain the hard-disabled money switch and the fixed 1B / USD 1 / 100% reserve invariants.
alter table public.cfg_platform_control
  drop constraint if exists cfg_platform_control_real_money_enabled_check;
alter table public.cfg_platform_control
  add constraint cfg_platform_control_real_money_disabled_v1
  check (real_money_enabled = false);

alter table public.cfg_countries
  drop constraint if exists cfg_countries_real_money_enabled_check;
alter table public.cfg_countries
  add constraint cfg_countries_real_money_disabled_v1
  check (real_money_enabled = false);

commit;

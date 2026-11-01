-- CFG Issuance & Supply Control Engine V1 catalog/privilege assertions.
-- Run only in a disposable isolated database after all prerequisite migrations.
do $$
begin
 if to_regprocedure('public.cfg_create_issuance_request(text,numeric,uuid)') is null then raise exception 'Missing request creation RPC'; end if;
 if to_regprocedure('public.cfg_submit_issuance_controller_approval(uuid,uuid,uuid)') is null then raise exception 'Missing Controller approval RPC'; end if;
 if to_regprocedure('public.cfg_submit_issuance_super_admin_approval(uuid,uuid)') is null then raise exception 'Missing Super Admin approval RPC'; end if;
 if to_regprocedure('public.cfg_execute_issuance_request(uuid)') is null then raise exception 'Missing issuance hard-stop RPC'; end if;
 if has_function_privilege('anon','public.cfg_create_issuance_request(text,numeric,uuid)','EXECUTE')
  or has_function_privilege('authenticated','public.cfg_create_issuance_request(text,numeric,uuid)','EXECUTE')
  or has_function_privilege('anon','public.cfg_submit_issuance_controller_approval(uuid,uuid,uuid)','EXECUTE')
  or has_function_privilege('authenticated','public.cfg_submit_issuance_controller_approval(uuid,uuid,uuid)','EXECUTE')
  or has_function_privilege('anon','public.cfg_submit_issuance_super_admin_approval(uuid,uuid)','EXECUTE')
  or has_function_privilege('authenticated','public.cfg_submit_issuance_super_admin_approval(uuid,uuid)','EXECUTE')
 then raise exception 'Browser roles must not execute Treasury approval RPCs'; end if;
 if not has_function_privilege('service_role','public.cfg_execute_issuance_request(uuid)','EXECUTE') then
  raise exception 'service_role hard-stop RPC privilege missing';
 end if;
end $$;

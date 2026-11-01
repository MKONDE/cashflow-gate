create or replace function public.record_practice_trade(
  p_user_id uuid,
  p_action text,
  p_market_symbol text,
  p_price numeric,
  p_virtual_units numeric,
  p_position_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_position public.practice_positions%rowtype;
  v_event public.practice_events%rowtype;
  v_cost numeric;
  v_pnl numeric;
begin
  if p_user_id is null
     or p_action not in ('buy', 'close')
     or p_market_symbol is null
     or p_market_symbol !~ '^[A-Z0-9._-]{2,20}$'
     or p_price is null or p_price <= 0
     or p_virtual_units is null or p_virtual_units <= 0
     or p_idempotency_key is null
     or length(p_idempotency_key) < 8
     or length(p_idempotency_key) > 128 then
    raise exception 'Invalid practice trade request' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0)
  );

  select * into v_event
  from public.practice_events
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'event_id', v_event.id);
  end if;

  if p_action = 'buy' then
    v_cost := round(p_price * p_virtual_units, 8);

    insert into public.practice_positions (
      user_id, market_symbol, entry_price, virtual_units, virtual_cost, status
    ) values (
      p_user_id, p_market_symbol, p_price, p_virtual_units, v_cost, 'open'
    )
    returning * into v_position;

    insert into public.practice_events (
      user_id, event_type, market_symbol, virtual_amount, simulated_pnl, idempotency_key
    ) values (
      p_user_id, 'practice_buy', p_market_symbol, v_cost, 0, p_idempotency_key
    )
    returning * into v_event;

    return jsonb_build_object(
      'ok', true, 'duplicate', false, 'event_id', v_event.id,
      'position_id', v_position.id, 'virtual_cost', v_cost
    );
  end if;

  if p_position_id is null then
    raise exception 'Position ID is required to close a practice position'
      using errcode = '22023';
  end if;

  select * into v_position
  from public.practice_positions
  where id = p_position_id and user_id = p_user_id and status = 'open'
  for update;

  if not found then
    raise exception 'Open practice position not found' using errcode = 'P0002';
  end if;

  if abs(p_virtual_units - v_position.virtual_units) > 0.00000001 then
    raise exception 'Closing units must match the open practice position'
      using errcode = '22023';
  end if;

  v_pnl := round((p_price - v_position.entry_price) * v_position.virtual_units, 8);

  update public.practice_positions
  set status = 'closed', closed_at = now(), updated_at = now()
  where id = v_position.id;

  insert into public.practice_events (
    user_id, event_type, market_symbol, virtual_amount, simulated_pnl, idempotency_key
  ) values (
    p_user_id, 'practice_close', v_position.market_symbol,
    round(p_price * v_position.virtual_units, 8), v_pnl, p_idempotency_key
  )
  returning * into v_event;

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'event_id', v_event.id,
    'position_id', v_position.id, 'simulated_pnl', v_pnl
  );
end;
$$;

revoke all on function public.record_practice_trade(uuid, text, text, numeric, numeric, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_practice_trade(uuid, text, text, numeric, numeric, uuid, text)
  to service_role;

-- =====================================================
-- SigmaLog: Accountability request fixes
-- =====================================================
-- - Re-send allowed after a decline (declined rows no longer block)
-- - Decline now deletes the row (no tombstone)
-- - list_sent_requests(): see your own outgoing pending requests (to cancel)
-- =====================================================

-- Send: block only on an active (pending/accepted) link; clear stale declines
CREATE OR REPLACE FUNCTION public.send_partner_request(p_email TEXT)
RETURNS TABLE (ok BOOLEAN, message TEXT) AS $$
DECLARE
  v_me UUID := auth.uid();
  v_them UUID;
BEGIN
  IF v_me IS NULL THEN RETURN QUERY SELECT false, 'Not authenticated'; RETURN; END IF;

  SELECT id INTO v_them FROM public.users WHERE lower(email) = lower(trim(p_email));
  IF v_them IS NULL THEN RETURN QUERY SELECT false, 'No SigmaLog user with that email'; RETURN; END IF;
  IF v_them = v_me THEN RETURN QUERY SELECT false, 'That email is you'; RETURN; END IF;

  -- Clear any stale declined rows in either direction so a re-send is possible
  DELETE FROM public.accountability_partners
  WHERE status = 'declined'
    AND ((requester_id = v_me AND addressee_id = v_them)
      OR (requester_id = v_them AND addressee_id = v_me));

  IF EXISTS (
    SELECT 1 FROM public.accountability_partners
    WHERE status IN ('pending', 'accepted')
      AND ((requester_id = v_me AND addressee_id = v_them)
        OR (requester_id = v_them AND addressee_id = v_me))
  ) THEN
    RETURN QUERY SELECT false, 'Already connected or request pending'; RETURN;
  END IF;

  INSERT INTO public.accountability_partners (requester_id, addressee_id)
  VALUES (v_me, v_them);

  RETURN QUERY SELECT true, 'Request sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Respond: accept -> accepted; decline -> delete the row (no tombstone to block re-asks)
CREATE OR REPLACE FUNCTION public.respond_partner_request(p_id UUID, p_accept BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  v_me UUID := auth.uid();
  v_found BOOLEAN := false;
BEGIN
  IF p_accept THEN
    UPDATE public.accountability_partners
      SET status = 'accepted', responded_at = NOW()
    WHERE id = p_id AND addressee_id = v_me AND status = 'pending';
    v_found := FOUND;
  ELSE
    DELETE FROM public.accountability_partners
    WHERE id = p_id AND addressee_id = v_me AND status = 'pending';
    v_found := FOUND;
  END IF;
  RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- My outgoing pending requests (so the sender can see / cancel them)
CREATE OR REPLACE FUNCTION public.list_sent_requests()
RETURNS TABLE (id UUID, addressee_id UUID, email TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE v_me UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT ap.id, ap.addressee_id, u.email, ap.created_at
  FROM public.accountability_partners ap
  JOIN public.users u ON u.id = ap.addressee_id
  WHERE ap.requester_id = v_me AND ap.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

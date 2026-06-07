-- =====================================================
-- SigmaLog: Accountability invite links (referral-style)
-- =====================================================
-- A stable per-user invite code. Anyone who opens the link and accepts
-- becomes that user's accountability partner. No email required.
-- =====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Return (creating if needed) the caller's invite code
CREATE OR REPLACE FUNCTION public.get_my_invite_code()
RETURNS TEXT AS $$
DECLARE
  v_me UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_me IS NULL THEN RETURN NULL; END IF;
  SELECT invite_code INTO v_code FROM public.users WHERE id = v_me;
  IF v_code IS NULL THEN
    v_code := substr(md5(random()::text || v_me::text || clock_timestamp()::text), 1, 10);
    UPDATE public.users SET invite_code = v_code WHERE id = v_me;
  END IF;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Resolve an invite code for the confirm prompt
-- status: 'ok' | 'self' | 'connected' | 'invalid'
CREATE OR REPLACE FUNCTION public.lookup_invite(p_code TEXT)
RETURNS TABLE (status TEXT, inviter_email TEXT) AS $$
DECLARE
  v_me UUID := auth.uid();
  v_inviter UUID;
  v_email TEXT;
BEGIN
  SELECT id, email INTO v_inviter, v_email FROM public.users WHERE invite_code = p_code;
  IF v_inviter IS NULL THEN RETURN QUERY SELECT 'invalid', NULL::TEXT; RETURN; END IF;
  IF v_inviter = v_me THEN RETURN QUERY SELECT 'self', v_email; RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM public.accountability_partners
    WHERE status IN ('pending', 'accepted')
      AND ((requester_id = v_inviter AND addressee_id = v_me)
        OR (requester_id = v_me AND addressee_id = v_inviter))
  ) THEN
    RETURN QUERY SELECT 'connected', v_email; RETURN;
  END IF;
  RETURN QUERY SELECT 'ok', v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Accept an invite code → creates an accepted partnership (both sides consented:
-- the inviter by sharing, the invitee by accepting)
CREATE OR REPLACE FUNCTION public.accept_invite_code(p_code TEXT)
RETURNS TABLE (ok BOOLEAN, message TEXT) AS $$
DECLARE
  v_me UUID := auth.uid();
  v_inviter UUID;
BEGIN
  IF v_me IS NULL THEN RETURN QUERY SELECT false, 'Not authenticated'; RETURN; END IF;
  SELECT id INTO v_inviter FROM public.users WHERE invite_code = p_code;
  IF v_inviter IS NULL THEN RETURN QUERY SELECT false, 'Invalid invite link'; RETURN; END IF;
  IF v_inviter = v_me THEN RETURN QUERY SELECT false, 'That is your own invite link'; RETURN; END IF;

  -- Clear stale declined rows so the invite can connect
  DELETE FROM public.accountability_partners
  WHERE status = 'declined'
    AND ((requester_id = v_inviter AND addressee_id = v_me)
      OR (requester_id = v_me AND addressee_id = v_inviter));

  IF EXISTS (
    SELECT 1 FROM public.accountability_partners
    WHERE status = 'accepted'
      AND ((requester_id = v_inviter AND addressee_id = v_me)
        OR (requester_id = v_me AND addressee_id = v_inviter))
  ) THEN
    RETURN QUERY SELECT true, 'You are already partners'; RETURN;
  END IF;

  -- If a pending request already exists in either direction, accept it
  UPDATE public.accountability_partners
    SET status = 'accepted', responded_at = NOW()
  WHERE status = 'pending'
    AND ((requester_id = v_inviter AND addressee_id = v_me)
      OR (requester_id = v_me AND addressee_id = v_inviter));
  IF FOUND THEN RETURN QUERY SELECT true, 'You are now partners'; RETURN; END IF;

  INSERT INTO public.accountability_partners (requester_id, addressee_id, status, responded_at)
  VALUES (v_inviter, v_me, 'accepted', NOW());
  RETURN QUERY SELECT true, 'You are now partners'; RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- SigmaLog: Accountability Partners (1-on-1 pacts)
-- =====================================================
-- A mutual partnership between two users. Partners can see each other's
-- daily completion % and streak ONLY — never the underlying habits/logs.
-- All cross-user reads go through SECURITY DEFINER functions that verify
-- an accepted partnership first.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.accountability_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT ap_unique_pair UNIQUE (requester_id, addressee_id),
  CONSTRAINT ap_no_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_ap_requester ON public.accountability_partners(requester_id);
CREATE INDEX IF NOT EXISTS idx_ap_addressee ON public.accountability_partners(addressee_id);

ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;

-- See only partnership rows you are part of
DROP POLICY IF EXISTS "view own partnerships" ON public.accountability_partners;
CREATE POLICY "view own partnerships" ON public.accountability_partners
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Remove a partnership you are part of (creates/updates go via functions below)
DROP POLICY IF EXISTS "delete own partnerships" ON public.accountability_partners;
CREATE POLICY "delete own partnerships" ON public.accountability_partners
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- =====================================================
-- Send a partner request by email
-- =====================================================
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

  IF EXISTS (
    SELECT 1 FROM public.accountability_partners
    WHERE (requester_id = v_me AND addressee_id = v_them)
       OR (requester_id = v_them AND addressee_id = v_me)
  ) THEN
    RETURN QUERY SELECT false, 'Already connected or request pending'; RETURN;
  END IF;

  INSERT INTO public.accountability_partners (requester_id, addressee_id)
  VALUES (v_me, v_them);

  RETURN QUERY SELECT true, 'Request sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Accept / decline a pending request (addressee only)
-- =====================================================
CREATE OR REPLACE FUNCTION public.respond_partner_request(p_id UUID, p_accept BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE v_me UUID := auth.uid();
BEGIN
  UPDATE public.accountability_partners
    SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
        responded_at = NOW()
  WHERE id = p_id AND addressee_id = v_me AND status = 'pending';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Incoming pending requests for me
-- =====================================================
CREATE OR REPLACE FUNCTION public.list_partner_requests()
RETURNS TABLE (id UUID, requester_id UUID, email TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE v_me UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT ap.id, ap.requester_id, u.email, ap.created_at
  FROM public.accountability_partners ap
  JOIN public.users u ON u.id = ap.requester_id
  WHERE ap.addressee_id = v_me AND ap.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Accepted partners + their today completion + streak
-- (completion % and streak only — never the habits themselves)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_partners_status()
RETURNS TABLE (
  partner_id UUID,
  email TEXT,
  today_score INT,
  today_max INT,
  streak INT
) AS $$
DECLARE v_me UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT p.partner_id, u.email,
         COALESCE(ds.score, 0), COALESCE(ds.max_score, 0),
         public.calculate_streak(p.partner_id)
  FROM (
    SELECT CASE WHEN requester_id = v_me THEN addressee_id ELSE requester_id END AS partner_id
    FROM public.accountability_partners
    WHERE status = 'accepted' AND (requester_id = v_me OR addressee_id = v_me)
  ) p
  JOIN public.users u ON u.id = p.partner_id
  LEFT JOIN LATERAL public.get_daily_score(p.partner_id, CURRENT_DATE) ds ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

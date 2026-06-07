import { useState, useEffect, useCallback } from 'react';
import * as partnerService from '../services/partnerService';

export function usePartners() {
  const [partners, setPartners] = useState<partnerService.PartnerStatus[]>([]);
  const [requests, setRequests] = useState<partnerService.PartnerRequest[]>([]);
  const [sent, setSent] = useState<partnerService.SentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r, s] = await Promise.all([
        partnerService.getPartners(),
        partnerService.listRequests(),
        partnerService.listSentRequests(),
      ]);
      setPartners(p);
      setRequests(r);
      setSent(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const sendRequest = async (email: string) => {
    const res = await partnerService.sendRequestByEmail(email);
    if (res.ok) await refetch();
    return res;
  };

  const respond = async (id: string, accept: boolean) => {
    const ok = await partnerService.respondToRequest(id, accept);
    if (ok) await refetch();
    return ok;
  };

  const remove = async (partnerId: string) => {
    const ok = await partnerService.removePartner(partnerId);
    if (ok) await refetch();
    return ok;
  };

  const cancel = async (id: string) => {
    const ok = await partnerService.cancelRequest(id);
    if (ok) await refetch();
    return ok;
  };

  return { partners, requests, sent, loading, refetch, sendRequest, respond, remove, cancel };
}

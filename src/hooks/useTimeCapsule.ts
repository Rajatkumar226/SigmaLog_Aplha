import { useState, useEffect, useCallback } from 'react';
import * as timeCapsuleService from '../services/timeCapsuleService';

export function useTimeCapsule() {
  const [capsules, setCapsules] = useState<timeCapsuleService.TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCapsules = useCallback(async () => {
    const data = await timeCapsuleService.getCapsules();
    setCapsules(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;

  const pendingCapsule = capsules.find(c => !c.is_opened && c.deliver_on > today) ?? null;
  const readyCapsule = capsules.find(c => !c.is_opened && c.deliver_on <= today) ?? null;
  const hasCapsule = capsules.length > 0;

  const createCapsule = async (message: string, deliverInDays: number) => {
    const result = await timeCapsuleService.createCapsule(message, deliverInDays);
    if (result.success) await fetchCapsules();
    return result;
  };

  const openCapsule = async (capsuleId: string) => {
    const ok = await timeCapsuleService.openCapsule(capsuleId);
    if (ok) await fetchCapsules();
    return ok;
  };

  return {
    capsules,
    pendingCapsule,
    readyCapsule,
    hasCapsule,
    loading,
    createCapsule,
    openCapsule,
    refetch: fetchCapsules,
  };
}

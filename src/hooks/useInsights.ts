import { useState, useEffect, useCallback } from 'react';
import * as insightsService from '../services/insightsService';

export function useInsights(windowDays = 90) {
  const [insights, setInsights] = useState<insightsService.Insights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      setInsights(await insightsService.getInsights(windowDays));
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, refetch: fetchInsights };
}

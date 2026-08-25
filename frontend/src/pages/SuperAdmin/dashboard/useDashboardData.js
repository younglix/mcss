import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api.js';

/**
 * Fetches a fixed set of dashboard endpoints in parallel and exposes
 * loading/error/reload state. `endpoints` must be a referentially stable
 * object (define it as a module-level constant, not inline in the
 * component body) since it drives the fetch effect's dependency.
 */
export function useDashboardData(endpoints) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const keys = Object.keys(endpoints);
      const results = await Promise.all(keys.map((key) => api.get(endpoints[key])));
      setData(Object.fromEntries(keys.map((key, i) => [key, results[i]])));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [endpoints]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

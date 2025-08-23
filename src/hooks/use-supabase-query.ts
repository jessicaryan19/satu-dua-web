import { useState, useEffect, DependencyList } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

type QueryFunction<T> = () => Promise<{ data: T; error: PostgrestError | null }>;

interface UseSupabaseQueryOptions {
  enabled?: boolean;
}

export function useSupabaseQuery<T>(
  queryFn: QueryFunction<T>,
  dependencies: DependencyList = [],
  options: UseSupabaseQueryOptions = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false); // skip loading if not enabled
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: queryData, error: queryError } = await queryFn();
        if (queryError) {
          setError(queryError);
        } else {
          setData(queryData);
        }
      } catch (e) {
        setError(e as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies, enabled]);

  return { data, loading, error };
}

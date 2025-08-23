import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

type QueryFunction<T> = () => Promise<any>;

export function useSupabaseQuery<T>(queryFn: QueryFunction<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
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
      } catch (e: any) {
        setError(e as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, dependencies);

  return { data, loading, error };
}
import { supabase } from "@/lib/supabase";

export type Report = {
  id: string;
  created_at: string;
  ai_summary: string | null;
  call: {
    id: string;
    started_at: string;
    status: string;
    caller: { name: string };
    operator: { id: string; name: string };
  };
};

export const ReportService = {
  getOperatorReports: async (operatorId: string) => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        created_at,
        ai_summary,
        call:call_id (
          id,
          started_at,
          status,
          caller:caller_id ( name ),
          operator:operator_id ( id, name )
        )
      `)
      .eq("call.operator_id", operatorId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {data: data as unknown as Report[] || [], error };
  },
};
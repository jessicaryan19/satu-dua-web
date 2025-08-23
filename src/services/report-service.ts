import { supabase } from "@/lib/supabase";

export type ReportRow = {
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
    return supabase
      .from('satudua.reports')
      .select('*')
  },
};
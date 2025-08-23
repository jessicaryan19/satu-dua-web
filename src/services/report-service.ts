import { supabase } from "@/lib/supabase";

export type OperatorReportJSON = {
  event_type: string
  kecamatan: string
  kelurahan: string
  report_type: string
}
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
  operator_report: OperatorReportJSON
};

export interface ReportFormData {
  callerPhone: string;
  callerName: string;
  reportType: string;
  eventType: string;
  kecamatan?: string;
  kelurahan?: string;
  detailAddress?: string;
  incidentDetails: string;
}

export interface User {
  id?: string;
  name: string;
  phone_number: string;
  address?: string;
  created_at?: string;
}

export interface Call {
  id?: string;
  caller_id: string;
  operator_id: string;
  started_at?: string;
  ended_at?: string;
  status?: 'waiting' | 'active' | 'ended' | 'escalated';
}

export const ReportService = {
  getOperatorReports: async (operatorId: string) => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        created_at,
        ai_summary,
        call:call_id!inner (
          id,
          started_at,
          status,
          caller:caller_id ( name ),
          operator:operator_id ( id, name )
        ),
        operator_report
      `)
      .eq("call.operator_id", operatorId)
      .order("created_at", { ascending: false })
      .limit(10);
    return { data: data as unknown as Report[] || [], error };
  },

  saveReport: async (
    formData: ReportFormData,
    operatorId: string,
    aiAnalysis?: string,
    aiRecommendation?: string
  ) => {
    try {
      // 1. Create or get user (caller)
      let user: User | null = null;

      // Check if user exists by phone number
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', formData.callerPhone)
        .limit(1);

      if (userCheckError) throw userCheckError;

      if (existingUsers && existingUsers.length > 0) {
        user = existingUsers[0];
        // Update name and address if they're different
        const updateData: Partial<User> = {};
        if (user?.name !== formData.callerName) {
          updateData.name = formData.callerName;
        }
        if (formData.detailAddress && user?.address !== formData.detailAddress) {
          updateData.address = formData.detailAddress;
        }

        if (Object.keys(updateData).length > 0) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', user?.id)
            .select()
            .single();

          if (updateError) throw updateError;
          user = updatedUser;
        }
      } else {
        // Create new user
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            name: formData.callerName,
            phone_number: formData.callerPhone,
            address: formData.detailAddress || null
          })
          .select()
          .single();

        if (createUserError) throw createUserError;
        user = newUser;
      }

      if (!user) throw new Error('Failed to create or retrieve user');

      // 2. Create call record
      const { data: call, error: callError } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          operator_id: operatorId,
          status: 'ended' // Assuming the call is completed when saving report
        })
        .select()
        .single();

      if (callError) throw callError;

      // 3. Generate report ID (using timestamp format)
      const reportId = `25080600${Date.now().toString().slice(-6)}`;

      // 4. Create report
      const reportData = {
        call_id: call.id,
        operator_report: {
          report_type: formData.reportType,
          event_type: formData.eventType,
          kecamatan: formData.kecamatan || null,
          kelurahan: formData.kelurahan || null,
          detail_address: formData.detailAddress || null,
          incident_details: formData.incidentDetails
        },
        system_info: {
          caller_name: formData.callerName,
          caller_phone: formData.callerPhone,
          report_id: reportId,
          timestamp: new Date().toISOString()
        },
        ai_summary: aiAnalysis || null
      };

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (reportError) throw reportError;

      // 5. Save AI recommendation if provided
      if (aiRecommendation) {
        const { error: aiError } = await supabase
          .from('ai_recommendations')
          .insert({
            call_id: call.id,
            suggestion: aiRecommendation,
            analysis: aiAnalysis || null
          });

        if (aiError) throw aiError;
      }

      return {
        success: true,
        reportId,
        callId: call.id,
        userId: user.id,
        data: report
      };

    } catch (error) {
      console.error('Error saving report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  getReportById: async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          call:call_id (
            *,
            caller:caller_id (*),
            operator:operator_id (*)
          )
        `)
        .eq('system_info->>report_id', reportId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report not found'
      };
    }
  },

  getReportDetails: async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          operator_report,
          system_info,
          ai_summary,
          call:call_id (
            id,
            started_at,
            ended_at,
            status,
            caller:caller_id (
              id,
              name,
              phone_number,
              address
            ),
            operator:operator_id (
              id,
              name
            )
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching report details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report not found'
      };
    }
  }
};

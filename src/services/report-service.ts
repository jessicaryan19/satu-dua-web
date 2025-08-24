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
  location?: {
    kecamatan?: string;
    kelurahan?: string;
    detail_address?: string;
  };
}

export const ReportService = {
  getOperatorReports: async (operatorId: string) => {
    const { data, error } = await supabase
      .schema('satudua')
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
          operator:operator_id ( id, name ),
          ai_recommendations ( 
            id, 
            suggestion, 
            key_indicators, 
            analysis,
            created_at
          )
        ),
        operator_report
      `)
      .eq("call.operator_id", operatorId)
      .order("created_at", { ascending: false })
      .limit(10);
    return { data: data as unknown as Report[] || [], error };
  },

  saveReport: async (
    callId: string, // This is the Agora channelName
    formData: ReportFormData,
    operatorId: string,
    aiAnalysis?: string,
    aiRecommendation?: string
  ) => {
    try {
      // 1. Find the existing call by call_id (channelName)
      const { data: existingCall, error: callFindError } = await supabase
        .schema('satudua')
        .from('calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (callFindError || !existingCall) {
        throw new Error(`Call with ID ${callId} not found: ${callFindError?.message || 'Unknown error'}`);
      }

      // 2. Get caller information from the existing call's caller_id
      let user: User | null = null;

      if (!existingCall.caller_id) {
        throw new Error(`Call ${callId} does not have a caller_id. Cannot create report without caller information.`);
      }

      // Fetch the caller information using the caller_id from the call
      try {
        const { data: callerData, error: callerError } = await supabase
          .schema('satudua')
          .from('users')
          .select('*')
          .eq('id', existingCall.caller_id)
          .single();

        if (callerError || !callerData) {
          console.error('Error fetching caller from satudua.users table:', callerError);
          throw new Error(`Caller not found: ${callerError?.message || 'User does not exist'}`);
        }

        user = callerData;
        console.log('Found caller:', user.id, user.name);

      } catch (userError) {
        console.error('Error in caller lookup process:', userError);
        throw userError; // Re-throw the error
      }

      if (!user || !user.id) {
        throw new Error('Failed to retrieve caller data');
      }

      // 3. Update the call status, location, and assign operator
      const { data: updatedCall, error: callUpdateError } = await supabase
        .schema('satudua')
        .from('calls')
        .update({
          operator_id: operatorId, // Assign the operator who answered the call
          status: 'ended', // Mark as completed
          ended_at: new Date().toISOString(),
          location: {
            kecamatan: formData.kecamatan || existingCall.location?.kecamatan || null,
            kelurahan: formData.kelurahan || existingCall.location?.kelurahan || null,
            detail_address: formData.detailAddress || existingCall.location?.detail_address || null
          }
        })
        .eq('id', callId)
        .select()
        .single();

      if (callUpdateError) throw callUpdateError;

      // 4. Generate report ID (using timestamp format)
      const reportId = `25080600${Date.now().toString().slice(-6)}`;

      // 5. Create report with location information from the updated call
      const reportData = {
        call_id: callId, // Use the existing call ID
        operator_report: {
          report_type: formData.reportType,
          event_type: formData.eventType,
          kecamatan: updatedCall.location?.kecamatan || formData.kecamatan || null,
          kelurahan: updatedCall.location?.kelurahan || formData.kelurahan || null,
          detail_address: updatedCall.location?.detail_address || formData.detailAddress || null,
          incident_details: formData.incidentDetails
        },
        system_info: {
          caller_name: formData.callerName,
          caller_address: formData.detailAddress,
          report_id: reportId,
          timestamp: new Date().toISOString()
        },
        ai_summary: aiAnalysis || null
      };

      const { data: report, error: reportError } = await supabase
        .schema('satudua')
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (reportError) throw reportError;

      // 6. Save AI recommendation if provided
      if (aiRecommendation) {
        try {
          // Check if AI recommendation already exists for this call
          const { data: existingAI, error: checkError } = await supabase
            .schema('satudua')
            .from('ai_recommendations')
            .select('id')
            .eq('call_id', callId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // If error is not "no rows found", throw it
            throw checkError;
          }

          if (existingAI) {
            // Update existing recommendation
            const { error: updateError } = await supabase
              .schema('satudua')
              .from('ai_recommendations')
              .update({
                suggestion: aiRecommendation,
                analysis: aiAnalysis || null
              })
              .eq('call_id', callId);

            if (updateError) throw updateError;
          } else {
            // Insert new recommendation
            const { error: aiError } = await supabase
              .schema('satudua')
              .from('ai_recommendations')
              .insert({
                call_id: callId,
                suggestion: aiRecommendation,
                analysis: aiAnalysis || null
              });

            if (aiError) throw aiError;
          }
        } catch (aiErr) {
          console.error('Error handling AI recommendation:', aiErr);
          // Don't fail the entire operation if AI recommendation fails
          console.warn('AI recommendation could not be saved, but report was created successfully');
        }
      }

      return {
        success: true,
        reportId,
        callId: callId,
        userId: user.id,
        userFound: true, // Always true now since we require existing users
        data: report,
        callData: updatedCall
      };

    } catch (error) {
      console.error('Error saving report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  getCallDetails: async (callId: string) => {
    try {
      const { data, error } = await supabase
        .schema('satudua')
        .from('calls')
        .select(`
          id,
          started_at,
          ended_at,
          status,
          location,
          caller:caller_id (
            id,
            name,
            phone_number,
            address
          ),
          operator:operator_id (
            id,
            name
          ),
          ai_recommendations (
            id,
            suggestion,
            key_indicators,
            analysis,
            created_at
          )
        `)
        .eq('id', callId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching call details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Call not found'
      };
    }
  },

  getReportById: async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .schema('satudua')
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
            ),
            ai_recommendations (
              id,
              suggestion,
              key_indicators,
              analysis,
              created_at
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

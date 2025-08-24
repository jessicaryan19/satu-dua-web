import { supabase } from "@/lib/supabase";
import { CallAnalysis } from "./callService";

export interface AIRecommendation {
  id?: string;
  call_id: string;
  suggestion?: string;
  key_indicators?: any; // JSONB field
  analysis?: string;
  created_at?: string;
}

export interface ExtendedAIRecommendation extends AIRecommendation {
  // Additional fields from the CallAnalysis that we want to store
  confidence_score?: number;
  trust_score?: number;
  location?: string;
  reasoning?: string;
  escalation_required?: boolean;
  current_status?: string;
  suggested_action?: string;
  is_prank_call?: boolean;
}

export const AIRecommendationService = {
  /**
   * Save AI analysis results to the ai_recommendations table
   */
  saveAIAnalysis: async (callId: string, analysis: CallAnalysis): Promise<{ success: boolean; error?: string; data?: AIRecommendation }> => {
    try {
      // Prepare the data to insert
      const aiRecommendationData: Partial<AIRecommendation> = {
        call_id: callId,
        suggestion: analysis.suggested_action || analysis.analysis?.suggestion,
        key_indicators: {
          is_prank_call: analysis.analysis?.is_prank_call,
          confidence_score: analysis.analysis?.confidence_score,
          trust_score: analysis.analysis?.trust_score,
          location: analysis.analysis?.location,
          reasoning: analysis.analysis?.reasoning,
          key_indicators: analysis.analysis?.key_indicators,
          escalation_required: analysis.analysis?.escalation_required,
          confidence_trend: analysis.confidence_trend,
          current_status: analysis.current_status,
          update_timestamp: analysis.update_timestamp
        },
        analysis: analysis.analysis?.reasoning || JSON.stringify(analysis.analysis)
      };

      // Check if recommendation already exists for this call
      const { data: existingRecommendation, error: checkError } = await supabase
        .from('ai_recommendations')
        .select('id')
        .eq('call_id', callId)
        .single();

      let result;
      if (existingRecommendation) {
        // Update existing recommendation
        result = await supabase
          .from('ai_recommendations')
          .update(aiRecommendationData)
          .eq('call_id', callId)
          .select()
          .single();
      } else {
        // Insert new recommendation
        result = await supabase
          .from('ai_recommendations')
          .insert(aiRecommendationData)
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('Error saving AI recommendation:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`AI recommendation ${existingRecommendation ? 'updated' : 'saved'} for call ${callId}`);
      return {
        success: true,
        data: data as AIRecommendation
      };

    } catch (error) {
      console.error('Error in saveAIAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get AI recommendation for a specific call
   */
  getAIRecommendation: async (callId: string): Promise<{ success: boolean; error?: string; data?: AIRecommendation }> => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('call_id', callId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return {
            success: true,
            data: undefined
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as AIRecommendation
      };

    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get all AI recommendations for multiple calls
   */
  getAIRecommendations: async (callIds: string[]): Promise<{ success: boolean; error?: string; data?: AIRecommendation[] }> => {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .in('call_id', callIds)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as AIRecommendation[]
      };

    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Delete AI recommendation for a call
   */
  deleteAIRecommendation: async (callId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .delete()
        .eq('call_id', callId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting AI recommendation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get AI recommendations with call details
   */
  getAIRecommendationsWithCalls: async (operatorId?: string): Promise<{ success: boolean; error?: string; data?: any[] }> => {
    try {
      let query = supabase
        .from('ai_recommendations')
        .select(`
          *,
          call:call_id (
            id,
            started_at,
            ended_at,
            status,
            caller:caller_id (
              name,
              phone_number
            ),
            operator:operator_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by operator if provided
      if (operatorId) {
        query = query.eq('call.operator_id', operatorId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Error fetching AI recommendations with calls:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

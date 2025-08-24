// services/operator-service.ts
import { Session } from "@supabase/supabase-js";

export interface Operator {
  id: string;
  name: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorStatusResponse {
  success: boolean;
  active_count?: number;
  operator?: Operator;
  message?: string;
  error?: string;
}

export class OperatorService {
  /**
   * Get count of active operators
   */
  static async getActiveOperatorCount(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const response = await fetch('/api/operators/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          count: 0,
          error: errorData.error || 'Failed to fetch operator count'
        };
      }

      const data = await response.json();
      return {
        success: true,
        count: data.active_count || 0
      };
    } catch (error) {
      console.error('Error fetching active operator count:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get total count of all operators
   */
  static async getTotalOperatorCount(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const response = await fetch('/api/operators/total', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          count: 0,
          error: errorData.error || 'Failed to fetch total operator count'
        };
      }

      const data = await response.json();
      return {
        success: true,
        count: data.total_count || 0
      };
    } catch (error) {
      console.error('Error fetching total operator count:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update operator status (active/inactive)
   */
  static async updateOperatorStatus(
    session: Session | null,
    isActive: boolean
  ): Promise<OperatorStatusResponse> {
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No valid session or user ID found'
      };
    }

    try {
      const response = await fetch('/api/operators/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operator_id: session.user.id,
          is_active: isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to update operator status'
        };
      }

      const data = await response.json();
      return {
        success: true,
        operator: data.operator,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating operator status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current operator ID from session
   */
  static getCurrentOperatorId(session: Session | null): string | null {
    return session?.user?.id || null;
  }

  /**
   * Get current operator info from session
   */
  static getCurrentOperatorInfo(session: Session | null): { id: string; email?: string; metadata?: any } | null {
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      metadata: session.user.user_metadata
    };
  }
}

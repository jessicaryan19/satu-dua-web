import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// GET - Get count of active operators
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    console.log('Fetching active operator count...');

    // First, try to get schema information to check if is_active column exists
    const { data: schemaData, error: schemaError } = await supabase
      .from('operators')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('Schema check error:', schemaError);
      
      // If the table doesn't exist, return 0 count instead of failing
      if (schemaError.code === 'PGRST116' || schemaError.message.includes('does not exist') || schemaError.message.includes('relation') || schemaError.code === '42P01') {
        console.warn('Operators table does not exist, returning 0 count');
        return NextResponse.json({
          active_count: 0,
          success: true,
          warning: 'Operators table not found'
        });
      }
    }

    // Try to count active operators with isActive column
    const { data, error, count } = await supabase
      .from('operators')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true);

    if (error) {
      console.error('Supabase error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If isActive column doesn't exist, try counting all operators
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('isActive')) {
        console.warn('isActive column does not exist, counting all operators');
        
        const { data: allData, error: allError, count: allCount } = await supabase
          .from('operators')
          .select('*', { count: 'exact', head: true });
          
        if (allError) {
          console.error('Error counting all operators:', allError);
          return NextResponse.json(
            { 
              error: `Database query failed: ${allError.message || 'Unknown error'}`,
              details: allError,
              suggestion: 'The operators table may be missing the is_active column. Please run: ALTER TABLE operators ADD COLUMN is_active BOOLEAN DEFAULT false;'
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          active_count: allCount || 0,
          success: true,
          warning: 'isActive column not found, returning count of all operators'
        });
      }
      
      // If the table doesn't exist, return 0 count instead of failing
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01') {
        console.warn('Operators table does not exist, returning 0 count');
        return NextResponse.json({
          active_count: 0,
          success: true,
          warning: 'Operators table not found'
        });
      }
      
      return NextResponse.json(
        { 
          error: `Database query failed: ${error.message || 'Unknown database error'}`,
          details: error,
          errorCode: error.code
        },
        { status: 500 }
      );
    }

    console.log(`Found ${count || 0} active operators`);

    return NextResponse.json({
      active_count: count || 0,
      success: true
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Update operator status
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { operator_id, is_active } = body;

    if (!operator_id || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: operator_id and is_active' },
        { status: 400 }
      );
    }

    console.log(`Attempting to update operator ${operator_id} to ${is_active ? 'active' : 'inactive'}`);

    // Only update existing operators - do not create new ones
    const { data, error } = await supabase
      .from('operators')
      .update({ 
        isActive: is_active
      })
      .eq('id', operator_id)
      .select();

    if (error) {
      console.error('Update error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Check if it's a missing column error
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('isActive')) {
        return NextResponse.json(
          { 
            error: `Database schema error: ${error.message || 'Missing required columns'}`,
            details: error,
            suggestion: 'Please run the following SQL to add missing columns: ALTER TABLE operators ADD COLUMN is_active BOOLEAN DEFAULT false;'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Database update failed: ${error.message || 'Unknown error'}`,
          details: error
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { 
          error: 'Operator not found. Cannot update status for non-existent operator.',
          suggestion: 'Make sure the operator exists in the database before updating status.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      operator: data[0],
      message: `Operator status updated to ${is_active ? 'active' : 'inactive'}`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

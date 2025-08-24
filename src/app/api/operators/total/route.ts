import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// GET - Get total count of all operators
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    console.log('Fetching total operator count...');

    // First, try to get schema information to check if operators table exists
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
          total_count: 0,
          success: true,
          warning: 'Operators table not found'
        });
      }
    }

    // Count all operators
    const { data, error, count } = await supabase
      .from('operators')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If the table doesn't exist, return 0 count instead of failing
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01') {
        console.warn('Operators table does not exist, returning 0 count');
        return NextResponse.json({
          total_count: 0,
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

    console.log(`Found ${count || 0} total operators`);

    return NextResponse.json({
      total_count: count || 0,
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

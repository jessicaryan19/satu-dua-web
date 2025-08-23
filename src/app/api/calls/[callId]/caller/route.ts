// app/api/calls/[callId]/caller/route.ts - Alternative approach
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params; // This is the channelName

    // First, get the call to find the caller_id from satudua.calls
    // Since callId is actually channelName which is the same as call_id
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('caller_id')
      .eq('id', callId)
      .single();

    if (callError) {
      console.error('Supabase call error:', callError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!callData) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Then get the caller information from satudua.users
    const { data: callerData, error: callerError } = await supabase
      .from('users')
      .select('id, name, phone_number, address')
      .eq('id', callData.caller_id)
      .single();

    if (callerError) {
      console.error('Supabase caller error:', callerError);
      return NextResponse.json(
        { error: 'Caller lookup failed' },
        { status: 500 }
      );
    }

    if (!callerData) {
      return NextResponse.json(
        { error: 'Caller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: callerData.id,
      name: callerData.name,
      phone_number: callerData.phone_number,
      address: callerData.address,
    });

  } catch (error) {
    console.error('Error fetching caller info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron function for market data collection (backup method)
export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron Secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('🚫 Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Supabase configuration
    const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseFunctionsUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    console.log('🚀 Starting Vercel Cron market data collection...');

    // Call Supabase Edge Function
    const response = await fetch(`${supabaseFunctionsUrl}/data-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Cron/1.0'
      },
      body: JSON.stringify({
        action: 'collect_all',
        source: 'vercel_cron'
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Edge function call failed:', response.status, responseData);
      return NextResponse.json(
        {
          error: 'Edge function call failed',
          status: response.status,
          details: responseData
        },
        { status: response.status }
      );
    }

    console.log('✅ Market data collection completed via Vercel Cron');
    console.log(`📊 Collected: ${responseData.collected} indicators`);
    console.log(`❌ Errors: ${responseData.errors?.length || 0}`);

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'vercel_cron',
      edgeFunctionStatus: response.status,
      result: responseData
    });

  } catch (error) {
    console.error('💥 Vercel Cron error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}
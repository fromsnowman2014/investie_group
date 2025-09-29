import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Server-side environment variable check for direct API approach
    const serverEnvCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_URL: process.env.VERCEL_URL,

      // Count all NEXT_PUBLIC_ variables
      nextPublicCount: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).length,

      // List all NEXT_PUBLIC_ variables (keys only, not values for security)
      nextPublicKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),

      // Direct API approach - no external services needed
      apiApproach: 'direct',
      usingSupabase: false,

      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      serverSide: serverEnvCheck,
      message: "Direct API environment check completed - no external services required",
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
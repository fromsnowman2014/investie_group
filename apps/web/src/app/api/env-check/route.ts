import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Server-side environment variable check
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
      
      // Specific Supabase variables (check existence, not values)
      supabaseVars: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: !!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
      },
      
      // Supabase variable lengths (for debugging without exposing values)
      supabaseVarLengths: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL?.length || 0,
      },
      
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      serverSide: serverEnvCheck,
      message: "Server-side environment check completed",
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

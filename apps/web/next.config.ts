import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  // experimental: {
  //   optimizePackageImports: ['react-icons'], // Disabled - package not installed
  // },
  
  // Optimize images
  images: {
    domains: ['s3.tradingview.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Compiler optimizations
  compiler: {
    // Temporarily disable console removal to debug environment variables in production
    removeConsole: false,
  },
  
  // Build-time environment variable debugging
  env: {
    // Capture build-time environment state
    BUILD_TIME_ENV_COUNT: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length.toString(),
    BUILD_TIME_NODE_ENV: process.env.NODE_ENV || 'undefined',
    BUILD_TIME_TIMESTAMP: new Date().toISOString(),
    BUILD_TIME_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    BUILD_TIME_SUPABASE_FUNCTIONS_URL: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'MISSING',
    BUILD_TIME_SUPABASE_ANON_KEY_STATUS: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    BUILD_TIME_API_URL: process.env.NEXT_PUBLIC_API_URL || 'MISSING',
    // Available environment variables list (for debugging)
    BUILD_TIME_NEXT_PUBLIC_VARS: JSON.stringify(
      Object.keys(process.env)
        .filter(k => k.startsWith('NEXT_PUBLIC_'))
        .map(k => ({ key: k, hasValue: !!process.env[k] }))
    ),
  },
  
  // Output configuration - let Vercel handle this automatically
  // output: 'standalone', // Commented out for Vercel deployment
  
  // Enable strict mode
  reactStrictMode: true,
  
  // Optimize external scripts (TradingView)
  async rewrites() {
    return [
      {
        source: '/tradingview/:path*',
        destination: 'https://s3.tradingview.com/:path*',
      },
    ];
  },
};

export default nextConfig;

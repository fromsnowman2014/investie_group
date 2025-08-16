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
    removeConsole: process.env.NODE_ENV === 'production',
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

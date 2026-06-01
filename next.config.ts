import type { NextConfig } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const backendUrl = (() => {
  try { return new URL(BACKEND_URL); } catch { return new URL('http://localhost:5000'); }
})();
const backendHostname = backendUrl.hostname;
const backendProtocol = backendUrl.protocol.replace(':', '') as 'http' | 'https';
const backendPort = backendUrl.port;

const IS_STATIC_EXPORT = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Use 'export' for Firebase static hosting, and 'standalone' for Railway dynamic hosting
  output: IS_STATIC_EXPORT ? 'export' : 'standalone',

  // Allow cross-origin requests from tunnel domains during development
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost', '127.0.0.1'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // Static exports do not support dynamic server-side image resizing
    unoptimized: IS_STATIC_EXPORT ? true : false,
    remotePatterns: [
      {
        protocol: backendProtocol,
        hostname: backendHostname,
        ...(backendPort ? { port: backendPort } : {}),
        pathname: '/uploads/**',
      },
      {
        protocol: backendProtocol,
        hostname: backendHostname,
        ...(backendPort ? { port: backendPort } : {}),
        pathname: '/items/**',
      },
      // Also allow localhost fallback
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/items/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

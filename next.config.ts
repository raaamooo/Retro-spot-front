import type { NextConfig } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const backendUrl = (() => {
  try { return new URL(BACKEND_URL); } catch { return new URL('http://localhost:5000'); }
})();
const backendHostname = backendUrl.hostname;
const backendProtocol = backendUrl.protocol.replace(':', '') as 'http' | 'https';
const backendPort = backendUrl.port;

const nextConfig: NextConfig = {
  // Optimised self-hosting: generates a standalone output that can be run
  // with `node .next/standalone/server.js` without the full node_modules.
  output: 'standalone',

  // Allow cross-origin requests from tunnel domains during development
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost', '127.0.0.1'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
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
    ],
  },
};

export default nextConfig;

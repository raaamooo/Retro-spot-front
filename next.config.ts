import type { NextConfig } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const backendUrl = (() => {
  try { return new URL(BACKEND_URL); } catch { return new URL('http://localhost:5000'); }
})();
const backendHostname = backendUrl.hostname;
const backendProtocol = backendUrl.protocol.replace(':', '') as 'http' | 'https';
const backendPort = backendUrl.port;

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost', '127.0.0.1'],
  eslint: { ignoreDuringBuilds: true },

  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://retro-spot-front.vercel.app/:path*',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: backendProtocol, hostname: backendHostname, ...(backendPort ? { port: backendPort } : {}), pathname: '/uploads/**' },
      { protocol: backendProtocol, hostname: backendHostname, ...(backendPort ? { port: backendPort } : {}), pathname: '/items/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/items/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;

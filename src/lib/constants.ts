function getApiUrl(): string {
  // 1. If explicitly set via env var at build time, use that
  let envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = 'https://' + envUrl;
    }
    // Remove trailing slash if present
    if (envUrl.endsWith('/')) {
      envUrl = envUrl.slice(0, -1);
    }
    return envUrl;
  }
  // 2. If running on Railway production, use the Railway backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://retro-spot-back-production.up.railway.app';
  }
  // 3. Fallback to localhost for local development
  return 'http://localhost:5000';
}

export const API_URL = getApiUrl();
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL;

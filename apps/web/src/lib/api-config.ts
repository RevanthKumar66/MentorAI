export const getApiBaseUrl = (): string => {
  let url = typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

  // Self-healing fallback: If NEXT_PUBLIC_API_URL is not set but NEXT_PUBLIC_APP_URL looks like a backend API url
  if (!url) {
    const appUrl = typeof window !== 'undefined'
      ? (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL
      : process.env.NEXT_PUBLIC_APP_URL;

    if (appUrl && (appUrl.includes('onrender.com') || appUrl.includes('8000') || appUrl.includes('/api/'))) {
      url = appUrl;
    }
  }

  url = url || 'http://127.0.0.1:8000/api/v1';
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

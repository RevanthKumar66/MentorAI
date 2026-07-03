export const getApiBaseUrl = (): string => {
  let url = typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

  url = url || 'http://127.0.0.1:8000/api/v1';
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

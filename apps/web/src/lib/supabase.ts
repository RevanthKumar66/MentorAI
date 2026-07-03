import { createClient, AuthError } from '@supabase/supabase-js';

// Safe clean-up of environment variables
const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/['"]/g, '').trim();
};

const getSupabaseUrl = (): string => {
  const url = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return 'https://placeholder-project.supabase.co';
  }
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return key || 'placeholder-anon-key';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Initialize the Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});

// Mock fallback interceptors for development
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async () => {
  try {
    const result = await originalGetSession();
    if (result.error && process.env.NODE_ENV === 'development') {
      throw result.error;
    }
    return result;
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Supabase fetch failed. Falling back to local mock session.");
      return {
        data: {
          session: {
            access_token: 'mock-token-dev-mock-uid-1234-5678',
            user: {
              id: 'mock-uid-1234-5678',
              email: 'dev@mentorai.os',
              user_metadata: {
                full_name: 'Dev Local',
                avatar_url: 'https://avatar.vercel.sh/dev'
              }
            }
          }
        },
        error: null
      } as unknown as Awaited<ReturnType<typeof originalGetSession>>;
    }
    return { data: { session: null }, error: err as AuthError };
  }
};

const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth);
supabase.auth.signInWithPassword = async (credentials) => {
  try {
    const result = await originalSignInWithPassword(credentials);
    if (result.error && process.env.NODE_ENV === 'development') {
      throw result.error;
    }
    return result;
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Supabase signIn failed. Falling back to local mock session.");
      const emailVal = ('email' in credentials) ? (credentials as { email: string }).email : 'dev@mentorai.os';
      return {
        data: {
          session: {
            access_token: 'mock-token-dev-mock-uid-1234-5678',
            user: {
              id: 'mock-uid-1234-5678',
              email: emailVal,
              user_metadata: {
                full_name: 'Dev Local',
                avatar_url: 'https://avatar.vercel.sh/dev'
              }
            }
          },
          user: {
            id: 'mock-uid-1234-5678',
            email: emailVal,
            user_metadata: {
              full_name: 'Dev Local',
              avatar_url: 'https://avatar.vercel.sh/dev'
            }
          }
        },
        error: null
      } as unknown as Awaited<ReturnType<typeof originalSignInWithPassword>>;
    }
    return { data: { session: null, user: null }, error: err as Error } as unknown as Awaited<ReturnType<typeof originalSignInWithPassword>>;
  }
};

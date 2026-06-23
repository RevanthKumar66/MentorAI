'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

    const syncUserWithBackend = async (sessionUser: User, token: string) => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        if (res.ok) {
          const body = await res.json();
          const dbUser = body.data;
          if (dbUser) {
            const oauthAvatarUrl = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture;
            const oauthFullName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name;
            setUser({
              ...sessionUser,
              user_metadata: {
                ...sessionUser.user_metadata,
                full_name: dbUser.full_name || oauthFullName,
                avatar_url: dbUser.avatar_url || oauthAvatarUrl,
              }
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error syncing user with backend profile:', error);
      }
      setUser(sessionUser);
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncUserWithBackend(session.user, session.access_token);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await syncUserWithBackend(session.user, session.access_token);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}

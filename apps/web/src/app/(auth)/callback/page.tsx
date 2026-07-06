'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check if session is already active/available
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/chat');
      }
    });

    // 2. Listen to state changes to capture when the SDK successfully parses the OAuth hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/chat');
      } else if (event === 'INITIAL_SESSION' && !session) {
        // Allow a small delay for hash parsing. If no token or error present, redirect to login.
        const timer = setTimeout(() => {
          const hash = window.location.hash || '';
          if (!hash.includes('access_token') && !hash.includes('error')) {
            router.push('/login');
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    // 3. Absolute fallback timeout to prevent infinite spinner
    const fallbackTimer = setTimeout(() => {
      router.push('/login');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-[#fcfbf9] text-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Completing sign-in. Please wait...</p>
      </div>
    </div>
  );
}

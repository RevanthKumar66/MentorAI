'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Completing sign-in...');

  useEffect(() => {
    // With implicit flow, Supabase automatically picks up the token
    // from the URL hash and fires onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setStatusText('Signed in! Redirecting to your workspace...');
          router.push('/chat');
        }
      }
    );

    // Also check if a session already exists (e.g. email confirmation flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatusText('Signed in! Redirecting to your workspace...');
        router.push('/chat');
      }
    });

    // Fallback: redirect to login after 8 seconds if nothing fires
    const fallback = setTimeout(() => {
      setStatusText('Session not found. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1000);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcfbf9]">
      <div className="text-center">
        <Image
          src="/mentorai-symbol-only.svg"
          alt="MentorAI"
          width={40}
          height={40}
          className="mx-auto mb-6 opacity-80"
        />
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-slate-800"></div>
          <p className="text-xs text-slate-600 font-medium">{statusText}</p>
        </div>
      </div>
    </div>
  );
}

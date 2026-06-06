'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    };

    handleAuthCallback();
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

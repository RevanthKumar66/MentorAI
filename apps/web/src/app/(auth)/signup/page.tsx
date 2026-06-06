'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { ArrowRight, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

// Real multi-color Google G logo SVG
const GoogleLogo = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setSuccessEmail(data.email);
        // Redirect to login after 4 seconds
        setTimeout(() => {
          router.push('/login');
        }, 4000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError('Failed to initiate Google sign-up.');
    }
  };

  // Show success screen
  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#fcfbf9] px-4 py-12">
        <div className="w-full max-w-[380px] bg-white border border-slate-200/80 p-8 rounded-[6px] text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-emerald-50 border border-emerald-200 mb-5">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">Check your inbox</h2>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-slate-800">{successEmail}</span>.
            Click the link to activate your account, then sign in.
          </p>
          <div className="mt-4 p-3 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex gap-2 items-start text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>Account created! Redirecting to login in a moment...</span>
          </div>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-[6px] transition-colors"
          >
            Go to Login
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-[#fcfbf9] px-4 py-12">
      <div className="w-full max-w-[380px] bg-white border border-slate-200/80 p-8 rounded-[6px]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image src="/mentorai-symbol-only.svg" alt="MentorAI Symbol" width={36} height={36} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Create account</h2>
          <p className="text-[11px] text-slate-500 mt-1">Get started with MentorAI OS platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-800 text-[11px] font-medium flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Google Sign Up — above email form for prominence */}
        <button
          onClick={handleGoogleSignup}
          type="button"
          className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-[6px] flex justify-center items-center gap-x-2 transition-colors cursor-pointer mb-5"
        >
          <GoogleLogo />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center justify-between mb-5">
          <span className="flex-1 border-b border-slate-200"></span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mx-3">or sign up with email</span>
          <span className="flex-1 border-b border-slate-200"></span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full bg-white border border-slate-300/80 rounded-[6px] px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 text-[10px] text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full bg-white border border-slate-300/80 rounded-[6px] px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-[10px] text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full bg-white border border-slate-300/80 rounded-[6px] px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-[10px] text-red-600 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-[6px] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting ? 'Creating account...' : 'Create account'}
            {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-slate-900 hover:underline font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

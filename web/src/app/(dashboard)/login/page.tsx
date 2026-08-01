'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Sign-in is unavailable: this deployment is missing its Supabase configuration.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Links accounts created before owner_id existed; a no-op afterwards.
      await fetch('/api/auth/provision-business', { method: 'POST' }).catch(() => {});

      const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
      router.replace(redirectTo?.startsWith('/dashboard') ? redirectTo : '/dashboard');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome back</h1>
          <p className="text-brand-50 text-lg">
            Manage your AI receptionist, view calls, bookings, and orders — all in one place.
          </p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Voice Receptionist AI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h2>
          <p className="text-sm text-gray-500 mb-8">Enter your email and password to access your dashboard.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember me
              </label>
              <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-600 hover:text-brand-700 font-medium">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

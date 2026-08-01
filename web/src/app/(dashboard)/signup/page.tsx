'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Building2, Mail, User, ArrowRight, Check, Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessLanguage, setBusinessLanguage] = useState('both');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!isSupabaseConfigured()) {
      setError('Sign-up is unavailable: this deployment is missing its Supabase configuration.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // Business details live in user_metadata so that provisioning can read them
      // server-side without trusting a client-supplied owner id.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            business_type: businessType,
            business_phone: businessPhone,
            business_language: businessLanguage,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // With email confirmation enabled, signUp returns no session. The business
      // is then provisioned on first login instead.
      if (!data.session) {
        setNotice('Check your email to confirm your address, then sign in to finish setup.');
        return;
      }

      const provision = await fetch('/api/auth/provision-business', { method: 'POST' });
      if (!provision.ok) {
        setError('Your account was created, but we could not set up your business. Please sign in and try again.');
        return;
      }

      router.replace('/dashboard');
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
          <h1 className="text-3xl font-bold text-white mb-4">Start your free trial</h1>
          <p className="text-brand-50 text-lg mb-8">
            14 days free. No credit card required. Cancel anytime.
          </p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {[
              'AI answers every call 24/7',
              'Speaks English and Vietnamese',
              'Books appointments automatically',
              'Takes restaurant phone orders',
              'Sends SMS confirmations',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-brand-50 text-sm">{feature}</span>
              </div>
            ))}
          </div>
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

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brand-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
              <p className="text-sm text-gray-500 mb-8">Step 1 of 2 — Your details</p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tim Do"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    />
                  </div>
                </div>

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
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
              <p className="text-sm text-gray-500 mb-8">Step 2 of 2 — Business setup</p>

              <form className="space-y-4" onSubmit={handleSignup}>
                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-sm text-brand-700">
                    {notice}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Lantern House Vietnamese Restaurant"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="salon">Nail Salon</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="spa">Beauty Spa</option>
                    <option value="both">Both Salon &amp; Restaurant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Business Phone Number</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="+1 571-749-5444"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Language</label>
                  <select
                    value={businessLanguage}
                    onChange={(e) => setBusinessLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="both">English + Vietnamese</option>
                    <option value="en">English only</option>
                    <option value="vi">Vietnamese only</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition disabled:opacity-60"
                >
                  {submitting ? 'Creating your account…' : 'Start Free Trial'}
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                Back
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

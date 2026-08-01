'use client';

import { useState, useEffect } from 'react';
import {
  Phone, Languages, Clock, Calendar, UtensilsCrossed, MessageSquare,
  PhoneForwarded, Menu, X, Star, Check, ChevronDown, Play, ArrowRight
} from 'lucide-react';
import { translations, type Language } from '@/lib/translations';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Languages, Clock, Calendar, UtensilsCrossed, MessageSquare, PhoneForwarded,
};

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('en');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSampleCall, setShowSampleCall] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => setLang(lang === 'en' ? 'vi' : 'en');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Voice Receptionist AI</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo('features')} className="text-sm text-gray-600 hover:text-brand-600 transition">{t.nav.features}</button>
              <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-600 hover:text-brand-600 transition">{t.nav.pricing}</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-600 hover:text-brand-600 transition">{t.nav.howItWorks}</button>
              <button onClick={() => scrollTo('faq')} className="text-sm text-gray-600 hover:text-brand-600 transition">{t.nav.faq}</button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition"
              >
                {t.nav.languageToggle}
              </button>
              <a
                href="/signup"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
              >
                {t.nav.startTrial}
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
              <button onClick={() => scrollTo('features')} className="text-sm text-gray-600 text-left">{t.nav.features}</button>
              <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-600 text-left">{t.nav.pricing}</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-600 text-left">{t.nav.howItWorks}</button>
              <button onClick={() => scrollTo('faq')} className="text-sm text-gray-600 text-left">{t.nav.faq}</button>
              <a href="/signup" className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold w-fit">{t.nav.startTrial}</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              {t.hero.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition shadow-lg shadow-brand-600/20"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </a>
              <button
                onClick={() => setShowSampleCall(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-lg hover:border-brand-400 hover:text-brand-600 transition"
              >
                <Play className="w-5 h-5" />
                {t.hero.ctaSecondary}
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {[t.hero.badge1, t.hero.badge2, t.hero.badge3].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <Check className="w-4 h-4 text-brand-500" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.problem.title}</h2>
              <div className="space-y-4">
                {t.problem.items.map((item, i) => (
                  <div key={i} className="p-5 rounded-xl bg-red-50 border border-red-100">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.solution.title}</h2>
              <div className="space-y-4">
                {t.solution.items.map((item, i) => (
                  <div key={i} className="p-5 rounded-xl bg-brand-50 border border-brand-100">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t.howItWorks.title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t.features.title}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((feature, i) => {
              const Icon = iconMap[feature.icon] || Phone;
              return (
                <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">{t.pricing.title}</h2>
          <p className="text-center text-gray-600 mb-12">{t.pricing.subtitle}</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.pricing.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl bg-white border-2 transition-all ${
                  plan.popular ? 'border-brand-600 shadow-xl shadow-brand-600/10' : 'border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
                    ★ {lang === 'en' ? 'Most Popular' : 'Phổ Biến Nhất'}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`block w-full text-center py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-600'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t.testimonials.title}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.items.map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t.faq.title}</h2>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-gray-900 text-sm sm:text-base pr-4">{item.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.finalCta.title}</h2>
          <p className="text-brand-50 text-lg mb-8">{t.finalCta.subtitle}</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-lg hover:bg-brand-50 transition shadow-lg"
          >
            {t.finalCta.button}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Voice Receptionist AI</span>
              </div>
              <p className="text-sm text-gray-400 max-w-xs">{t.footer.tagline}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => scrollTo('features')} className="text-sm text-gray-400 hover:text-white text-left">{t.footer.features}</button>
              <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-400 hover:text-white text-left">{t.footer.pricing}</button>
              <button onClick={() => scrollTo('faq')} className="text-sm text-gray-400 hover:text-white text-left">{t.footer.faq}</button>
            </div>
            <div className="flex flex-col gap-3">
              <a href="/signup" className="text-sm text-gray-400 hover:text-white">{t.footer.signUp}</a>
              <a href="/login" className="text-sm text-gray-400 hover:text-white">{t.footer.login}</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">{t.footer.copyright}</p>
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:text-white hover:border-gray-600 transition"
            >
              {t.nav.languageToggle}
            </button>
          </div>
        </div>
      </footer>

      {/* Sample Call Modal */}
      {showSampleCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSampleCall(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t.sampleCall.title}</h3>
              <button onClick={() => setShowSampleCall(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t.sampleCall.description}</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center hover:bg-brand-700 transition">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-brand-500 rounded-full" />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>0:00</span>
                    <span>0:45</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">{lang === 'en' ? 'Sample audio coming soon' : 'Âm thanh mẫu sắp có'}</p>
            </div>
            <button
              onClick={() => setShowSampleCall(false)}
              className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              {t.sampleCall.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

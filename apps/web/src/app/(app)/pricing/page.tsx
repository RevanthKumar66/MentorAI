'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Check, X, ChevronDown, 
  Lock, Mail, Info, Sparkles, Database, Code, LineChart, ShieldCheck
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

interface PlanPricing {
  monthly: string;
  yearly: string;
  '3_years': string;
}

interface Plan {
  id: string;
  name: string;
  target: string;
  badge?: string;
  pricing: PlanPricing;
  pricingSubtext: PlanPricing;
  period: string;
  features: string[];
  limitations?: string[];
  buttonText: string;
  buttonClass: string;
  selectedCycle?: 'monthly' | 'yearly' | '3_years';
  selectedPrice?: string;
}

export default function PricingPage() {
  // Billing cycle state: monthly | yearly | 3_years
  const [activeCycle, setActiveCycle] = useState<'monthly' | 'yearly' | '3_years'>('yearly');
  
  // Modal states for plan selection/checkout
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<Plan | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // FAQ open/close states
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({
    0: true, // Default first FAQ open
  });

  // Fetch current user settings to show their active plan
  const { data: settingsData } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const body = await res.json();
      return body.data;
    }
  });

  useEffect(() => {
    // Sync email from Supabase Auth session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setNotifyEmail(data.session.user.email);
      }
    });
  }, []);

  const currentPlan = settingsData?.subscription_plan?.toUpperCase() || 'FREE';
  const currentBillingCycle = settingsData?.billing_cycle?.toLowerCase() || 'yearly';

  // Toggle FAQ item helper
  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Triggered when user clicks the main CTA on pricing cards
  const handlePlanSelect = async (plan: Plan) => {
    if (plan.id === 'FREE' && currentPlan === 'FREE') return;
    if (plan.id === currentPlan && activeCycle === currentBillingCycle) return;

    setIsCheckoutLoading(true);
    try {
      const headers = await getHeaders();
      // Future-ready checkout request
      const res = await fetch(`${API_BASE_URL}/billing/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: activeCycle
        })
      });

      if (!res.ok) throw new Error('Checkout request failed');
      const body = await res.json();
      const checkoutData = body.data;

      // Clean loading state
      setIsCheckoutLoading(false);

      if (checkoutData.status === 'active' && checkoutData.checkout_url) {
        // Stripe/Razorpay redirection when active
        window.location.assign(checkoutData.checkout_url);
      } else {
        // Shows modal when 'coming_soon'
        setSelectedPlanForModal({
          ...plan,
          selectedCycle: activeCycle,
          selectedPrice: plan.pricing[activeCycle]
        });
        setNotifySubmitted(false);
      }
    } catch (err) {
      console.error('Checkout failed, falling back to modal:', err);
      setIsCheckoutLoading(false);
      // Fallback in case of error: open modal anyway to keep experience smooth
      setSelectedPlanForModal({
        ...plan,
        selectedCycle: activeCycle,
        selectedPrice: plan.pricing[activeCycle]
      });
      setNotifySubmitted(false);
    }
  };

  // Triggered when submitting email on Coming Soon modal
  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;

    // Simulate notification signup (could log or store database interest list)
    setNotifySubmitted(true);
  };

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: 'Free',
      target: 'Students exploring MentorAI',
      pricing: {
        monthly: '₹0',
        yearly: '₹0',
        '3_years': '₹0'
      },
      pricingSubtext: {
        monthly: 'Free of charge',
        yearly: 'Free of charge',
        '3_years': 'Free of charge'
      },
      period: 'forever',
      features: [
        'AI Chat access',
        'Learning Mode',
        'Coding Mode',
        'DSA Mode',
        'Research Mode',
        '20 messages/day limit',
        '5 document uploads limit',
        '100MB cloud storage',
        'Basic chat history',
        'Community support'
      ],
      limitations: [
        'Knowledge Base module',
        'RAG Document Q&A',
        'Data Science Copilot',
        'Board of Advisors',
        'Project Mentor'
      ],
      buttonText: currentPlan === 'FREE' ? 'Current Plan' : 'Get Started',
      buttonClass: currentPlan === 'FREE'
        ? 'bg-[#F7F7F7] border-[#E5E7EB] text-[#71717A] cursor-default font-medium'
        : 'bg-white border-[#E5E7EB] text-[#111111] hover:bg-[#F7F7F7] font-semibold active:scale-[0.98]'
    },
    {
      id: 'PRO',
      name: 'Pro',
      target: 'Students and Developers',
      badge: 'Recommended',
      pricing: {
        monthly: '₹199',
        yearly: '₹1,999',
        '3_years': '₹4,999'
      },
      pricingSubtext: {
        monthly: 'billed monthly',
        yearly: 'billed yearly (~₹166/mo)',
        '3_years': 'billed once (~₹139/mo)'
      },
      period: 'per user',
      features: [
        'Everything in Free plan',
        'Unlimited AI Chat messages',
        'Role-Based AI Mentors',
        'Knowledge Base module',
        'RAG Document Q&A',
        'Advanced global search',
        'Project Mentor workspace',
        'Learning Memory repository',
        '10GB cloud storage',
        'Priority email support'
      ],
      buttonText: currentPlan === 'PRO' && activeCycle === currentBillingCycle 
        ? 'Current Plan' 
        : (currentPlan === 'PRO_PLUS' ? 'Downgrade to Pro' : 'Upgrade to Pro'),
      buttonClass: currentPlan === 'PRO' && activeCycle === currentBillingCycle
        ? 'bg-[#F7F7F7] border-[#E5E7EB] text-[#71717A] cursor-default font-medium'
        : 'bg-[#111111] text-white hover:bg-black font-semibold active:scale-[0.98]'
    },
    {
      id: 'PRO_PLUS',
      name: 'Pro Plus',
      target: 'Power Users & AI Researchers',
      pricing: {
        monthly: '₹499',
        yearly: '₹4,999',
        '3_years': '₹11,999'
      },
      pricingSubtext: {
        monthly: 'billed monthly',
        yearly: 'billed yearly (~₹416/mo)',
        '3_years': 'billed once (~₹333/mo)'
      },
      period: 'per user',
      features: [
        'Everything in Pro plan',
        'Data Science Copilot module',
        'Automatic dataset analysis',
        'CSV / Excel intelligence tool',
        'Multi-Document Research capability',
        'Board of Advisors setup',
        'Career Mentor template',
        'Interview Simulator session',
        '100GB cloud storage space',
        'Early access to new features'
      ],
      buttonText: currentPlan === 'PRO_PLUS' && activeCycle === currentBillingCycle
        ? 'Current Plan'
        : 'Upgrade to Pro Plus',
      buttonClass: currentPlan === 'PRO_PLUS' && activeCycle === currentBillingCycle
        ? 'bg-[#F7F7F7] border-[#E5E7EB] text-[#71717A] cursor-default font-medium'
        : 'bg-white border-[#E5E7EB] text-[#111111] hover:bg-[#F7F7F7] font-semibold active:scale-[0.98]'
    }
  ];

  // Grid details for Why Upgrade
  const whyUpgradeFeatures = [
    {
      icon: Database,
      title: 'Knowledge Base',
      desc: 'Upload PDFs and reference papers. Ask questions and build complete, unified personal knowledge search systems.'
    },
    {
      icon: Code,
      title: 'Project Mentor',
      desc: 'Track software and learning milestones. Receive continuous architectural guidance, system designs, and code reviews.'
    },
    {
      icon: LineChart,
      title: 'Data Science Copilot',
      desc: 'Upload CSV or Excel data. Instantly analyze datasets, calculate stats, write Python pandas scripts, and generate ML suggestions.'
    }
  ];

  // Features Comparison Matrix configuration
  const matrixRows = [
    { name: 'AI Chat', free: '20 messages/day', pro: 'Unlimited', plus: 'Unlimited' },
    { name: 'Learning Mentor', free: 'Basic access', pro: 'Full capability', plus: 'Full capability' },
    { name: 'Coding Assistant', free: 'Basic access', pro: 'Full capability', plus: 'Full capability' },
    { name: 'DSA Coach', free: 'Basic access', pro: 'Full capability', plus: 'Full capability' },
    { name: 'Research Assistant', free: 'Basic access', pro: 'Full capability', plus: 'Full capability' },
    { name: 'Knowledge Base', free: '✗ Not Available', pro: '✓ Available', plus: '✓ Available' },
    { name: 'Document Upload', free: '5 documents max', pro: 'Unlimited', plus: 'Unlimited' },
    { name: 'RAG', free: '✗ Not Available', pro: '✓ Available', plus: '✓ Available' },
    { name: 'Learning Memory', free: '✗ Not Available', pro: '✓ Available', plus: '✓ Available' },
    { name: 'Project Mentor', free: '✗ Not Available', pro: '✓ Available', plus: '✓ Available' },
    { name: 'Data Science Copilot', free: '✗ Not Available', pro: '✗ Not Available', plus: '✓ Available' },
    { name: 'Board of Advisors', free: '✗ Not Available', pro: '✗ Not Available', plus: '✓ Available' },
    { name: 'Interview Simulator', free: '✗ Not Available', pro: '✗ Not Available', plus: '✓ Available' },
    { name: 'Storage Limit', free: '100 MB', pro: '10 GB', plus: '100 GB' },
    { name: 'Priority Support', free: '✗ Not Available', pro: '✓ Email (24h)', plus: '✓ Priority (1h)' }
  ];

  // FAQ Q&A configuration
  const faqs = [
    {
      q: 'What is included in the Free tier?',
      a: 'The Free tier gives you full access to standard conversational modes (Learning, Coding, DSA, and Research) with a limit of 20 messages per day. You can also upload up to 5 documents with a total storage limit of 100MB. Advanced modules like the Knowledge Base, RAG Q&A, Project Mentor, and Data Science Copilot require an upgrade.'
    },
    {
      q: 'Can I upload PDFs and documents?',
      a: 'Yes, you can upload PDFs, markdown, text files, and CSV datasets. The Free plan allows uploading 5 documents, while Pro and Pro Plus offer unlimited uploads up to 10GB and 100GB of storage respectively.'
    },
    {
      q: 'How much data can I store in my workspace?',
      a: 'Free workspaces support 100MB of total document storage. Pro tiers support 10GB, and Pro Plus plans support 100GB, allowing you to build massive multi-document RAG collections and research indexes.'
    },
    {
      q: 'What is the Data Science Copilot?',
      a: 'The Data Science Copilot is a powerful data analysis interface. You can upload CSV, Excel, or JSON data and ask the AI to perform cleaning, write statistics computations, execute pandas code blocks, and offer machine learning pipelines. This feature is exclusive to the Pro Plus plan.'
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Absolutely. All upgrades are commitment-free. You can downgrade, cancel, or switch billing cycles anytime from your settings. If you cancel a paid plan, your premium features will remain active until the end of your prepaid billing cycle.'
    },
    {
      q: 'Will my data remain private?',
      a: 'Yes. All documents, workspace indices, and conversation histories are stored privately and securely. We do not use user files or query history to train AI models.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FCFCFC] overflow-y-auto text-[#111111] font-sans antialiased">
      {/* Header Navigation */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#111111] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Chat
            </Link>
          </div>
          <div className="text-xs font-medium text-[#71717A] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#111111]" />
            Secure checkout powered by MentorAI
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 space-y-10">
        
        {/* Title and Subtitle */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Plans tailored to your learning and productivity
          </h1>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Redesigned around MentorAI capabilities. Pay for features, workflows, and advanced workspaces instead of raw model tokens.
          </p>
        </div>

        {/* Segmented Billing Cycle Toggle */}
        <div className="flex justify-center">
          <div className="bg-[#F7F7F7] border border-[#E5E7EB] p-1 rounded-lg flex items-center gap-1">
            {(['monthly', 'yearly', '3_years'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setActiveCycle(cycle)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer select-none ${
                  activeCycle === cycle
                    ? 'bg-white border border-[#E5E7EB] text-[#111111] shadow-xs'
                    : 'text-[#71717A] hover:text-[#111111]'
                }`}
              >
                {cycle === 'monthly' && 'Monthly'}
                {cycle === 'yearly' && 'Yearly (Save ~15%)'}
                {cycle === '3_years' && '3 Years (Save ~30%)'}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id && activeCycle === currentBillingCycle;
            const price = plan.pricing[activeCycle];
            const subtext = plan.pricingSubtext[activeCycle];
            
            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between relative transition-all ${
                  plan.badge 
                    ? 'border-slate-900 ring-[0.5px] ring-slate-900' 
                    : 'border-[#E5E7EB]'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-slate-900 text-[9px] font-semibold text-white tracking-wide uppercase">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  {/* Title & Audience */}
                  <div>
                    <h3 className="text-base font-semibold text-[#111111]">{plan.name}</h3>
                    <p className="text-xs text-[#71717A] mt-0.5">{plan.target}</p>
                  </div>

                  {/* Price */}
                  <div className="border-t border-b border-[#E5E7EB] py-3.5 space-y-0.5">
                     <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-semibold tracking-tight text-[#111111]">
                        {price}
                      </span>
                      <span className="text-xs text-[#71717A] lowercase">
                        / {plan.period}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#71717A] font-medium">{subtext}</p>
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-[#111111] uppercase tracking-wider">Features Included</h4>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-[#111111]">
                          <Check className="w-3.5 h-3.5 text-[#111111] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                      {plan.limitations?.map((limit) => (
                        <li key={limit} className="flex items-start gap-2 text-xs text-[#71717A]">
                          <X className="w-3.5 h-3.5 text-[#E5E7EB] shrink-0 mt-0.5" />
                          <span className="line-through">{limit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="mt-5">
                  <button
                    type="button"
                    disabled={isCurrent || isCheckoutLoading}
                    onClick={() => handlePlanSelect(plan)}
                    className={`w-full py-2.5 rounded-lg text-xs transition-all border ${plan.buttonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isCheckoutLoading ? 'Connecting...' : plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why Upgrade Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-tight text-[#111111]">Why Upgrade to Pro?</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Unlock productivity tools designed for long-term project mentoring and analysis.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyUpgradeFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
                  <div className="p-2 bg-[#F7F7F7] border border-[#E5E7EB] w-max rounded-lg">
                    <Icon className="w-4 h-4 text-[#111111]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-[#111111]">{feat.title}</h3>
                    <p className="text-xs text-[#71717A] leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-tight text-[#111111]">Detailed Feature Matrix</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Compare feature sets and limits across plans at a glance.</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F7] border-b border-[#E5E7EB]">
                    <th className="p-4 font-semibold text-[#111111] uppercase tracking-wider text-[9px] w-2/5">Capability</th>
                    <th className="p-4 font-semibold text-[#111111] uppercase tracking-wider text-[9px] text-center w-1/5">Free</th>
                    <th className="p-4 font-semibold text-[#111111] uppercase tracking-wider text-[9px] text-center w-1/5">Pro</th>
                    <th className="p-4 font-semibold text-[#111111] uppercase tracking-wider text-[9px] text-center w-1/5">Pro Plus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-medium">
                  {matrixRows.map((row) => (
                    <tr key={row.name} className="hover:bg-[#FCFCFC] transition-colors">
                      <td className="p-4 text-[#111111] font-semibold">{row.name}</td>
                      <td className={`p-4 text-center ${row.free.includes('✗') ? 'text-[#71717A]' : 'text-[#111111]'}`}>{row.free}</td>
                      <td className={`p-4 text-center ${row.pro.includes('✗') ? 'text-[#71717A]' : 'text-[#111111]'}`}>{row.pro}</td>
                      <td className="p-4 text-center text-[#111111]">{row.plus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-tight text-[#111111]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Common questions about MentorAI subscriptions and billing.</p>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl bg-white divide-y divide-[#E5E7EB]">
            {faqs.map((faq, idx) => {
              const isOpen = !!openFaqIndices[idx];
              return (
                <div key={faq.q} className="p-4 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left font-semibold text-xs text-[#111111] focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#71717A] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-[#71717A] leading-relaxed pt-1">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA */}
        <div className="border border-[#E5E7EB] bg-white rounded-xl p-8 text-center space-y-4">
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-[#111111]">Ready to build your personal AI workspace?</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Learn faster. Build better. Think deeper. Unlock the full capabilities of structured roles, document indexing, and data intelligence.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#111111] hover:bg-black text-white text-xs font-semibold tracking-tight transition-all active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <a
              href="https://github.com/RevanthKumar66/MentorAI"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F7F7F7] text-[#111111] text-xs font-semibold tracking-tight transition-all active:scale-[0.98]"
            >
              View Roadmap
            </a>
          </div>
        </div>

      </main>

      {/* Plan Details "Coming Soon" Modal Overlay */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div 
            className="bg-white border border-[#E5E7EB] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F7F7F7]">
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#111111]" />
                  Plan Details: {selectedPlanForModal.name}
                </h3>
                <p className="text-[10px] text-[#71717A] mt-0.5">{selectedPlanForModal.target}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="text-[#71717A] hover:text-[#111111] p-1 rounded-md hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Pricing breakdown */}
              <div className="flex items-baseline justify-between border-b border-[#E5E7EB] pb-3">
                <span className="text-xs font-semibold text-[#71717A]">Pre-launch Price</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-[#111111]">{selectedPlanForModal.selectedPrice}</span>
                  <span className="text-[10px] text-[#71717A] block">
                    billed {selectedPlanForModal.selectedCycle === 'monthly' ? 'monthly' : selectedPlanForModal.selectedCycle === 'yearly' ? 'yearly' : 'once'}
                  </span>
                </div>
              </div>

              {/* Coming Soon Announcement Alert */}
              <div className="p-4 bg-[#F7F7F7] border border-[#E5E7EB] rounded-lg flex items-start gap-3 text-xs leading-relaxed text-[#111111]">
                <Info className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-xs">Feature Coming Soon</span>
                  <p className="text-[#71717A] text-[11px]">
                    We are currently polishing our Stripe & Razorpay subscription integrations. Leave your email to receive early developer access and pre-launch pricing!
                  </p>
                </div>
              </div>

              {/* Notify form */}
              {!notifySubmitted ? (
                <form onSubmit={handleNotifySubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-[#111111] uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg py-2 pl-9 pr-3 text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                      <Mail className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Notify Me
                  </button>
                </form>
              ) : (
                <div className="p-4 border border-[#E5E7EB] bg-white rounded-lg flex items-center gap-2.5 text-xs text-[#111111]">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#111111]" />
                  <div>
                    <span className="font-semibold">You are on the list!</span>
                    <p className="text-[#71717A] text-[11px] mt-0.5">We will email you at {notifyEmail} when {selectedPlanForModal.name} is ready for activation.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#F7F7F7] border-t border-[#E5E7EB] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="px-4 py-1.5 border border-[#E5E7EB] bg-white hover:bg-[#F7F7F7] text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

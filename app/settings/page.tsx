'use client';

import { useEffect, useState } from 'react';
import { User, Zap, Users, ChevronLeft, Mail, X, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { deleteUserAccount } from '../actions/delete-account';

type SettingsTab = 'profile' | 'billing' | 'team';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamEmailSubmitted, setTeamEmailSubmitted] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  
  // Loading states
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fetch actual profile data on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_name')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.company_name) setCompanyName(profile.company_name);
        } else if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
      } else {
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);

  // Save Profile Logic
  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName, 
          company_name: companyName 
        })
        .eq('id', userId);

      if (dbError) throw dbError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      alert('Profile saved successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      alert('Failed to save profile. Make sure you ran the SQL policy update!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Delete Account Logic
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will permanently delete your account, contracts, and data. This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    
    const result = await deleteUserAccount();

    if (result.success) {
      await supabase.auth.signOut();
      router.push('/');
    } else {
      alert("Failed to delete account. Please contact support.");
      setIsDeletingAccount(false);
    }
  };

  // Manage Billing (Stripe Portal)
  const handleManageBilling = async () => {
    if (!userId) {
      alert('User ID not found. Please refresh and try again.');
      return;
    }

    setLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to open billing portal');
        setLoadingPortal(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening billing portal:', err);
      alert('An error occurred. Please try again.');
      setLoadingPortal(false);
    }
  };

  // Cancel Subscription (Uses same portal, different loading state for UX)
  const handleCancelSubscription = async () => {
    if (!userId) {
      alert('User ID not found. Please refresh and try again.');
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to open billing portal');
        setIsCanceling(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening billing portal:', err);
      alert('An error occurred. Please try again.');
      setIsCanceling(false);
    }
  };

  const handleTeamEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamEmail.trim()) {
      console.log('Team waitlist email:', teamEmail);
      setTeamEmailSubmitted(true);
      setTimeout(() => {
        setShowTeamForm(false);
        setTeamEmailSubmitted(false);
        setTeamEmail('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-slate-600 transition-colors group">
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-sm font-bold text-slate-900">Back to Dashboard</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* SIDEBAR NAVIGATION (Desktop) */}
          <div className="hidden md:block">
            <nav className="space-y-2 sticky top-24">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${
                  activeTab === 'profile'
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${
                  activeTab === 'billing'
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-4 h-4" /> Billing
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-3 ${
                  activeTab === 'team'
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" /> Team
              </button>
            </nav>
          </div>

          {/* TOP TABS (Mobile) */}
          <div className="md:hidden col-span-1 mb-6">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'billing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'team'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="md:col-span-3">
            {/* PROFILE SECTION */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Profile Settings</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage your account information and preferences.</p>
                </div>

                {/* Avatar Section */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shrink-0`}>
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Profile Avatar</p>
                      <p className="text-slate-900 font-bold text-lg">{fullName || 'User'}</p>
                      <p className="text-slate-500 text-sm">Based on your first and last name</p>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 font-medium"
                      placeholder="Your full name"
                    />
                    <p className="text-xs text-slate-500 mt-2">This will be used on your invoices and agreements.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 font-medium"
                      placeholder="Your company or brand name"
                    />
                    <p className="text-xs text-slate-500 mt-2">Displayed as your business identity to clients.</p>
                  </div>

                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-wait px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      Danger Zone
                    </h3>
                    <p className="text-red-700 text-sm mt-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-sm py-3 rounded-lg transition-all shadow-lg hover:shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isDeletingAccount ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Deleting Account...</>
                    ) : (
                      <><Trash2 className="w-4 h-4" /> Delete Account</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* BILLING SECTION */}
            {activeTab === 'billing' && (
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing & Subscription</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage your plan and billing information.</p>
                </div>

                {/* Current Plan Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Plan</p>
                      <h3 className="text-3xl font-bold text-slate-900">Starter Plan</h3>
                      <p className="text-slate-600 text-sm mt-2">You're on our most popular plan. Perfect for solo freelancers.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Billing Cycle</p>
                        <p className="text-slate-900 font-bold">Monthly</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Next Billing Date</p>
                        <p className="text-slate-900 font-bold">May 21, 2026</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Included Features</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span className="text-sm font-medium">Unlimited contracts & proposals</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span className="text-sm font-medium">Digital signature integration</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span className="text-sm font-medium">Stripe payment connections</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span className="text-sm font-medium">Email invoice reminders</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span className="text-sm font-medium">Expense tracking</span>
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Subscription Management</p>
                      <p className="text-slate-600 text-sm">Update your payment method or download past invoices.</p>
                    </div>
                    <button
                      onClick={handleManageBilling}
                      disabled={loadingPortal}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-wait px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {loadingPortal ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Manage Billing Info
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* NEW: Cancel Subscription Area */}
                <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      Cancel Subscription
                    </h3>
                    <p className="text-red-700 text-sm mt-2">
                      Because Stripe securely manages your subscription, you can unsubscribe and cancel your plan directly through your Stripe Billing Portal.
                    </p>
                  </div>
                  <button 
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-sm py-3 rounded-lg transition-all shadow-lg hover:shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isCanceling ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...</>
                    ) : (
                      'Unsubscribe in Stripe'
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* TEAM SECTION */}
            {activeTab === 'team' && (
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
                  <p className="text-slate-500 text-sm mt-1">Collaborate with your team (Agency plan feature).</p>
                </div>

                {/* Locked Feature Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Agency Plan Only</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mt-3">Team features are currently available for Agency plans.</h3>
                      <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                        Invite team members to collaborate on contracts, manage permissions, and streamline your workflow. This feature is exclusively available on our Agency plan and above.
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Coming Soon</p>
                          <ul className="space-y-2 text-xs text-slate-600">
                            <li>✓ Invite team members</li>
                            <li>✓ Role-based permissions</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">For Agencies</p>
                          <ul className="space-y-2 text-xs text-slate-600">
                            <li>✓ Shared workspace</li>
                            <li>✓ Activity logs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <Users className="w-32 h-32 text-gray-100" />
                    </div>
                  </div>
                </div>

                {/* Add Team Member - Fake Door */}
                <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-200">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-indigo-900">Ready to expand your team?</h3>
                    <p className="text-indigo-800 text-sm">
                      If you're interested in team collaboration, join our Agency waitlist to get early access to this powerful feature.
                    </p>
                    <button
                      onClick={() => setShowTeamForm(!showTeamForm)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      {showTeamForm ? 'Cancel' : 'Add Team Member'}
                    </button>
                  </div>

                  {/* Team Waitlist Form - Inline */}
                  {showTeamForm && (
                    <div className="mt-6 pt-6 border-t border-indigo-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-3">📧 Team features are currently in closed beta</p>
                        <p className="text-indigo-800 text-sm mb-4 font-medium">Join the Agency waitlist to get early access and be among the first to use team features.</p>
                      </div>

                      <form onSubmit={handleTeamEmailSubmit} className="space-y-3">
                        <div>
                          <label htmlFor="team-email" className="block text-xs font-bold text-indigo-900 mb-2">
                            Email Address
                          </label>
                          <input
                            id="team-email"
                            type="email"
                            value={teamEmail}
                            onChange={(e) => setTeamEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-2.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-900 font-medium"
                            required
                          />
                        </div>

                        {teamEmailSubmitted && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center animate-in fade-in">
                            <p className="text-emerald-700 text-sm font-bold">✓ You've been added to the Agency waitlist!</p>
                            <p className="text-emerald-600 text-xs mt-1">We'll notify you as soon as teams become available.</p>
                          </div>
                        )}

                        {!teamEmailSubmitted && (
                          <button
                            type="submit"
                            className="w-full bg-indigo-900 hover:bg-indigo-950 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Join Agency Waitlist
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">💡 Tip</p>
                  <p className="text-slate-700 text-sm font-medium">
                    Start with the Starter or Pro plan and scale up to Agency when your team grows. Your data and preferences will carry over seamlessly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
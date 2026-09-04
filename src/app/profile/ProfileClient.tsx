'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  X,
  UserCheck,
  AlertCircle,
  Menu,
  Eye,
  EyeOff
} from 'lucide-react';
import axiosServices from '@/utils/axios';
import LoadingScreen from '@/components/common/LoadingScreen';
import Footer from '@/components/common/Footer';

interface UserProfile {
  id: number;
  name: string;
  mobile: string;
  role: number;
  status: number;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // Profile Form State
  const [profileName, setProfileName] = useState<string>('');
  const [profileMobile, setProfileMobile] = useState<string>('');
  const [profilePassword, setProfilePassword] = useState<string>('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState<string>('');
  const [showProfilePassword, setShowProfilePassword] = useState<boolean>(false);
  const [showProfileConfirmPassword, setShowProfileConfirmPassword] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');

  // Authentication check & Fetch User Profile
  useEffect(() => {
    document.title = 'QuickCash Ledger - Profile';
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');

    if (!token) {
      router.replace('/');
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setProfileName(parsed.name || '');
        setProfileMobile(parsed.mobile || '');
      } catch (err) {
        // Fallback
      }
    }

    axiosServices
      .get('auth/profile')
      .then((res) => {
        const profile = res.data?.result?.data || res.data?.data;
        if (profile) {
          setUser(profile);
          setProfileName(profile.name || '');
          setProfileMobile(profile.mobile || '');
          localStorage.setItem('user_profile', JSON.stringify(profile));
        }
      })
      .catch(() => {
        // Handled by axios 401 interceptor
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Global Keyboard Shortcut Handler (Alt + L for Logout, Esc to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        setIsLogoutModalOpen(false);
        return;
      }

      if (isAlt && key === 'l') {
        e.preventDefault();
        setIsLogoutModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Profile Update Submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName.trim() || profileName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    if (!/^[0-9]{10}$/.test(profileMobile.trim())) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (profilePassword || profileConfirmPassword) {
      if (profilePassword.length < 6) {
        setProfileError('New password must be at least 6 characters long.');
        return;
      }
      if (profilePassword !== profileConfirmPassword) {
        setProfileError('New password and confirm password do not match.');
        return;
      }
    }

    setProfileLoading(true);

    try {
      const payload: Record<string, any> = {
        name: profileName.trim(),
        mobile: profileMobile.trim()
      };
      if (profilePassword) {
        payload.password = profilePassword;
      }

      const response = await axiosServices.put('auth/profile', payload);
      const updatedUser = response.data?.result?.data || response.data?.data;

      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      }

      setProfileSuccess('Profile details updated successfully!');
      setProfilePassword('');
      setProfileConfirmPassword('');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      const msg = Array.isArray(apiErrors)
        ? apiErrors.map((e: any) => e.message).join('. ')
        : err.message || 'Failed to update profile.';
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Confirm Logout
  const confirmLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      await axiosServices.post('auth/logout');
    } catch (err) {
      // Ignore network errors on cleanup
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setIsLogoutModalOpen(false);
      router.replace('/');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased overflow-hidden">
      {/* MOBILE DRAWER NAVIGATION (Smartphones & Tablets) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Drawer Sidebar Content */}
          <div className="w-64 bg-[#002B2A] text-slate-300 flex flex-col h-full border-r border-emerald-950/60 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Brand Logo Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-emerald-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h1 className="font-black text-white text-sm tracking-tight leading-none">
                    QuickCash
                  </h1>
                  <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">
                    Ledger Portal
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              <div className="px-3 mb-2 text-[10px] font-extrabold text-emerald-500/80 uppercase tracking-widest">
                Main Menu
              </div>
              <button
                onClick={() => {
                  router.push('/dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs transition-all"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Profile Settings</span>
              </button>
            </nav>

            {/* Mobile Admin Profile Card */}
            <div className="p-3 m-3 bg-emerald-950/80 rounded-2xl border border-emerald-900/50 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-emerald-400/90 font-medium truncate">
                    {user?.mobile || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                disabled={loggingOut}
                title="Logout"
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Click Outside Backdrop */}
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* DESKTOP SIDEBAR (Laptops & Desktops) */}
      <aside className="w-64 bg-[#002B2A] text-slate-300 flex-col shrink-0 h-full border-r border-emerald-950/60 select-none z-20 hidden md:flex">
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-emerald-900/40 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-900/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight leading-none">
              QuickCash
            </h1>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
              Ledger Portal
            </span>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-extrabold text-emerald-500/80 uppercase tracking-widest">
            Main Menu
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs transition-all"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Profile Settings</span>
          </button>
        </nav>

        {/* Sticky Admin Profile Card */}
        <div className="p-3.5 m-3 bg-emerald-950/80 rounded-2xl border border-emerald-900/50 flex items-center justify-between shrink-0 shadow-md mt-auto">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-emerald-700/60 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-emerald-400/90 font-medium truncate">
                {user?.mobile || 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            disabled={loggingOut}
            title="Logout"
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition md:hidden"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              Admin Profile Settings
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Session Active
            </span>
          </div>
        </header>

        {/* Inner Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto flex-1">
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {/* Profile Header Card */}
            <div className="bg-[#002B2A] rounded-2xl p-6 text-white shadow-md border border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center font-black text-2xl text-white shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">{user?.name || 'Administrator'}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    System Administrator &bull; Mobile: {user?.mobile || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Account Active
                </span>
              </div>
            </div>

            {/* Profile Settings Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 tracking-tight">Admin Profile Details</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Update your account name, mobile login credentials, or security password.
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>

              {profileError && (
                <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>{profileError}</div>
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>{profileSuccess}</div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={profileLoading}
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Admin Name"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-2xs"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      disabled={profileLoading}
                      value={profileMobile}
                      onChange={(e) => setProfileMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Security & Password Update Section */}
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                    Security & Password Update (Optional)
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showProfilePassword ? 'text' : 'password'}
                          disabled={profileLoading}
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="Leave blank to keep current"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showProfileConfirmPassword ? 'text' : 'password'}
                          disabled={profileLoading}
                          value={profileConfirmPassword}
                          onChange={(e) => setProfileConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfileConfirmPassword(!showProfileConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showProfileConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 bg-[#1B64F2] hover:bg-[#1553d1] active:bg-[#1246b3] text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      'Save Profile Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Are you sure you want to end your active ledger session?
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={confirmLogout}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing out...
                    </>
                  ) : (
                    'Sign Out'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

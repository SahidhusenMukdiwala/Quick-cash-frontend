'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Smartphone,
  LockKeyhole
} from 'lucide-react';
import axiosServices from '@/utils/axios';

interface UserProfile {
  id: number;
  name: string;
  mobile: string;
  role: number;
  status: number;
}

interface AuthResponseData {
  user?: UserProfile;
  access_token?: string;
  refresh_token?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  errors: Array<{ message: string }>;
  result: {
    message?: string;
    data?: T;
  };
}

export default function LoginPage(): React.ReactElement {
  const router = useRouter();

  // Login Form States
  const [mobile, setMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotMobile, setForgotMobile] = useState<string>('');
  const [forgotPasswordState, setForgotPasswordState] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState<boolean>(false);

  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');

  // Main UI Feedback State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Redirect to dashboard if session token already exists
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Derived validation states
  const isLoginFormFilled = mobile.trim().length === 10 && password.trim().length >= 1;

  const isForgotFormFilled =
    forgotMobile.trim().length === 10 &&
    forgotPasswordState.trim().length >= 6 &&
    forgotConfirmPassword.trim().length >= 6;

  const isPasswordMismatch =
    forgotConfirmPassword.length > 0 && forgotPasswordState !== forgotConfirmPassword;

  // Handle Login Submit using axiosServices
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^[0-9]{10}$/.test(mobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosServices.post<ApiResponse<AuthResponseData>>('auth/login', {
        mobile: mobile.trim(),
        password
      });

      const resBody = response.data;

      if (!resBody.success) {
        const errorText = resBody.errors?.map((e) => e.message).join('. ') || 'Login failed.';
        throw new Error(errorText);
      }

      const resultObj = resBody.result;

      if (resultObj?.data?.user) {
        localStorage.setItem('user_profile', JSON.stringify(resultObj.data.user));
      }

      if (resultObj?.data?.access_token) {
        localStorage.setItem('access_token', resultObj.data.access_token);
      }
      if (resultObj?.data?.refresh_token) {
        localStorage.setItem('refresh_token', resultObj.data.refresh_token);
      }

      // Immediately redirect to dashboard without displaying green success alert card
      router.push('/dashboard');
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      const apiErrorMessage =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.map((e: any) => e.message || String(e)).join('. ')
          : err.message || 'Failed to connect to authentication server';
      setErrorMsg(apiErrorMessage);
      setLoading(false);
    }
  };

  // Handle Forgot Password Submit using axiosServices (Checking Mobile Number)
  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!/^[0-9]{10}$/.test(forgotMobile)) {
      setForgotError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (forgotPasswordState.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (forgotPasswordState !== forgotConfirmPassword) {
      setForgotError('Password and Confirm Password do not match.');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await axiosServices.post<ApiResponse>('auth/forgot-password', {
        mobile: forgotMobile.trim(),
        password: forgotPasswordState,
        confirm_password: forgotConfirmPassword
      });

      const resBody = response.data;

      if (!resBody.success) {
        const errorText = resBody.errors?.map((e) => e.message).join('. ') || 'Password update failed.';
        throw new Error(errorText);
      }

      const resultObj = resBody.result;
      const successMessage = resultObj?.message || 'Password updated successfully! You can now log in.';

      setForgotSuccess(successMessage);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotMobile('');
        setForgotPasswordState('');
        setForgotConfirmPassword('');
        setShowForgotPassword(false);
        setShowForgotConfirmPassword(false);
        setForgotSuccess('');
      }, 2000);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      const apiErrorMessage =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.map((e: any) => e.message || String(e)).join('. ')
          : err.message || 'Failed to update password.';
      setForgotError(apiErrorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Centered Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10 transition-all">
        {/* Top Logo & App Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* QuickCash Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#002B2A] border-2 border-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-900/10 mb-4 transition-transform hover:scale-105">
            <Building2 className="w-8 h-8 text-[#10B981]" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            QuickCash Ledger
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Accounting &amp; Management System
          </p>
        </div>

        {/* Error Alert Only */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Mobile Number Input */}
          <div>
            <label htmlFor="mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="text"
              maxLength={10}
              disabled={loading}
              value={mobile}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMobile(e.target.value.replace(/\D/g, ''))
              }
              placeholder="Enter your mobile number"
              className="w-full px-4 py-3 bg-[#f1f3f6] border border-transparent rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsForgotModalOpen(true);
                  setForgotError('');
                  setForgotSuccess('');
                  if (mobile) setForgotMobile(mobile);
                }}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-4 pr-11 py-3 bg-[#f1f3f6] border border-transparent rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 font-normal">
              Password must be at least 6 characters long.
            </p>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !isLoginFormFilled}
            className="w-full py-3.5 px-4 bg-[#1B64F2] hover:bg-[#1553d1] active:bg-[#1246b3] text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              disabled={forgotLoading}
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-3">
                <LockKeyhole className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered mobile number to update your password.
              </p>
            </div>

            {forgotError && (
              <div className="flex items-start gap-2.5 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>{forgotError}</div>
              </div>
            )}

            {forgotSuccess && (
              <div className="flex items-start gap-2.5 p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>{forgotSuccess}</div>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={forgotLoading}
                    value={forgotMobile}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForgotMobile(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#f1f3f6] border border-transparent rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotPassword ? 'text' : 'password'}
                    disabled={forgotLoading}
                    value={forgotPasswordState}
                    onChange={(e) => setForgotPasswordState(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="w-full pl-3 pr-10 py-2.5 bg-[#f1f3f6] border border-transparent rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    disabled={forgotLoading}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full pl-3 pr-10 py-2.5 bg-[#f1f3f6] border rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isPasswordMismatch
                        ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                        : 'border-transparent focus:border-blue-500'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isPasswordMismatch && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 animate-in fade-in flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Password and Confirm Password do not match.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || !isForgotFormFilled || isPasswordMismatch}
                  className="px-5 py-2.5 bg-[#1B64F2] hover:bg-[#1553d1] text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

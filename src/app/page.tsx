'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
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

  // Derived validation state
  const isLoginFormFilled = mobile.trim().length === 10 && password.trim().length >= 1;

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

      // Immediately redirect to dashboard
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
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>

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
    </div>
  );
}

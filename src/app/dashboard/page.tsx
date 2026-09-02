'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Search,
  LogOut,
  Plus,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Menu,
  User,
  Eye,
  EyeOff,
  ChevronDown,
  Keyboard,
  Command
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
}

interface TransactionItem {
  id: number;
  type: number; // 1 = Cash In, 2 = Cash Out
  paid_to: string | null;
  amount: number;
  payment_mode: number; // 1 = Cash, 2 = Online/UPI, 3 = Bank Transfer, 4 = Cheque
  remark: string | null;
  transaction_date: string;
  createdAt: string;
  updatedAt: string;
}

interface SummaryData {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
}

interface PaginationData {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  errors: Array<{ message: string }>;
  result: {
    message?: string;
    data?: T;
  };
}

export default function DashboardPage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Authentication & User Data State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalCashIn: 0,
    totalCashOut: 0,
    netBalance: 0
  });
  const [pagination, setPagination] = useState<PaginationData>({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20
  });
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  // Filter & Navigation States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Input & Select Refs for Keyboard Navigation Shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modeSelectRef = useRef<HTMLSelectElement>(null);

  // Entry Modal (Create / Edit) State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [formData, setFormData] = useState({
    type: 1, // 1 = Cash In, 2 = Cash Out
    paid_to: '',
    amount: '',
    payment_mode: 1, // 1 = Cash, 2 = Online/UPI, 3 = Bank Transfer, 4 = Cheque
    transaction_date: new Date().toISOString().split('T')[0],
    remark: ''
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

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

  // Fetch Transactions API
  const fetchTransactions = useCallback(async () => {
    setTableLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20
      };
      if (typeFilter) params.type = typeFilter;
      if (paymentModeFilter) params.payment_mode = paymentModeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await axiosServices.get<
        ApiResponse<{
          transactions: TransactionItem[];
          summary: SummaryData;
          pagination: PaginationData;
        }>
      >('transactions/lists', { params });

      const resData = response.data?.result?.data;
      if (resData) {
        setTransactions(resData.transactions || []);
        if (resData.summary) setSummary(resData.summary);
        if (resData.pagination) setPagination(resData.pagination);
      }
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch transactions', err);
      }
    } finally {
      setTableLoading(false);
    }
  }, [page, typeFilter, paymentModeFilter, searchQuery]);

  // Check Session & Profile
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');

    if (!token) {
      router.replace('/');
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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
          localStorage.setItem('user_profile', JSON.stringify(profile));
        }
      })
      .catch(() => {
        // Handled by 401 interceptor
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Keep profile form fields synced with user profile state
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileMobile(user.mobile || '');
    }
  }, [user]);

  // Trigger transaction list fetch on filter/page change
  useEffect(() => {
    if (!loading) {
      fetchTransactions();
    }
  }, [fetchTransactions, loading]);

  // Open Create Modal
  const handleOpenCreateModal = useCallback(() => {
    setEditingTransaction(null);
    setFormData({
      type: 1,
      paid_to: '',
      amount: '',
      payment_mode: 1,
      transaction_date: new Date().toISOString().split('T')[0],
      remark: ''
    });
    setFormError('');
    setIsEntryModalOpen(true);
  }, []);

  // Open Edit Modal
  const handleOpenEditModal = useCallback((tx: TransactionItem) => {
    setEditingTransaction(tx);
    // Format date string YYYY-MM-DD
    const formattedDate = tx.transaction_date ? tx.transaction_date.substring(0, 10) : '';
    setFormData({
      type: tx.type || 1,
      paid_to: tx.paid_to || '',
      amount: String(tx.amount),
      payment_mode: tx.payment_mode || 1,
      transaction_date: formattedDate,
      remark: tx.remark || ''
    });
    setFormError('');
    setIsEntryModalOpen(true);
  }, []);

  // Handle Form Submit (Create or Update)
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseInt(formData.amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    if (!formData.transaction_date) {
      setFormError('Please select a valid transaction date.');
      return;
    }

    setFormLoading(true);

    const payload = {
      type: Number(formData.type),
      paid_to: formData.paid_to.trim() || null,
      amount: numAmount,
      payment_mode: Number(formData.payment_mode),
      transaction_date: formData.transaction_date,
      remark: formData.remark.trim() || null
    };

    try {
      if (editingTransaction) {
        // Update Transaction
        await axiosServices.patch(`transactions/update/${editingTransaction.id}`, payload);
      } else {
        // Create Transaction
        await axiosServices.post('transactions/create', payload);
      }

      setIsEntryModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      const msg = Array.isArray(apiErrors)
        ? apiErrors.map((e: any) => e.message).join('. ')
        : err.message || 'Failed to save transaction.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = useCallback((tx: TransactionItem) => {
    setDeletingTransaction(tx);
    setIsDeleteModalOpen(true);
  }, []);

  // Confirm Delete Transaction
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTransaction) return;

    setDeleteLoading(true);
    try {
      await axiosServices.delete(`transactions/delete/${deletingTransaction.id}`);
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      console.error('Failed to delete transaction', err);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTransaction, fetchTransactions]);

  // Keep selected index within bounds when transactions change
  useEffect(() => {
    if (transactions.length > 0 && selectedIndex >= transactions.length) {
      setSelectedIndex(transactions.length - 1);
    }
  }, [transactions, selectedIndex]);

  // Global Keyboard Shortcuts Event Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      let inInput = false;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        inInput =
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable;
      }

      const key = e.key.toLowerCase();
      const isAlt = e.altKey;

      // 1. ESCAPE KEY -> Close active modals
      if (e.key === 'Escape') {
        if (isEntryModalOpen) setIsEntryModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        if (isLogoutModalOpen) setIsLogoutModalOpen(false);
        if (isHelpModalOpen) setIsHelpModalOpen(false);
        return;
      }

      // 2. KEYBOARD HELP: Alt + H or Shift + ? (outside text fields)
      if ((isAlt && key === 'h') || (!inInput && e.key === '?')) {
        e.preventDefault();
        setIsHelpModalOpen((prev) => !prev);
        return;
      }

      // 3. ALT + N -> Open New Entry modal (default Cash In) OR Toggle Cash In / Cash Out (if modal open)
      if (isAlt && key === 'n') {
        e.preventDefault();
        if (!isEntryModalOpen) {
          handleOpenCreateModal();
        } else {
          setFormData((prev) => ({ ...prev, type: prev.type === 1 ? 2 : 1 }));
        }
        return;
      }

      // 4. CASH IN / CASH OUT TAB SWITCHING: Alt + 1 (Cash In) & Alt + 2 (Cash Out)
      const code = e.code;
      const isSelectCashIn = isAlt && (key === '1' || key === 'i' || code === 'Digit1' || code === 'Numpad1');
      const isSelectCashOut = isAlt && (key === '2' || key === 'o' || code === 'Digit2' || code === 'Numpad2');
      const isSelectAll = isAlt && (key === '0' || key === 'a' || code === 'Digit0' || code === 'Numpad0');

      if (isSelectCashIn) {
        e.preventDefault();
        if (isEntryModalOpen) {
          setFormData((prev) => ({ ...prev, type: 1 }));
        } else {
          setTypeFilter('1');
          setPage(1);
        }
        return;
      }

      if (isSelectCashOut) {
        e.preventDefault();
        if (isEntryModalOpen) {
          setFormData((prev) => ({ ...prev, type: 2 }));
        } else {
          setTypeFilter('2');
          setPage(1);
        }
        return;
      }

      if (isSelectAll && !isEntryModalOpen) {
        e.preventDefault();
        setTypeFilter('');
        setPage(1);
        return;
      }

      // 5. DELETE CONFIRMATION MODAL: Enter key to confirm deletion
      if (isDeleteModalOpen) {
        if (e.key === 'Enter' && !deleteLoading) {
          e.preventDefault();
          handleConfirmDelete();
        }
        return;
      }

      // If any other modal is open, ignore ledger navigation/edit/delete shortcuts
      if (isLogoutModalOpen || isHelpModalOpen) {
        return;
      }

      // 6. ARROW KEYS: ArrowUp / ArrowDown for table row selection
      if (!inInput && transactions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, transactions.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
      }

      // 7. ALT + E -> Edit selected transaction
      if (isAlt && key === 'e') {
        e.preventDefault();
        if (transactions.length > 0 && selectedIndex >= 0 && selectedIndex < transactions.length) {
          handleOpenEditModal(transactions[selectedIndex]);
        }
        return;
      }

      // 8. ALT + D or DELETE KEY (outside text fields) -> Delete selected transaction
      if ((isAlt && key === 'd') || (!inInput && e.key === 'Delete')) {
        e.preventDefault();
        if (transactions.length > 0 && selectedIndex >= 0 && selectedIndex < transactions.length) {
          handleOpenDeleteModal(transactions[selectedIndex]);
        }
        return;
      }

      // 9. ALT + S -> Jump to Search Input Field
      if (isAlt && key === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 10. ALT + M -> Jump to Payment Mode Dropdown Filter
      if (isAlt && key === 'm') {
        e.preventDefault();
        modeSelectRef.current?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEntryModalOpen,
    isDeleteModalOpen,
    isLogoutModalOpen,
    isHelpModalOpen,
    transactions,
    selectedIndex,
    deleteLoading,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDeleteModal,
    handleConfirmDelete
  ]);

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

  // Helper for Payment Mode Labels (1 = Cash, 2 = Cheque, 3 = Online)
  const getPaymentModeBadge = (mode: number) => {
    switch (mode) {
      case 1:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/60">
            Cash
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200/60">
            Cheque
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200/60">
            Online
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700">
            Other
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden selection:bg-emerald-500 selection:text-white font-sans relative">
      {/* MOBILE DRAWER OVERLAY (Tablets & Phones) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex md:hidden animate-in fade-in duration-150">
          <div className="w-64 bg-[#002B2A] text-slate-300 flex flex-col h-full shadow-2xl border-r border-emerald-950/60">
            {/* Mobile Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-emerald-900/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <h1 className="font-black text-white text-base tracking-tight leading-none">
                  QuickCash
                </h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
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
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  router.push('/profile');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
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
                    {user?.mobile || '9876543210'}
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
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
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
            onClick={() => { }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <UserCheck className="w-4 h-4 text-slate-400" />
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
                {user?.mobile || '9876543210'}
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
              Dashboard Overview
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Session Active
            </span>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Keyboard Shortcuts Trigger Button */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              title="Keyboard Shortcuts (Alt + H)"
              className="px-2.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0 border border-slate-200/80"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-600" />
              {/* <span className="hidden sm:inline">Shortcuts</span> */}
              {/* <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500 shadow-2xs">
                Alt+H
              </kbd> */}
            </button>

            {/* New Entry Action Button */}
            <button
              onClick={handleOpenCreateModal}
              title="New Transaction Entry (Alt + N)"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1B64F2] hover:bg-[#1553d1] active:bg-[#1246b3] text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </header>

        {/* Inner Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto flex-1">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#002B2A] to-[#0A4D4A] rounded-2xl p-6 text-white shadow-md shadow-emerald-950/10 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                Financial Ledger Summary
              </span>
              <h3 className="text-xl font-extrabold mt-1 tracking-tight">
                Welcome back, {user?.name || 'Admin'}! 👋
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg font-normal leading-relaxed">
                Manage your real-time Cash In and Cash Out entries. All database transactions are synchronized live.
              </p>
            </div>
            <div className="relative z-10 hidden sm:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-right">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  System Security
                </p>
                <p className="text-xs font-bold text-white flex items-center justify-end gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Session Verified
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1: Total Cash In */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Cash In
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  ₹ {summary.totalCashIn.toLocaleString('en-IN')}
                </h4>
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Receivables recorded
                </p>
              </div>
            </div>

            {/* Stat Card 2: Total Cash Out */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Cash Out
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  ₹ {summary.totalCashOut.toLocaleString('en-IN')}
                </h4>
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> Payables recorded
                </p>
              </div>
            </div>

            {/* Stat Card 3: Net Cash Balance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Net Balance
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                    }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h4
                  className={`text-2xl font-black tracking-tight ${summary.netBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
                    }`}
                >
                  ₹ {summary.netBalance.toLocaleString('en-IN')}
                </h4>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  Inflow minus outflow
                </p>
              </div>
            </div>

            {/* Stat Card 4: Total Records Count */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Total Entries
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  {pagination.totalRecords}
                </h4>
                <p className="text-[11px] font-bold text-purple-600 mt-1">
                  Active entries in database
                </p>
              </div>
            </div>
          </div>

          {/* Transactions Table & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header Controls & Filters */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                {/* <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                  Ledger Transactions
                </h3> */}
                {/* Search Bar placed instead of text */}
                <div className="relative mt-0.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search party or remark..."
                    title="Search party or remark (Alt + S)"
                    className="w-full sm:w-64 pl-9 pr-4 py-1.5 bg-slate-100/90 border border-transparent rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition font-medium"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Type Filter */}
                <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setTypeFilter('');
                      setPage(1);
                    }}
                    title="All Transactions (Alt + 0)"
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${typeFilter === ''
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter('1');
                      setPage(1);
                    }}
                    title="Cash In Filter (Alt + 1)"
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${typeFilter === '1'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Cash In
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter('2');
                      setPage(1);
                    }}
                    title="Cash Out Filter (Alt + 2)"
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${typeFilter === '2'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Cash Out
                  </button>
                </div>

                {/* Payment Mode Dropdown Filter */}
                <select
                  ref={modeSelectRef}
                  value={paymentModeFilter}
                  onChange={(e) => {
                    setPaymentModeFilter(e.target.value);
                    setPage(1);
                  }}
                  title="Filter by Payment Mode (Alt + M)"
                  className="px-3 py-1.5 bg-slate-100/90 border border-transparent rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">All Modes</option>
                  <option value="1">Cash</option>
                  <option value="2">Cheque</option>
                  <option value="3">Online</option>
                </select>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto min-h-[250px] relative">
              {tableLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                </div>
              )}

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Paid To</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Payment Mode</th>
                    <th className="py-3.5 px-5 text-nowrap">Remark</th>
                    <th className="py-3.5 px-5 text-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                        No transactions found. Click <strong>"New Entry"</strong> to add a transaction.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedIndex(idx)}
                          className={`transition cursor-pointer ${isSelected
                              ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500 font-semibold'
                              : 'hover:bg-slate-50/80'
                            }`}
                        >
                          <td className="py-3.5 px-5 font-bold text-slate-400">
                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              )}
                              #{tx.id}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-slate-600">
                            {tx.transaction_date ? tx.transaction_date.substring(0, 10) : '-'}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {tx.paid_to || <span className="text-slate-400 font-normal">N/A</span>}
                          </td>
                          <td className="py-3.5 px-5">
                            {tx.type === 1 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Cash In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-lg">
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> Cash Out
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 font-black text-slate-800">
                            ₹ {tx.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5">{getPaymentModeBadge(tx.payment_mode)}</td>
                          <td
                            className="py-3.5 px-5 text-slate-500 max-w-[180px] sm:max-w-[220px] truncate"
                            title={tx.remark || undefined}
                          >
                            {tx.remark || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIndex(idx);
                                  handleOpenEditModal(tx);
                                }}
                                title="Edit Entry (Alt + E)"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIndex(idx);
                                  handleOpenDeleteModal(tx);
                                }}
                                title="Delete Entry (Alt + D / Delete)"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {pagination.totalPages > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing page <strong>{pagination.currentPage}</strong> of{' '}
                  <strong>{pagination.totalPages}</strong>
                  {/* ({pagination.totalRecords} total entries) */}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1 || tableLoading}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="font-extrabold text-slate-800 px-2">{page}</span>
                  <button
                    disabled={page >= pagination.totalPages || tableLoading}
                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>

      {/* CREATE / EDIT TRANSACTION MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction Entry'}
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Record a financial cash entry into the accounting ledger.
                </p>
              </div>
              <button
                disabled={formLoading}
                onClick={() => setIsEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitEntry} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>{formError}</div>
                </div>
              )}

              {/* Segmented Type Toggle (Cash In vs Cash Out) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Transaction Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 1 })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${formData.type === 1
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Cash In (Received)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 2 })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${formData.type === 2
                      ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> Cash Out (Paid)
                  </button>
                </div>
              </div>

              {/* Paid To / Party Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Party Name / Account
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">Max 45 chars</span>
                </div>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    maxLength={45}
                    disabled={formLoading}
                    value={formData.paid_to}
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    placeholder="e.g. Aarav Sharma or Vendor Name"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Amount & Payment Mode Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs text-slate-500 font-bold absolute left-3.5 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      disabled={formLoading}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      placeholder="5000"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-semibold transition shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Payment Mode Modern Select Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.payment_mode}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_mode: Number(e.target.value) })
                      }
                      disabled={formLoading}
                      className="w-full appearance-none pl-3.5 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 cursor-pointer transition shadow-2xs"
                    >
                      <option value={1}>Cash</option>
                      <option value={2}>Cheque</option>
                      <option value={3}>Online</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    disabled={formLoading}
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Remark / Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Remark / Notes
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {formData.remark.length}/200
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  disabled={formLoading}
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="Optional settlement details or voucher reference..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium resize-none transition shadow-2xs"
                />
              </div>

              {/* Modal Action Buttons Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#1B64F2] hover:bg-[#1553d1] active:bg-[#1246b3] text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingTransaction ? (
                    'Update Entry'
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center border border-slate-100">
            <button
              disabled={deleteLoading}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Delete Transaction
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
              Are you sure you want to delete transaction entry <strong>#{deletingTransaction.id}</strong> (₹
              {deletingTransaction.amount.toLocaleString('en-IN')})?
            </p>

            {/* <p className="text-[11px] text-slate-400 mt-3 font-normal">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600 font-semibold">Enter</kbd> to confirm or <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600 font-semibold">Esc</kbd> to cancel
            </p> */}

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center border border-slate-100">
            <button
              disabled={loggingOut}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
              <LogOut className="w-6 h-6 ml-0.5" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Confirm Logout</h3>
            <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
              Are you sure you want to log out of QuickCash Ledger?
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                No
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={confirmLogout}
                className="w-1/2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging out...
                  </>
                ) : (
                  'Yes, Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    Keyboard Shortcuts Reference
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Quickly navigate and manage transactions using hotkeys.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Shortcuts Table */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 px-3">Action Description</th>
                    <th className="pb-2.5 px-3 text-right">Shortcut Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {/* Category 1: Entry Actions */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="py-2 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Transaction Entry Actions
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      Open New Entry <span className="font-normal text-slate-400 text-[11px]">(Default Cash In)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Alt + N
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      Switch Table Filter <span className="font-normal text-slate-400 text-[11px]">(Cash In / Out / All)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Alt + 1 / 2 / 0
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Focus Search Field</td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Alt + S
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Focus Payment Mode Filter</td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Alt + M
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      Select Cash In / Cash Out <span className="font-normal text-slate-400 text-[11px]">(In Entry Form)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          Alt + 1 / 2
                        </kbd>
                        <span className="text-slate-400 font-bold text-[10px]">OR</span>
                        <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          Alt + I / O
                        </kbd>
                      </div>
                    </td>
                  </tr>

                  {/* Category 2: Table Navigation */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="py-2 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Ledger Table Navigation & Actions
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Navigate / Highlight Row</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          ↑
                        </kbd>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          ↓
                        </kbd>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Edit Highlighted Transaction</td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Alt + E
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Delete Highlighted Transaction</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          Alt + D
                        </kbd>
                        <span className="text-slate-400 font-bold text-[10px]">OR</span>
                        <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                          Delete
                        </kbd>
                      </div>
                    </td>
                  </tr>

                  {/* Category 3: General Controls */}
                  <tr className="bg-slate-50/70">
                    <td colSpan={2} className="py-2 px-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      General Controls
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Confirm Action / Delete</td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Enter
                      </kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800">Close Any Active Modal</td>
                    <td className="py-3 px-3 text-right">
                      <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 shadow-2xs rounded-lg font-mono text-xs font-bold text-slate-800">
                        Esc
                      </kbd>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 text-right">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

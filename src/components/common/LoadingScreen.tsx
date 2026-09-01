'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = 'Loading QuickCash Ledger...'
}: LoadingScreenProps): React.ReactElement {
  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center font-sans select-none">
      <Loader2 className="w-9 h-9 animate-spin text-emerald-600 mb-3" />
      <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
        {message}
      </p>
    </div>
  );
}

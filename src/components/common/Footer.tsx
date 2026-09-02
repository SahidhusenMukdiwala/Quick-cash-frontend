'use client';

import React from 'react';

export default function Footer(): React.ReactElement {
  return (
    <footer className="w-full py-3.5 px-4 sm:px-6 md:px-8 bg-white/95 backdrop-blur-md border-t border-slate-200/80 mt-auto shrink-0 sticky bottom-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium text-slate-500">
        <div>
          © {new Date().getFullYear()} <span className="font-bold text-slate-700">QuickCash Ledger</span>. All rights reserved.
        </div>
        <div>
          Created by{' '}
          <a
            href="https://portfolio-red-rho-63.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
          >
            Sahidhusen Mukdiwala
          </a>
        </div>
      </div>
    </footer>
  );
}

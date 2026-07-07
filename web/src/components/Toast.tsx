'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // Auto-dismiss after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass =
    type === 'success'
      ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400'
      : type === 'error'
      ? 'bg-rose-955 border-rose-500/30 text-rose-400'
      : 'bg-slate-900 border-amber-500/30 text-amber-400';

  const iconName =
    type === 'success'
      ? 'check_circle'
      : type === 'error'
      ? 'error'
      : 'info';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 transform translate-y-0 ${bgClass}`}>
      <span className="material-symbols-outlined text-lg">{iconName}</span>
      <span className="text-xs font-semibold tracking-wide font-sans">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

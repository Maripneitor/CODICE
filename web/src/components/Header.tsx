'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [userEmail, setUserEmail] = useState('mariomoguel05@gmail.com');

  useEffect(() => {
    // Read and decode auth_token from cookie client-side
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return '';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    };

    const decodeJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const token = getCookie('auth_token');
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.email) {
        setUserEmail(payload.email);
      }
    }
  }, []);

  const getInitials = (email: string) => {
    if (!email) return 'AD';
    // Handle emails like mariomoguel05@gmail.com
    const namePart = email.split('@')[0];
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const initials = getInitials(userEmail);
  const displayName = userEmail === 'mariomoguel05@gmail.com' 
    ? 'Mario Efraín Moguel' 
    : userEmail.split('@')[0];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 text-slate-300 relative">
      <div className="flex items-center gap-4">
        {title && <h1 className="font-serif text-xl font-bold text-slate-100">{title}</h1>}
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-4 z-50">
              <p className="text-xs font-mono text-slate-400">No tienes notificaciones pendientes</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center border border-amber-600">
              {initials}
            </div>
            <div className="hidden md:block text-sm text-left">
              <p className="font-medium text-slate-200">{displayName}</p>
              <p className="text-xs text-slate-400">Conservador Jefe</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

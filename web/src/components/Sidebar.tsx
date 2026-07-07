'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
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
      if (payload && payload.role) {
        setUserRole(payload.role.toLowerCase());
      }
    }
  }, []);

  const allMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Catálogo', href: '/catalog', icon: 'menu_book' },
    { name: 'Almacenes', href: '/warehouses', icon: 'inventory_2' },
    { name: 'Salidas (Préstamos)', href: '/operations/loans', icon: 'shopping_cart_checkout' },
    { name: 'Entradas (Devoluciones)', href: '/operations/returns', icon: 'assignment_return' },
    { name: 'Mis Resguardos', href: '/my-loans', icon: 'assignment_ind' },
    { name: 'Diccionarios', href: '/dictionaries', icon: 'book' },
    { name: 'Generador QR', href: '/qr-generator', icon: 'qr_code_scanner' },
    { name: 'Reportes', href: '/reports', icon: 'analytics' },
    { name: 'Usuarios', href: '/users', icon: 'group' },
    { name: 'Configuración', href: '/settings', icon: 'settings' },
  ];

  // Restrict routes based on role
  const menuItems = allMenuItems.filter((item) => {
    const role = userRole || 'viewer';
    if (role === 'admin') {
      return item.href !== '/my-loans';
    }
    if (role === 'restorer' || role === 'operator') {
      return ['/dashboard', '/catalog', '/warehouses', '/operations/loans', '/operations/returns'].includes(item.href);
    }
    if (role === 'viewer' || role === 'technician') {
      return ['/dashboard', '/catalog', '/warehouses', '/my-loans'].includes(item.href);
    }
    return true;
  });

  const handleLogout = async () => {
    // Clear the auth and refresh cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Notify other tabs
    const channel = new BroadcastChannel('codice_session_channel');
    channel.postMessage('logout');
    channel.close();

    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
        <span className="font-serif font-bold text-2xl tracking-wider text-amber-500">CÓDICE</span>
        <span className="material-symbols-outlined text-amber-500">description</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:ring-2 focus:ring-amber-500/50 outline-none ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-500 font-semibold border-l-2 border-amber-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:ring-2 focus:ring-red-500/50 outline-none text-left font-medium"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';

export default function DashboardPage() {
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
  const stats = [
    {
      title: 'Total Herramientas en Stock',
      value: '12,450',
      icon: 'category',
      change: '+145 esta semana',
      changeColor: 'text-green-500',
    },
    {
      title: 'En Mantenimiento',
      value: '342',
      icon: 'construction',
      change: 'En talleres de servicio activos',
      changeColor: 'text-amber-500',
    },
    {
      title: 'Alertas Sync',
      value: '12',
      icon: 'sync_problem',
      change: 'Requieren revisión manual',
      changeColor: 'text-red-500',
    },
    {
      title: 'Almacenes Activos',
      value: '8',
      icon: 'warehouse',
      change: 'Control de inventario y resguardos',
      changeColor: 'text-slate-400',
    },
  ];

  const recentMovements = [
    {
      id: 'HER-2026-045',
      name: 'Martillo Demoledor',
      action: 'Préstamo',
      actionColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      location: 'a Obra B',
      user: 'M. García',
      time: 'Hoy, 10:45 AM',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0OIpBM29awZMJhLnFzSSZs4C3w27s0WoQeOM5MGTleYEqlzm_n2d2HMt9WZgFqfsNh8qbKLNqjGPSBH_Mnj_7vmq9y-RuzVW8-0ZuOeK44LJYW8AFlWLyZinbQHjJS3thOGf-TSylQKJO_qGTSQnTIBzfFRi_ePAkxFrgpEyMOIjv_wfz_cfbYY-F1WMhuHOoEjS2zxWSCdvESgVEc_OWC--7fefrotsETLSEnm_0SGQiqyE_fr8gEBMfQJkrifJeHY53kfSfRXI',
    },
    {
      id: 'HER-2026-112',
      name: 'Multímetro Digital',
      action: 'Alta de Herramienta',
      actionColor: 'bg-green-500/10 text-green-400 border border-green-500/20',
      location: 'Almacén Norte',
      user: 'L. Torres',
      time: 'Hoy, 09:12 AM',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWOYGl0DpcXusKKywaR9_h3GcYnX1cbYlDlFA0kasOM3b4Giqb5P3a1del9FT-csdQ_EmuRK2xkK4mblaR7JREiJORLd0OMPVW3Ywd7_dz8COEhoZUB3UTfw19hGvvdA97Z7DDYw_3ErGBhFvGK3a5wwcxWax5m3Qsz60xLf8r1X-1gXNc8N5XAWb7UvtZ1vF9-E2hjiu7Iw6ORmnGjgZ8-IHxMKniTw34mhN09DvLplLQaNf0xls5i-F8HQdr3k33R-OUINLBJQ',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Resumen General" />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Panel de Control</h2>
              <p className="text-sm text-slate-400 mt-1">Monitoreo en tiempo real del estado del inventario y logística de herramientas.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                      <h3 className="text-3xl font-serif font-bold text-slate-100 mt-2">{stat.value}</h3>
                    </div>
                    <div className="p-3 bg-slate-850 border border-slate-850 rounded-lg">
                      <span className="material-symbols-outlined text-amber-500">{stat.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Movements */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-serif text-lg font-bold text-slate-200">Últimos Movimientos</h3>
                  <Link href="/catalog" className="text-sm text-amber-500 hover:text-amber-400 transition-colors font-medium">
                    Ver todos
                  </Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID Herramienta</th>
                        <th className="px-6 py-4">Imagen</th>
                        <th className="px-6 py-4">Acción</th>
                        <th className="px-6 py-4">Responsable</th>
                        <th className="px-6 py-4">Fecha/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {recentMovements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-300">{mov.id}</td>
                          <td className="px-6 py-4">
                            <img
                              alt={mov.name}
                              className="w-10 h-10 rounded object-cover border border-slate-700 shadow-sm"
                              src={mov.img}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${mov.actionColor}`}>
                                {mov.action}
                              </span>
                              <span className="text-slate-400 text-xs">{mov.location}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-medium">{mov.user}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{mov.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-200 mb-4">Acciones Rápidas</h3>
                  <div className="space-y-3">
                    {userRole !== 'viewer' && (
                      <Link href="/catalog" className="w-full flex items-center justify-between p-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 hover:text-amber-500 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-amber-500">add_box</span>
                          <span className="text-sm font-medium">Registrar Herramienta Nueva</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </Link>
                    )}
                    
                    <Link href="/warehouses" className="w-full flex items-center justify-between p-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 hover:text-amber-500 transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">transfer_within_a_station</span>
                        <span className="text-sm font-medium">Registrar Préstamo / Traslado</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>

                    {userRole !== 'viewer' && (
                      <Link href="/qr-generator" className="w-full flex items-center justify-between p-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 hover:text-amber-500 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-amber-500">qr_code</span>
                          <span className="text-sm font-medium">Generar Código QR</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
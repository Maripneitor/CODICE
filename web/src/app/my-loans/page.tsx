'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface Tool {
  id: string;
  code: string;
  name: string;
  location: string;
  material: string;
  status: string;
  createdAt: string;
}

export default function MyLoansPage() {
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

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
    let email = '';
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.email) {
        setUserEmail(payload.email);
        email = payload.email;
      }
    }

    const fetchMyLoans = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Error al obtener resguardos.');
        const data = await response.json();

        // Filter where status is 'Prestado' and location contains technical email
        const filtered = data.data.filter(
          (a: Tool) => a.status === 'Prestado' && a.location.toLowerCase().includes(email.toLowerCase())
        );
        setMyTools(filtered);
      } catch (err: any) {
        toast.error('Error al cargar resguardos', { description: err.message });
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchMyLoans();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <Header title="Mis Resguardos Logísticos" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Mis Herramientas en Custodia</h2>
              <p className="text-sm text-slate-400 mt-1">
                Listado de activos bajo su resguardo directo para operaciones de campo.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-amber-500 text-3xl">progress_activity</span>
              </div>
            ) : myTools.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">assignment_turned_in</span>
                <p className="text-slate-400 text-sm">Usted no tiene ninguna herramienta bajo custodia activa.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Alerta de devolución pendiente simulada */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">warning</span>
                  <p className="text-xs">
                    Recuerde retornar sus herramientas en Excelente estado físico para mantener su resguardo limpio.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Material</th>
                        <th className="px-6 py-4">Estado Interno</th>
                        <th className="px-6 py-4">Asignación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {myTools.map((tool) => (
                        <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-350">{tool.code}</td>
                          <td className="px-6 py-4 font-semibold text-slate-200">{tool.name}</td>
                          <td className="px-6 py-4 text-slate-400">{tool.material}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {tool.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(tool.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

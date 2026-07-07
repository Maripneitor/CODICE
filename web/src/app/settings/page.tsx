'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useState } from 'react';

export default function SettingsPage() {
  const [syncInterval, setSyncInterval] = useState('15');
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Configuración" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Configuración Global</h2>
              <p className="text-sm text-slate-400 mt-1">Configuración técnica del monorrepo ERP, parámetros de sincronización y API local.</p>
            </div>

            <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-md space-y-6">
              <h3 className="font-serif text-lg font-bold text-slate-200">Parámetros del Sistema</h3>

              {saved && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Configuración guardada correctamente.</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">API Endpoint del Servidor</label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Intervalo de Sincronización Automática (minutos)</label>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="5">Cada 5 minutos</option>
                    <option value="15">Cada 15 minutos</option>
                    <option value="30">Cada 30 minutos</option>
                    <option value="60">Cada hora</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-955 font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
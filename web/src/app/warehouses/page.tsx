'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function WarehousesPage() {
  const warehouses = [
    {
      id: 'ALM-01',
      name: 'Almacén Principal',
      location: 'Sótano Sector Norte',
      cajasDisponibles: 120,
      artifactsCount: 412,
      status: 'Espacio Medio',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'ALM-02',
      name: 'Almacén B',
      location: 'Edificio Este',
      cajasDisponibles: 250,
      artifactsCount: 154,
      status: 'Espacio Disponible',
      statusColor: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
      id: 'ALM-03',
      name: 'Taller de Conservación A',
      location: 'Planta Alta',
      cajasDisponibles: 15,
      artifactsCount: 45,
      status: 'Capacidad Crítica',
      statusColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Almacenes y Custodia" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-100">Almacenes y Custodia</h2>
                <p className="text-sm text-slate-400 mt-1">Supervisión de almacenes de seguridad, herramientas resguardadas y cajas disponibles.</p>
              </div>
            </div>

            {/* Grid of Warehouses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((wh) => (
                <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-amber-500 font-semibold">{wh.id}</span>
                      <h3 className="font-serif text-lg font-bold text-slate-200 mt-1">{wh.name}</h3>
                      <p className="text-xs text-slate-400">{wh.location}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">Herramientas Almacenadas</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{wh.artifactsCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cajas Disponibles</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{wh.cajasDisponibles}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
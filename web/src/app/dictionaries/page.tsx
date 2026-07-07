'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DictionariesPage() {
  const materials = [
    { code: 'MAT-BRZ', name: 'Bronce', description: 'Aleación metálica de cobre y estaño.', count: 48 },
    { code: 'MAT-STN', name: 'Piedra', description: 'Material lítico natural de talla o escultura.', count: 112 },
    { code: 'MAT-CER', name: 'Cerámica', description: 'Arcilla modelada y cocida.', count: 231 },
    { code: 'MAT-GLD', name: 'Oro', description: 'Metal precioso de alta pureza.', count: 12 },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Diccionarios de Clasificación" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Diccionarios y Vocabularios</h2>
              <p className="text-sm text-slate-400 mt-1">Control de términos estandarizados para materiales y clasificación de herramientas industriales.</p>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Código Tesauro</th>
                    <th className="px-6 py-4">Nombre Estandarizado</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4">Total Elementos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {materials.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-350">{item.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-200">{item.name}</td>
                      <td className="px-6 py-4 text-slate-400">{item.description}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
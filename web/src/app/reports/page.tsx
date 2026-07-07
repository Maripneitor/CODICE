'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface StockReport {
  totalStock: number;
  available: number;
  loaned: number;
  maintenance: number;
}

interface UsageItem {
  code: string;
  toolName: string;
  count: number;
  totalMinutes: number;
}

interface DamagedItem {
  id: string;
  code: string;
  name: string;
  tecnico: string;
  fechaSalida: string;
}

interface ReportsData {
  stockReport: StockReport;
  usageReport: UsageItem[];
  damagedReport: DamagedItem[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'stock' | 'usage' | 'damaged'>('stock');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts/reports/data`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Acceso denegado o error del servidor.');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      toast.error('Error al cargar métricas', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (type: string) => {
    setDownloading(type);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts/reports/download-pdf?type=${type}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Error al generar el PDF. Verifique permisos de administrador.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${type}-${new Date().getFullYear()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF Descargado', { description: `El reporte de ${type} ha sido generado exitosamente.` });
    } catch (err: any) {
      toast.error('Error de Descarga', { description: err.message });
    } finally {
      setDownloading(null);
    }
  };

  const reportTypes = [
    {
      key: 'stock' as const,
      label: 'Stock Actual',
      icon: 'inventory_2',
      description: 'Inventario disponible vs. herramientas en préstamo activo.',
    },
    {
      key: 'usage' as const,
      label: 'Uso y Rotación',
      icon: 'trending_up',
      description: 'Herramientas más solicitadas, técnicos con mayor acumulación.',
    },
    {
      key: 'damaged' as const,
      label: 'Pérdidas y Daños',
      icon: 'report_problem',
      description: 'Activos dañados o retenidos más allá de la fecha límite.',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <Header title="Centro de Reportes y Auditoría" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Reportes Analíticos</h2>
              <p className="text-sm text-slate-400 mt-1">
                Panel exclusivo de administración para generar informes oficiales de auditoría interna en PDF.
              </p>
            </div>

            {/* KPI Snapshot Cards */}
            {loading ? (
              <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-amber-500 text-3xl">progress_activity</span>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Herramientas Totales', value: data.stockReport.totalStock, icon: 'construction', color: 'text-slate-100' },
                    { label: 'Disponibles', value: data.stockReport.available, icon: 'check_circle', color: 'text-emerald-400' },
                    { label: 'En Préstamo', value: data.stockReport.loaned, icon: 'shopping_cart_checkout', color: 'text-amber-400' },
                    { label: 'En Mantenimiento', value: data.stockReport.maintenance, icon: 'build', color: 'text-red-400' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{kpi.label}</span>
                      </div>
                      <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Report Type Selector */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200">Seleccionar Tipo de Reporte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportTypes.map((rt) => (
                      <button
                        key={rt.key}
                        onClick={() => setSelectedType(rt.key)}
                        className={`p-5 rounded-xl border text-left transition-all ${
                          selectedType === rt.key
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.1)]'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`material-symbols-outlined ${selectedType === rt.key ? 'text-amber-500' : 'text-slate-500'}`}>
                            {rt.icon}
                          </span>
                          <span className={`font-semibold text-sm ${selectedType === rt.key ? 'text-amber-400' : 'text-slate-200'}`}>
                            {rt.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{rt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                      Vista Previa: {reportTypes.find((r) => r.key === selectedType)?.label}
                    </h4>
                    <button
                      onClick={() => handleDownloadPdf(selectedType)}
                      disabled={!!downloading}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] disabled:opacity-50 flex items-center gap-2"
                    >
                      {downloading === selectedType ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                          Generando PDF...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                          Descargar PDF Oficial
                        </>
                      )}
                    </button>
                  </div>

                  {selectedType === 'stock' && (
                    <div className="p-6 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                          <p className="text-xs text-emerald-400 font-semibold uppercase">En Almacén Central</p>
                          <p className="text-2xl font-bold text-emerald-400 mt-1">{data.stockReport.available}</p>
                        </div>
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <p className="text-xs text-amber-400 font-semibold uppercase">Fuera en Obra</p>
                          <p className="text-2xl font-bold text-amber-400 mt-1">{data.stockReport.loaned}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedType === 'usage' && (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Código</th>
                          <th className="px-6 py-3">Herramienta</th>
                          <th className="px-6 py-3">Solicitudes</th>
                          <th className="px-6 py-3">Uso Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data.usageReport.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Sin datos de uso registrados.</td></tr>
                        ) : (
                          data.usageReport.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-6 py-3 font-mono text-xs text-slate-350">{item.code}</td>
                              <td className="px-6 py-3 font-semibold text-slate-200">{item.toolName}</td>
                              <td className="px-6 py-3 text-amber-400 font-bold">{item.count}</td>
                              <td className="px-6 py-3 text-slate-400">{item.totalMinutes} min</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {selectedType === 'damaged' && (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Código</th>
                          <th className="px-6 py-3">Herramienta</th>
                          <th className="px-6 py-3">Custodio Responsable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {data.damagedReport.length === 0 ? (
                          <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No se detectaron daños ni pérdidas.</td></tr>
                        ) : (
                          data.damagedReport.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-6 py-3 font-mono text-xs text-slate-350">{item.code}</td>
                              <td className="px-6 py-3 font-semibold text-slate-200">{item.name}</td>
                              <td className="px-6 py-3 text-red-400 font-semibold">{item.tecnico}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">lock</span>
                <p className="text-slate-400 text-sm">Sin acceso a métricas. Verifique permisos de administrador.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

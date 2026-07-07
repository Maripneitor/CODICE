'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface Tool {
  id: string;
  code: string;
  name: string;
  status: string;
  location: string;
}

export default function ReturnsPage() {
  const [qrInput, setQrInput] = useState('');
  const [scannedTool, setScannedTool] = useState<Tool | null>(null);
  const [statusCheck, setStatusCheck] = useState<'Excelente' | 'Desgastado' | 'Dañado / Requiere Mantenimiento'>('Excelente');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScanTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Error al obtener el catálogo.');
      const data = await response.json();

      const tool = data.data.find(
        (a: any) => a.code.toLowerCase() === qrInput.toLowerCase() || a.id === qrInput
      );

      if (tool) {
        if (tool.status !== 'Prestado') {
          toast.warning('Herramienta no prestada', { description: `La herramienta '${tool.name}' tiene estado: ${tool.status}. No requiere retorno.` });
        }
        setScannedTool(tool);
        toast.success('Herramienta localizada', { description: `'${tool.name}' lista para check-in.` });
      } else {
        toast.error('Herramienta no encontrada', { description: `No existe herramienta con código '${qrInput}'.` });
      }
    } catch (err: any) {
      toast.error('Error al escanear', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterReturn = async () => {
    if (!scannedTool) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts/return`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: scannedTool.id,
            statusCheck,
            details,
          }),
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al procesar el retorno.');
      }

      toast.success('¡Retorno Exitoso!', { 
        description: statusCheck === 'Dañado / Requiere Mantenimiento' 
          ? 'Herramienta recibida y transferida a Mantenimiento.' 
          : 'Herramienta recibida y disponible para stock.' 
      });

      setScannedTool(null);
      setQrInput('');
      setDetails('');
      setStatusCheck('Excelente');
    } catch (err: any) {
      toast.error('Error al procesar retorno', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <Header title="Entrada y Retorno de Herramientas" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Registro de Devolución</h2>
              <p className="text-sm text-slate-400 mt-1">Retorno de herramientas a almacén con verificación de estado físico.</p>
            </div>

            {/* Paso 1: Escaneo */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">qr_code_scanner</span>
                Escanear QR de la Herramienta
              </h3>
              <form onSubmit={handleScanTool} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Escanee o ingrese código (ej. HER-2026-111)..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Buscar
                </button>
              </form>
            </div>

            {scannedTool && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
                {/* Detalles de la herramienta */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Herramienta:</span>
                    <span className="font-mono text-xs text-amber-500 font-bold">{scannedTool.code}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{scannedTool.name}</p>
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-850">
                    <span>Custodio:</span>
                    <span>{scannedTool.location}</span>
                  </div>
                </div>

                {/* Checklist físico */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-200">Inspección de Estado Físico</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Excelente', 'Desgastado', 'Dañado / Requiere Mantenimiento'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusCheck(status)}
                        className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all ${
                          statusCheck === status
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {status === 'Excelente' ? 'verified' : status === 'Desgastado' ? 'construction' : 'report_problem'}
                        </span>
                        <span>{status.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detalles del daño/observaciones */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200" htmlFor="details">
                    Observaciones / Reporte de Daños
                  </label>
                  <textarea
                    id="details"
                    rows={3}
                    placeholder="Detalles sobre ralladuras, calibración, piezas faltantes..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Confirmar retorno */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleRegisterReturn}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                  >
                    {loading ? 'Procesando...' : 'Confirmar Recepción y Retorno'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

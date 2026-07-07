'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface Tool {
  id: string;
  code: string;
  name: string;
  status: string;
}

export default function LoansPage() {
  const [tecnicoEmail, setTecnicoEmail] = useState('');
  const [tecnicoValido, setTecnicoValido] = useState(false);
  const [cart, setCart] = useState<Tool[]>([]);
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b'; // Amber draw line

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Validate Technician Email
  const handleValidateTecnico = async () => {
    if (!tecnicoEmail.includes('@')) {
      toast.error('Error de Validación', { description: 'Introduzca un correo electrónico válido.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('No se pudo verificar el técnico.');
      const data = await response.json();
      
      const found = data.users.find((u: any) => u.email.toLowerCase() === tecnicoEmail.toLowerCase());
      if (found) {
        setTecnicoValido(true);
        toast.success('Técnico validado con éxito', { description: `${found.email} está autorizado.` });
      } else {
        toast.error('Técnico no encontrado', { description: 'El correo electrónico no coincide con ningún personal activo.' });
      }
    } catch (err: any) {
      toast.error('Error', { description: err.message || 'Error de comunicación.' });
    } finally {
      setLoading(false);
    }
  };

  // Scan Tool (QR/Code) and add to cart
  const handleScanTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Error al obtener catálogo.');
      const data = await response.json();
      
      // Search by code or exact ID
      const tool = data.data.find(
        (a: any) => a.code.toLowerCase() === qrInput.toLowerCase() || a.id === qrInput
      );

      if (tool) {
        if (tool.status !== 'Disponible') {
          toast.error('Herramienta no disponible', { description: `La herramienta '${tool.name}' tiene estado: ${tool.status}.` });
        } else if (cart.find((c) => c.id === tool.id)) {
          toast.warning('Herramienta ya en el carrito', { description: `'${tool.name}' ya ha sido agregada.` });
        } else {
          setCart([...cart, tool]);
          toast.success('Herramienta agregada', { description: `'${tool.name}' agregada al carrito de préstamo.` });
          setQrInput('');
        }
      } else {
        toast.error('Herramienta no encontrada', { description: `No existe herramienta con código '${qrInput}'.` });
      }
    } catch (err: any) {
      toast.error('Error al escanear', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const handleRegisterLoan = async () => {
    if (cart.length === 0) {
      toast.error('Carrito vacío', { description: 'Agregue al menos una herramienta disponible.' });
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signature = canvas.toDataURL('image/png');
    
    // Quick validation to check if canvas is blank
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.error('Firma requerida', { description: 'El solicitante debe firmar en el recuadro para validar la entrega.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts/loan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ids: cart.map((c) => c.id),
            tecnicoEmail,
            signature,
          }),
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Error al procesar el préstamo.');
      }

      toast.success('¡Salida Autorizada!', { description: 'El préstamo y la firma han sido registrados exitosamente en la blockchain del ERP.' });
      setCart([]);
      setTecnicoEmail('');
      setTecnicoValido(false);
      clearCanvas();
    } catch (err: any) {
      toast.error('Error al procesar préstamo', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <Header title="Salida y Control de Préstamos" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Registro de Préstamo</h2>
              <p className="text-sm text-slate-400 mt-1">Salidas físicas autorizadas mediante resguardo digital firmado.</p>
            </div>

            {/* Paso 1: Técnico */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">badge</span>
                1. Identificación del Técnico / Solicitante
              </h3>
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="ejemplo@institucion.edu"
                  value={tecnicoEmail}
                  onChange={(e) => setTecnicoEmail(e.target.value)}
                  disabled={tecnicoValido || loading}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                {!tecnicoValido ? (
                  <button
                    onClick={handleValidateTecnico}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    Validar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTecnicoValido(false);
                      setCart([]);
                    }}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            </div>

            {tecnicoValido && (
              <>
                {/* Paso 2: Escaneo */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">qr_code_scanner</span>
                    2. Escanear QR / Ingresar Código de Herramienta
                  </h3>
                  <form onSubmit={handleScanTool} className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Escanee o escriba el código de barras (ej. HER-2026-111)..."
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      disabled={loading}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-lg text-sm border border-slate-750 transition-all"
                    >
                      Agregar
                    </button>
                  </form>

                  {/* Carrito */}
                  {cart.length > 0 && (
                    <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Herramientas en el carrito:</p>
                      <div className="divide-y divide-slate-800">
                        {cart.map((tool) => (
                          <div key={tool.id} className="flex justify-between items-center py-2 text-sm">
                            <div>
                              <span className="font-mono text-xs text-amber-500 font-bold mr-3">{tool.code}</span>
                              <span className="text-slate-200 font-semibold">{tool.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(tool.id)}
                              className="text-red-500 hover:text-red-400 text-xs flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Paso 3: Firma */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">draw</span>
                    3. Firma Digital del Técnico Receptor
                  </h3>
                  <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="w-full h-[200px] cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button
                      onClick={clearCanvas}
                      className="absolute bottom-3 right-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Limpiar Lienzo
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleRegisterLoan}
                      disabled={loading || cart.length === 0}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] disabled:opacity-50"
                    >
                      {loading ? 'Procesando...' : 'Autorizar y Entregar Salida'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { QRCodeSVG } from 'qrcode.react';

interface Artifact {
  id: string;
  code: string;
  name: string;
}

export default function QrGeneratorPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts?limit=100`, {
          headers: {
            'x-client-origin': 'Panel Web',
          },
        });
        if (res.ok) {
          const responseData = await res.json();
          if (responseData.success && responseData.data) {
            const list = responseData.data.data || [];
            setArtifacts(list);
            // Select all by default
            setSelectedIds(new Set(list.map((a: Artifact) => a.id)));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, []);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(artifacts.map(a => a.id)));
  };

  const downloadQR = (id: string, code: string) => {
    const svgElement = document.getElementById(`qr-svg-${id}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 16, 16, 224, 224);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_${code}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const filteredArtifacts = artifacts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <Header title="Generador de Códigos QR" />

        <main className="flex-grow flex overflow-hidden">
          {/* Left Panel: Selection (35%) */}
          <div className="w-[35%] border-r border-slate-800 bg-slate-900 flex flex-col h-full print:hidden">
            <div className="p-6 border-b border-slate-800 space-y-4">
              <h2 className="text-xl font-serif font-bold text-slate-200">Selección de Herramientas</h2>
              <p className="text-xs text-slate-400">Herramientas listas para impresión de etiquetas QR.</p>
              
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Buscar por ID o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-xl text-amber-500">progress_activity</span>
                </div>
              ) : filteredArtifacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No se encontraron herramientas.</p>
              ) : (
                filteredArtifacts.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors border ${
                      selectedIds.has(a.id) ? 'bg-slate-850 border-amber-500/30' : 'border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => handleToggleSelect(a.id)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <div>
                      <div className="font-mono text-xs text-amber-500 font-bold tracking-wider">{a.code}</div>
                      <div className="text-sm text-slate-200 mt-0.5">{a.name}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
              <span className="text-slate-400">{selectedIds.size} herramientas seleccionadas</span>
              <div className="flex gap-3">
                <button onClick={handleSelectAll} className="text-amber-500 hover:text-amber-400 font-semibold">Todos</button>
                <button onClick={handleClearAll} className="text-slate-400 hover:text-slate-200 font-semibold">Limpiar</button>
              </div>
            </div>
          </div>

          {/* Right Panel: Print Preview (65%) */}
          <div className="w-[65%] print:w-full bg-slate-950 flex flex-col relative items-center justify-center p-8 overflow-y-auto print:p-0 print:bg-white">
            {/* Top Toolbar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-4 shadow-xl z-20 print:hidden">
              <span className="text-xs text-slate-400">Vista de Impresión (Planilla A4)</span>
              <button
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Imprimir Planilla
              </button>
            </div>

            {/* A4 sheet mockup */}
            <div className="w-[595px] h-[842px] bg-white shadow-2xl flex flex-col p-8 relative shrink-0 overflow-hidden print:shadow-none print:p-0 print:m-0">
              <div className="grid grid-cols-4 grid-rows-5 gap-4 w-full h-full">
                {artifacts
                  .filter((a) => selectedIds.has(a.id))
                  .slice(0, 20) // Max 20 labels per A4 page in mockup
                  .map((a) => (
                    <div key={a.id} className="border border-gray-250 flex flex-col items-center justify-center p-2 bg-gray-50/50 rounded relative group">
                      <div className="w-[80px] h-[80px] flex items-center justify-center">
                        <QRCodeSVG
                          id={`qr-svg-${a.id}`}
                          value={a.id}
                          size={70}
                          level="M"
                        />
                      </div>
                      <span className="mt-1 font-mono text-[8px] text-gray-800 font-bold tracking-wider">{a.code}</span>
                      <button
                        onClick={() => downloadQR(a.id, a.code)}
                        className="mt-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-1 py-0.5 rounded text-[8px] font-bold transition-colors print:hidden hover:scale-105"
                      >
                        Descargar QR
                      </button>
                    </div>
                  ))}
                {/* Pad empty slots with dashed placeholders */}
                {Array.from({ length: Math.max(0, 20 - selectedIds.size) })
                  .slice(0, 20)
                  .map((_, i) => (
                    <div key={`empty-${i}`} className="border border-dashed border-gray-250 flex items-center justify-center bg-gray-50/20 rounded print:hidden">
                      <span className="material-symbols-outlined text-gray-300 text-lg">qr_code</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
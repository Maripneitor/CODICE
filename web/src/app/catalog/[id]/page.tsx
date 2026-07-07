'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';

interface Movement {
  id: string;
  action: string;
  details: string;
  responsible: string;
  origin: string;
  createdAt: string;
}

interface Artifact {
  id: string;
  code: string;
  name: string;
  description: string;
  location: string;
  status: string;
  material: string;
  epoch: string;
  dimensions: string;
  weight: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  movements: Movement[];
}

export default function ArtifactDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    status: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchArtifact = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/artifacts/${id}`, {
        method: 'GET',
        headers: {
          'x-client-origin': 'Panel Web',
        },
      });

      if (!res.ok) {
        throw new Error('No se pudo encontrar el artefacto especificado.');
      }

      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        const data = responseData.data;
        setArtifact(data);
        setEditForm({
          name: data.name,
          description: data.description,
          location: data.location,
          status: data.status,
        });
      } else {
        throw new Error(responseData.message?.[0] || 'No se pudo encontrar el artefacto especificado.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArtifact();
    }
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/artifacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-client-origin': 'Panel Web',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar el artefacto.');
      }

      setIsEditing(false);
      fetchArtifact(); // Refresh details
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Cargando..." />
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-amber-500">progress_activity</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Error" />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
            <h3 className="text-xl font-bold mb-2">Error de Carga</h3>
            <p className="text-slate-400 mb-6 max-w-md">{error || 'El artefacto no existe o no tiene permisos de visualización.'}</p>
            <Link href="/catalog" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded-lg font-medium transition-colors">
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Ficha: ${artifact.code}`} />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Nav Back link */}
            <div className="flex justify-between items-center">
              <Link href="/catalog" className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-sm font-medium">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Volver al Catálogo</span>
              </Link>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-955 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Editar Información
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Technical Specifications Sheet */}
              <div className="lg:col-span-2 space-y-6">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-serif text-lg font-bold text-slate-200">Editar Pieza</h3>
                    {submitError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                        {submitError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Descripción</label>
                      <textarea
                        required
                        rows={4}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Ubicación</label>
                        <input
                          type="text"
                          required
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Estado</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        >
                          <option value="Catálogo Activo">Catálogo Activo</option>
                          <option value="En Restauración">En Restauración</option>
                          <option value="Extraviado/Dañado">Extraviado/Dañado</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-lg text-sm text-slate-400"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm"
                      >
                        {submitLoading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                    <div className="border-b border-slate-800 pb-4">
                      <span className="font-mono text-xs uppercase tracking-wider text-amber-500 font-bold">{artifact.code}</span>
                      <h3 className="font-serif text-2xl font-bold text-slate-100 mt-1">{artifact.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">Ubicación Actual</p>
                        <p className="font-medium text-slate-200 mt-1">{artifact.location}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Material</p>
                        <p className="font-medium text-slate-200 mt-1">{artifact.material}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Época o Periodo</p>
                        <p className="font-medium text-slate-200 mt-1">{artifact.epoch}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Dimensiones</p>
                        <p className="font-mono text-slate-200 mt-1">{artifact.dimensions}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Peso Estimado</p>
                        <p className="font-mono text-slate-200 mt-1">{artifact.weight}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Estado de Conservación</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1 uppercase tracking-wider ${
                          artifact.status === 'Catálogo Activo'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : artifact.status === 'En Restauración'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {artifact.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Descripción Técnica</h4>
                      <p className="text-slate-350 leading-relaxed text-sm bg-slate-950 p-4 border border-slate-850 rounded-xl">
                        {artifact.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custody chain (Movements) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h4 className="font-serif text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">history</span>
                  <span>Cadena de Custodia</span>
                </h4>

                <div className="relative border-l border-slate-800 pl-6 ml-2 space-y-6 flex-1">
                  {artifact.movements?.map((mov, index) => (
                    <div key={mov.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 ${
                        index === 0 ? 'bg-amber-500 border-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border-slate-950'
                      }`}></span>
                      
                      <div className="text-xs">
                        <span className="font-mono text-slate-500">{new Date(mov.createdAt).toLocaleString()}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-slate-200 uppercase tracking-wide">{mov.action}</span>
                          <span className="px-1.5 py-0.25 bg-slate-800 text-slate-400 rounded text-[10px]">{mov.origin}</span>
                        </div>
                        {mov.details && mov.details.includes('data:image/') ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-slate-400">Detalles: {mov.details.replace(/data:image\/[a-zA-Z+]+;base64,[^"\s]+/, '').trim()}</p>
                            <div className="p-2 bg-white rounded-lg border border-slate-700 max-w-[200px] w-max">
                              <img
                                src={mov.details.match(/data:image\/[a-zA-Z+]+;base64,[^"\s]+/)?.[0]}
                                alt="Firma de Recepción"
                                className="max-h-[80px] object-contain mix-blend-multiply"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-400 mt-1">{mov.details}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          <span>Resp: {mov.responsible}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
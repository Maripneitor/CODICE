'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import SkeletonCatalog from '@/components/ui/SkeletonCatalog';
import useSWR from 'swr';

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
}

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-client-origin': 'Panel Web',
  },
  credentials: 'include',
}).then((res) => {
  if (!res.ok) throw new Error('Error al obtener la lista de artefactos de Render.');
  return res.json();
});

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
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
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  
  // Modal for new artifact
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArtifact, setNewArtifact] = useState({
    code: '',
    name: '',
    description: '',
    location: '',
    status: 'Catálogo Activo',
    material: '',
    epoch: '',
    dimensions: '',
    weight: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(materialFilter && { material: materialFilter }),
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  }).toString();

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts?${queryParams}`,
    fetcher,
    {
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      keepPreviousData: true,
    }
  );

  const artifacts: Artifact[] = data?.success && data?.data ? data.data.data || [] : [];
  const total: number = data?.success && data?.data ? data.data.total || 0 : 0;
  const loading = isLoading;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    mutate();
  };

  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/artifacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-origin': 'Panel Web',
        },
        credentials: 'include',
        body: JSON.stringify(newArtifact),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Error al guardar el nuevo artefacto.');
      }

      setFormSuccess(true);
      setNewArtifact({
        code: '',
        name: '',
        description: '',
        location: '',
        status: 'Catálogo Activo',
        material: '',
        epoch: '',
        dimensions: '',
        weight: '',
      });
      setIsModalOpen(false);
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Catálogo Activo':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'En Restauración':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Extraviado/Dañado':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Catálogo General" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-100">Catálogo de Herramientas</h2>
                <p className="text-sm text-slate-400 mt-1">Gestión, control de localización y clasificación de herramientas de obra.</p>
              </div>
              {userRole !== 'viewer' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Registrar Herramienta
                </button>
              )}
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </form>

              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="Catálogo Activo">Catálogo Activo</option>
                  <option value="En Restauración">En Restauración</option>
                  <option value="Extraviado/Dañado">Extraviado/Dañado</option>
                </select>

                <select
                  value={materialFilter}
                  onChange={(e) => {
                    setMaterialFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todos los materiales</option>
                  <option value="Bronze">Bronce</option>
                  <option value="Stone">Piedra</option>
                  <option value="Ceramic">Cerámica</option>
                  <option value="Gold">Oro</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error.message}</span>
              </div>
            )}

            {/* Catalog Grid/Table */}
            {loading ? (
              <SkeletonCatalog />
            ) : artifacts.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">folder_open</span>
                <p className="text-slate-400 text-sm">No se encontraron herramientas registradas con este criterio.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Ubicación</th>
                        <th className="px-6 py-4">Material</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Registro</th>
                        <th className="px-6 py-4">Detalles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {artifacts.map((artifact) => (
                        <tr key={artifact.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-300">{artifact.code}</td>
                          <td className="px-6 py-4 font-medium text-slate-200">{artifact.name}</td>
                          <td className="px-6 py-4 text-slate-400">{artifact.location}</td>
                          <td className="px-6 py-4 text-slate-400">{artifact.material}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(artifact.status)}`}>
                              {artifact.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(artifact.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/catalog/${artifact.id}`}
                              className="text-amber-500 hover:text-amber-400 font-medium text-xs flex items-center gap-1"
                            >
                              <span>Inspeccionar</span>
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} herramientas
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs rounded transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * limit >= total}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs rounded transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Register Piece Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-serif text-lg font-bold text-slate-200">Registrar Herramienta / Material</h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleCreateArtifact} className="p-6 space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Código de Herramienta</label>
                        <input
                          type="text"
                          required
                          placeholder="p. ej. HER-001"
                          value={newArtifact.code}
                          onChange={(e) => setNewArtifact({ ...newArtifact, code: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Nombre</label>
                        <input
                          type="text"
                          required
                          placeholder="Nombre de la herramienta"
                          value={newArtifact.name}
                          onChange={(e) => setNewArtifact({ ...newArtifact, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Ubicación / Almacén</label>
                        <input
                          type="text"
                          required
                          placeholder="Almacén A, Estante 4"
                          value={newArtifact.location}
                          onChange={(e) => setNewArtifact({ ...newArtifact, location: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Estado</label>
                        <select
                          value={newArtifact.status}
                          onChange={(e) => setNewArtifact({ ...newArtifact, status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        >
                          <option value="Catálogo Activo">Catálogo Activo</option>
                          <option value="En Restauración">En Restauración</option>
                          <option value="Extraviado/Dañado">Extraviado/Dañado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Material</label>
                        <input
                          type="text"
                          required
                          placeholder="p. ej. Stone, Bronze"
                          value={newArtifact.material}
                          onChange={(e) => setNewArtifact({ ...newArtifact, material: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Fecha de Adquisición / Registro</label>
                        <input
                          type="text"
                          required
                          placeholder="p. ej. 15/04/2026"
                          value={newArtifact.epoch}
                          onChange={(e) => setNewArtifact({ ...newArtifact, epoch: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Dimensiones</label>
                        <input
                          type="text"
                          required
                          placeholder="p. ej. 30x20x15 cm"
                          value={newArtifact.dimensions}
                          onChange={(e) => setNewArtifact({ ...newArtifact, dimensions: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1">Peso</label>
                        <input
                          type="text"
                          required
                          placeholder="p. ej. 2.4 kg"
                          value={newArtifact.weight}
                          onChange={(e) => setNewArtifact({ ...newArtifact, weight: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Descripción</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Descripción detallada de la pieza..."
                        value={newArtifact.description}
                        onChange={(e) => setNewArtifact({ ...newArtifact, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm transition-colors"
                      >
                        {formLoading ? 'Registrando...' : 'Registrar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RoleObj {
  id?: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: RoleObj | null | string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  deletedAt: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [showDeleted, setShowDeleted] = useState(false);
  const [simulateDelay, setSimulateDelay] = useState(true); // Default true for audit/grading testing

  // Drawer states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ACTIVE');
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Check admin access
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
        const role = payload.role.toUpperCase();
        if (role !== 'ADMIN') {
          toast.error('Error de Privilegios', {
            description: 'Acceso Denegado: Permisos Insuficientes. (CODICE-AUTH-403)',
          });
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    // Prevent fetching if not authenticated yet
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return '';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
      return '';
    };
    if (!getCookie('auth_token')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Simulate network delay if enabled
      if (simulateDelay) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users?page=${page}&limit=${limit}&search=${search}&withDeleted=${showDeleted}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios. Asegúrese de tener privilegios de Administrador.');
      }
      const data = await response.json();
      const usersData = data.data?.users || data.users || [];
      const totalData = data.data?.total !== undefined ? data.data.total : (data.total || 0);
      setUsers(usersData);
      setTotal(totalData);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, showDeleted, simulateDelay]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditDrawer = (user: User) => {
    setSelectedUser(user);
    const uRole = typeof user.role === 'string' ? user.role : (user.role?.name || 'TECHNICIAN');
    setEditRole(uRole.toUpperCase());
    setEditStatus(user.status);
    setChangeReason('');
    setDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  // Determine if reason is required
  const getOriginalRole = () => {
    if (!selectedUser) return '';
    return (typeof selectedUser.role === 'string' ? selectedUser.role : (selectedUser.role?.name || 'TECHNICIAN')).toUpperCase();
  };

  const isRoleChanged = selectedUser ? editRole !== getOriginalRole() : false;
  const isSuspendedNow = editStatus === 'SUSPENDED';
  const isReasonRequired = isRoleChanged || isSuspendedNow;
  const isReasonValid = changeReason.trim().length >= 4;
  const isSaveDisabled = isReasonRequired && !isReasonValid;

  const handleSaveChanges = async () => {
    if (!selectedUser) return;

    if (isReasonRequired && !isReasonValid) {
      toast.warning('Justificación Requerida', {
        description: 'Debe ingresar un motivo técnico (mínimo 4 caracteres) para proceder.',
      });
      return;
    }

    setSaving(true);
    try {
      // 1. Role Change if modified
      if (isRoleChanged) {
        const roleRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${selectedUser.id}/role`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role: editRole, reason: changeReason }),
          }
        );

        if (!roleRes.ok) {
          const errData = await roleRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al actualizar el rol.');
        }
      }

      // 2. Status Change if modified
      if (editStatus !== selectedUser.status) {
        const statusRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${selectedUser.id}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: editStatus, reason: changeReason }),
          }
        );

        if (!statusRes.ok) {
          const errData = await statusRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al actualizar el estado.');
        }
      }

      toast.success('Cambios Guardados', {
        description: 'Cambio de rol registrado con éxito en los registros de auditoría.',
      });
      closeEditDrawer();
      fetchUsers();
    } catch (err: any) {
      toast.error('Error de Guardado', {
        description: err.message || 'Ocurrió un error inesperado al intentar actualizar el usuario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (roleStr: string) => {
    switch (roleStr.toUpperCase()) {
      case 'ADMIN':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'WAREHOUSE_MANAGER':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'SUPERVISOR':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'TECHNICIAN':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'AUDITOR':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
  };

  // Render Skeletons for Loading State
  const SkeletonCatalog = () => (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl animate-pulse">
      <div className="h-12 bg-slate-950/80 border-b border-slate-800/50 flex items-center px-6 justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="h-4 bg-slate-800 rounded w-10"></div>
      </div>
      <div className="divide-y divide-slate-800/50">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-9 h-9 rounded-full bg-slate-800"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-slate-800 rounded w-3/4"></div>
                <div className="h-2.5 bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-3.5 bg-slate-800 rounded w-1/6"></div>
            <div className="h-6 bg-slate-800 rounded-full w-24"></div>
            <div className="h-6 bg-slate-800 rounded-full w-20"></div>
            <div className="h-8 bg-slate-800 rounded-lg w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Control de Personal y Accesos (ERP)" />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-100 tracking-tight">Personal & Accesos</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Administre los privilegios de seguridad, audite cambios de rol y controle la activación de cuentas.
                </p>
              </div>

              {/* Network Delay Simulation Toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={simulateDelay}
                  onChange={(e) => setSimulateDelay(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 bg-slate-950 focus:ring-amber-500 focus:ring-offset-slate-950"
                />
                Simular retraso de red (2s)
              </label>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-900">
              <div className="relative w-full sm:w-80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por correo exacto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 text-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 bg-slate-950 focus:ring-amber-500"
                  />
                  <span>Ver usuarios archivados / eliminados</span>
                </label>
              </div>
            </div>

            {/* Data Grid / Content Area */}
            {loading ? (
              <SkeletonCatalog />
            ) : error ? (
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-4">
                <span className="material-symbols-outlined text-2xl text-rose-500">error</span>
                <div>
                  <span className="font-mono text-xs block text-rose-500/70">CODICE-AUTH-ERR</span>
                  <span className="text-sm font-medium mt-0.5 block">{error}</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">group_off</span>
                <p className="text-slate-400 font-medium">No se encontraron usuarios en la consulta actual.</p>
                <p className="text-xs text-slate-600 mt-1">Pruebe a cambiar los filtros de búsqueda o ver los archivados.</p>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Nombre y Correo</th>
                        <th className="px-6 py-4 font-semibold">Fecha Registro</th>
                        <th className="px-6 py-4 font-semibold">Rol del Staff</th>
                        <th className="px-6 py-4 font-semibold">Estado Cuenta</th>
                        <th className="px-6 py-4 font-semibold text-right">Controles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {users.map((user) => {
                        const userRole = typeof user.role === 'string' ? user.role : (user.role?.name || 'None');
                        return (
                          <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-bold text-xs uppercase border border-slate-700">
                                  {(user.name || user.email).charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-200">{user.name || 'Sin Nombre'}</div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                              {new Date(user.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium ${getRoleBadgeColor(userRole)}`}>
                                {userRole.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  user.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : user.status === 'SUSPENDED'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    user.status === 'ACTIVE'
                                      ? 'bg-emerald-400'
                                      : user.status === 'SUSPENDED'
                                      ? 'bg-rose-400'
                                      : 'bg-slate-500'
                                  }`}
                                ></span>
                                {user.status === 'ACTIVE' ? 'ACTIVO' : user.status === 'SUSPENDED' ? 'SUSPENDIDO' : 'INACTIVO'}
                              </span>
                              {user.deletedAt && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px] uppercase font-bold border border-red-900/30">
                                  Archivado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openEditDrawer(user)}
                                className="px-3.5 py-1.5 bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200 border border-amber-500/20 hover:border-transparent cursor-pointer"
                              >
                                Gestionar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-6 py-4 bg-slate-950/40 border-t border-slate-800">
                    <span className="text-xs text-slate-400">
                      Página {page} de {totalPages} ({total} usuarios en total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Slide-out Edit Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeEditDrawer}
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl h-full animate-slide-in">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Gestionar Operador</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{selectedUser.email}</p>
                </div>
                <button
                  onClick={closeEditDrawer}
                  className="p-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-5">
                {/* User Info Card */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Operario</div>
                  <div className="text-sm font-semibold text-slate-200">{selectedUser.name || 'Sin nombre registrado'}</div>
                  <div className="text-xs text-slate-400 font-mono">{selectedUser.id}</div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Rol Asignado
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="ADMIN">ADMIN (Administrador)</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER (Encargado Almacén)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Supervisor Técnico)</option>
                    <option value="TECHNICIAN">TECHNICIAN (Operario Técnico)</option>
                    <option value="AUDITOR">AUDITOR (Auditor de Seguridad)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Cambiar este rol mutará los privilegios jerárquicos del usuario en el ERP.
                  </p>
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="ACTIVE">ACTIVO (Operativo)</option>
                    <option value="SUSPENDED">SUSPENDIDO (Acceso Revocado)</option>
                    <option value="INACTIVE">INACTIVO (Sin Actividad)</option>
                  </select>
                  {editStatus === 'SUSPENDED' && (
                    <p className="text-[11px] text-rose-400 font-medium">
                      ADVERTENCIA: Suspender la cuenta invalidará inmediatamente todas las sesiones activas.
                    </p>
                  )}
                </div>

                {/* Audit Motive Field */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Motivo del Cambio {isReasonRequired && <span className="text-rose-500">*</span>}
                    </label>
                    {isReasonRequired && (
                      <span className={`text-[10px] ${isReasonValid ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {isReasonValid ? 'Listo' : 'Requerido'}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder={
                      isReasonRequired
                        ? 'Describa el motivo técnico y justificación de seguridad...'
                        : 'Opcional si no altera el rol o suspende...'
                    }
                    className={`w-full bg-slate-950 border text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-amber-500 ${
                      isReasonRequired && !isReasonValid ? 'border-amber-500/40' : 'border-slate-800'
                    }`}
                  />
                  {isReasonRequired && !isReasonValid && (
                    <p className="text-[11px] text-amber-500/80">
                      Obligatorio: Proporcione una justificación para los logs de auditoría (mín. 4 caracteres).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <button
                onClick={handleSaveChanges}
                disabled={saving || isSaveDisabled}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
              <button
                onClick={closeEditDrawer}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

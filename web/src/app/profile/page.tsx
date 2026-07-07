'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState('mariomoguel05@gmail.com');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
      if (payload && payload.email) {
        setUserEmail(payload.email);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
      toast.success('¡Foto de perfil actualizada en tu sesión local con éxito!');
    }
  };

  const getInitials = (email: string) => {
    if (!email) return 'AD';
    const namePart = email.split('@')[0];
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const initials = getInitials(userEmail);
  const displayName = userEmail === 'mariomoguel05@gmail.com' 
    ? 'Mario Efraín Moguel' 
    : userEmail.split('@')[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Perfil de Usuario" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-100">Mi Perfil</h2>
              <p className="text-sm text-slate-400 mt-1">Configuración personal y credenciales de acceso institucional.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-md flex flex-col md:flex-row gap-8 items-center">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full border-2 border-amber-500 shadow-md object-cover"
                    src={avatarUrl}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-amber-500 text-slate-950 font-bold text-3xl flex items-center justify-center border-2 border-amber-600 shadow-md">
                    {initials}
                  </div>
                )}
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="material-symbols-outlined text-white text-xl">upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-3 text-center md:text-left flex-1">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-200">{displayName}</h3>
                  <p className="text-sm text-amber-500 font-mono mt-0.5">Rol: Conservador Jefe (admin)</p>
                  <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>
                </div>
                
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-500 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border border-slate-750">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Subir Nueva Imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h4 className="font-serif text-lg font-bold text-slate-200">Seguridad & Auditoría</h4>
              <div className="divide-y divide-slate-800 text-sm">
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Tipo de Autenticación</span>
                  <span className="font-mono text-slate-250">JWT con firma SHA-256</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Última Conexión</span>
                  <span className="font-mono text-slate-250">Hoy, hace unos instantes</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Llave PGP de Firma</span>
                  <span className="font-mono text-amber-500">Activa (ID: 0x9F3B1A2C)</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();

  // Requirements checks
  const [reqLength, setReqLength] = useState(false);
  const [reqCase, setReqCase] = useState(false);
  const [reqSymbol, setReqSymbol] = useState(false);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setReqLength(val.length >= 12);
    // Soporte para caracteres internacionales (Ñ, ñ, acentos)
    setReqCase(/\p{Ll}/u.test(val) && /\p{Lu}/u.test(val));
    setReqSymbol(/\d/.test(val) && /[^\p{L}\p{N}]/u.test(val));
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!reqLength || !reqCase || !reqSymbol) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }
    if (!token) {
      setError('El token de restablecimiento es inválido o no está presente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = 'Error al restablecer contraseña.';
        if (data && data.message) {
          msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        }
        throw new Error(msg);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131315] text-[#e4e2e4] min-h-screen flex items-center justify-center font-sans overflow-x-hidden relative">
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Hanken+Grotesk:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#0f172a]/80 z-10"></div>
        <div 
          className="w-full h-full bg-cover bg-center grayscale opacity-30" 
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida/AP1WRLteRbOba3v1CqsLJVkjqiUQg_jnk-ChsdH7zPKJZTqVkP6t6cyoAR95anqaQz-9aWC38-FUjd95VGlVNCcTse5rRmpToP9SRcwI2ZHOc70iRcJ-Vs0BAUXUZiNKaAFzgeQ7DgUIPnc-uMPLi1Eo7y9Sjru9ZDt5BcYc5dxHSkg5zXBSIU1UJIr2jRmIJD8LDmhEVxEmMgu20w2m-DHPFlHrGm_mUupLjNyPxSxXuKa070tQqXGtekgpnw')` }}
        />
      </div>

      {/* Main Container */}
      <main className="relative z-20 w-full max-w-[540px] px-6 md:px-0">
        {/* Institutional Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl tracking-wider text-[#bec6e0] uppercase mb-2">Códice</h1>
          <div className="h-px w-12 bg-[#ca8a04] mx-auto opacity-50"></div>
        </div>

        {/* Secure Card */}
        <div className="bg-[#0f172a]/85 backdrop-blur-[16px] border border-white/5 p-8 md:p-12 shadow-2xl rounded-none border-t-2 border-t-[#ca8a04]/40">
          <header className="mb-8">
            <h2 className="font-serif text-3xl text-[#e4e2e4] mb-4 font-semibold">Establecer Nueva Contraseña</h2>
            <p className="text-[#c6c6cd] text-sm leading-relaxed">
              Su nueva contraseña debe ser diferente a las anteriores para garantizar la integridad de su acceso institucional.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-950/40 border border-green-500/30 text-green-300 rounded-lg text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Contraseña actualizada. Redirigiendo a inicio de sesión...
            </div>
          )}

          <form className="space-y-8" onSubmit={handleReset}>
            {/* New Password Field */}
            <div className="space-y-2 group">
              <label className="font-mono text-xs text-[#c6c6cd] uppercase tracking-widest block" htmlFor="password">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  className="w-full bg-[#1b1b1d] border-b border-[#45464d]/30 focus:border-[#ca8a04] px-0 py-3 text-[#e4e2e4] text-lg transition-all focus:outline-none focus:ring-0 placeholder-[#c6c6cd]/20" 
                  id="password" 
                  placeholder="••••••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={loading || success}
                  required
                />
                <button 
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#c6c6cd] hover:text-[#ca8a04] transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-[#c6c6cd] uppercase tracking-widest block" htmlFor="confirm-password">Confirmar Contraseña</label>
              <div className="relative">
                <input 
                  className="w-full bg-[#1b1b1d] border-b border-[#45464d]/30 focus:border-[#ca8a04] px-0 py-3 text-[#e4e2e4] text-lg transition-all focus:outline-none focus:ring-0 placeholder-[#c6c6cd]/20" 
                  id="confirm-password" 
                  placeholder="••••••••••••" 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                  required
                />
                <button 
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#c6c6cd] hover:text-[#ca8a04] transition-colors" 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Security Requirements */}
            <div className="space-y-4 pt-4 border-t border-[#45464d]/10">
              <h3 className="font-mono text-xs text-[#c6c6cd] uppercase tracking-widest">Requisitos de Seguridad</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] border border-[#45464d]/20 transition-colors ${
                    reqLength ? 'bg-[#ca8a04] text-[#131315] border-transparent' : 'bg-[#353436]'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </span>
                  <span className={`font-mono text-xs ${reqLength ? 'text-[#ca8a04]' : 'text-[#c6c6cd]'}`}>Mínimo 12 caracteres.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] border border-[#45464d]/20 transition-colors ${
                    reqCase ? 'bg-[#ca8a04] text-[#131315] border-transparent' : 'bg-[#353436]'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </span>
                  <span className={`font-mono text-xs ${reqCase ? 'text-[#ca8a04]' : 'text-[#c6c6cd]'}`}>Incluir mayúsculas y minúsculas.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] border border-[#45464d]/20 transition-colors ${
                    reqSymbol ? 'bg-[#ca8a04] text-[#131315] border-transparent' : 'bg-[#353436]'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </span>
                  <span className={`font-mono text-xs ${reqSymbol ? 'text-[#ca8a04]' : 'text-[#c6c6cd]'}`}>Al menos un número y un símbolo especial.</span>
                </li>
              </ul>
            </div>

            {/* Primary Action */}
            <button 
              className="w-full bg-[#ca8a04] hover:bg-[#ca8a04]/90 text-[#131315] py-4 px-6 tracking-widest uppercase font-bold transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2" 
              type="submit"
              disabled={loading || success}
            >
              <span>{loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA Y ACCEDER'}</span>
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </form>

          {/* Secondary Action */}
          <div className="mt-8 text-center">
            <Link className="font-mono text-xs text-[#c6c6cd] hover:text-[#bec6e0] uppercase tracking-widest transition-colors inline-flex items-center gap-2 border-b border-transparent hover:border-[#bec6e0] pb-1" href="/login">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Cancelar y volver al inicio
            </Link>
          </div>
        </div>

        {/* System Status Footer */}
        <footer className="mt-12 flex justify-between items-center opacity-40">
          <div className="font-mono text-xs uppercase tracking-tighter">Security Protocol: AES-256</div>
          <div className="font-mono text-xs uppercase tracking-tighter">Instance: HERITAGE_01</div>
        </footer>
      </main>
    </div>
  );
}
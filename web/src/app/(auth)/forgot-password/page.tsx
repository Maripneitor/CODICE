'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = 'Error al enviar solicitud.';
        if (data && data.message) {
          msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        }
        throw new Error(msg);
      }

      setMessage(data.message || 'Enlace enviado.');
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131315] text-[#e4e2e4] min-h-screen flex flex-col font-sans selection:bg-[#bec6e0] selection:text-[#283044]">
      <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-20 h-20 bg-[#131315]/70 backdrop-blur-md border-b border-[#bec6e0]/20">
        <div className="font-serif text-2xl tracking-[0.2em] text-[#e4e2e4] uppercase">
          CÓDICE
        </div>
        <div className="flex items-center gap-4 text-[#bec6e0]">
          <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors duration-300">help_outline</span>
          <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors duration-300">language</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center relative pt-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            alt="Archaeological site background" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale" 
            src="https://lh3.googleusercontent.com/aida/AP1WRLteRbOba3v1CqsLJVkjqiUQg_jnk-ChsdH7zPKJZTqVkP6t6cyoAR95anqaQz-9aWC38-FUjd95VGlVNCcTse5rRmpToP9SRcwI2ZHOc70iRcJ-Vs0BAUXUZiNKaAFzgeQ7DgUIPnc-uMPLi1Eo7y9Sjru9ZDt5BcYc5dxHSkg5zXBSIU1UJIr2jRmIJD8LDmhEVxEmMgu20w2m-DHPFlHrGm_mUupLjNyPxSxXuKa070tQqXGtekgpnw" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/80 to-transparent"></div>
        </div>

        {/* Recovery Card */}
        <div className="relative z-10 w-full max-w-md px-6 py-16">
          <div className="bg-[#0f172a]/70 backdrop-blur-[12px] p-8 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] border border-[#1e293b] border-t-2 border-t-[#ca8a04]/50">
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-4xl text-[#ca8a04] mb-4">lock_reset</span>
              <h1 className="font-serif text-2xl text-[#e4e2e4] mb-2 font-semibold">Recuperar Acceso</h1>
              <p className="text-[#c6c6cd] text-sm">Introduzca su correo electrónico institucional para recibir un enlace de restablecimiento seguro.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-950/40 border border-green-500/30 text-green-300 rounded-lg text-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {message}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSend}>
              <div className="relative">
                <label className="sr-only" htmlFor="email">Correo Electrónico</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#909097]">mail</span>
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 border-0 bg-[#2a2a2b] text-[#e4e2e4] placeholder-[#909097] focus:ring-1 focus:ring-[#ca8a04] rounded transition-all duration-300 font-mono text-sm"
                  id="email" 
                  name="email" 
                  placeholder="usuario@institucion.edu" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                className="w-full bg-[#ca8a04] text-[#0f172a] hover:bg-[#a16207] font-mono text-xs uppercase tracking-wider py-3 px-4 rounded transition-colors duration-300 flex justify-center items-center gap-2 font-bold" 
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link className="inline-flex items-center gap-2 font-mono text-xs text-[#bec6e0] hover:text-[#ca8a04] transition-colors duration-300 uppercase tracking-wider" href="/login">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0e0e10] border-t border-[#45464d] mt-auto relative z-10">
        <div className="font-serif text-3xl text-[#bec6e0] font-bold">
          CÓDICE
        </div>
        <div className="font-mono text-xs uppercase tracking-wider text-[#c6c6cd] text-center md:text-left">
          © 2024 CÓDICE Heritage Management. Institutional Grade Security.
        </div>
        <div className="flex gap-6 font-mono text-xs uppercase tracking-wider text-[#7e8183]">
          <a className="hover:text-[#bec6e0] transition-colors cursor-pointer" href="#">Privacy Policy</a>
          <a className="hover:text-[#bec6e0] transition-colors cursor-pointer" href="#">Terms of Service</a>
          <a className="hover:text-[#bec6e0] transition-colors cursor-pointer" href="#">Security Architecture</a>
          <a className="hover:text-[#bec6e0] transition-colors cursor-pointer" href="#">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
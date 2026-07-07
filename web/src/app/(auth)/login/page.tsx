'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('--- STARTING LOGIN REQUEST ---');
    console.log('Email to submit:', email);
    console.log('Password length being sent:', password.length);
    console.log('Password starts with:', password ? password[0] : 'empty');
    console.log('Password ends with:', password ? password[password.length - 1] : 'empty');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes(':3000')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:3001/api';

      console.log('API Target URL:', `${apiUrl}/auth/login`);

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      const data = await response.json();
      console.log('Response Body Data:', data);

      if (!response.ok) {
        let msg = 'Error al iniciar sesión.';
        if (data && data.message) {
          msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        }
        if (data && data.reason) {
          msg += ` Razón: ${data.reason}. Acción: ${data.action}`;
        }
        console.warn('Login rejection message:', msg);
        toast.error('Error del Servidor', { description: msg });
        throw new Error(msg);
      }

      console.log('Saving cookies client-side...');
      document.cookie = `auth_token=${data.data.token}; path=/; max-age=${15 * 60}; samesite=strict`;
      document.cookie = `refresh_token=${data.data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; samesite=strict`;
      console.log('Cookies saved. Document cookies content:', document.cookie);

      setSuccess(true);
      toast.success('¡Autenticación exitosa!', { description: 'Redirigiendo al panel...' });

      setTimeout(() => {
        console.log('Triggering router redirect to /dashboard');
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Login process caught exception:', err);
      toast.error('Error de Conexión o Proceso', { description: err.message || 'Error de conexión.' });
      setError(err.message || 'Error de conexión.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131315] text-[#e4e2e4] font-sans min-h-screen overflow-hidden">
      {/* Styles & Fonts injected dynamically for preview consistency */}
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <main className="flex min-h-screen w-full">
        {/* Left Side: Visual & Identity (Desktop Only) */}
        <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-[#45464d]/30">
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-10000 hover:scale-110" 
              style={{ 
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAYP39QTaR--cYI_nOntMdSIisNkFHIt1KNY78_lNfMrWnwgutZq6KErsbWEhO4NiL54DoNKlXOdynipz4garZsyBwGMs8S2jhWTrLkIjRqF_YX7GOj4wSzW4CotR89D8fyZjfr81VxPlWi5ZeydnHILHzoB88ONxsMH7Vw1p3_UOrbtoQDf7qYIvFVNvWBhC2N_ExB_MzP51EIjUiuoSz_Tr3z_ajelYB2nrASZSd388B7us6jh_4bgmync70NeR_bpKaKpxnmQCQ')`,
                filter: 'brightness(0.5)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/40 to-[#0f172a]/80 backdrop-blur-[4px]"></div>
          </div>
          
          <div className="relative z-10">
            <span className="font-serif text-3xl tracking-[0.2em] text-[#bec6e0] uppercase">CÓDICE</span>
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="font-serif text-5xl text-[#bec6e0] leading-tight mb-6 font-bold">
              Acceso Seguro al Inventario Patrimonial
            </h1>
            <div className="h-1 w-24 bg-[#ca8a04] mb-8"></div>
            <p className="text-[#c6c6cd] text-lg max-w-md">
              Sistema de gestión para arqueología, restauración y conservación de monumentos históricos nacionales.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-[#c6c6cd]">
            <span className="material-symbols-outlined text-[#ca8a04]">verified_user</span>
            <span className="font-mono text-xs uppercase tracking-widest">Protocolo de seguridad encriptado</span>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="w-full lg:w-1/2 bg-[#1e293b] flex items-center justify-center p-6 sm:p-20 relative">
          <div className="absolute top-8 left-6 lg:hidden">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#bec6e0] uppercase">CÓDICE</span>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="font-serif text-3xl text-[#bec6e0] mb-2 font-bold">Iniciar Sesión</h2>
              <p className="text-[#c6c6cd] text-sm">Ingrese sus credenciales institucionales para continuar.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-sm flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">alternate_email</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-4 pl-12 pr-4 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out"
                    id="email"                     placeholder="nombre@institucion.gob" 
                    required 
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || success}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="password">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="font-mono text-xs text-[#ca8a04] hover:underline transition-all">¿Olvidó su contraseña?</Link>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">lock</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-4 pl-12 pr-12 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out"
                    id="password"                     placeholder="••••••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || success}
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909097] hover:text-[#bec6e0] transition-colors" 
                    id="togglePassword" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-3">
                <input 
                  className="w-4 h-4 rounded border-[#45464d] bg-[#1b1b1d] text-[#ca8a04] focus:ring-[#ca8a04]" 
                  id="remember" 
                  type="checkbox" 
                />
                <label className="text-[#c6c6cd] text-xs font-mono cursor-pointer" htmlFor="remember">Mantener sesión iniciada</label>
              </div>

              {/* CTA Button */}
              <button 
                className={`w-full py-4 px-6 rounded-lg font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                  success 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#ca8a04] text-[#0f172a] hover:bg-[#a16207] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] focus:ring-2 focus:ring-[#ca8a04]/50'
                } active:scale-[0.98] outline-none`}                 type="submit"
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Validando...</span>
                  </>
                ) : success ? (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Bienvenido</span>
                  </>
                ) : (
                  <>
                    <span>Acceder al Sistema</span>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                  </>
                )}
              </button>
              
              <div className="mt-4 flex flex-col gap-2 text-center text-xs font-mono">
                <Link href="/register" className="text-[#ca8a04] hover:underline transition-all">
                  ¿No tienes cuenta? Regístrate aquí
                </Link>
                <Link href="/landing" className="text-[#909097] hover:text-[#bec6e0] hover:underline transition-all">
                  Volver al Inicio (Landing Page)
                </Link>
              </div>
            </form>

            {/* Footer / Support */}
            <div className="mt-12 pt-8 border-t border-[#45464d]/30 flex flex-col sm:flex-row gap-6 justify-between items-center">
              <div className="flex items-center gap-2 text-[#909097] text-xs font-mono">
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                Asistencia Técnica
              </div>
              <div className="flex gap-4 items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[#909097] text-xs font-mono">Servidores Operativos</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
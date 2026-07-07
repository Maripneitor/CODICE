'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Form validations
    const xssPattern = /[<>\/\\\[\]{}();]/;
    if (xssPattern.test(name) || name.trim() === '') {
      setToast({ message: 'El nombre contiene caracteres inválidos.', type: 'error' });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden.', type: 'error' });
      setLoading(false);
      return;
    }

    // Password strength check (10+ chars, upper, lower, number, special) supporting Unicode (Ñ, ñ, accents)
    const hasLower = /\p{Ll}/u.test(password);
    const hasUpper = /\p{Lu}/u.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^\p{L}\p{N}]/u.test(password);
    const isLongEnough = password.length >= 10;

    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial || !isLongEnough) {
      setToast({
        message: 'La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.',
        type: 'error',
      });
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes(':3000')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = 'Error al crear la cuenta.';
        if (data && data.message) {
          msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
        }
        throw new Error(msg);
      }

      setToast({ message: 'Registro exitoso. Iniciando sesión...', type: 'success' });

      // Automatically login the user
      const loginResponse = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error('Cuenta creada, pero falló el inicio de sesión automático. Por favor, ingrese manualmente.');
      }

      // Store local cookies just in case
      document.cookie = `auth_token=${loginData.data?.token}; path=/; max-age=${15 * 60}; samesite=strict`;
      document.cookie = `refresh_token=${loginData.data?.refreshToken}; path=/; max-age=${7 * 24 * 3600}; samesite=strict`;

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al conectar con el servidor.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131315] text-[#e4e2e4] font-sans min-h-screen overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="flex min-h-screen w-full">
        {/* Left Side: Visual */}
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
              Registro Institucional de Investigadores
            </h1>
            <div className="h-1 w-24 bg-[#ca8a04] mb-8"></div>
            <p className="text-[#c6c6cd] text-lg max-w-md">
              Únase a la red nacional de arqueólogos y restauradores para la protección activa del patrimonio cultural.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-[#c6c6cd]">
            <span className="material-symbols-outlined text-[#ca8a04]">verified_user</span>
            <span className="font-mono text-xs uppercase tracking-widest">Protocolo de seguridad encriptado</span>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="w-full lg:w-1/2 bg-[#1e293b] flex items-center justify-center p-6 sm:p-20 relative overflow-y-auto">
          <div className="absolute top-8 left-6 lg:hidden">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#bec6e0] uppercase">CÓDICE</span>
          </div>

          <div className="w-full max-w-md py-8">
            <div className="mb-8">
              <h2 className="font-serif text-3xl text-[#bec6e0] mb-2 font-bold">Crear Cuenta</h2>
              <p className="text-[#c6c6cd] text-sm">Regístrese con sus credenciales autorizadas.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="name">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">person</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-3.5 pl-12 pr-4 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out text-sm"
                    id="name" 
                    placeholder="Lic. Juan Pérez"                     required 
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="email">
                  Correo Institucional
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">alternate_email</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-3.5 pl-12 pr-4 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out text-sm"
                    id="email" 
                    placeholder="nombre@institucion.gob" 
                    required 
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">lock</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-3.5 pl-12 pr-12 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out text-sm"
                    id="password" 
                    placeholder="••••••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909097] hover:text-[#bec6e0] transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block font-mono text-xs text-[#c6c6cd] uppercase tracking-widest" htmlFor="confirmPassword">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#909097]">lock_reset</span>
                  <input 
                    className="w-full bg-[#1b1b1d] border border-[#45464d] text-[#e4e2e4] py-3.5 pl-12 pr-4 rounded-lg focus:outline-none focus:border-[#ca8a04] focus:ring-2 focus:ring-[#ca8a04]/50 transition-all duration-300 ease-in-out text-sm"
                    id="confirmPassword" 
                    placeholder="••••••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* CTA */}
              <button 
                className="w-full py-3.5 px-6 rounded-lg bg-[#ca8a04] text-[#0f172a] hover:bg-[#a16207] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:ring-2 focus:ring-[#ca8a04]/50 active:scale-[0.98] outline-none mt-4" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta</span>
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex flex-col gap-2 text-center text-xs font-mono">
                <Link href="/login" className="text-[#ca8a04] hover:underline transition-all">
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
                <Link href="/landing" className="text-[#909097] hover:text-[#bec6e0] hover:underline transition-all">
                  Regresar a la Landing Page
                </Link>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[#45464d]/30 flex justify-between items-center text-xs font-mono text-[#909097]">
              <span>Asistencia Técnica</span>
              <span>Servidores Operativos</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

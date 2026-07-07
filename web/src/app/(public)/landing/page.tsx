'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-[#131315] text-[#e4e2e4] font-sans antialiased selection:bg-[#0f172a] selection:text-[#bec6e0]">
      {/* Google Fonts and Material Symbols */}
      <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* TopNavBar Component */}
      <header className="fixed top-0 w-full z-50 bg-[#131315]/70 backdrop-blur-md border-b border-[#bec6e0]/20 transition-all duration-300">
        <div className="flex justify-between items-center px-6 md:px-20 py-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#bec6e0] uppercase">CÓDICE</span>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a className="font-mono text-xs uppercase tracking-wider hover:text-[#bec6e0] transition-colors duration-300 text-[#bec6e0] font-bold border-b-2 border-[#bec6e0] pb-1" href="#sistema">El Sistema</a>
            <a className="font-mono text-xs uppercase tracking-wider hover:text-[#bec6e0] transition-colors duration-300 text-[#c6c6cd] font-medium" href="#mision">Misión & Visión</a>
            <a className="font-mono text-xs uppercase tracking-wider hover:text-[#bec6e0] transition-colors duration-300 text-[#c6c6cd] font-medium" href="#seguridad">Seguridad</a>
            <a className="font-mono text-xs uppercase tracking-wider hover:text-[#bec6e0] transition-colors duration-300 text-[#c6c6cd] font-medium" href="#movil">Móvil Offline</a>
            <a className="font-mono text-xs uppercase tracking-wider hover:text-[#bec6e0] transition-colors duration-300 text-[#c6c6cd] font-medium" href="#contacto">Contacto</a>
          </nav>
          <div className="hidden md:flex items-center">
            <Link href="/login" className="bg-[#bec6e0] text-[#283044] font-mono text-xs uppercase tracking-wider px-6 py-3 rounded hover:opacity-90 transition-opacity duration-300">Acceder</Link>
          </div>
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-[#e4e2e4] p-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <main className="pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-20 pb-[120px] grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[80vh]">
          <div className="col-span-1 md:col-span-6 flex flex-col items-start z-10">
            <h1 className="font-serif text-5xl text-[#e4e2e4] mb-6 font-bold leading-tight animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              Sistema de control y flujo para tu almacén
            </h1>
            <p className="text-lg text-[#c6c6cd] mb-10 max-w-xl animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
              Catalogación, trazabilidad y gestión offline: control total de materiales y herramientas.
            </p>
            <div className="animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <Link href="/login" className="bg-[#bec6e0] text-[#283044] font-mono text-xs uppercase tracking-wider px-8 py-4 rounded flex items-center gap-3 hover:bg-[#dae2fd] transition-all duration-300 group shadow-[0_4px_12px_rgba(190,198,224,0.15)] hover:scale-[1.02] font-bold">
                Descubrir Códice
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="col-span-1 md:col-span-6 relative mt-12 md:mt-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="absolute inset-0 bg-[#bec6e0]/5 blur-3xl rounded-full -z-10 transform translate-x-10 translate-y-10"></div>
            <img 
              className="w-full h-auto rounded-lg border border-[#45464d] shadow-2xl transform hover:scale-[1.02] transition-transform duration-700 ease-out" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiqsk2yI11eVa6AjPbQM4WvHKS2l76Jky5DbfWPJSgjI8A-HhwrYl2_p6d1KYlOdPO9t-FnzuCLTVUBJAsoiFG5No8zL65PowJcVmgjfw1iyrnO0PwxaHjglG8cN3ZGFqmI1x_zYiSZJagsTmi7R56V071nDBd3Fr5CvIx_M4rZpCG8zPo9SIQVDomkfJ60zWID242pHa15hBzbQG6IO5haVv7xR9P5zB-zZiLtws9Rvyx-tUaFAsctZA3is0igZjcEb9WsXZgUOI"
              alt="Códice Showcase"
            />
          </div>
        </section>

        {/* New Section: Misión, Visión y Qué Hacemos */}
        <section id="mision" className="bg-[#1f1f21]/40 py-[120px] border-t border-[#45464d]/30 relative overflow-hidden transition-all duration-500 ease-in-out">
          <div className="max-w-[1280px] mx-auto px-6 md:px-20 relative z-10">
            <div className="text-center mb-16 max-w-2xl mx-auto animate-slide-up">
              <span className="font-mono text-xs text-[#ca8a04] uppercase tracking-wider font-bold">Identidad Institucional</span>
              <h2 className="font-serif text-4xl text-[#e4e2e4] mt-2 mb-4 font-semibold">Misión, Visión y Qué Hacemos</h2>
              <p className="text-lg text-[#c6c6cd]">Digitalizando pases de herramientas y materiales de forma infalible.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#1f1f21] p-8 rounded-lg border border-[#45464d]/40 hover:border-[#ca8a04]/60 hover:bg-[#222224] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 group animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <span className="material-symbols-outlined text-[#ca8a04] mb-6 text-4xl group-hover:scale-110 transition-transform duration-300">my_location</span>
                <h3 className="font-serif text-xl text-[#e4e2e4] mb-3 font-semibold">Nuestra Misión</h3>
                <p className="text-[#c6c6cd] text-sm leading-relaxed">
                  Proteger y salvaguardar la trazabilidad de inventarios históricos y arqueológicos nacionales mediante herramientas tecnológicas avanzadas de registro continuo e inmutable.
                </p>
              </div>

              <div className="bg-[#1f1f21] p-8 rounded-lg border border-[#45464d]/40 hover:border-[#ca8a04]/60 hover:bg-[#222224] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 group animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                <span className="material-symbols-outlined text-[#ca8a04] mb-6 text-4xl group-hover:scale-110 transition-transform duration-300">visibility</span>
                <h3 className="font-serif text-xl text-[#e4e2e4] mb-3 font-semibold">Nuestra Visión</h3>
                <p className="text-[#c6c6cd] text-sm leading-relaxed">
                  Convertirnos en el estándar de interoperabilidad patrimonial y control físico-digital, permitiendo operaciones eficientes en campo sin dependencia de conectividad.
                </p>
              </div>

              <div className="bg-[#1f1f21] p-8 rounded-lg border border-[#45464d]/40 hover:border-[#ca8a04]/60 hover:bg-[#222224] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 group animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <span className="material-symbols-outlined text-[#ca8a04] mb-6 text-4xl group-hover:scale-110 transition-transform duration-300">handyman</span>
                <h3 className="font-serif text-xl text-[#e4e2e4] mb-3 font-semibold">¿Qué Hacemos?</h3>
                <p className="text-[#c6c6cd] text-sm leading-relaxed">
                  Proveemos un ecosistema robusto de auditoría con pases de herramientas, firmas biométricas encriptadas, etiquetas QR blindadas y sincronización bidireccional en lotes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Challenges and Solutions */}
        <section id="sistema" className="bg-[#0e0e10] py-[120px] border-y border-[#45464d]/30 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-[#0f172a]/20 to-transparent blur-3xl pointer-events-none"></div>
          <div className="max-w-[1280px] mx-auto px-6 md:px-20 relative z-10">
            <div className="text-center mb-16 max-w-2xl mx-auto animate-slide-up">
              <h2 className="font-serif text-4xl text-[#e4e2e4] mb-4 font-semibold">De la Obra al Registro Digital</h2>
              <p className="text-lg text-[#c6c6cd]">Superando las barreras técnicas en entornos patrimoniales de alta complejidad.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
              {/* Left Column: Challenges */}
              <div className="flex flex-col gap-6">
                <h3 className="font-mono text-xs text-[#909097] uppercase tracking-wider border-b border-[#45464d]/50 pb-4 mb-2">El Trabajo de Campo</h3>
                <div className="bg-[#1f1f21] p-8 rounded-lg border border-[#45464d]/50 flex flex-col justify-between h-full hover:bg-[#2a2a2b] hover:border-[#ca8a04]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300">
                  <div>
                    <span className="material-symbols-outlined text-[#909097] mb-6 text-4xl">wifi_off</span>
                    <h4 className="font-serif text-2xl text-[#e4e2e4] mb-3 font-semibold">Falta de conexión en zonas de trabajo</h4>
                    <p className="text-[#c6c6cd] text-sm">La recolección de datos se detiene o se vuelve propensa a errores manuales cuando se pierde la señal en interiores de monumentos o estructuras aisladas.</p>
                  </div>
                </div>
                <div className="bg-[#1f1f21] p-8 rounded-lg border border-[#45464d]/50 flex flex-col justify-between h-full hover:bg-[#2a2a2b] hover:border-[#ca8a04]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300">
                  <div>
                    <span className="material-symbols-outlined text-[#909097] mb-6 text-4xl">history_toggle_off</span>
                    <h4 className="font-serif text-2xl text-[#e4e2e4] mb-3 font-semibold">Pérdida de trazabilidad</h4>
                    <p className="text-[#c6c6cd] text-sm">El traslado de materiales y herramientas desde el almacén hasta los puntos de intervención frecuentemente resulta en pérdida de control sin un registro riguroso de pases de entrada y salida.</p>
                  </div>
                </div>
              </div>
              {/* Right Column: Solutions */}
              <div className="flex flex-col gap-6">
                <h3 className="font-mono text-xs text-[#bec6e0] uppercase tracking-wider border-b border-[#bec6e0]/30 pb-4 mb-2">Tecnología Códice</h3>
                <div id="movil" className="bg-[#0f172a]/20 p-8 rounded-lg border border-[#bec6e0]/40 flex flex-col justify-between h-full backdrop-blur-sm hover:bg-[#0f172a]/40 hover:border-[#ca8a04]/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#bec6e0]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="relative z-10">
                    <span className="material-symbols-outlined text-[#bec6e0] mb-6 text-4xl">sync</span>
                    <h4 className="font-serif text-2xl text-[#bec6e0] mb-3 font-semibold">Sincronización Offline-First</h4>
                    <p className="text-[#bec6e0] text-sm">Arquitectura de base de datos local robusta que permite registrar, editar y catalogar sin conexión. La sincronización se realiza automáticamente y sin conflictos al recuperar la red.</p>
                  </div>
                </div>
                <div id="seguridad" className="bg-[#0f172a]/20 p-8 rounded-lg border border-[#bec6e0]/40 flex flex-col justify-between h-full backdrop-blur-sm hover:bg-[#0f172a]/40 hover:border-[#ca8a04]/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#bec6e0]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                  <div className="relative z-10">
                    <span className="material-symbols-outlined text-[#bec6e0] mb-6 text-4xl">track_changes</span>
                    <h4 className="font-serif text-2xl text-[#bec6e0] mb-3 font-semibold">Auditoría de Movimientos en tiempo real</h4>
                    <p className="text-[#bec6e0] text-sm">Registro inmutable de cada cambio de estado, ubicación y custodio del artefacto, garantizando una cadena de custodia digital perfecta desde la tierra hasta la vitrina.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-20 py-[120px] flex flex-col gap-32">
          {/* Block 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="col-span-1 md:col-span-5 order-2 md:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded bg-[#1f1f21] border border-[#45464d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#bec6e0]">qr_code_scanner</span>
                </div>
                <span className="font-mono text-xs text-[#909097] uppercase tracking-wider">Identidad Física y Digital</span>
              </div>
              <h3 className="font-serif text-4xl text-[#e4e2e4] mb-6 font-semibold">Generación de Códigos QR y Etiquetado</h3>
              <p className="text-lg text-[#c6c6cd] mb-8">Emisión automatizada de etiquetas de alta durabilidad vinculadas a la base de datos central. Escaneo rápido en campo para recuperar instantáneamente la ficha técnica, histórico de intervenciones y documentación fotográfica del objeto.</p>
              <ul className="flex flex-col gap-4 text-[#e4e2e4]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#bec6e0] text-xl">check_circle</span>
                  <span>Formatos de impresión industrial compatibles</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#bec6e0] text-xl">check_circle</span>
                  <span>Lectura óptima en condiciones de baja luminosidad</span>
                </li>
              </ul>
            </div>
            <div className="col-span-1 md:col-span-7 order-1 md:order-2 relative group">
              <div className="absolute inset-0 bg-[#bec6e0]/20 rounded-lg transform translate-x-4 translate-y-4 -z-10 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
              <img 
                className="w-full h-auto rounded-lg shadow-xl border border-[#45464d] object-cover aspect-[4/3] relative z-10" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk6Bqoa6efPrACWoZzZS5woxghhjruuxCfPnj_eOqDJoS-1ZZtrFAd1QntzE6w4QP-GxBzvEWQovJPfFkIZglzLfMKEmVQGy9f6zk51g8drEblJBiQMCtynRr_y9XeVfaWSycPJV25kHcyiPWuaEtXXYiK_82-fM4hfIczjINljGV7nnRKGiWefKnoTWQdSek2TACuj--lzU8FVpvpBag2VwXtmyfD0YNBJzAf65HbOcS7EyssL5LvKHMMIrBRgPtknV_-ajldzCQ"
                alt="QR Labeling system"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <footer id="contacto" className="bg-[#0e0e10] border-t border-[#45464d] w-full">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-20 py-12 max-w-[1280px] mx-auto gap-8 md:gap-0">
          <div className="flex items-center gap-4">
            <span className="font-serif text-2xl text-[#bec6e0] font-semibold">Códice</span>
          </div>
          <div className="text-center md:text-left text-[#c4c7c9] text-xs font-mono">
            © 2026 Códice. Catalogación, trazabilidad y gestión offline para proyectos de restauración monumental. [Privacidad] [Términos] [Soporte] [Documentación]
          </div>
        </div>
      </footer>
    </div>
  );
}
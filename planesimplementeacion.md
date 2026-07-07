Primer plan hecho por la ia 

Plan de Implementación - Fase 1: Autenticación Segura e Infraestructura
Este plan detalla los pasos para realizar la Fase 1 del proyecto Codice, configurando la base de datos y caché, securizando la API de NestJS, implementando la autenticación e integrando el flujo en las aplicaciones web y móviles.

User Review Required
IMPORTANT

Utilizaremos TypeORM con PostgreSQL como la capa de persistencia en NestJS.
Se habilitará cookie-parser en el backend para poder inyectar y leer cookies seguras HTTP-Only (Secure, SameSite=Strict, HttpOnly).
Utilizaremos un cliente de Redis integrado con @nestjs/throttler para implementar limitación de tasa (Rate Limiting) centralizada.
Proposed Changes
[Componente: Infraestructura]
Configuración del entorno Docker Compose y variables de entorno globales.

[MODIFY] 
docker-compose.yml
Validar el archivo actual que ya cuenta con los servicios postgres y redis expuestos en los puertos por defecto.
[NEW] 
.env.example
Declarar variables de configuración para la base de datos (host, puerto, usuario, contraseña, nombre de BD), Redis, puerto del servidor, secretos del JWT y configuración de cookies.
[NEW] 
.env
Archivo local con valores listos para ejecución y desarrollo local seguro.
[Componente: Backend (NestJS)]
Hardening perimetral y lógica de autenticación defensiva.

[MODIFY] 
package.json
Añadir dependencias: helmet, @nestjs/throttler, ioredis, bcrypt, class-validator, class-transformer, @nestjs/jwt, pg, @nestjs/typeorm, typeorm, cookie-parser, dotenv.
DevDependencies: @types/bcrypt, @types/cookie-parser.
[MODIFY] 
src/main.ts
Configurar helmet globalmente.
Configurar cookie-parser.
Configurar ValidationPipe global con { whitelist: true, forbidNonWhitelisted: true }.
Habilitar CORS con credentials: true apuntando a la URL del frontend.
Establecer prefijo global /api.
[MODIFY] 
src/app.module.ts
Importar y configurar TypeOrmModule usando variables de entorno.
Importar y configurar ThrottlerModule con almacenamiento en Redis.
Registrar el controlador y servicios correspondientes.
[NEW] [Módulo de Autenticación en Backend]
Crear la entidad User para persistir el email (único), la contraseña hasheada y campos para tokens de recuperación.
Crear DTOs estrictos (RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto) con validaciones fuertes (regex de correo electrónico, longitud mínima de password y sanitización de texto para evitar XSS/SQL Injection).
Implementar hashing con bcrypt y salt de 12.
Implementar AuthService para validar credenciales, generar el JWT firmado con HS256 e inyectarlo en cookies seguras HTTP-Only.
Implementar AuthController exponiendo /api/auth/register, /api/auth/login, /api/auth/forgot-password, /api/auth/reset-password.
[Componente: Web (Next.js)]
Protección de rutas del lado del servidor e integración de interfaces base.

[NEW] 
middleware.ts
Middleware que intercepta rutas protegidas (ej. /dashboard, /catalog, /settings).
Leer el token de la cookie HTTP-Only y validar su estructura/firma básica. Redirigir a /login si no existe o es inválido.
[MODIFY] Vistas Base
Inyectar el código de vistas proporcionado para login, landing, forgot-password y reset-password.
Conectar los formularios con fetch/axios enviando la cabecera credentials: 'include' para el correcto intercambio de cookies.
[Componente: Móvil (Expo)]
Persistencia cifrada y control de flujo de acceso.

[NEW] 
services/secure-storage/secure-store.service.ts
Implementación de guardado y recuperación de tokens usando expo-secure-store.
[MODIFY] 
app/_layout.tsx
Modificar el enrutamiento raíz para leer el token al iniciar la app.
Redirigir a (auth)/login si no hay token válido.
Verification Plan
Automated Tests & Scripts
Prueba de Inyección: Enviar payloads con XSS o SQLi y verificar error 400.
Prueba de Atributos de Cookie: Validar las cabeceras Set-Cookie para certificar HttpOnly; Secure; SameSite=Strict.
Prueba de Bloqueo Móvil: Probar redirecciones en Expo Router al no haber sesión.


--------------------------------------------------------------

Plan de Implementación - Fase 2: Operación Local y Núcleo de Negocio
Este plan detalla los pasos para realizar la Fase 2 del proyecto Codice, incluyendo la transpilación final de las vistas a TSX, el desarrollo del módulo de artefactos con Arquitectura Limpia y control de acceso (RBAC), la conexión de las interfaces Next.js con el backend y la inicialización de WatermelonDB en Expo.

User Review Required
IMPORTANT

Utilizaremos Next.js <Link> en lugar de etiquetas <a> en todas las páginas web.
El backend de artefactos se estructurará siguiendo los principios de la Arquitectura Limpia en backend/src/modules/artifacts/ (domain, application, infra).
Implementaremos un RolesGuard en el backend para validar los roles de usuario (admin, restorer, viewer) extraídos del JWT.
En la parte móvil, configuraremos WatermelonDB para el almacenamiento local offline.
Proposed Changes
[Componente: Web Vistas y globals.css]
Asegurar cumplimiento estricto de las directivas de transpilación.

[MODIFY] 
landing/page.tsx
Reemplazar etiquetas <a> por <Link href="..."> importado de next/link.
[MODIFY] 
login/page.tsx
Reemplazar etiquetas <a> por <Link href="..."> importado de next/link.
[MODIFY] 
forgot-password/page.tsx
Reemplazar etiquetas <a> por <Link href="..."> importado de next/link.
[MODIFY] 
reset-password/page.tsx
Reemplazar etiquetas <a> por <Link href="..."> importado de next/link.
[Componente: Backend (NestJS)]
Módulo de artefactos y control de acceso RBAC.

[NEW] [Roles Decorator & Guard]
Crear roles.decorator.ts y roles.guard.ts en backend/src/common/guards/ para verificar roles (admin, restorer, viewer) desde el token JWT.
[NEW] [Módulo de Artefactos (domain)]
Crear entidades de dominio Artifact y ArtifactMovement en backend/src/modules/artifacts/domain/.
[NEW] [Módulo de Artefactos (application)]
Crear casos de uso CreateArtifactUseCase, ListArtifactsUseCase, GetArtifactByIdUseCase, UpdateArtifactUseCase en backend/src/modules/artifacts/application/.
[NEW] [Módulo de Artefactos (infra)]
Crear ArtifactController en backend/src/modules/artifacts/infra/ con protección por RolesGuard.
Implementar validación y sanitización anti-malware (XSS) en la descripción del artefacto.
[Componente: Web (Next.js)]
Conectar vistas protegidas con endpoints reales del backend.

[MODIFY] Vistas del ERP Web
Adaptar y conectar a TSX: dashboard/page.tsx, catalog/page.tsx, catalog/[id]/page.tsx, warehouses/page.tsx, profile/page.tsx, dictionaries/page.tsx y settings/page.tsx.
[Componente: Móvil (Expo)]
Persistencia local e interfaces offline.

[NEW] [Schema & Database setup]
Inicializar y configurar WatermelonDB en mobile/. Definir el esquema relacional con artifacts y artifact_movements.
[MODIFY] Vistas Móviles
Conectar index.tsx, new-artifact.tsx, transfer-form.tsx, y artifact-profile.tsx para persistir datos localmente en WatermelonDB.
Verification Plan
Automated Tests
Compilación Web: Ejecutar npm run build en web/ y validar salida 0.
RBAC Check: Probar con cURL que viewer reciba 403 Forbidden en POST /api/artifacts.
Offline Check: Simular inserción offline y validar en base de datos local con flag synchronized: false.
























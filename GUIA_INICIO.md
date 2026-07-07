# CÓDICE - Guía de Inicio Rápido y Flujo de Trabajo

Esta guía te guiará para encender, correr y validar el monorrepo **Códice** (Backend, Web y Móvil) en menos de 5 minutos.

---

## 📦 1. Requisitos Previos

Antes de arrancar, asegúrate de tener instalado en tu máquina local:
- **Node.js:** Versión v20 o superior.
- **Docker Desktop:** Activo y corriendo (para PostgreSQL y Redis).
- **Expo Go App:** Instalado en tu dispositivo móvil (iOS/Android) o contar con un emulador configurado.
- **Git:** Para control de versiones.

---

## 🚀 2. Levantamiento del Entorno en 3 Pasos

### Paso 1: Infraestructura Base (Bases de Datos)
1. Sitúate en la raíz del proyecto.
2. Copia el archivo `.env.example` a `.env` (si aún no existe):
   ```bash
   cp .env.example .env
   ```
3. Enciende los contenedores de PostgreSQL y Redis:
   ```bash
   docker-compose up -d
   ```
   *Nota: Postgres arrancará en el puerto `5432` y Redis en el `6379`.*

### Paso 2: Servidor Backend (NestJS)
1. Accede al directorio `backend/`:
   ```bash
   cd backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```
   *El servidor compilará y se expondrá en `http://localhost:3000/api`.*

### Paso 3: Clientes (Web Next.js y Móvil Expo)

#### Panel de Administración Web (Next.js)
1. Accede al directorio `web/` desde una nueva terminal:
   ```bash
   cd web
   ```
2. Instala las dependencias y arranca el entorno:
   ```bash
   npm install
   ```
   ```bash
   npm run dev
   ```
   *La consola web estará disponible en `http://localhost:3001`.*

#### Aplicación Móvil de Campo (Expo)
1. Accede al directorio `mobile/` desde una nueva terminal:
   ```bash
   cd mobile
   ```
2. Instala dependencias e inicia el Metro Bundler:
   ```bash
   npm install --legacy-peer-deps
   ```
   ```bash
   npx expo start
   ```
3. Escanea el código QR que se muestra en tu terminal con la app **Expo Go** en tu celular para cargar la aplicación.

---

## 🔄 3. Flujo de Trabajo y Casos de Prueba Rápido

### A. Acceso Inicial
- Abre en tu navegador la Landing Page (`http://localhost:3001/landing`).
- Haz clic en **Acceder** para ir al Login.
- Ingresa las credenciales del usuario semilla cargado por defecto:
  - **Email:** `admin@codice-heritage.org` o `restorer@codice-heritage.org`
  - **Contraseña:** `AdminPassword123!` (o la configurada en tu seed).

### B. Simulación Offline-First
1. Abre la aplicación de Expo en tu celular.
2. Desconecta el Wi-Fi/Datos de tu teléfono celular (Modo Avión).
3. Entra a la pantalla **Registrar Pieza** y llena el formulario (ej: Código: `HR-Offline-1`, Nombre: `Vasija de Campo`).
4. Guarda el registro. Verás que se guarda localmente en **WatermelonDB**.
5. Abre la pantalla **Cola de Sincronización** (`sync-queue`).
6. Vuelve a encender el Wi-Fi/Datos. El sistema detectará la red y enviará el batch a `POST /api/sync/push` automáticamente de forma silenciosa.

### C. Matriz de Control de Acceso (RBAC)

| Rol | Operaciones de Lectura (`GET`) | Operaciones de Mutación (`POST`, `PATCH`) |
| :--- | :--- | :--- |
| **admin** | ✅ Permitido | ✅ Permitido |
| **restorer** | ✅ Permitido | ✅ Permitido |
| **viewer** | ✅ Permitido | ❌ Denegado (`403 Forbidden`) |

---

## 🔒 4. Puntos de Control de Seguridad (Hardening Activo)

El ecosistema cuenta con los siguientes mecanismos de ciberseguridad:
1. **Seguridad de Sesiones:** La autenticación inyecta una cookie `auth_token` configurada como `HttpOnly`, `Secure` y `SameSite=Strict` para mitigar ataques XSS y CSRF.
2. **Mitigación DoS:** Los endpoints críticos (como la generación de QR en `/api/artifacts/:id/qr`) están protegidos con Rate Limiting a un máximo de 10 req/min por usuario.
3. **Validación y Sanitización:** El backend sanitiza todo campo de texto libre (como la descripción del artefacto) barriendo cualquier tag HTML o inyección de scripts potencialmente dañina.

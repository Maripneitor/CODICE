export interface ErrorDetails {
  code: string;
  reason: string;
  action: string;
}

export const ERROR_CODES: Record<string, ErrorDetails> = {
  'CODICE-AUTH-001': {
    code: 'CODICE-AUTH-001',
    reason: 'Credenciales inválidas, contraseña errónea o cuenta inactiva.',
    action: 'Verifique su correo y contraseña o solicite un código OTP.',
  },
  'CODICE-AUTH-002': {
    code: 'CODICE-AUTH-002',
    reason: 'Código OTP inválido o expirado.',
    action: 'Solicite un nuevo código OTP desde la aplicación móvil.',
  },
  'CODICE-AUTH-003': {
    code: 'CODICE-AUTH-003',
    reason: 'Su cuenta ha sido suspendida por el administrador.',
    action: 'Contacte al administrador del sistema para reactivar su acceso.',
  },
  'CODICE-DB-023': {
    code: 'CODICE-DB-023',
    reason: 'La operación viola la integridad referencial en la base de datos.',
    action: 'Asegúrese de que los recursos vinculados existan previamente.',
  },
  'CODICE-DB-024': {
    code: 'CODICE-DB-024',
    reason: 'El registro de datos ya existe en la base de datos.',
    action: 'Verifique que el código identificador único no esté duplicado.',
  },
  'CODICE-SYS-500': {
    code: 'CODICE-SYS-500',
    reason: 'Ocurrió un error inesperado al procesar la solicitud en el servidor.',
    action: 'Proporcione el código de referencia al equipo de soporte técnico.',
  },
};

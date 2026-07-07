import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { auditLogger } from '../audit-logger';
import { ERROR_CODES } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let customCode = 'CODICE-SYS-500';
    let message = 'Ocurrió un error interno en el servidor.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = exception.name;
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        message = resObj.message || message;
        error = resObj.error || error;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      // Map HttpException status or messages to business codes
      if (status === HttpStatus.UNAUTHORIZED) {
        if (message.toString().includes('OTP')) {
          customCode = 'CODICE-AUTH-002';
        } else {
          customCode = 'CODICE-AUTH-001';
        }
      } else if (status === HttpStatus.FORBIDDEN) {
        customCode = 'CODICE-AUTH-003';
      }
    } else {
      // Generate unhandled trace error ID
      const errId = `ERR-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      
      // Log structured error trace using Winston
      auditLogger.error({
        errorId: errId,
        message: exception.message || 'No message provided',
        stack: exception.stack || 'No stack provided',
        timestamp: new Date().toISOString(),
      });

      // Securely handle key violations
      if (exception.code === '23505') { // PostgreSQL Unique Violation
        customCode = 'CODICE-DB-024';
        message = 'El registro de datos ya existe en el sistema.';
        error = 'Conflict';
        status = HttpStatus.CONFLICT;
      } else if (exception.code === '23503') { // PostgreSQL Foreign Key Violation
        customCode = 'CODICE-DB-023';
        message = 'La operación viola la integridad referencial de los datos.';
        error = 'Bad Request';
        status = HttpStatus.BAD_REQUEST;
      } else {
        customCode = 'CODICE-SYS-500';
        message = `Ocurrió un error interno en el servidor. Código de referencia: ${errId}`;
        error = 'Internal Server Error';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    const errDetails = ERROR_CODES[customCode] || ERROR_CODES['CODICE-SYS-500'];

    response.status(status).json({
      success: false,
      code: errDetails.code,
      error,
      message: Array.isArray(message) ? message : [message],
      reason: errDetails.reason,
      action: errDetails.action,
      timestamp: new Date().toISOString(),
    });
  }
}

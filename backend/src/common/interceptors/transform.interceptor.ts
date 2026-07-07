import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    let message = 'Operación realizada con éxito';
    if (statusCode === 201) {
      message = 'Elemento guardado en la nube con éxito';
    } else if (statusCode === 204) {
      message = 'Elemento eliminado con éxito';
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in standardized format, return it
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          data: data?.data !== undefined ? data.data : data,
          message: data?.message || message,
        };
      }),
    );
  }
}

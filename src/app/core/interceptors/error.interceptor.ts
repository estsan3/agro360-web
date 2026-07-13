import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Captura global de errores HTTP: traduce el error técnico a un mensaje
 * amigable. Cuando exista el módulo notifications/ (Paso 11), acá se
 * disparará el toast — ningún componente maneja errores HTTP a mano.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = friendlyMessage(error);
      // TODO(paso 11): inject(NotificationStore).notifyError(message)
      return throwError(() => new Error(message));
    }),
  );
};

function friendlyMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'No hay conexión con el servidor';
    case 401:
      return 'Credenciales inválidas o sesión expirada';
    case 403:
      return 'No tenés permisos para esta operación';
    case 404:
      return 'El recurso solicitado no existe';
    case 422:
      return 'Los datos enviados no son válidos';
    default:
      return 'Ocurrió un error inesperado. Intentalo de nuevo.';
  }
}

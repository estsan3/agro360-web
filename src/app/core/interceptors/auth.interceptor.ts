import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Adjunta credenciales (cookie httpOnly) a todas las llamadas a la API.
 * No maneja tokens: el navegador envía la cookie automáticamente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiBaseUrl)) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};

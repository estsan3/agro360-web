import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';

const MOCK_USER: User = {
  id: 'u-1',
  nombre: 'María González',
  email: 'admin@agro360.com',
  rol: 'administrador',
};

// Simula la cookie de sesión del backend (en memoria)
let sessionActive = false;

/**
 * API fake para desarrollar sin backend. Se desactiva completo con
 * environment.mockApi = false cuando exista el backend Python.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockApi || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const path = req.url.slice(environment.apiBaseUrl.length);

  if (req.method === 'POST' && path === '/auth/login') {
    const { email, password } = req.body as { email?: string; password?: string };
    if (email && password && password.length >= 4) {
      sessionActive = true;
      return ok({ ...MOCK_USER, email });
    }
    return fail(401);
  }

  if (req.method === 'GET' && path === '/auth/me') {
    return sessionActive ? ok(MOCK_USER) : fail(401);
  }

  if (req.method === 'POST' && path === '/auth/logout') {
    sessionActive = false;
    return ok(null);
  }

  return next(req);
};

function ok(body: unknown) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(400));
}

function fail(status: number) {
  return throwError(() => new HttpErrorResponse({ status })).pipe(delay(400));
}

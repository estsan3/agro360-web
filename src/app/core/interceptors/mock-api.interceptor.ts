import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';
import { MOCK_CATALOGOS, MOCK_DESPACHOS, MockDespacho } from './mock-data';

const MOCK_USER: User = {
  id: 'u-1',
  nombre: 'María González',
  email: 'admin@agro360.com',
  rol: 'administrador',
};

// Simula la cookie de sesión del backend (en memoria)
let sessionActive = false;

// "Base de datos" de despachos en memoria
const despachosDb: MockDespacho[] = [...MOCK_DESPACHOS];
let nextDespachoId = despachosDb.length + 1;

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
    // Simula credenciales inválidas con contraseñas de menos de 8 caracteres
    const { email, password } = req.body as { email?: string; password?: string };
    if (email && password && password.length >= 8) {
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

  if (req.method === 'GET' && path === '/catalogos') {
    return ok(MOCK_CATALOGOS);
  }

  if (req.method === 'GET' && path === '/despachos') {
    return ok(despachosDb);
  }

  if (req.method === 'POST' && path === '/despachos') {
    const body = req.body as Omit<MockDespacho, 'id' | 'viajes'> & {
      viajes: Omit<MockDespacho['viajes'][number], 'id' | 'estado'>[];
    };
    const nuevo: MockDespacho = {
      ...body,
      id: `d-${nextDespachoId++}`,
      viajes: body.viajes.map((viaje, index) => ({
        ...viaje,
        id: `#${12350 + index}`,
        estado: 'pendiente' as const,
      })),
    };
    despachosDb.push(nuevo);
    return ok(nuevo);
  }

  const deleteMatch = /^\/despachos\/(.+)$/.exec(path);
  if (req.method === 'DELETE' && deleteMatch) {
    const index = despachosDb.findIndex((despacho) => despacho.id === deleteMatch[1]);
    if (index === -1) {
      return fail(404);
    }
    despachosDb.splice(index, 1);
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

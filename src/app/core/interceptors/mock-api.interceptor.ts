import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';
import {
  MOCK_CATALOGOS,
  MOCK_CONVERSACIONES,
  MOCK_DESPACHOS,
  MOCK_USUARIOS,
  MockConversacion,
  MockDespacho,
  MockParametros,
  MockPreferencias,
  MockUsuario,
} from './mock-data';

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

// Conversaciones en memoria (deep copy para poder mutar mensajes)
const conversacionesDb: MockConversacion[] = structuredClone(MOCK_CONVERSACIONES);
let nextMensajeId = 100;

// Configuración en memoria
const usuariosDb: MockUsuario[] = [...MOCK_USUARIOS];
let nextUsuarioId = usuariosDb.length + 1;
let nextViajeId = 30;
const catalogosDb = structuredClone(MOCK_CATALOGOS);
let nextCatalogoId = 100;
let parametros: MockParametros = { precio_por_tonelada: 1000, moneda: 'ARS' };
let preferencias: MockPreferencias = {
  viaje_retrasado: true,
  viaje_completado: true,
  mensaje_chofer: true,
};

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
    return ok(catalogosDb);
  }

  // --- Configuración: usuarios ---
  if (req.method === 'GET' && path === '/usuarios') {
    return ok(usuariosDb);
  }
  if (req.method === 'POST' && path === '/usuarios') {
    const nuevo: MockUsuario = {
      ...(req.body as Omit<MockUsuario, 'id'>),
      id: `u-${nextUsuarioId++}`,
    };
    usuariosDb.push(nuevo);
    return ok(nuevo);
  }
  const usuarioMatch = /^\/usuarios\/(.+)$/.exec(path);
  if (req.method === 'DELETE' && usuarioMatch) {
    const index = usuariosDb.findIndex((u) => u.id === usuarioMatch[1]);
    if (index === -1) {
      return fail(404);
    }
    usuariosDb.splice(index, 1);
    return ok(null);
  }

  // --- Configuración: parámetros y preferencias ---
  if (path === '/parametros') {
    if (req.method === 'PUT') {
      parametros = { ...parametros, ...(req.body as Partial<MockParametros>) };
    }
    return ok(parametros);
  }
  if (path === '/preferencias') {
    if (req.method === 'PUT') {
      preferencias = { ...preferencias, ...(req.body as Partial<MockPreferencias>) };
    }
    return ok(preferencias);
  }

  // --- Configuración: catálogos maestros ---
  if (req.method === 'POST' && path === '/catalogos/productores') {
    const nuevo = { ...(req.body as { nombre: string }), id: `p-${nextCatalogoId++}`, campos: [] };
    catalogosDb.productores.push(nuevo);
    return ok(nuevo);
  }
  const campoMatch = /^\/catalogos\/productores\/([^/]+)\/campos$/.exec(path);
  if (req.method === 'POST' && campoMatch) {
    const productor = catalogosDb.productores.find((p) => p.id === campoMatch[1]);
    if (!productor) {
      return fail(404);
    }
    const nuevo = { ...(req.body as { nombre: string }), id: `c-${nextCatalogoId++}` };
    productor.campos.push(nuevo);
    return ok(nuevo);
  }
  if (req.method === 'POST' && path === '/catalogos/choferes') {
    const nuevo = {
      ...(req.body as { nombre: string; dominio: string }),
      id: `ch-${nextCatalogoId++}`,
    };
    catalogosDb.choferes.push(nuevo);
    return ok(nuevo);
  }
  if (req.method === 'POST' && path === '/catalogos/vendedores') {
    const nuevo = { ...(req.body as { nombre: string }), id: `v-${nextCatalogoId++}` };
    catalogosDb.vendedores.push(nuevo);
    return ok(nuevo);
  }
  if (req.method === 'POST' && path === '/catalogos/materiales') {
    const { nombre } = req.body as { nombre: string };
    if (!catalogosDb.materiales.includes(nombre)) {
      catalogosDb.materiales.push(nombre);
    }
    return ok({ nombre });
  }
  const catalogoDeleteMatch =
    /^\/catalogos\/(productores|choferes|vendedores|materiales)\/([^/]+)$/.exec(path);
  if (req.method === 'DELETE' && catalogoDeleteMatch) {
    const [, tipo, id] = catalogoDeleteMatch;
    if (tipo === 'materiales') {
      catalogosDb.materiales = catalogosDb.materiales.filter((m) => m !== decodeURIComponent(id));
    } else {
      const lista = catalogosDb[tipo as 'productores' | 'choferes' | 'vendedores'] as {
        id: string;
      }[];
      const index = lista.findIndex((item) => item.id === id);
      if (index === -1) {
        return fail(404);
      }
      lista.splice(index, 1);
    }
    return ok(null);
  }

  if (req.method === 'GET' && path === '/despachos') {
    return ok(despachosDb);
  }

  if (req.method === 'POST' && path === '/despachos') {
    const body = req.body as Omit<MockDespacho, 'id' | 'viajes'> & {
      viajes: Omit<
        MockDespacho['viajes'][number],
        'id' | 'estado' | 'progreso' | 'observaciones'
      >[];
    };
    const nuevo: MockDespacho = {
      ...body,
      id: `d-${nextDespachoId++}`,
      viajes: body.viajes.map((viaje, index) => ({
        ...viaje,
        id: `#${12350 + nextViajeId++ + index}`,
        estado: body.estado === 'borrador' ? ('borrador' as const) : ('pendiente' as const),
        progreso: 0,
        observaciones: body.estado === 'borrador' ? '' : 'Pendiente asignación',
      })),
    };
    despachosDb.push(nuevo);
    return ok(nuevo);
  }

  if (req.method === 'GET' && path === '/conversaciones') {
    return ok(conversacionesDb);
  }

  const mensajeMatch = /^\/conversaciones\/([^/]+)\/mensajes$/.exec(path);
  if (req.method === 'POST' && mensajeMatch) {
    const conversacion = conversacionesDb.find((c) => c.id === mensajeMatch[1]);
    if (!conversacion) {
      return fail(404);
    }
    const { texto } = req.body as { texto: string };
    const mensaje = {
      id: `m-${nextMensajeId++}`,
      autor: 'admin' as const,
      texto,
      fecha: new Date().toISOString(),
    };
    conversacion.mensajes.push(mensaje);
    return ok(mensaje);
  }

  const viajeAccion = /^\/despachos\/([^/]+)\/viajes\/([^/]+)(?:\/(iniciar|duplicar))?$/.exec(path);
  if (viajeAccion) {
    const despacho = despachosDb.find((d) => d.id === viajeAccion[1]);
    const viajeId = decodeURIComponent(viajeAccion[2]);
    const viaje = despacho?.viajes.find((v) => v.id === viajeId);
    if (!despacho || !viaje) {
      return fail(404);
    }

    if (req.method === 'POST' && viajeAccion[3] === 'iniciar') {
      viaje.estado = 'en_viaje';
      viaje.progreso = 0;
      viaje.observaciones = 'Viaje iniciado';
      // Si no quedan viajes en borrador, el despacho pasa a activo
      if (despacho.viajes.every((v) => v.estado !== 'borrador')) {
        despacho.estado = 'activo';
      }
      return ok(despacho);
    }

    if (req.method === 'POST' && viajeAccion[3] === 'duplicar') {
      const copia = { ...viaje, id: `#${12350 + nextViajeId++}` };
      despacho.viajes.splice(despacho.viajes.indexOf(viaje) + 1, 0, copia);
      return ok(despacho);
    }

    if (req.method === 'DELETE' && !viajeAccion[3]) {
      despacho.viajes.splice(despacho.viajes.indexOf(viaje), 1);
      return ok(despacho);
    }
    return fail(404);
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
  // Clonar: nunca entregar referencias vivas de las "tablas" en memoria
  // (un store que guarde la referencia vería mutaciones fantasma)
  const snapshot = body === null ? null : structuredClone(body);
  return of(new HttpResponse({ status: 200, body: snapshot })).pipe(delay(400));
}

function fail(status: number) {
  return throwError(() => new HttpErrorResponse({ status })).pipe(delay(400));
}

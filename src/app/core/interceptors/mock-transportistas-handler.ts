import { HttpRequest } from '@angular/common/http';
import {
  TransportistaDetalleDto,
  TransportistaDto,
} from '../../features/transportistas/data-access/transportistas.dto';
import {
  MOCK_TIPOS_LICENCIA,
  MOCK_TIPOS_VEHICULO,
  MOCK_TRANSPORTISTAS_DB,
  MockTransportistaDb,
} from './mock-transportistas';

const db: MockTransportistaDb = structuredClone(MOCK_TRANSPORTISTAS_DB);
let nextId = 200;

function detalle(id: string): TransportistaDetalleDto | null {
  const empresa = db.empresas.find((e) => e.id === id);
  if (!empresa) {
    return null;
  }
  return {
    ...empresa,
    camiones: db.camiones.filter((c) => c.transportista_id === id),
    choferes: db.choferes.filter((c) => c.transportista_id === id),
  };
}

function filtrarEmpresas(filtro: string, busqueda: string): TransportistaDto[] {
  let items = db.empresas.filter((e) => !e.eliminado);
  if (filtro === 'activos') {
    items = items.filter((e) => e.activo);
  } else if (filtro === 'inactivos') {
    items = items.filter((e) => !e.activo);
  }
  const q = busqueda.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (e) =>
        e.nombre_fantasia.toLowerCase().includes(q) ||
        e.razon_social.toLowerCase().includes(q) ||
        e.cuit.toLowerCase().includes(q),
    );
  }
  return items.sort((a, b) => a.nombre_fantasia.localeCompare(b.nombre_fantasia, 'es'));
}

function parsePath(path: string): {
  transportistaId?: string;
  choferId?: string;
  camionId?: string;
  accion?: string;
} {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'transportistas') {
    return {};
  }
  const transportistaId = parts[1];
  if (parts.length === 2) {
    return { transportistaId };
  }
  if (parts[2] === 'choferes') {
    return { transportistaId, choferId: parts[3], accion: parts[4] };
  }
  if (parts[2] === 'camiones') {
    return { transportistaId, camionId: parts[3], accion: parts[4] };
  }
  if (parts[2] === 'activo') {
    return { transportistaId, accion: 'activo' };
  }
  return { transportistaId };
}

/** Respuesta mock para transportistas (UI-first, independiente de mockApi global). */
export function manejarMockTransportistas(
  req: HttpRequest<unknown>,
  path: string,
): unknown | undefined {
  if (path === '/parametria/tipos-vehiculo' && req.method === 'GET') {
    return MOCK_TIPOS_VEHICULO;
  }
  if (path === '/parametria/tipos-licencia' && req.method === 'GET') {
    return MOCK_TIPOS_LICENCIA;
  }
  if (!path.startsWith('/transportistas')) {
    return undefined;
  }

  const params = req.params;
  const parsed = parsePath(path);
  const body = req.body as Record<string, unknown> | null;

  if (req.method === 'GET' && path === '/transportistas') {
    return filtrarEmpresas(params.get('filtro') ?? 'activos', params.get('busqueda') ?? '');
  }

  if (req.method === 'GET' && parsed.transportistaId && path.split('/').length === 3) {
    return detalle(parsed.transportistaId) ?? null;
  }

  if (req.method === 'POST' && path === '/transportistas') {
    const nuevo: TransportistaDto = {
      id: `t-${nextId++}`,
      activo: true,
      eliminado: false,
      nombre_fantasia: String(body?.['nombre_fantasia'] ?? ''),
      razon_social: String(body?.['razon_social'] ?? ''),
      cuit: String(body?.['cuit'] ?? ''),
      direccion: String(body?.['direccion'] ?? ''),
      email: String(body?.['email'] ?? ''),
      telefono: String(body?.['telefono'] ?? ''),
      pagina_web: String(body?.['pagina_web'] ?? ''),
    };
    db.empresas.push(nuevo);
    return detalle(nuevo.id)!;
  }

  if (req.method === 'PUT' && parsed.transportistaId && path.split('/').length === 3) {
    const empresa = db.empresas.find((e) => e.id === parsed.transportistaId);
    if (!empresa) {
      return null;
    }
    Object.assign(empresa, {
      nombre_fantasia: String(body?.['nombre_fantasia'] ?? empresa.nombre_fantasia),
      razon_social: String(body?.['razon_social'] ?? empresa.razon_social),
      cuit: String(body?.['cuit'] ?? empresa.cuit),
      direccion: String(body?.['direccion'] ?? empresa.direccion),
      email: String(body?.['email'] ?? empresa.email),
      telefono: String(body?.['telefono'] ?? empresa.telefono),
      pagina_web: String(body?.['pagina_web'] ?? empresa.pagina_web),
    });
    return detalle(empresa.id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.camionId &&
    path.includes('/camiones/') &&
    path.endsWith('/activo')
  ) {
    const camion = db.camiones.find((c) => c.id === parsed.camionId);
    if (!camion) {
      return null;
    }
    camion.activo = Boolean(body?.['activo']);
    return detalle(camion.transportista_id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.choferId &&
    path.includes('/choferes/') &&
    path.endsWith('/activo')
  ) {
    const chofer = db.choferes.find((c) => c.id === parsed.choferId);
    if (!chofer) {
      return null;
    }
    chofer.activo = Boolean(body?.['activo']);
    return detalle(chofer.transportista_id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.accion === 'activo' &&
    parsed.transportistaId &&
    !parsed.camionId &&
    !parsed.choferId
  ) {
    const empresa = db.empresas.find((e) => e.id === parsed.transportistaId);
    if (!empresa) {
      return null;
    }
    empresa.activo = Boolean(body?.['activo']);
    return detalle(empresa.id)!;
  }

  if (req.method === 'DELETE' && parsed.transportistaId && path.split('/').length === 3) {
    const empresa = db.empresas.find((e) => e.id === parsed.transportistaId);
    if (!empresa) {
      return null;
    }
    empresa.eliminado = true;
    empresa.activo = false;
    return null;
  }

  if (req.method === 'POST' && parsed.transportistaId && path.endsWith('/choferes')) {
    db.choferes.push({
      id: `ch-${nextId++}`,
      transportista_id: parsed.transportistaId,
      activo: true,
      eliminado: false,
      nombre: String(body?.['nombre'] ?? ''),
      apellido: String(body?.['apellido'] ?? ''),
      documento: String(body?.['documento'] ?? ''),
      direccion: String(body?.['direccion'] ?? ''),
      telefono: String(body?.['telefono'] ?? ''),
      edad: Number(body?.['edad'] ?? 0),
      fecha_nacimiento: String(body?.['fecha_nacimiento'] ?? ''),
      licencia_tipo: String(body?.['licencia_tipo'] ?? ''),
      licencia_vencimiento: String(body?.['licencia_vencimiento'] ?? ''),
      camion_id: (body?.['camion_id'] as string | null) ?? null,
      foto_licencia: body?.['foto_licencia'] as (typeof db.choferes)[number]['foto_licencia'],
      foto_dni_frente: body?.['foto_dni_frente'] as (typeof db.choferes)[number]['foto_dni_frente'],
      foto_dni_dorso: body?.['foto_dni_dorso'] as (typeof db.choferes)[number]['foto_dni_dorso'],
    });
    return detalle(parsed.transportistaId)!;
  }

  if (
    req.method === 'PUT' &&
    parsed.transportistaId &&
    parsed.choferId &&
    path.includes('/choferes/')
  ) {
    const chofer = db.choferes.find(
      (c) => c.id === parsed.choferId && c.transportista_id === parsed.transportistaId,
    );
    if (!chofer) {
      return null;
    }
    Object.assign(chofer, {
      nombre: String(body?.['nombre'] ?? chofer.nombre),
      apellido: String(body?.['apellido'] ?? chofer.apellido),
      documento: String(body?.['documento'] ?? chofer.documento),
      direccion: String(body?.['direccion'] ?? chofer.direccion),
      telefono: String(body?.['telefono'] ?? chofer.telefono),
      edad: Number(body?.['edad'] ?? chofer.edad),
      fecha_nacimiento: String(body?.['fecha_nacimiento'] ?? chofer.fecha_nacimiento),
      licencia_tipo: String(body?.['licencia_tipo'] ?? chofer.licencia_tipo),
      licencia_vencimiento: String(body?.['licencia_vencimiento'] ?? chofer.licencia_vencimiento),
      camion_id: (body?.['camion_id'] as string | null) ?? chofer.camion_id,
      foto_licencia: body?.['foto_licencia'] ?? chofer.foto_licencia,
      foto_dni_frente: body?.['foto_dni_frente'] ?? chofer.foto_dni_frente,
      foto_dni_dorso: body?.['foto_dni_dorso'] ?? chofer.foto_dni_dorso,
    });
    return detalle(parsed.transportistaId)!;
  }

  if (req.method === 'DELETE' && parsed.choferId && path.includes('/choferes/')) {
    const chofer = db.choferes.find((c) => c.id === parsed.choferId);
    if (!chofer) {
      return null;
    }
    chofer.eliminado = true;
    chofer.activo = false;
    return detalle(chofer.transportista_id)!;
  }

  if (req.method === 'POST' && parsed.transportistaId && path.endsWith('/camiones')) {
    db.camiones.push({
      id: `cm-${nextId++}`,
      transportista_id: parsed.transportistaId,
      activo: true,
      eliminado: false,
      dominio: String(body?.['dominio'] ?? '').toUpperCase(),
      marca: String(body?.['marca'] ?? ''),
      modelo: String(body?.['modelo'] ?? ''),
      tipo: String(body?.['tipo'] ?? ''),
      nro_chasis: String(body?.['nro_chasis'] ?? ''),
      nro_motor: String(body?.['nro_motor'] ?? ''),
      foto_tarjeta_verde: body?.[
        'foto_tarjeta_verde'
      ] as (typeof db.camiones)[number]['foto_tarjeta_verde'],
    });
    return detalle(parsed.transportistaId)!;
  }

  if (
    req.method === 'PUT' &&
    parsed.transportistaId &&
    parsed.camionId &&
    path.includes('/camiones/')
  ) {
    const camion = db.camiones.find(
      (c) => c.id === parsed.camionId && c.transportista_id === parsed.transportistaId,
    );
    if (!camion) {
      return null;
    }
    Object.assign(camion, {
      dominio: String(body?.['dominio'] ?? camion.dominio).toUpperCase(),
      marca: String(body?.['marca'] ?? camion.marca),
      modelo: String(body?.['modelo'] ?? camion.modelo),
      tipo: String(body?.['tipo'] ?? camion.tipo),
      nro_chasis: String(body?.['nro_chasis'] ?? camion.nro_chasis),
      nro_motor: String(body?.['nro_motor'] ?? camion.nro_motor),
      foto_tarjeta_verde: body?.['foto_tarjeta_verde'] ?? camion.foto_tarjeta_verde,
    });
    return detalle(parsed.transportistaId)!;
  }

  if (req.method === 'DELETE' && parsed.camionId && path.includes('/camiones/')) {
    const camion = db.camiones.find((c) => c.id === parsed.camionId);
    if (!camion) {
      return null;
    }
    camion.eliminado = true;
    camion.activo = false;
    return detalle(camion.transportista_id)!;
  }

  return undefined;
}

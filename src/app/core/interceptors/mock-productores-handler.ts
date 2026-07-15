import { HttpRequest } from '@angular/common/http';
import {
  CampoProductorDto,
  ProductorDetalleDto,
  ProductorDto,
  PuntoEntradaDto,
} from '../../features/productores/data-access/productores.dto';
import {
  MOCK_PRODUCTORES_DB,
  MOCK_VENDEDORES,
  MockProductoresDb,
  catalogoProductoresDesdeDb,
} from './mock-productores';

const db: MockProductoresDb = structuredClone(MOCK_PRODUCTORES_DB);
let nextId = 500;

function puntosDeCampo(campoId: string): PuntoEntradaDto[] {
  return db.puntosEntrada
    .filter((p) => p.campo_id === campoId && !p.eliminado)
    .sort((a, b) => a.orden - b.orden);
}

function campoConPuntos(c: CampoProductorDto): CampoProductorDto {
  return { ...c, puntos_entrada: puntosDeCampo(c.id) };
}

function detalle(id: string): ProductorDetalleDto | null {
  const productor = db.productores.find((p) => p.id === id);
  if (!productor) {
    return null;
  }
  return {
    ...productor,
    responsables: db.responsables.filter((r) => r.productor_id === id),
    campos: db.campos.filter((c) => c.productor_id === id).map((c) => campoConPuntos(c)),
  };
}

function filtrarProductores(filtro: string, busqueda: string): ProductorDto[] {
  let items = db.productores.filter((p) => !p.eliminado);
  if (filtro === 'activos') {
    items = items.filter((p) => p.activo);
  } else if (filtro === 'inactivos') {
    items = items.filter((p) => !p.activo);
  }
  const q = busqueda.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (p) =>
        p.nombre_fantasia.toLowerCase().includes(q) ||
        p.razon_social.toLowerCase().includes(q) ||
        p.cuit.toLowerCase().includes(q),
    );
  }
  return items.sort((a, b) => a.nombre_fantasia.localeCompare(b.nombre_fantasia, 'es'));
}

function sincronizarPuntos(
  campoId: string,
  puntos: {
    id?: string;
    nombre: string;
    orden: number;
    latitud: number;
    longitud: number;
    observacion: string;
  }[],
): void {
  db.puntosEntrada.forEach((p) => {
    if (p.campo_id === campoId) {
      p.eliminado = true;
      p.activo = false;
    }
  });
  puntos.forEach((p) => {
    db.puntosEntrada.push({
      id: p.id ?? `pe-${nextId++}`,
      campo_id: campoId,
      activo: true,
      eliminado: false,
      nombre: p.nombre,
      orden: p.orden,
      latitud: p.latitud,
      longitud: p.longitud,
      observacion: p.observacion,
    });
  });
}

function parsePath(path: string): {
  productorId?: string;
  responsableId?: string;
  campoId?: string;
  accion?: string;
} {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'productores') {
    return {};
  }
  if (parts.length === 1) {
    return {};
  }
  if (parts[1] === 'vendedores') {
    return {};
  }
  const productorId = parts[1];
  if (parts.length === 2) {
    return { productorId };
  }
  if (parts[2] === 'responsables') {
    return { productorId, responsableId: parts[3], accion: parts[4] };
  }
  if (parts[2] === 'campos') {
    return { productorId, campoId: parts[3], accion: parts[4] };
  }
  if (parts[2] === 'activo') {
    return { productorId, accion: 'activo' };
  }
  return { productorId };
}

export function obtenerCatalogoProductoresMock(): ReturnType<typeof catalogoProductoresDesdeDb> {
  return catalogoProductoresDesdeDb(db);
}

/** Respuesta mock para productores (UI-first, independiente de mockApi global). */
export function manejarMockProductores(
  req: HttpRequest<unknown>,
  path: string,
): unknown | undefined {
  if (path === '/productores/vendedores' && req.method === 'GET') {
    return MOCK_VENDEDORES;
  }
  if (!path.startsWith('/productores')) {
    return undefined;
  }

  const params = req.params;
  const parsed = parsePath(path);
  const body = req.body as Record<string, unknown> | null;

  if (req.method === 'GET' && path === '/productores') {
    return filtrarProductores(params.get('filtro') ?? 'activos', params.get('busqueda') ?? '');
  }

  if (req.method === 'GET' && parsed.productorId && path.split('/').length === 3) {
    return detalle(parsed.productorId) ?? null;
  }

  if (req.method === 'POST' && path === '/productores') {
    const nuevo: ProductorDto = {
      id: `p-${nextId++}`,
      activo: true,
      eliminado: false,
      nombre_fantasia: String(body?.['nombre_fantasia'] ?? ''),
      razon_social: String(body?.['razon_social'] ?? ''),
      cuit: String(body?.['cuit'] ?? ''),
      direccion_fiscal: String(body?.['direccion_fiscal'] ?? ''),
      email: String(body?.['email'] ?? ''),
      telefono: String(body?.['telefono'] ?? ''),
      vendedor_id: String(body?.['vendedor_id'] ?? ''),
      notas: String(body?.['notas'] ?? ''),
    };
    db.productores.push(nuevo);
    return detalle(nuevo.id)!;
  }

  if (req.method === 'PUT' && parsed.productorId && path.split('/').length === 3) {
    const productor = db.productores.find((p) => p.id === parsed.productorId);
    if (!productor) {
      return null;
    }
    Object.assign(productor, {
      nombre_fantasia: String(body?.['nombre_fantasia'] ?? productor.nombre_fantasia),
      razon_social: String(body?.['razon_social'] ?? productor.razon_social),
      cuit: String(body?.['cuit'] ?? productor.cuit),
      direccion_fiscal: String(body?.['direccion_fiscal'] ?? productor.direccion_fiscal),
      email: String(body?.['email'] ?? productor.email),
      telefono: String(body?.['telefono'] ?? productor.telefono),
      vendedor_id: String(body?.['vendedor_id'] ?? productor.vendedor_id),
      notas: String(body?.['notas'] ?? productor.notas),
    });
    return detalle(productor.id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.campoId &&
    path.includes('/campos/') &&
    path.endsWith('/activo')
  ) {
    const campo = db.campos.find((c) => c.id === parsed.campoId);
    if (!campo) {
      return null;
    }
    campo.activo = Boolean(body?.['activo']);
    return detalle(campo.productor_id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.responsableId &&
    path.includes('/responsables/') &&
    path.endsWith('/activo')
  ) {
    const responsable = db.responsables.find((r) => r.id === parsed.responsableId);
    if (!responsable) {
      return null;
    }
    responsable.activo = Boolean(body?.['activo']);
    return detalle(responsable.productor_id)!;
  }

  if (
    req.method === 'PATCH' &&
    parsed.accion === 'activo' &&
    parsed.productorId &&
    !parsed.campoId &&
    !parsed.responsableId
  ) {
    const productor = db.productores.find((p) => p.id === parsed.productorId);
    if (!productor) {
      return null;
    }
    productor.activo = Boolean(body?.['activo']);
    return detalle(productor.id)!;
  }

  if (req.method === 'DELETE' && parsed.productorId && path.split('/').length === 3) {
    const productor = db.productores.find((p) => p.id === parsed.productorId);
    if (!productor) {
      return null;
    }
    productor.eliminado = true;
    productor.activo = false;
    return null;
  }

  if (req.method === 'POST' && parsed.productorId && path.endsWith('/responsables')) {
    db.responsables.push({
      id: `rs-${nextId++}`,
      productor_id: parsed.productorId,
      activo: true,
      eliminado: false,
      nombre: String(body?.['nombre'] ?? ''),
      apellido: String(body?.['apellido'] ?? ''),
      telefono: String(body?.['telefono'] ?? ''),
      documento: String(body?.['documento'] ?? ''),
    });
    return detalle(parsed.productorId)!;
  }

  if (
    req.method === 'PUT' &&
    parsed.productorId &&
    parsed.responsableId &&
    path.includes('/responsables/')
  ) {
    const responsable = db.responsables.find(
      (r) => r.id === parsed.responsableId && r.productor_id === parsed.productorId,
    );
    if (!responsable) {
      return null;
    }
    Object.assign(responsable, {
      nombre: String(body?.['nombre'] ?? responsable.nombre),
      apellido: String(body?.['apellido'] ?? responsable.apellido),
      telefono: String(body?.['telefono'] ?? responsable.telefono),
      documento: String(body?.['documento'] ?? responsable.documento),
    });
    return detalle(parsed.productorId)!;
  }

  if (req.method === 'DELETE' && parsed.responsableId && path.includes('/responsables/')) {
    const responsable = db.responsables.find((r) => r.id === parsed.responsableId);
    if (!responsable) {
      return null;
    }
    responsable.eliminado = true;
    responsable.activo = false;
    return detalle(responsable.productor_id)!;
  }

  if (req.method === 'POST' && parsed.productorId && path.endsWith('/campos')) {
    const campoId = `cm-${nextId++}`;
    const puntosRaw = (body?.['puntos_entrada'] as Record<string, unknown>[] | undefined) ?? [];
    sincronizarPuntos(
      campoId,
      puntosRaw.map((p, i) => ({
        nombre: String(p['nombre'] ?? `Entrada ${i + 1}`),
        orden: Number(p['orden'] ?? i + 1),
        latitud: Number(p['latitud'] ?? -33.89),
        longitud: Number(p['longitud'] ?? -60.57),
        observacion: String(p['observacion'] ?? ''),
      })),
    );
    db.campos.push({
      id: campoId,
      productor_id: parsed.productorId,
      activo: true,
      eliminado: false,
      nombre: String(body?.['nombre'] ?? ''),
      codigo: String(body?.['codigo'] ?? ''),
      superficie_ha: Number(body?.['superficie_ha'] ?? 0),
      localidad: String(body?.['localidad'] ?? ''),
      provincia: String(body?.['provincia'] ?? ''),
      partido: String(body?.['partido'] ?? ''),
      direccion: String(body?.['direccion'] ?? ''),
      latitud: Number(body?.['latitud'] ?? -33.89),
      longitud: Number(body?.['longitud'] ?? -60.57),
      contacto_nombre: String(body?.['contacto_nombre'] ?? ''),
      contacto_telefono: String(body?.['contacto_telefono'] ?? ''),
      puntos_entrada: puntosDeCampo(campoId),
    });
    return detalle(parsed.productorId)!;
  }

  if (req.method === 'PUT' && parsed.productorId && parsed.campoId && path.includes('/campos/')) {
    const campo = db.campos.find(
      (c) => c.id === parsed.campoId && c.productor_id === parsed.productorId,
    );
    if (!campo) {
      return null;
    }
    Object.assign(campo, {
      nombre: String(body?.['nombre'] ?? campo.nombre),
      codigo: String(body?.['codigo'] ?? campo.codigo),
      superficie_ha: Number(body?.['superficie_ha'] ?? campo.superficie_ha),
      localidad: String(body?.['localidad'] ?? campo.localidad),
      provincia: String(body?.['provincia'] ?? campo.provincia),
      partido: String(body?.['partido'] ?? campo.partido),
      direccion: String(body?.['direccion'] ?? campo.direccion),
      latitud: Number(body?.['latitud'] ?? campo.latitud),
      longitud: Number(body?.['longitud'] ?? campo.longitud),
      contacto_nombre: String(body?.['contacto_nombre'] ?? campo.contacto_nombre),
      contacto_telefono: String(body?.['contacto_telefono'] ?? campo.contacto_telefono),
    });
    const puntosRaw = body?.['puntos_entrada'] as Record<string, unknown>[] | undefined;
    if (puntosRaw) {
      sincronizarPuntos(
        campo.id,
        puntosRaw.map((p, i) => ({
          id: p['id'] as string | undefined,
          nombre: String(p['nombre'] ?? `Entrada ${i + 1}`),
          orden: Number(p['orden'] ?? i + 1),
          latitud: Number(p['latitud'] ?? campo.latitud),
          longitud: Number(p['longitud'] ?? campo.longitud),
          observacion: String(p['observacion'] ?? ''),
        })),
      );
    }
    return detalle(parsed.productorId)!;
  }

  if (req.method === 'DELETE' && parsed.campoId && path.includes('/campos/')) {
    const campo = db.campos.find((c) => c.id === parsed.campoId);
    if (!campo) {
      return null;
    }
    campo.eliminado = true;
    campo.activo = false;
    return detalle(campo.productor_id)!;
  }

  return undefined;
}

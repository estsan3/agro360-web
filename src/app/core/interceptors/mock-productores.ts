import {
  CampoProductorDto,
  CatalogoProductorDto,
  ProductorDto,
  PuntoEntradaDto,
  ResponsableProductorDto,
} from '../../features/productores/data-access/productores.dto';

export const MOCK_VENDEDORES = [
  { id: 'v-1', nombre: 'Juan Pérez' },
  { id: 'v-2', nombre: 'Carlos Rodríguez' },
];

export interface MockProductoresDb {
  productores: ProductorDto[];
  responsables: ResponsableProductorDto[];
  campos: CampoProductorDto[];
  puntosEntrada: PuntoEntradaDto[];
}

const PREFIJOS = ['Agro', 'Campo', 'Estancia', 'Cultivos', 'Granos', 'Loma', 'Surco', 'Chacra'];
const ZONAS = ['Pampeana', 'Litoral', 'Cuyo', 'NOA', 'Centro', 'Norte', 'Sur', 'Delta'];
const PROVINCIAS = [
  'Buenos Aires',
  'Santa Fe',
  'Córdoba',
  'Entre Ríos',
  'La Pampa',
  'Santiago del Estero',
];
const LOCALIDADES = [
  'Pergamino',
  'Rojas',
  'Junín',
  'Salto',
  'Chivilcoy',
  'Venado Tuerto',
  'Marcos Juárez',
  'Arrecifes',
];
const NOMBRES = [
  'Juan',
  'María',
  'Carlos',
  'Ana',
  'Pedro',
  'Lucía',
  'Roberto',
  'Sofía',
  'Miguel',
  'Laura',
];
const APELLIDOS = [
  'García',
  'López',
  'Martínez',
  'Rodríguez',
  'Fernández',
  'González',
  'Pérez',
  'Sánchez',
  'Romero',
  'Díaz',
];
const ENTRADAS = ['Norte', 'Sur', 'Este', 'Oeste', 'Principal', 'Secundaria', 'Ripio', 'Asfalto'];

function cuitDemo(n: number): string {
  const base = String(20000000 + n).padStart(8, '0');
  return `30-${base.slice(0, 8)}-${n % 10}`;
}

function crearPuntos(
  campoId: string,
  baseLat: number,
  baseLng: number,
  cantidad: number,
): PuntoEntradaDto[] {
  const puntos: PuntoEntradaDto[] = [];
  for (let i = 0; i < cantidad; i++) {
    puntos.push({
      id: `pe-${campoId}-${i + 1}`,
      campo_id: campoId,
      activo: true,
      eliminado: false,
      nombre: `Entrada ${ENTRADAS[i % ENTRADAS.length]}`,
      orden: i + 1,
      latitud: Number((baseLat + (i + 1) * 0.002).toFixed(6)),
      longitud: Number((baseLng + (i + 1) * 0.0015).toFixed(6)),
      observacion:
        i === 0
          ? 'Portón principal sobre ruta. Tocar bocina al llegar.'
          : 'Acceso alternativo por camino de tierra.',
    });
  }
  return puntos;
}

function generarProductores(): ProductorDto[] {
  const items: ProductorDto[] = [
    {
      id: 'p-1',
      activo: true,
      eliminado: false,
      nombre_fantasia: 'Agro SA',
      razon_social: 'Agro SA S.A.',
      cuit: '30-50123456-7',
      direccion_fiscal: 'Av. San Martín 450, Pergamino',
      email: 'contacto@agrosa.com.ar',
      telefono: '+54 2477 555-0101',
      vendedor_id: 'v-1',
      notas: 'Cliente histórico. Prioridad en cosecha fina.',
    },
    {
      id: 'p-2',
      activo: true,
      eliminado: false,
      nombre_fantasia: 'Agro Pampeana',
      razon_social: 'Agro Pampeana S.R.L.',
      cuit: '30-61234567-8',
      direccion_fiscal: 'Ruta 8 Km 245, Pergamino',
      email: 'operaciones@agropampeana.com.ar',
      telefono: '+54 2477 555-0202',
      vendedor_id: 'v-2',
      notas: 'Grupo con 15 campos activos en zona núcleo.',
    },
  ];

  for (let n = 3; n <= 50; n++) {
    const prefijo = PREFIJOS[n % PREFIJOS.length];
    const zona = ZONAS[n % ZONAS.length];
    items.push({
      id: `p-${n}`,
      activo: n % 7 !== 0,
      eliminado: false,
      nombre_fantasia: `${prefijo} ${zona}`,
      razon_social: `${prefijo} ${zona} S.A.`,
      cuit: cuitDemo(n),
      direccion_fiscal: `Calle ${100 + n}, ${LOCALIDADES[n % LOCALIDADES.length]}`,
      email: `info@${prefijo.toLowerCase()}${n}.com.ar`,
      telefono: `+54 2477 555-${String(n).padStart(4, '0')}`,
      vendedor_id: n % 2 === 0 ? 'v-1' : 'v-2',
      notas: n % 5 === 0 ? 'Requiere coordinación previa con administración.' : '',
    });
  }
  return items;
}

function generarResponsables(productores: ProductorDto[]): ResponsableProductorDto[] {
  const items: ResponsableProductorDto[] = [];
  productores.forEach((p, idx) => {
    const cantidad = p.id === 'p-2' ? 3 : idx % 4 === 0 ? 2 : 1;
    for (let r = 0; r < cantidad; r++) {
      const n = idx * 3 + r;
      items.push({
        id: `rs-${p.id}-${r + 1}`,
        productor_id: p.id,
        activo: r !== 2 || p.id !== 'p-2',
        eliminado: false,
        nombre: NOMBRES[n % NOMBRES.length],
        apellido: APELLIDOS[n % APELLIDOS.length],
        telefono: `+54 9 11 ${String(4000 + n).slice(-4)}-${String(1000 + n).slice(-4)}`,
        documento: String(25000000 + n),
      });
    }
  });
  return items;
}

function generarCamposYPuntos(productores: ProductorDto[]): {
  campos: CampoProductorDto[];
  puntosEntrada: PuntoEntradaDto[];
} {
  const campos: CampoProductorDto[] = [];
  const puntosEntrada: PuntoEntradaDto[] = [];

  productores.forEach((p, idx) => {
    const cantidad =
      p.id === 'p-2' ? 15 : p.id === 'p-1' ? 2 : idx % 6 === 0 ? 3 : idx % 3 === 0 ? 2 : 1;

    for (let c = 0; c < cantidad; c++) {
      const campoId =
        p.id === 'p-2' ? `cm-p${c + 1}` : p.id === 'p-1' ? `c-${c + 1}` : `cm-${p.id}-${c + 1}`;
      const baseLat = -33.89 - idx * 0.01 - c * 0.003;
      const baseLng = -60.57 - idx * 0.008 + c * 0.004;
      const loc = LOCALIDADES[(idx + c) % LOCALIDADES.length];
      const prov = PROVINCIAS[(idx + c) % PROVINCIAS.length];
      const puntos = crearPuntos(campoId, baseLat, baseLng, p.id === 'p-2' ? 3 : c === 0 ? 2 : 1);
      puntosEntrada.push(...puntos);

      campos.push({
        id: campoId,
        productor_id: p.id,
        activo: c !== cantidad - 1 || p.id === 'p-2',
        eliminado: false,
        nombre:
          p.id === 'p-1'
            ? c === 0
              ? 'Campo Norte'
              : 'Campo Los Nogales'
            : p.id === 'p-2'
              ? `Campo ${String.fromCharCode(65 + c)}`
              : `Campo ${loc} ${c + 1}`,
        codigo: `CP-${String(idx + 1).padStart(2, '0')}${String(c + 1).padStart(2, '0')}`,
        superficie_ha: 200 + (((idx + c) * 37) % 800),
        localidad: loc,
        provincia: prov,
        partido: loc,
        direccion: `Ruta ${8 + (c % 5)} Km ${120 + c * 3}, ${loc}`,
        latitud: Number(baseLat.toFixed(6)),
        longitud: Number(baseLng.toFixed(6)),
        contacto_nombre: `${NOMBRES[(idx + c) % NOMBRES.length]} ${APELLIDOS[(idx + c) % APELLIDOS.length]}`,
        contacto_telefono: `+54 2477 555-${String(idx * 10 + c).padStart(4, '0')}`,
        puntos_entrada: puntos,
      });
    }
  });

  return { campos, puntosEntrada };
}

const productores = generarProductores();
const responsables = generarResponsables(productores);
const { campos, puntosEntrada } = generarCamposYPuntos(productores);

export const MOCK_PRODUCTORES_DB: MockProductoresDb = {
  productores,
  responsables,
  campos,
  puntosEntrada,
};

/** Vista simplificada para catálogo de despachos (mock). */
export function catalogoProductoresDesdeDb(db: MockProductoresDb): CatalogoProductorDto[] {
  return db.productores
    .filter((p) => p.activo && !p.eliminado)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre_fantasia || p.razon_social,
      campos: db.campos
        .filter((c) => c.productor_id === p.id && c.activo && !c.eliminado)
        .map((c) => ({
          id: c.id,
          nombre: c.nombre,
          puntos_entrada: c.puntos_entrada
            .filter((pe) => pe.activo && !pe.eliminado)
            .sort((a, b) => a.orden - b.orden)
            .map((pe) => ({
              id: pe.id,
              nombre: pe.nombre,
              orden: pe.orden,
              latitud: pe.latitud,
              longitud: pe.longitud,
              observacion: pe.observacion,
            })),
        })),
    }));
}

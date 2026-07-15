import {
  CamionTransportistaDto,
  ChoferTransportistaDto,
  TransportistaDto,
} from '../../features/transportistas/data-access/transportistas.dto';

export const MOCK_TIPOS_VEHICULO = [
  'Semirremolque',
  'Acoplado',
  'Chasis',
  'Camión rígido',
  'Bitren',
];

export const MOCK_TIPOS_LICENCIA = ['B1', 'B2', 'C', 'E1', 'E2'];

export interface MockTransportistaDb {
  empresas: TransportistaDto[];
  camiones: CamionTransportistaDto[];
  choferes: ChoferTransportistaDto[];
}

const MARCAS = ['Mercedes-Benz', 'Volvo', 'Scania', 'Iveco', 'MAN', 'Ford', 'Renault'];
const PREFIJOS = [
  'Transportes',
  'Logística',
  'Flota',
  'Cargas',
  'Express',
  'Fletes',
  'Camiones',
  'Rodados',
];
const ZONAS = [
  'Pampeana',
  'Litoral',
  'Cuyo',
  'NOA',
  'Patagonia',
  'Centro',
  'Norte',
  'Sur',
  'Oeste',
  'Delta',
];
const CIUDADES = [
  'La Plata',
  'Rosario',
  'Córdoba',
  'Mendoza',
  'Pergamino',
  'Bahía Blanca',
  'Tucumán',
  'Mar del Plata',
  'Salta',
  'Neuquén',
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
  'Diego',
  'Valentina',
  'Jorge',
  'Camila',
  'Fernando',
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
  'Torres',
  'Ruiz',
  'Gómez',
  'Ramírez',
  'Vega',
];

function cuitDemo(n: number): string {
  const base = String(70000000 + n).padStart(8, '0');
  return `30-${base.slice(0, 8)}-${n % 10}`;
}

function patenteDemo(n: number): string {
  const l = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const a = l[n % 26];
  const b = l[(n + 7) % 26];
  const c = l[(n + 13) % 26];
  const num = String(100 + n).padStart(3, '0');
  return n % 2 === 0 ? `${a}${b}${num}${c}${l[(n + 3) % 26]}` : `${a}${b}${c}${num}`;
}

function generarEmpresas(): TransportistaDto[] {
  const empresas: TransportistaDto[] = [
    {
      id: 't-1',
      activo: true,
      eliminado: false,
      nombre_fantasia: 'Transportes del Plata',
      razon_social: 'Transportes del Plata S.A.',
      cuit: '30-71234567-8',
      direccion: 'Av. Mitre 1200, La Plata',
      email: 'contacto@delplata.com.ar',
      telefono: '+54 221 555-0101',
      pagina_web: 'https://delplata.com.ar',
    },
    {
      id: 't-2',
      activo: true,
      eliminado: false,
      nombre_fantasia: 'Flota Pampeana',
      razon_social: 'Flota Pampeana Logística SRL',
      cuit: '30-70987654-3',
      direccion: 'Ruta 9 Km 312, Pergamino',
      email: 'logistica@flotapampeana.com',
      telefono: '+54 2477 555-0202',
      pagina_web: 'https://flotapampeana.com',
    },
  ];

  for (let i = 3; i <= 50; i++) {
    const ciudad = CIUDADES[i % CIUDADES.length];
    const prefijo = PREFIJOS[i % PREFIJOS.length];
    const zona = ZONAS[i % ZONAS.length];
    empresas.push({
      id: `t-${i}`,
      activo: i % 6 !== 0,
      eliminado: false,
      nombre_fantasia: `${prefijo} ${zona}`,
      razon_social: `${prefijo} ${zona} S.R.L.`,
      cuit: cuitDemo(i),
      direccion: `Av. Industrial ${100 + i}, ${ciudad}`,
      email: `contacto${i}@transporte-demo.com.ar`,
      telefono: `+54 11 555-${String(1000 + i).slice(-4)}`,
      pagina_web: `https://transporte-${i}.demo.ar`,
    });
  }

  return empresas;
}

function generarCamionesChoferesT1(): {
  camiones: CamionTransportistaDto[];
  choferes: ChoferTransportistaDto[];
} {
  return {
    camiones: [
      {
        id: 'cm-1',
        transportista_id: 't-1',
        activo: true,
        eliminado: false,
        dominio: 'AA123BB',
        marca: 'Mercedes-Benz',
        modelo: '1114',
        tipo: 'Camión rígido',
        nro_chasis: 'WDB9340031L123456',
        nro_motor: 'OM366LA987654',
      },
      {
        id: 'cm-2',
        transportista_id: 't-1',
        activo: true,
        eliminado: false,
        dominio: 'EF789GH',
        marca: 'Volvo',
        modelo: 'FH 420',
        tipo: 'Semirremolque',
        nro_chasis: 'YV2RTY0A8MB123457',
        nro_motor: 'D13K420765432',
      },
    ],
    choferes: [
      {
        id: 'ch-1',
        transportista_id: 't-1',
        activo: true,
        eliminado: false,
        nombre: 'Carlos',
        apellido: 'Ruiz',
        documento: '28456789',
        direccion: 'Calle 50 N° 432, La Plata',
        telefono: '+54 221 555-1001',
        edad: 42,
        fecha_nacimiento: '1984-03-15',
        licencia_tipo: 'E2',
        licencia_vencimiento: '2027-08-20',
        camion_id: 'cm-1',
      },
      {
        id: 'ch-2',
        transportista_id: 't-1',
        activo: true,
        eliminado: false,
        nombre: 'Miguel',
        apellido: 'Torres',
        documento: '30123456',
        direccion: 'Av. 7 N° 1890, La Plata',
        telefono: '+54 221 555-1002',
        edad: 38,
        fecha_nacimiento: '1988-11-02',
        licencia_tipo: 'E2',
        licencia_vencimiento: '2026-12-10',
        camion_id: 'cm-2',
      },
    ],
  };
}

function generarFlotaPampeana(): {
  camiones: CamionTransportistaDto[];
  choferes: ChoferTransportistaDto[];
} {
  const camiones: CamionTransportistaDto[] = [];
  const choferes: ChoferTransportistaDto[] = [];

  for (let i = 1; i <= 15; i++) {
    const camionId = `cm-p${i}`;
    const marca = MARCAS[i % MARCAS.length];
    const tipo = MOCK_TIPOS_VEHICULO[i % MOCK_TIPOS_VEHICULO.length];
    const dominio = patenteDemo(200 + i);

    camiones.push({
      id: camionId,
      transportista_id: 't-2',
      activo: i % 9 !== 0,
      eliminado: false,
      dominio,
      marca,
      modelo: i % 2 === 0 ? 'R450' : 'FH 420',
      tipo,
      nro_chasis: `CHP${String(i).padStart(6, '0')}X`,
      nro_motor: `MOT${String(i).padStart(6, '0')}Y`,
    });

    const nombre = NOMBRES[i % NOMBRES.length];
    const apellido = APELLIDOS[i % APELLIDOS.length];
    choferes.push({
      id: `ch-p${i}`,
      transportista_id: 't-2',
      activo: i % 8 !== 0,
      eliminado: false,
      nombre,
      apellido,
      documento: String(25000000 + i),
      direccion: `Calle ${i} N° ${100 + i}, Pergamino`,
      telefono: `+54 2477 555-${String(3000 + i).slice(-4)}`,
      edad: 28 + (i % 20),
      fecha_nacimiento: `${1975 + (i % 25)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      licencia_tipo: MOCK_TIPOS_LICENCIA[i % MOCK_TIPOS_LICENCIA.length],
      licencia_vencimiento: `202${6 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-28`,
      camion_id: camionId,
    });
  }

  return { camiones, choferes };
}

function buildMockTransportistasDb(): MockTransportistaDb {
  const t1 = generarCamionesChoferesT1();
  const pampeana = generarFlotaPampeana();

  return {
    empresas: generarEmpresas(),
    camiones: [...t1.camiones, ...pampeana.camiones],
    choferes: [...t1.choferes, ...pampeana.choferes],
  };
}

export const MOCK_TRANSPORTISTAS_DB: MockTransportistaDb = buildMockTransportistasDb();

export type { ArchivoAdjuntoDto } from '../../features/transportistas/data-access/transportistas.dto';

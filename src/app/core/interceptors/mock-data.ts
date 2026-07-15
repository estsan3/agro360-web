/**
 * Datos semilla del mock — nombres tomados de los diseños de Figma.
 * Este archivo desaparece junto con el mock cuando exista el backend.
 */

export const MOCK_CATALOGOS = {
  productores: [
    {
      id: 'p-1',
      nombre: 'Agro SA',
      campos: [
        { id: 'c-1', nombre: 'Campo Norte' },
        { id: 'c-2', nombre: 'Campo Los Nogales' },
      ],
    },
    {
      id: 'p-2',
      nombre: 'Campo Verde SRL',
      campos: [{ id: 'c-3', nombre: 'Campo San Pedro' }],
    },
  ],
  administradores: [
    { id: 'a-1', nombre: 'María González' },
    { id: 'a-2', nombre: 'Antonio Samuel' },
  ],
  vendedores: [
    { id: 'v-1', nombre: 'Juan Pérez' },
    { id: 'v-2', nombre: 'Carlos Rodríguez' },
  ],
  materiales: ['Soja', 'Maíz', 'Girasol', 'Trigo'],
  choferes: [
    {
      id: 'ch-1',
      nombre: 'Carlos Ruiz',
      transportista_id: 't-1',
      dominio: 'AA123BB',
      modelo: 'Mercedes 1114',
      camiones: [{ id: 'cm-1', dominio: 'AA123BB', modelo: 'Mercedes 1114' }],
    },
    {
      id: 'ch-2',
      nombre: 'Miguel Torres',
      transportista_id: 't-1',
      dominio: 'EF789GH',
      modelo: 'Volvo FH 420',
      camiones: [{ id: 'cm-2', dominio: 'EF789GH', modelo: 'Volvo FH 420' }],
    },
    {
      id: 'ch-3',
      nombre: 'Roberto Gómez',
      transportista_id: 't-2',
      dominio: 'BC456CD',
      modelo: 'Scania R450',
      camiones: [{ id: 'cm-3', dominio: 'BC456CD', modelo: 'Scania R450' }],
    },
    {
      id: 'ch-4',
      nombre: 'Pedro Ramírez',
      transportista_id: 't-2',
      dominio: 'XY789ZA',
      modelo: 'Iveco Tector 170',
      camiones: [{ id: 'cm-4', dominio: 'XY789ZA', modelo: 'Iveco Tector 170' }],
    },
  ],
  transportistas: [
    {
      id: 't-1',
      nombre: 'Transportes del Plata',
      camiones: [
        { id: 'cm-1', dominio: 'AA123BB', modelo: 'Mercedes 1114' },
        { id: 'cm-2', dominio: 'EF789GH', modelo: 'Volvo FH 420' },
      ],
      choferes: [],
    },
    {
      id: 't-2',
      nombre: 'Flota Pampeana',
      camiones: [
        { id: 'cm-3', dominio: 'BC456CD', modelo: 'Scania R450' },
        { id: 'cm-4', dominio: 'XY789ZA', modelo: 'Iveco Tector 170' },
      ],
      choferes: [],
    },
  ],
};

export interface MockConversacion {
  id: string;
  chofer: string;
  dominio: string;
  viaje_id: string;
  origen: string;
  destino: string;
  estado_viaje: 'pendiente' | 'en_viaje' | 'retrasado' | 'completado';
  en_linea: boolean;
  no_leidos: number;
  mensajes: {
    id: string;
    autor: 'admin' | 'chofer';
    texto: string;
    fecha: string;
    leido: boolean;
  }[];
}

export const MOCK_CONVERSACIONES: MockConversacion[] = [
  {
    id: 'conv-1',
    chofer: 'Carlos Ruiz',
    dominio: 'AA123BB',
    viaje_id: '#12391',
    origen: 'Salta Capital',
    destino: 'Rosario - Terminal',
    estado_viaje: 'en_viaje',
    en_linea: true,
    no_leidos: 2,
    mensajes: [
      {
        id: 'm-1',
        autor: 'admin',
        texto: 'Hola Carlos, ¿cómo va el viaje?',
        fecha: '2026-07-13T08:15:00',
        leido: true,
      },
      {
        id: 'm-2',
        autor: 'chofer',
        texto: 'Todo bien, voy por la ruta 34. Sin problemas hasta ahora.',
        fecha: '2026-07-13T08:22:00',
        leido: true,
      },
      {
        id: 'm-3',
        autor: 'chofer',
        texto: 'Perfecto, ya estoy llegando a destino.',
        fecha: '2026-07-13T10:05:00',
        leido: false,
      },
    ],
  },
  {
    id: 'conv-2',
    chofer: 'Pedro Ramírez',
    dominio: 'XY789ZA',
    viaje_id: '#12392',
    origen: 'Salta Capital',
    destino: 'San Lorenzo - Puerto',
    estado_viaje: 'retrasado',
    en_linea: false,
    no_leidos: 1,
    mensajes: [
      {
        id: 'm-4',
        autor: 'chofer',
        texto: 'Hay un problema en la ruta, corte total en el km 120. Voy a demorar.',
        fecha: '2026-07-13T09:40:00',
        leido: false,
      },
    ],
  },
  {
    id: 'conv-3',
    chofer: 'Miguel Torres',
    dominio: 'EF789GH',
    viaje_id: '#12390',
    origen: 'Salta Capital',
    destino: 'Rosario - Terminal',
    estado_viaje: 'en_viaje',
    en_linea: true,
    no_leidos: 0,
    mensajes: [
      {
        id: 'm-5',
        autor: 'admin',
        texto: 'Miguel, ¿pudiste cargar completo?',
        fecha: '2026-07-12T18:00:00',
        leido: true,
      },
      {
        id: 'm-6',
        autor: 'chofer',
        texto: 'Sí, 32 toneladas. Salgo mañana temprano.',
        fecha: '2026-07-12T18:12:00',
        leido: true,
      },
      {
        id: 'm-7',
        autor: 'admin',
        texto: 'Perfecto, buen viaje.',
        fecha: '2026-07-13T07:30:00',
        leido: true,
      },
    ],
  },
  {
    id: 'conv-4',
    chofer: 'Roberto Gómez',
    dominio: 'BC456CD',
    viaje_id: '#12394',
    origen: 'Salta Capital',
    destino: 'Rosario - Terminal',
    estado_viaje: 'completado',
    en_linea: false,
    no_leidos: 0,
    mensajes: [
      {
        id: 'm-8',
        autor: 'chofer',
        texto: 'Descarga terminada, todo en orden. Firmaron el remito.',
        fecha: '2026-07-12T16:45:00',
        leido: true,
      },
      {
        id: 'm-9',
        autor: 'admin',
        texto: 'Gracias Roberto, quedó registrado.',
        fecha: '2026-07-12T17:00:00',
        leido: true,
      },
    ],
  },
  {
    id: 'conv-5',
    chofer: 'Carlos Ruiz',
    dominio: 'AA123BB',
    viaje_id: '#12332',
    origen: 'Pergamino',
    destino: 'Puerto San Martín',
    estado_viaje: 'en_viaje',
    en_linea: true,
    no_leidos: 0,
    mensajes: [
      {
        id: 'm-10',
        autor: 'admin',
        texto: 'Carlos, este es el canal del viaje a Puerto San Martín.',
        fecha: '2026-07-13T06:50:00',
        leido: true,
      },
    ],
  },
];

interface MockViaje {
  id: string;
  chofer: string;
  dominio: string;
  destino: string;
  toneladas: number;
  estado: 'borrador' | 'pendiente' | 'en_viaje' | 'retrasado' | 'completado';
  progreso: number;
  observaciones: string;
}

export interface MockDespacho {
  id: string;
  nombre: string;
  productor_id: string;
  campo_id: string;
  origen: string;
  entrada_campo: string;
  material: string;
  administrador_id: string;
  vendedor_id: string;
  fecha_inicio: string;
  fecha_llegada_estimada: string;
  estado: 'borrador' | 'activo';
  viajes: MockViaje[];
}

export const MOCK_DESPACHOS: MockDespacho[] = [
  {
    id: 'd-1',
    nombre: 'Campaña Maíz 2026',
    productor_id: 'p-1',
    campo_id: 'c-1',
    origen: 'Rosario, Santa Fe',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Maíz',
    administrador_id: 'a-1',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-07-01',
    fecha_llegada_estimada: '2026-07-20',
    estado: 'activo',
    viajes: [
      {
        id: '#12345',
        chofer: 'Juan Pérez',
        dominio: 'AB123CD',
        destino: 'Buenos Aires - Puerto',
        toneladas: 28,
        estado: 'en_viaje',
        progreso: 65,
        observaciones: 'Viaje normal',
      },
      {
        id: '#12343',
        chofer: 'Sin asignar',
        dominio: '-',
        destino: 'Buenos Aires - Puerto',
        toneladas: 28,
        estado: 'pendiente',
        progreso: 0,
        observaciones: 'Pendiente asignación',
      },
      {
        id: '#12342',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'Buenos Aires - Puerto',
        toneladas: 30,
        estado: 'retrasado',
        progreso: 42,
        observaciones: 'Desperfecto técnico en ruta',
      },
      {
        id: '#12340',
        chofer: 'Carlos Ruiz',
        dominio: 'DE456FG',
        destino: 'Buenos Aires - Puerto',
        toneladas: 29,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
    ],
  },
  {
    id: 'd-3',
    nombre: 'Campaña Soja 2026',
    productor_id: 'p-1',
    campo_id: 'c-2',
    origen: 'Pergamino, Buenos Aires',
    entrada_campo: 'Entrada Sur',
    material: 'Soja',
    administrador_id: 'a-2',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-06-20',
    fecha_llegada_estimada: '2026-07-15',
    estado: 'activo',
    viajes: [
      {
        id: '#12330',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Rosario - Terminal',
        toneladas: 32,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12331',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Rosario - Terminal',
        toneladas: 30,
        estado: 'en_viaje',
        progreso: 80,
        observaciones: 'Llegada anticipada',
      },
      {
        id: '#12332',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Puerto San Martín',
        toneladas: 28.5,
        estado: 'en_viaje',
        progreso: 35,
        observaciones: 'Viaje normal',
      },
    ],
  },
  {
    id: 'd-11',
    nombre: 'Campaña Maíz Otoño',
    productor_id: 'p-1',
    campo_id: 'c-2',
    origen: 'Pergamino, Buenos Aires',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Maíz',
    administrador_id: 'a-1',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-04-08',
    fecha_llegada_estimada: '2026-04-30',
    estado: 'activo',
    viajes: [
      {
        id: '#12200',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Bahía Blanca - Terminal',
        toneladas: 30,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12201',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Bahía Blanca - Terminal',
        toneladas: 31,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12202',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'Buenos Aires - Puerto',
        toneladas: 28,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12203',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Buenos Aires - Puerto',
        toneladas: 29,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
    ],
  },
  {
    id: 'd-12',
    nombre: 'Campaña Girasol Mayo',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'Junín, Buenos Aires',
    entrada_campo: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    material: 'Girasol',
    administrador_id: 'a-2',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-05-12',
    fecha_llegada_estimada: '2026-05-28',
    estado: 'activo',
    viajes: [
      {
        id: '#12210',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Necochea - Puerto Quequén',
        toneladas: 32,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12211',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Bahía Blanca - Terminal',
        toneladas: 30.5,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
    ],
  },
  {
    id: 'd-13',
    nombre: 'Campaña Soja Mayo',
    productor_id: 'p-1',
    campo_id: 'c-2',
    origen: 'Venado Tuerto, Santa Fe',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Soja',
    administrador_id: 'a-1',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-05-20',
    fecha_llegada_estimada: '2026-06-05',
    estado: 'activo',
    viajes: [
      {
        id: '#12220',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Puerto San Martín',
        toneladas: 29.5,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12221',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'Puerto San Martín',
        toneladas: 30,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12222',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Rosario - Terminal',
        toneladas: 28,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
    ],
  },
  {
    id: 'd-8',
    nombre: 'Campaña Trigo Norte',
    productor_id: 'p-1',
    campo_id: 'c-2',
    origen: 'Salta Capital, Salta',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Trigo',
    administrador_id: 'a-2',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-07-05',
    fecha_llegada_estimada: '2026-07-22',
    estado: 'activo',
    viajes: [
      {
        id: '#12390',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Rosario - Terminal',
        toneladas: 32,
        estado: 'en_viaje',
        progreso: 45,
        observaciones: 'Viaje normal',
      },
      {
        id: '#12391',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Rosario - Terminal',
        toneladas: 30.5,
        estado: 'en_viaje',
        progreso: 82,
        observaciones: 'Llegada anticipada',
      },
      {
        id: '#12392',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'San Lorenzo - Puerto',
        toneladas: 29,
        estado: 'retrasado',
        progreso: 55,
        observaciones: 'Corte de ruta en km 120',
      },
      {
        id: '#12393',
        chofer: 'Sin asignar',
        dominio: '-',
        destino: 'San Lorenzo - Puerto',
        toneladas: 28,
        estado: 'pendiente',
        progreso: 0,
        observaciones: 'Pendiente asignación',
      },
      {
        id: '#12394',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Rosario - Terminal',
        toneladas: 31,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
    ],
  },
  {
    id: 'd-9',
    nombre: 'Campaña Girasol Sur (finalizada)',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'Tandil, Buenos Aires',
    entrada_campo: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    material: 'Girasol',
    administrador_id: 'a-1',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-06-10',
    fecha_llegada_estimada: '2026-06-28',
    estado: 'activo',
    viajes: [
      {
        id: '#12310',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Necochea - Puerto Quequén',
        toneladas: 30,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12311',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Necochea - Puerto Quequén',
        toneladas: 32.5,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado',
      },
      {
        id: '#12312',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Necochea - Puerto Quequén',
        toneladas: 28,
        estado: 'completado',
        progreso: 100,
        observaciones: 'Entregado con demora menor',
      },
    ],
  },
  {
    id: 'd-10',
    nombre: 'Campaña Soja Express',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'San Nicolás, Buenos Aires',
    entrada_campo: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    material: 'Soja',
    administrador_id: 'a-1',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-07-14',
    fecha_llegada_estimada: '2026-07-20',
    estado: 'activo',
    viajes: [
      {
        id: '#12395',
        chofer: 'Sin asignar',
        dominio: '-',
        destino: 'Puerto San Martín',
        toneladas: 29,
        estado: 'pendiente',
        progreso: 0,
        observaciones: 'Pendiente asignación',
      },
      {
        id: '#12396',
        chofer: 'Sin asignar',
        dominio: '-',
        destino: 'Puerto San Martín',
        toneladas: 30,
        estado: 'pendiente',
        progreso: 0,
        observaciones: 'Pendiente asignación',
      },
    ],
  },
  {
    id: 'd-4',
    nombre: 'Campaña Girasol 2026',
    productor_id: 'p-1',
    campo_id: 'c-1',
    origen: 'Pergamino, Buenos Aires',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Girasol',
    administrador_id: 'a-2',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-08-05',
    fecha_llegada_estimada: '2026-08-25',
    estado: 'borrador',
    viajes: [
      {
        id: '#12370',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Buenos Aires - Puerto',
        toneladas: 30,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
      {
        id: '#12371',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Buenos Aires - Puerto',
        toneladas: 31.5,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
      {
        id: '#12372',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'Bahía Blanca - Terminal',
        toneladas: 28,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
      {
        id: '#12373',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Bahía Blanca - Terminal',
        toneladas: 29.5,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
    ],
  },
  {
    id: 'd-5',
    nombre: 'Campaña Trigo Sur',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'Tres Arroyos, Buenos Aires',
    entrada_campo: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    material: 'Trigo',
    administrador_id: 'a-1',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-07-25',
    fecha_llegada_estimada: '2026-08-02',
    estado: 'borrador',
    viajes: [
      {
        id: '#12375',
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Necochea - Puerto Quequén',
        toneladas: 33,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
    ],
  },
  {
    id: 'd-6',
    nombre: 'Campaña Soja Tardía',
    productor_id: 'p-1',
    campo_id: 'c-2',
    origen: 'Venado Tuerto, Santa Fe',
    entrada_campo: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    material: 'Soja',
    administrador_id: 'a-2',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-07-18',
    fecha_llegada_estimada: '2026-07-30',
    estado: 'borrador',
    viajes: [
      {
        id: '#12380',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Rosario - Terminal',
        toneladas: 28.5,
        estado: 'en_viaje',
        progreso: 20,
        observaciones: 'Viaje iniciado',
      },
      {
        id: '#12381',
        chofer: 'Pedro Ramírez',
        dominio: 'XY789ZA',
        destino: 'Rosario - Terminal',
        toneladas: 30,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
      {
        id: '#12382',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Puerto San Martín',
        toneladas: 27,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
    ],
  },
  {
    id: 'd-7',
    nombre: 'Campaña Maíz Tardío (sin viajes)',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'Junín, Buenos Aires',
    entrada_campo: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    material: 'Maíz',
    administrador_id: 'a-1',
    vendedor_id: 'v-1',
    fecha_inicio: '2026-10-01',
    fecha_llegada_estimada: '2026-10-15',
    estado: 'borrador',
    viajes: [],
  },
  {
    id: 'd-2',
    nombre: 'Campaña Maíz Primavera',
    productor_id: 'p-2',
    campo_id: 'c-3',
    origen: 'Campo Verde SRL',
    entrada_campo: 'Campo San Pedro',
    material: 'Maíz',
    administrador_id: 'a-1',
    vendedor_id: 'v-2',
    fecha_inicio: '2026-09-15',
    fecha_llegada_estimada: '2026-10-01',
    estado: 'borrador',
    viajes: [
      {
        id: '#12360',
        chofer: 'Carlos Ruiz',
        dominio: 'AA123BB',
        destino: 'Puerto San Martín',
        toneladas: 28.5,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
      {
        id: '#12361',
        chofer: 'Roberto Gómez',
        dominio: 'BC456CD',
        destino: 'Puerto San Martín',
        toneladas: 27.5,
        estado: 'borrador',
        progreso: 0,
        observaciones: '',
      },
    ],
  },
];

export interface MockUsuario {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  rol: 'administrador' | 'vendedor';
}

export const MOCK_USUARIOS: MockUsuario[] = [
  {
    id: 'u-1',
    nombre: 'María González',
    dni: '27888999',
    email: 'admin@agro360.com',
    rol: 'administrador',
  },
  {
    id: 'u-2',
    nombre: 'Juan Pérez',
    dni: '12345678',
    email: 'juan.perez@email.com',
    rol: 'vendedor',
  },
  {
    id: 'u-3',
    nombre: 'Carlos Rodríguez',
    dni: '23456789',
    email: 'carlos.rodriguez@agro360.com',
    rol: 'vendedor',
  },
];

export interface MockParametros {
  precio_por_tonelada: number;
  moneda: 'ARS' | 'USD';
}

export interface MockPreferencias {
  viaje_retrasado: boolean;
  viaje_completado: boolean;
  mensaje_chofer: boolean;
}

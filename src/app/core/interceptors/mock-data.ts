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
    { id: 'ch-1', nombre: 'Carlos Ruiz', dominio: 'AA123BB' },
    { id: 'ch-2', nombre: 'Miguel Torres', dominio: 'EF789GH' },
    { id: 'ch-3', nombre: 'Roberto Gómez', dominio: 'BC456CD' },
    { id: 'ch-4', nombre: 'Pedro Ramírez', dominio: 'XY789ZA' },
  ],
};

export interface MockConversacion {
  id: string;
  chofer: string;
  dominio: string;
  no_leidos: number;
  mensajes: { id: string; autor: 'admin' | 'chofer'; texto: string; fecha: string }[];
}

export const MOCK_CONVERSACIONES: MockConversacion[] = [
  {
    id: 'conv-1',
    chofer: 'Carlos Ruiz',
    dominio: 'AA123BB',
    no_leidos: 2,
    mensajes: [
      {
        id: 'm-1',
        autor: 'admin',
        texto: 'Hola Carlos, ¿cómo va el viaje?',
        fecha: '2026-07-13T08:15:00',
      },
      {
        id: 'm-2',
        autor: 'chofer',
        texto: 'Todo bien, la carga va segura. Llego al puerto en 2 horas.',
        fecha: '2026-07-13T08:22:00',
      },
      {
        id: 'm-3',
        autor: 'chofer',
        texto: 'Ya estoy en la fila de descarga.',
        fecha: '2026-07-13T10:05:00',
      },
    ],
  },
  {
    id: 'conv-2',
    chofer: 'Pedro Ramírez',
    dominio: 'XY789ZA',
    no_leidos: 1,
    mensajes: [
      {
        id: 'm-4',
        autor: 'chofer',
        texto: 'Tengo un desperfecto técnico en ruta, voy a demorar.',
        fecha: '2026-07-13T09:40:00',
      },
    ],
  },
  {
    id: 'conv-3',
    chofer: 'Miguel Torres',
    dominio: 'EF789GH',
    no_leidos: 0,
    mensajes: [
      {
        id: 'm-5',
        autor: 'admin',
        texto: 'Miguel, mañana salís con la carga de soja a Rosario.',
        fecha: '2026-07-12T18:00:00',
      },
      {
        id: 'm-6',
        autor: 'chofer',
        texto: 'Perfecto, ¿a qué hora paso a cargar?',
        fecha: '2026-07-12T18:12:00',
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

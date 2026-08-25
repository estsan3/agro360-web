/**
 * Catálogo mínimo ARCA/WSCPE para selects de la pantalla Crear despacho.
 * Fuente: casuística CPE + códigos habituales de homologación.
 * Ampliar cuando exista endpoint de consulta ARCA.
 */

import { SelectOption } from '../../../shared/ui/select/select-input';

export const ARCA_PROVINCIAS: SelectOption[] = [
  { value: '1', label: '01 — Buenos Aires' },
  { value: '2', label: '02 — Catamarca' },
  { value: '3', label: '03 — Córdoba' },
  { value: '4', label: '04 — Corrientes' },
  { value: '5', label: '05 — Entre Ríos' },
  { value: '6', label: '06 — Jujuy' },
  { value: '7', label: '07 — Mendoza' },
  { value: '8', label: '08 — La Rioja' },
  { value: '9', label: '09 — Salta' },
  { value: '10', label: '10 — San Juan' },
  { value: '11', label: '11 — San Luis' },
  { value: '12', label: '12 — Santa Fe' },
  { value: '13', label: '13 — Santiago del Estero' },
  { value: '14', label: '14 — Tucumán' },
  { value: '16', label: '16 — Chaco' },
  { value: '17', label: '17 — Chubut' },
  { value: '18', label: '18 — Formosa' },
  { value: '19', label: '19 — Misiones' },
  { value: '20', label: '20 — Neuquén' },
  { value: '21', label: '21 — La Pampa' },
  { value: '22', label: '22 — Río Negro' },
  { value: '23', label: '23 — Santa Cruz' },
  { value: '24', label: '24 — Tierra del Fuego' },
];

/** Localidades usadas en casuística + destinos frecuentes. */
export const ARCA_LOCALIDADES: { provincia: number; codigo: number; nombre: string }[] = [
  { provincia: 21, codigo: 6975, nombre: 'Intendente Alvear' },
  { provincia: 12, codigo: 11797, nombre: 'Puerto General San Martín' },
  { provincia: 12, codigo: 6381, nombre: 'General Lagos' },
  { provincia: 12, codigo: 11629, nombre: 'Rosario' },
  { provincia: 12, codigo: 11678, nombre: 'Timbúes' },
  { provincia: 1, codigo: 204, nombre: 'Bahía Blanca' },
  { provincia: 1, codigo: 336, nombre: 'Pergamino' },
];

export function localidadesDeProvincia(codProvincia: number | null): SelectOption[] {
  if (!codProvincia) {
    return [];
  }
  return ARCA_LOCALIDADES.filter((l) => l.provincia === codProvincia).map((l) => ({
    value: String(l.codigo),
    label: `${l.codigo} — ${l.nombre}`,
  }));
}

/** Códigos de grano AFIP (WSCPE) para etiqueta junto al material. */
export const CODIGO_GRANO_AFIP: Record<string, number> = {
  Trigo: 1,
  Maíz: 19,
  Soja: 23,
  Girasol: 27,
};

/** Razones sociales conocidas (casuística / demo) hasta integrar padrón ARCA. */
export const RAZON_SOCIAL_POR_CUIT: Record<string, string> = {
  '33506737449': 'COFCO International Argentina S.A.',
  '30526712729': 'LDC Argentina S.A.',
  '33502232229': 'Viterra Argentina S.A.',
  '30711855641': 'FYO Acopio S.A.',
  '30525698412': 'A3 Mercados S.A.',
  '30703605105': 'FYO.com S.A.',
  '30711962766': 'Gualtieri S.A.',
  '20237684436': 'Barbesini Claudio Oscar',
  '30649956746': 'Transportes Braidotti S.R.L.',
  '30716040530': 'SIEMBRAS TC-SMG S.R.L.',
  '20388082802': 'Parra Paolo Maximiliano',
  '23247746099': 'Torres Dario Alberto',
};

export function razonSocialCuit(cuit: string | null | undefined): string {
  const key = (cuit ?? '').replace(/\D/g, '');
  if (key.length !== 11) {
    return '';
  }
  return RAZON_SOCIAL_POR_CUIT[key] ?? 'Razón social (consultar ARCA)';
}

export type TabDespacho =
  'origen' | 'cereal' | 'destino' | 'intervinientes' | 'vendedor' | 'transporte' | 'transportistas';

export const TABS_DESPACHO: { id: TabDespacho; label: string }[] = [
  { id: 'origen', label: 'Origen' },
  { id: 'cereal', label: 'Cereal' },
  { id: 'destino', label: 'Destino' },
  { id: 'intervinientes', label: 'Intervinientes' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'transportistas', label: 'Transportistas' },
];

export type CanalAsignacion = 'directo' | 'lista_espera' | 'ia' | 'telefono' | '';

export const CANAL_OPTIONS: SelectOption[] = [
  { value: 'directo', label: 'Directo' },
  { value: 'lista_espera', label: 'Lista de espera' },
  { value: 'ia', label: 'Agente IA' },
  { value: 'telefono', label: 'Teléfono' },
];

/**
 * Paleta categórica de charts en ORDEN FIJO (nunca ciclada).
 * Validada con dataviz/validate_palette.js (lightness, chroma, CVD, contraste).
 * Debe coincidir con $chart-1..4 de styles/_tokens.scss.
 */
export const CHART_COLORS = ['#007c2e', '#2563eb', '#d97706', '#37b38d'] as const;

export interface ChartDatum {
  label: string;
  value: number;
}

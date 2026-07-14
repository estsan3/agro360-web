import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type KpiTone = 'brand' | 'orange' | 'amber' | 'red' | 'green';

/**
 * Card de KPI del kit Agro360 (Figma: UI Kit Gestión → Card / Reportería,
 * y totalizadores de Gestión operativa).
 * light: card blanca con icono en cuadrado verde y chip de tendencia.
 * dark: card verde profunda (ej. Recaudación $619,000).
 * tone (≠ brand): panel de icono tintado + valor coloreado (totalizadores).
 */
@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly variant = input<'light' | 'dark'>('light');
  readonly tone = input<KpiTone>('brand');
  /** stat: icono arriba y chip de tendencia flotante (dashboard Reportería) */
  readonly layout = input<'row' | 'stat'>('row');
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Chip de tendencia, ej. "+12%" */
  readonly trend = input('');
  /** Semántica de la tendencia: en Incidentes, "+1" es malo aunque sea positivo */
  readonly trendTone = input<'auto' | 'good' | 'bad'>('auto');
  /** Serie de los últimos días para el sparkline (opcional) */
  readonly sparkline = input<number[]>([]);
  /** Línea de contexto bajo el valor, ej. "sobre 27 viajes totales" */
  readonly detail = input('');

  /** Puntos del sparkline normalizados a un viewBox de 100x30 */
  protected readonly sparkPoints = computed(() => {
    const serie = this.sparkline();
    if (serie.length < 2) {
      return '';
    }
    const max = Math.max(...serie);
    const min = Math.min(...serie);
    const rango = Math.max(max - min, 1);
    return serie
      .map((valor, i) => {
        const x = (i / (serie.length - 1)) * 100;
        const y = 27 - ((valor - min) / rango) * 22;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  protected readonly trendIsBad = computed(() => {
    if (this.trendTone() !== 'auto') {
      return this.trendTone() === 'bad';
    }
    return this.trend().startsWith('-');
  });

  protected readonly trendGlyph = computed(() => (this.trend().startsWith('-') ? '↘' : '↗'));
}

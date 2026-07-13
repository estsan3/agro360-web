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
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Chip de tendencia, ej. "+12%" */
  readonly trend = input('');
  /** Semántica de la tendencia: en Incidentes, "+1" es malo aunque sea positivo */
  readonly trendTone = input<'auto' | 'good' | 'bad'>('auto');

  protected readonly trendIsBad = computed(() => {
    if (this.trendTone() !== 'auto') {
      return this.trendTone() === 'bad';
    }
    return this.trend().startsWith('-');
  });

  protected readonly trendGlyph = computed(() => (this.trend().startsWith('-') ? '↘' : '↗'));
}

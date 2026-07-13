import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Card de KPI del kit Agro360 (Figma: UI Kit Gestión → Card / Reportería).
 * light: card blanca con icono en cuadrado verde y chip de tendencia.
 * dark: card verde profunda (ej. Recaudación $619,000).
 */
@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly variant = input<'light' | 'dark'>('light');
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Chip de tendencia, ej. "+12%" (se colorea según el signo) */
  readonly trend = input('');
}

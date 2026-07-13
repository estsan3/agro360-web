import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartDatum } from '../../../shared/ui/charts/chart-colors';
import { BarChart } from '../../../shared/ui/charts/bar-chart';
import { DonutChart } from '../../../shared/ui/charts/donut-chart';
import { Icon } from '../../../shared/ui/icon/icon';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { ParametrosStore } from '../../../core/state/parametros.store';
import { DespachoStore } from '../data-access/despacho.store';

/**
 * Reportería (Figma: UI Kit Gestión → Reportería): KPIs + composición
 * de viajes por material y por campo. Lee del mismo DespachoStore que
 * el resto del dominio — la comunicación entre pantallas es vía store.
 */
@Component({
  selector: 'app-reportes-page',
  imports: [DecimalPipe, BarChart, DonutChart, Icon, KpiCard, StateWrapper],
  templateUrl: './reportes-page.html',
  styleUrl: './reportes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesPage {
  private readonly store = inject(DespachoStore);
  private readonly parametrosStore = inject(ParametrosStore);

  protected readonly despachos = this.store.despachos;

  private readonly viajes = computed(() => this.store.enOperacion().flatMap((d) => d.viajes));

  protected readonly enRuta = computed(
    () => this.viajes().filter((viaje) => viaje.estado === 'en-viaje').length,
  );
  protected readonly completados = computed(
    () => this.viajes().filter((viaje) => viaje.estado === 'completado').length,
  );
  protected readonly totalToneladas = computed(() =>
    this.viajes().reduce((sum, viaje) => sum + viaje.toneladas, 0),
  );
  protected readonly recaudacion = computed(
    () =>
      this.viajes()
        .filter((viaje) => viaje.estado === 'completado')
        .reduce((sum, viaje) => sum + viaje.toneladas, 0) *
      this.parametrosStore.parametros().precioPorTonelada,
  );

  protected readonly viajesPorMaterial = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const despacho of this.store.enOperacion()) {
      counts.set(despacho.material, (counts.get(despacho.material) ?? 0) + despacho.viajes.length);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly viajesPorCampo = computed<ChartDatum[]>(() => {
    const catalogos = this.store.catalogos().data;
    const counts = new Map<string, number>();
    for (const despacho of this.store.enOperacion()) {
      const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
      const campo = productor?.campos.find((c) => c.id === despacho.campoId);
      const nombre = campo?.nombre ?? 'Sin campo';
      counts.set(nombre, (counts.get(nombre) ?? 0) + despacho.viajes.length);
    }
    return [...counts.entries()].map(([label, value]) => ({ label, value }));
  });

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
    this.parametrosStore.cargar();
  }
}

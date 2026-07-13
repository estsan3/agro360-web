import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ParametrosStore } from '../../../core/state/parametros.store';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { BubbleChart } from '../../../shared/ui/charts/bubble-chart';
import { ChartDatum } from '../../../shared/ui/charts/chart-colors';
import { DonutChart } from '../../../shared/ui/charts/donut-chart';
import { GroupedBarChart, GroupedBarDatum } from '../../../shared/ui/charts/grouped-bar-chart';
import { Icon } from '../../../shared/ui/icon/icon';
import { KpiCard } from '../../../shared/ui/kpi-card/kpi-card';
import { SelectInput, SelectOption } from '../../../shared/ui/select/select-input';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../../shared/ui/table/table';
import { TableCellDef } from '../../../shared/ui/table/table-cell-def';
import { TextInput } from '../../../shared/ui/input/text-input';
import { EstadoViaje } from '../data-access/despacho.model';
import { DespachoStore } from '../data-access/despacho.store';
import { ReportExportService } from './report-export.service';

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const ESTADO_LABEL: Record<EstadoViaje, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  'en-viaje': 'En viaje',
  retrasado: 'Retrasado',
  completado: 'Completado',
};

interface FilaReporte {
  id: string;
  campania: string;
  productor: string;
  campo: string;
  material: string;
  chofer: string;
  dominio: string;
  destino: string;
  toneladas: number;
  estado: EstadoViaje;
  fecha: Date;
}

const REPORTE_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'campania', label: 'Campaña' },
  { key: 'productor', label: 'Productor' },
  { key: 'material', label: 'Material' },
  { key: 'chofer', label: 'Chofer' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Tn', align: 'right' },
  { key: 'estado', label: 'Estado' },
  { key: 'fechaTexto', label: 'Fecha' },
];

/**
 * Reportería en dos secciones independientes:
 * - Dashboard: KPIs y gráficos (Figma).
 * - Generador de reportes: filtros → tabla → exportar PDF/Excel/CSV.
 */
@Component({
  selector: 'app-reportes-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    Badge,
    BubbleChart,
    Button,
    DonutChart,
    GroupedBarChart,
    Icon,
    KpiCard,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
    TextInput,
  ],
  templateUrl: './reportes-page.html',
  styleUrl: './reportes-page.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(DespachoStore);
  private readonly parametrosStore = inject(ParametrosStore);
  private readonly exportService = inject(ReportExportService);
  private readonly datePipe = inject(DatePipe);

  protected readonly despachos = this.store.despachos;
  protected readonly seccion = signal<'dashboard' | 'generador'>('dashboard');
  protected readonly reporteColumns = REPORTE_COLUMNS;

  // ============ DASHBOARD ============
  private readonly viajes = computed(() => this.store.enOperacion().flatMap((d) => d.viajes));

  protected readonly totalViajes = computed(() => this.viajes().length);
  protected readonly completados = computed(
    () => this.viajes().filter((v) => v.estado === 'completado').length,
  );
  protected readonly totalToneladas = computed(() =>
    this.viajes().reduce((sum, v) => sum + v.toneladas, 0),
  );
  protected readonly recaudacion = computed(
    () =>
      this.viajes()
        .filter((v) => v.estado === 'completado')
        .reduce((sum, v) => sum + v.toneladas, 0) *
      this.parametrosStore.parametros().precioPorTonelada,
  );

  protected readonly viajesPorMaterial = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const despacho of this.store.enOperacion()) {
      counts.set(despacho.material, (counts.get(despacho.material) ?? 0) + despacho.viajes.length);
    }
    // Tendencias mock hasta que el backend calcule históricos
    const trends = ['+8%', '+5%', '-3%', '+2%'];
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .map((datum, index) => ({ ...datum, trend: trends[index] }));
  });

  protected readonly camposSeries = computed<[string, string]>(() => {
    const totales = new Map<string, number>();
    for (const despacho of this.store.enOperacion()) {
      const campo = this.nombreCampo(despacho.productorId, despacho.campoId);
      totales.set(campo, (totales.get(campo) ?? 0) + despacho.viajes.length);
    }
    const top = [...totales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    return [top[0]?.[0] ?? '—', top[1]?.[0] ?? '—'];
  });

  protected readonly viajesPorCampoMes = computed<GroupedBarDatum[]>(() => {
    const [serie1, serie2] = this.camposSeries();
    const meses = new Map<string, GroupedBarDatum>();

    for (const despacho of this.store.enOperacion()) {
      const campo = this.nombreCampo(despacho.productorId, despacho.campoId);
      if (campo !== serie1 && campo !== serie2) {
        continue;
      }
      const clave = `${despacho.fechaInicio.getFullYear()}-${String(despacho.fechaInicio.getMonth()).padStart(2, '0')}`;
      if (!meses.has(clave)) {
        meses.set(clave, {
          label: MESES_CORTOS[despacho.fechaInicio.getMonth()],
          values: [0, 0],
        });
      }
      const entrada = meses.get(clave)!;
      entrada.values[campo === serie1 ? 0 : 1] += despacho.viajes.length;
    }
    return [...meses.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, valor]) => valor);
  });

  protected readonly viajesPorDestino = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const viaje of this.viajes()) {
      counts.set(viaje.destino, (counts.get(viaje.destino) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly totalDestinos = computed(() =>
    this.viajesPorDestino().reduce((sum, d) => sum + d.value, 0),
  );

  protected porcentajeDestino(valor: number): number {
    return Math.round((valor / Math.max(this.totalDestinos(), 1)) * 100);
  }

  private nombreCampo(productorId: string, campoId: string): string {
    const productor = this.store.catalogos().data?.productores.find((p) => p.id === productorId);
    return productor?.campos.find((c) => c.id === campoId)?.nombre ?? '—';
  }

  // ============ GENERADOR DE REPORTES ============
  protected readonly filtrosForm = this.fb.group({
    fechaDesde: [''],
    fechaHasta: [''],
    productorId: [''],
    material: [''],
    estado: [''],
    chofer: [''],
    destino: [''],
    tnMin: [''],
    tnMax: [''],
  });

  private readonly filtros = toSignal(this.filtrosForm.valueChanges, {
    initialValue: this.filtrosForm.getRawValue(),
  });

  protected readonly productorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.productores ?? []).map((p) => ({
      value: p.id,
      label: p.nombre,
    })),
  );
  protected readonly materialOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.materiales ?? []).map((m) => ({ value: m, label: m })),
  );
  protected readonly choferOptions = computed<SelectOption[]>(() => {
    const nombres = new Set<string>();
    for (const despacho of this.store.despachos().data ?? []) {
      for (const viaje of despacho.viajes) {
        nombres.add(viaje.chofer);
      }
    }
    return [...nombres].sort().map((nombre) => ({ value: nombre, label: nombre }));
  });
  protected readonly estadoOptions: SelectOption[] = Object.entries(ESTADO_LABEL).map(
    ([value, label]) => ({ value, label }),
  );

  /** Todos los viajes del sistema aplanados (incluye borradores) */
  private readonly todasLasFilas = computed<FilaReporte[]>(() => {
    const catalogos = this.store.catalogos().data;
    return (this.store.despachos().data ?? []).flatMap((despacho) => {
      const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
      const campo = productor?.campos.find((c) => c.id === despacho.campoId);
      return despacho.viajes.map((viaje) => ({
        id: viaje.id,
        campania: despacho.nombre,
        productor: productor?.nombre ?? '—',
        campo: campo?.nombre ?? '—',
        material: despacho.material,
        chofer: viaje.chofer,
        dominio: viaje.dominio,
        destino: viaje.destino,
        toneladas: viaje.toneladas,
        estado: viaje.estado,
        fecha: despacho.fechaInicio,
      }));
    });
  });

  protected readonly filasFiltradas = computed<FilaReporte[]>(() => {
    const filtros = this.filtros();
    const desde = filtros.fechaDesde ? new Date(`${filtros.fechaDesde}T00:00:00`) : null;
    const hasta = filtros.fechaHasta ? new Date(`${filtros.fechaHasta}T23:59:59`) : null;
    const destino = (filtros.destino ?? '').toLowerCase();
    const tnMin = filtros.tnMin ? Number(filtros.tnMin) : null;
    const tnMax = filtros.tnMax ? Number(filtros.tnMax) : null;
    const catalogos = this.store.catalogos().data;
    const productorNombre = catalogos?.productores.find(
      (p) => p.id === filtros.productorId,
    )?.nombre;

    return this.todasLasFilas().filter(
      (fila) =>
        (!desde || fila.fecha >= desde) &&
        (!hasta || fila.fecha <= hasta) &&
        (!filtros.productorId || fila.productor === productorNombre) &&
        (!filtros.material || fila.material === filtros.material) &&
        (!filtros.estado || fila.estado === filtros.estado) &&
        (!filtros.chofer || fila.chofer === filtros.chofer) &&
        (!destino || fila.destino.toLowerCase().includes(destino)) &&
        (tnMin === null || fila.toneladas >= tnMin) &&
        (tnMax === null || fila.toneladas <= tnMax),
    );
  });

  protected readonly filasTabla = computed(() =>
    this.filasFiltradas().map(
      (fila) =>
        ({
          ...fila,
          fechaTexto: this.datePipe.transform(fila.fecha, 'dd/MM/yyyy') ?? '—',
        }) as unknown as Record<string, unknown>,
    ),
  );

  protected readonly toneladasFiltradas = computed(() =>
    this.filasFiltradas().reduce((sum, fila) => sum + fila.toneladas, 0),
  );

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
    this.parametrosStore.cargar();
  }

  protected limpiarFiltros(): void {
    this.filtrosForm.reset();
  }

  protected exportar(formato: 'pdf' | 'excel' | 'csv'): void {
    const reporte = {
      titulo: 'Reporte de viajes',
      headers: [
        'ID',
        'Campaña',
        'Productor',
        'Campo',
        'Material',
        'Chofer',
        'Dominio',
        'Destino',
        'Toneladas',
        'Estado',
        'Fecha',
      ],
      filas: this.filasFiltradas().map((fila) => [
        fila.id,
        fila.campania,
        fila.productor,
        fila.campo,
        fila.material,
        fila.chofer,
        fila.dominio,
        fila.destino,
        String(fila.toneladas),
        ESTADO_LABEL[fila.estado],
        this.datePipe.transform(fila.fecha, 'dd/MM/yyyy') ?? '',
      ]),
    };
    if (formato === 'csv') {
      this.exportService.exportCsv(reporte);
    } else if (formato === 'excel') {
      this.exportService.exportExcel(reporte);
    } else {
      this.exportService.exportPdf(reporte);
    }
  }
}

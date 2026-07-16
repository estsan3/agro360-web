import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ParametrosStore } from '../../../core/state/parametros.store';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { BarChart } from '../../../shared/ui/charts/bar-chart';
import { BubbleChart } from '../../../shared/ui/charts/bubble-chart';
import { ChartDatum } from '../../../shared/ui/charts/chart-colors';
import { DonutChart } from '../../../shared/ui/charts/donut-chart';
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
  campaniaId: string;
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

interface EvolucionCampoVm {
  campo: string;
  totalTn: number;
  datos: ChartDatum[];
}

interface RankingCampania {
  campania: string;
  viajes: number;
  toneladas: number;
  completados: number;
  enViaje: number;
  alertas: number;
}

interface RankingChofer {
  chofer: string;
  viajes: number;
  toneladas: number;
  completados: number;
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

const RANKING_CAMPANIA_COLUMNS: TableColumn[] = [
  { key: 'campania', label: 'Campaña' },
  { key: 'viajes', label: 'Viajes', align: 'right' },
  { key: 'toneladas', label: 'Toneladas', align: 'right' },
  { key: 'completados', label: 'Completados', align: 'right' },
  { key: 'enViaje', label: 'En ruta', align: 'right' },
  { key: 'alertas', label: 'Alertas', align: 'right' },
];

const RANKING_CHOFER_COLUMNS: TableColumn[] = [
  { key: 'chofer', label: 'Chofer' },
  { key: 'viajes', label: 'Viajes', align: 'right' },
  { key: 'toneladas', label: 'Toneladas', align: 'right' },
  { key: 'completados', label: 'Completados', align: 'right' },
];

/**
 * Reportería estilo Power BI: filtros globales (slicers), KPIs dinámicos,
 * gráficos interactivos y tablas de ranking para la toma de decisiones.
 */
@Component({
  selector: 'app-reportes-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    Badge,
    BarChart,
    BubbleChart,
    Button,
    DonutChart,
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
  private readonly route = inject(ActivatedRoute);
  private readonly parametrosStore = inject(ParametrosStore);
  private readonly exportService = inject(ReportExportService);
  private readonly datePipe = inject(DatePipe);

  protected readonly despachos = this.store.despachos;
  protected readonly seccion = signal<'dashboard' | 'generador'>('dashboard');
  protected readonly reporteColumns = REPORTE_COLUMNS;
  protected readonly rankingCampaniaColumns = RANKING_CAMPANIA_COLUMNS;
  protected readonly rankingChoferColumns = RANKING_CHOFER_COLUMNS;

  protected readonly filtrosForm = this.fb.group({
    fechaDesde: [''],
    fechaHasta: [''],
    campaniaId: [''],
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

  protected readonly campaniaOptions = computed<SelectOption[]>(() =>
    (this.store.despachos().data ?? [])
      .filter((despacho) => despacho.estado !== 'borrador')
      .map((despacho) => ({
        value: despacho.id,
        label: despacho.nombre,
      })),
  );

  protected readonly materialOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.materiales ?? []).map((m) => ({ value: m, label: m })),
  );

  protected readonly choferOptions = computed<SelectOption[]>(() => {
    const nombres = new Set<string>();
    for (const despacho of this.store.despachos().data ?? []) {
      for (const viaje of despacho.viajes) {
        if (viaje.chofer && viaje.chofer !== 'Sin asignar') {
          nombres.add(viaje.chofer);
        }
      }
    }
    return [...nombres].sort().map((nombre) => ({ value: nombre, label: nombre }));
  });

  protected readonly estadoOptions: SelectOption[] = Object.entries(ESTADO_LABEL)
    .filter(([value]) => value !== 'borrador')
    .map(([value, label]) => ({ value, label }));

  private readonly todasLasFilas = computed<FilaReporte[]>(() => {
    const catalogos = this.store.catalogos().data;
    return (this.store.despachos().data ?? []).flatMap((despacho) => {
      const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
      const campo = productor?.campos.find((c) => c.id === despacho.campoId);
      return despacho.viajes.map((viaje) => ({
        id: viaje.id,
        campaniaId: despacho.id,
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
        fila.estado !== 'borrador' &&
        (!desde || fila.fecha >= desde) &&
        (!hasta || fila.fecha <= hasta) &&
        (!filtros.campaniaId || fila.campaniaId === filtros.campaniaId) &&
        (!filtros.productorId || fila.productor === productorNombre) &&
        (!filtros.material || fila.material === filtros.material) &&
        (!filtros.estado || fila.estado === filtros.estado) &&
        (!filtros.chofer || fila.chofer === filtros.chofer) &&
        (!destino || fila.destino.toLowerCase().includes(destino)) &&
        (tnMin === null || Number.isNaN(tnMin) || fila.toneladas >= tnMin) &&
        (tnMax === null || Number.isNaN(tnMax) || fila.toneladas <= tnMax),
    );
  });

  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.fechaDesde ||
      f.fechaHasta ||
      f.campaniaId ||
      f.productorId ||
      f.material ||
      f.estado ||
      f.chofer ||
      f.destino ||
      f.tnMin ||
      f.tnMax
    );
  });

  protected readonly etiquetasFiltrosActivos = computed(() => {
    const f = this.filtros();
    const catalogos = this.store.catalogos().data;
    const chips: string[] = [];
    if (f.fechaDesde) {
      chips.push(`Desde ${f.fechaDesde}`);
    }
    if (f.fechaHasta) {
      chips.push(`Hasta ${f.fechaHasta}`);
    }
    if (f.campaniaId) {
      const nombre =
        this.store.despachos().data?.find((d) => d.id === f.campaniaId)?.nombre ?? f.campaniaId;
      chips.push(`Campaña: ${nombre}`);
    }
    if (f.productorId) {
      const nombre = catalogos?.productores.find((p) => p.id === f.productorId)?.nombre;
      chips.push(`Productor: ${nombre ?? f.productorId}`);
    }
    if (f.material) {
      chips.push(`Material: ${f.material}`);
    }
    if (f.estado) {
      chips.push(`Estado: ${ESTADO_LABEL[f.estado as EstadoViaje]}`);
    }
    if (f.chofer) {
      chips.push(`Chofer: ${f.chofer}`);
    }
    if (f.destino) {
      chips.push(`Destino: ${f.destino}`);
    }
    if (f.tnMin) {
      chips.push(`Tn ≥ ${f.tnMin}`);
    }
    if (f.tnMax) {
      chips.push(`Tn ≤ ${f.tnMax}`);
    }
    return chips;
  });

  protected readonly rangoFiltroTexto = computed(() => {
    const f = this.filtros();
    const formatear = (iso: string) => {
      const fecha = new Date(`${iso}T12:00:00`);
      if (Number.isNaN(fecha.getTime())) {
        return iso;
      }
      return `${String(fecha.getDate()).padStart(2, '0')} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
    };
    if (f.fechaDesde && f.fechaHasta) {
      return `${formatear(f.fechaDesde)} – ${formatear(f.fechaHasta)}`;
    }
    if (f.fechaDesde) {
      return `Desde ${formatear(f.fechaDesde)}`;
    }
    if (f.fechaHasta) {
      return `Hasta ${formatear(f.fechaHasta)}`;
    }
    return 'Todo el período';
  });

  // ============ DASHBOARD (derivado de filtros globales) ============

  protected readonly totalViajes = computed(() => this.filasFiltradas().length);

  protected readonly completados = computed(
    () => this.filasFiltradas().filter((fila) => fila.estado === 'completado').length,
  );

  protected readonly enViaje = computed(
    () => this.filasFiltradas().filter((fila) => fila.estado === 'en-viaje').length,
  );

  protected readonly pendientes = computed(
    () => this.filasFiltradas().filter((fila) => fila.estado === 'pendiente').length,
  );

  protected readonly retrasados = computed(
    () => this.filasFiltradas().filter((fila) => fila.estado === 'retrasado').length,
  );

  protected readonly totalToneladas = computed(() =>
    this.filasFiltradas().reduce((sum, fila) => sum + fila.toneladas, 0),
  );

  protected readonly toneladasCompletadas = computed(() =>
    this.filasFiltradas()
      .filter((fila) => fila.estado === 'completado')
      .reduce((sum, fila) => sum + fila.toneladas, 0),
  );

  protected readonly recaudacion = computed(
    () => this.toneladasCompletadas() * this.parametrosStore.parametros().precioPorTonelada,
  );

  protected readonly avancePorcentaje = computed(() =>
    Math.round((this.completados() / Math.max(this.totalViajes(), 1)) * 100),
  );

  protected readonly campaniasUnicas = computed(
    () => new Set(this.filasFiltradas().map((fila) => fila.campaniaId)).size,
  );

  protected readonly promedioToneladas = computed(() =>
    (this.totalToneladas() / Math.max(this.totalViajes(), 1)).toFixed(1),
  );

  protected readonly viajesPorMaterial = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const fila of this.filasFiltradas()) {
      counts.set(fila.material, (counts.get(fila.material) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly viajesPorEstado = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const fila of this.filasFiltradas()) {
      const label = ESTADO_LABEL[fila.estado];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const orden = ['Completado', 'En viaje', 'Pendiente', 'Retrasado'];
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => orden.indexOf(a.label) - orden.indexOf(b.label));
  });

  protected readonly evolucionTopCampos = computed<EvolucionCampoVm[]>(() => {
    const totales = new Map<string, number>();
    for (const fila of this.filasFiltradas()) {
      totales.set(fila.campo, (totales.get(fila.campo) ?? 0) + fila.toneladas);
    }
    const topCampos = [...totales.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([campo]) => campo);

    return topCampos.map((campo) => {
      const meses = new Map<string, ChartDatum>();
      let totalTn = 0;
      for (const fila of this.filasFiltradas()) {
        if (fila.campo !== campo) {
          continue;
        }
        totalTn += fila.toneladas;
        const clave = `${fila.fecha.getFullYear()}-${String(fila.fecha.getMonth()).padStart(2, '0')}`;
        if (!meses.has(clave)) {
          meses.set(clave, {
            label: MESES_CORTOS[fila.fecha.getMonth()],
            value: 0,
          });
        }
        const entrada = meses.get(clave)!;
        entrada.value = Math.round((entrada.value + fila.toneladas) * 10) / 10;
      }
      return {
        campo,
        totalTn: Math.round(totalTn * 10) / 10,
        datos: [...meses.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([, valor]) => valor),
      };
    });
  });

  protected readonly topCamposToneladas = computed<ChartDatum[]>(() => {
    const totals = new Map<string, number>();
    for (const fila of this.filasFiltradas()) {
      totals.set(fila.campo, (totals.get(fila.campo) ?? 0) + fila.toneladas);
    }
    return [...totals.entries()]
      .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  });

  protected readonly viajesPorDestino = computed<ChartDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const fila of this.filasFiltradas()) {
      counts.set(fila.destino, (counts.get(fila.destino) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly totalDestinos = computed(() =>
    this.viajesPorDestino().reduce((sum, dato) => sum + dato.value, 0),
  );

  protected readonly rankingCampanias = computed(() =>
    this.agruparRankingCampanias()
      .sort((a, b) => b.toneladas - a.toneladas)
      .slice(0, 8)
      .map((fila) => ({ ...fila }) as unknown as Record<string, unknown>),
  );

  protected readonly rankingChoferes = computed(() =>
    this.agruparRankingChoferes()
      .sort((a, b) => b.toneladas - a.toneladas)
      .slice(0, 8)
      .map((fila) => ({ ...fila }) as unknown as Record<string, unknown>),
  );

  protected porcentajeDestino(valor: number): number {
    return Math.round((valor / Math.max(this.totalDestinos(), 1)) * 100);
  }

  // ============ GENERADOR ============

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

    this.route.queryParamMap.subscribe((params) => {
      const campaniaId = params.get('campania');
      if (campaniaId) {
        this.filtrosForm.patchValue({ campaniaId });
        this.seccion.set('generador');
      }
    });
  }

  protected limpiarFiltros(): void {
    this.filtrosForm.reset();
  }

  protected aplicarFiltroGrafico(
    campo: 'material' | 'estado' | 'destino' | 'campo',
    valor: string,
  ): void {
    if (campo === 'material') {
      const actual = this.filtrosForm.get('material')?.value;
      this.filtrosForm.patchValue({ material: actual === valor ? '' : valor });
      return;
    }
    if (campo === 'estado') {
      const clave = Object.entries(ESTADO_LABEL).find(([, label]) => label === valor)?.[0] ?? '';
      const actual = this.filtrosForm.get('estado')?.value;
      this.filtrosForm.patchValue({ estado: actual === clave ? '' : clave });
      return;
    }
    if (campo === 'destino') {
      const actual = this.filtrosForm.get('destino')?.value;
      this.filtrosForm.patchValue({ destino: actual === valor ? '' : valor });
      return;
    }
    const catalogos = this.store.catalogos().data;
    const campoEncontrado = catalogos?.productores
      .flatMap((productor) => productor.campos)
      .find((c) => c.nombre === valor);
    if (!campoEncontrado) {
      return;
    }
    const productor = catalogos?.productores.find((p) =>
      p.campos.some((c) => c.id === campoEncontrado.id),
    );
    const actualProductor = this.filtrosForm.get('productorId')?.value;
    this.filtrosForm.patchValue({
      productorId: actualProductor === productor?.id ? '' : (productor?.id ?? ''),
    });
  }

  protected verDetalleTabla(): void {
    this.seccion.set('generador');
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

  private agruparRankingCampanias(): RankingCampania[] {
    const mapa = new Map<string, RankingCampania>();
    for (const fila of this.filasFiltradas()) {
      const actual = mapa.get(fila.campania) ?? {
        campania: fila.campania,
        viajes: 0,
        toneladas: 0,
        completados: 0,
        enViaje: 0,
        alertas: 0,
      };
      actual.viajes += 1;
      actual.toneladas += fila.toneladas;
      if (fila.estado === 'completado') {
        actual.completados += 1;
      }
      if (fila.estado === 'en-viaje') {
        actual.enViaje += 1;
      }
      if (fila.estado === 'retrasado' || fila.estado === 'pendiente') {
        actual.alertas += 1;
      }
      mapa.set(fila.campania, actual);
    }
    return [...mapa.values()].map((fila) => ({
      ...fila,
      toneladas: Math.round(fila.toneladas * 10) / 10,
    }));
  }

  private agruparRankingChoferes(): RankingChofer[] {
    const mapa = new Map<string, RankingChofer>();
    for (const fila of this.filasFiltradas()) {
      if (!fila.chofer || fila.chofer === 'Sin asignar') {
        continue;
      }
      const actual = mapa.get(fila.chofer) ?? {
        chofer: fila.chofer,
        viajes: 0,
        toneladas: 0,
        completados: 0,
      };
      actual.viajes += 1;
      actual.toneladas += fila.toneladas;
      if (fila.estado === 'completado') {
        actual.completados += 1;
      }
      mapa.set(fila.chofer, actual);
    }
    return [...mapa.values()].map((fila) => ({
      ...fila,
      toneladas: Math.round(fila.toneladas * 10) / 10,
    }));
  }
}

import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { TextInput } from '../../shared/ui/input/text-input';
import { Modal } from '../../shared/ui/modal/modal';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { TransportistasService } from '../transportistas/data-access/transportistas.service';
import { MovimientoCtacte } from './data-access/liquidaciones.model';
import { LiquidacionesStore } from './data-access/liquidaciones.store';

/** Columnas del resumen de cuenta (mismo orden que el comprobante en papel). */
const MOV_COLUMNS: TableColumn[] = [
  { key: 'fecha', label: 'Fecha', width: '100px' },
  { key: 'comprobante', label: 'Nro. Comprobante', width: '120px' },
  { key: 'detalle', label: 'Detalle' },
  { key: 'dadorViaje', label: 'Dador de viaje', width: '140px' },
  { key: 'toneladas', label: 'Tn', align: 'right', width: '90px' },
  { key: 'tarifa', label: 'Tfa.', align: 'right', width: '130px' },
  // Ancho para montos hasta 90.000.000,00
  { key: 'debe', label: 'Debe', align: 'right', width: '160px' },
  { key: 'haber', label: 'Haber', align: 'right', width: '160px' },
  { key: 'saldo', label: 'Saldo', align: 'right', width: '160px' },
  { key: 'acciones', label: '', align: 'right', width: '88px' },
];

/**
 * Resumen de cuenta corriente de transportista:
 * 1) Elegir transportista (titular de la cta cte)
 * 2) Rango desde / hasta
 * 3) Grilla Debe/Haber/Saldo
 * 4) Pie: saldo a favor del transportista o de la transportadora
 */
@Component({
  selector: 'app-liquidaciones-page',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    Button,
    Icon,
    TextInput,
    Modal,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
  ],
  templateUrl: './liquidaciones-page.html',
  styleUrl: './liquidaciones-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidacionesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificaciones = inject(NotificationStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly transportistasApi = inject(TransportistasService);
  protected readonly store = inject(LiquidacionesStore);

  protected readonly movColumns = MOV_COLUMNS;
  protected readonly modalMovimiento = signal(false);
  protected readonly modalFlete = signal(false);
  protected readonly modalEditar = signal(false);
  protected readonly modalParametros = signal(false);
  protected readonly movimientoEditando = signal<MovimientoCtacte | null>(null);
  protected readonly transportistaOptions = signal<SelectOption[]>([]);
  protected readonly consultado = signal(false);

  protected readonly consultaForm = this.fb.nonNullable.group({
    transportistaId: ['', Validators.required],
    desde: [''],
    hasta: [''],
  });

  protected readonly movimientoForm = this.fb.nonNullable.group({
    transportistaId: ['', Validators.required],
    concepto: ['gasoil' as const, Validators.required],
    detalle: ['', Validators.required],
    importe: [0, [Validators.required, Validators.min(0.01)]],
    tipoImporte: ['debe' as 'debe' | 'haber'],
    fecha: [''],
  });

  protected readonly editarForm = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    comprobante: [''],
    detalle: ['', Validators.required],
    dadorViaje: [''],
    toneladas: [null as number | null],
    tarifa: [null as number | null],
    importe: [0, [Validators.required, Validators.min(0.01)]],
    tipoImporte: ['debe' as 'debe' | 'haber'],
  });

  protected readonly fleteForm = this.fb.nonNullable.group({
    transportistaId: ['', Validators.required],
    detalle: ['', Validators.required],
    toneladas: [0, [Validators.required, Validators.min(0.01)]],
    tarifa: [null as number | null],
    dadorViaje: [''],
    fecha: [''],
  });

  protected readonly parametrosForm = this.fb.nonNullable.group({
    tarifaFletePorTn: [15000, [Validators.required, Validators.min(1)]],
    comisionPorcentaje: [8, [Validators.required, Validators.min(0)]],
    ivaAlicuota: [21, [Validators.required, Validators.min(0)]],
    ley25413Porcentaje: [0.6, [Validators.required, Validators.min(0)]],
    nombreTransportadora: ['Transportadora', Validators.required],
  });

  protected readonly conceptoOptions: SelectOption[] = [
    { value: 'gasoil', label: 'Gasoil' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'anticipo', label: 'Anticipo' },
    { value: 'ajuste', label: 'Ajuste' },
  ];

  protected readonly tipoImporteOptions: SelectOption[] = [
    { value: 'debe', label: 'Debe (descuento / pago)' },
    { value: 'haber', label: 'Haber (a favor del transportista)' },
  ];

  protected readonly nombreTransportadora = computed(
    () => this.store.parametros().data?.nombreTransportadora || 'Transportadora',
  );

  protected readonly transportistaSeleccionadoLabel = computed(() => {
    const id = this.consultaForm.controls.transportistaId.value;
    return this.transportistaOptions().find((o) => o.value === id)?.label ?? '';
  });

  protected readonly filasMovimientos = computed(() =>
    (this.store.resumen().data?.movimientos ?? []).map(
      (m) =>
        ({
          id: m.id,
          fecha: m.fecha,
          comprobante: m.comprobante || '—',
          detalle: m.detalle || '—',
          dadorViaje: m.dadorViaje || '—',
          toneladas: m.toneladas,
          tarifa: m.tarifa,
          debe: m.debe,
          haber: m.haber,
          saldo: m.saldo,
          concepto: m.concepto,
        }) as Record<string, unknown>,
    ),
  );

  /** Saldo > 0 → a favor del transportista; < 0 → a favor de la transportadora. */
  protected readonly cierreSaldo = computed(() => {
    const saldo = this.store.resumen().data?.saldoFinal ?? 0;
    const abs = Math.abs(saldo);
    if (saldo > 0) {
      return {
        tipo: 'transportista' as const,
        etiqueta: `Saldo a favor Transportista (${this.transportistaSeleccionadoLabel()})`,
        monto: abs,
      };
    }
    if (saldo < 0) {
      return {
        tipo: 'transportadora' as const,
        etiqueta: `Saldo a favor Transportadora (${this.nombreTransportadora()})`,
        monto: abs,
      };
    }
    return {
      tipo: 'cero' as const,
      etiqueta: 'Saldo a favor Transporte',
      monto: 0,
    };
  });

  ngOnInit(): void {
    this.store.cargarParametros();
    this.transportistasApi.listar('activos', '').subscribe({
      next: (items) =>
        this.transportistaOptions.set(
          items.map((t) => ({
            value: t.id,
            label: t.nombreFantasia || t.razonSocial,
          })),
        ),
    });
  }

  protected consultar(): void {
    if (this.consultaForm.controls.transportistaId.invalid) {
      this.consultaForm.controls.transportistaId.markAsTouched();
      this.notificaciones.warning('Seleccioná un transportista');
      return;
    }
    const f = this.consultaForm.getRawValue();
    this.consultado.set(true);
    this.store.cargarResumen(f.transportistaId, f.desde || undefined, f.hasta || undefined);
  }

  protected abrirMovimiento(): void {
    const id = this.consultaForm.controls.transportistaId.value;
    this.movimientoForm.reset({
      transportistaId: id,
      concepto: 'gasoil',
      detalle: '',
      importe: 0,
      tipoImporte: 'debe',
      fecha: '',
    });
    this.modalMovimiento.set(true);
  }

  protected abrirFlete(): void {
    const id = this.consultaForm.controls.transportistaId.value;
    const tarifa = this.store.parametros().data?.tarifaFletePorTn ?? null;
    this.fleteForm.reset({
      transportistaId: id,
      detalle: 'Flete',
      toneladas: 0,
      tarifa,
      dadorViaje: '',
      fecha: '',
    });
    this.modalFlete.set(true);
  }

  protected abrirEditar(row: Record<string, unknown>): void {
    const mov = (this.store.resumen().data?.movimientos ?? []).find((m) => m.id === row['id']);
    if (!mov) {
      return;
    }
    this.movimientoEditando.set(mov);
    this.editarForm.reset({
      fecha: mov.fecha,
      comprobante: mov.comprobante,
      detalle: mov.detalle,
      dadorViaje: mov.dadorViaje,
      toneladas: mov.toneladas,
      tarifa: mov.tarifa,
      importe: mov.debe > 0 ? mov.debe : mov.haber,
      tipoImporte: mov.debe > 0 ? 'debe' : 'haber',
    });
    this.modalEditar.set(true);
  }

  protected guardarMovimiento(): void {
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      return;
    }
    const v = this.movimientoForm.getRawValue();
    this.store.crearMovimiento(
      {
        transportistaId: v.transportistaId,
        concepto: v.concepto,
        detalle: v.detalle,
        debe: v.tipoImporte === 'debe' ? v.importe : 0,
        haber: v.tipoImporte === 'haber' ? v.importe : 0,
        fecha: v.fecha || undefined,
      },
      () => {
        this.modalMovimiento.set(false);
        this.notificaciones.success('Movimiento registrado');
        this.consultaForm.patchValue({ transportistaId: v.transportistaId });
        this.consultar();
      },
    );
  }

  protected guardarEdicion(): void {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      return;
    }
    const mov = this.movimientoEditando();
    if (!mov) {
      return;
    }
    const v = this.editarForm.getRawValue();
    this.store.actualizarMovimiento(
      mov.id,
      {
        fecha: v.fecha,
        detalle: v.detalle,
        dadorViaje: v.dadorViaje,
        comprobante: v.comprobante,
        toneladas: v.toneladas,
        tarifa: v.tarifa,
        debe: v.tipoImporte === 'debe' ? v.importe : 0,
        haber: v.tipoImporte === 'haber' ? v.importe : 0,
      },
      () => {
        this.modalEditar.set(false);
        this.movimientoEditando.set(null);
        this.notificaciones.success('Movimiento actualizado');
        this.consultar();
      },
    );
  }

  protected async eliminarMovimiento(row: Record<string, unknown>): Promise<void> {
    const detalle = String(row['detalle'] ?? 'este movimiento');
    const confirmar = await this.confirmDialog.abrir({
      titulo: 'Eliminar movimiento',
      mensaje: `¿Eliminar «${detalle}»? El saldo de la cuenta se recalculará.`,
      textoConfirmar: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmar) {
      return;
    }
    this.store.eliminarMovimiento(String(row['id']), () => {
      this.notificaciones.warning('Movimiento eliminado');
      this.consultar();
    });
  }

  protected guardarFlete(): void {
    if (this.fleteForm.invalid) {
      this.fleteForm.markAllAsTouched();
      return;
    }
    const v = this.fleteForm.getRawValue();
    this.store.crearFlete(
      {
        transportistaId: v.transportistaId,
        detalle: v.detalle,
        toneladas: v.toneladas,
        tarifa: v.tarifa ?? undefined,
        dadorViaje: v.dadorViaje || undefined,
        fecha: v.fecha || undefined,
      },
      () => {
        this.modalFlete.set(false);
        this.notificaciones.success(
          'Flete cargado (IVA, comisión, IVA comisión e Imp. Ley 25.413 generados)',
        );
        this.consultaForm.patchValue({ transportistaId: v.transportistaId });
        this.consultar();
      },
    );
  }

  protected abrirParametros(): void {
    const p = this.store.parametros().data;
    if (p) {
      this.parametrosForm.patchValue(p);
    }
    this.modalParametros.set(true);
  }

  protected guardarParametros(): void {
    if (this.parametrosForm.invalid) {
      return;
    }
    this.store.guardarParametros(this.parametrosForm.getRawValue());
    this.modalParametros.set(false);
    this.notificaciones.success('Parámetros de liquidación actualizados');
  }
}

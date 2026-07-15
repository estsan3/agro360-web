import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationStore } from '../../../notifications/state/notification.store';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { TextInput } from '../../../shared/ui/input/text-input';
import { SearchBar } from '../../../shared/ui/search-bar/search-bar';
import { SelectInput, SelectOption } from '../../../shared/ui/select/select-input';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { Viaje } from '../data-access/despacho.model';
import { DespachoStore } from '../data-access/despacho.store';

interface BorradorVm {
  id: string;
  codigo: string;
  nombre: string;
  fecha: string;
  administrador: string;
  vendedor: string;
  desde: string;
  totalViajes: number;
  totalToneladas: number;
  viajes: Viaje[];
}

/**
 * Borradores de Despacho (Figma v2): revisión del despacho creado.
 * Cada borrador se expande a sus viajes; "Iniciar Viaje" lo pasa al
 * workflow de Gestión operativa (deja de ser borrador).
 */
@Component({
  selector: 'app-borrador-despachos-page',
  imports: [
    Badge,
    Button,
    Icon,
    ReactiveFormsModule,
    SearchBar,
    SelectInput,
    StateWrapper,
    TextInput,
  ],
  templateUrl: './borrador-despachos-page.html',
  styleUrl: './borrador-despachos-page.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorradorDespachosPage {
  private readonly store = inject(DespachoStore);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);
  private readonly notifications = inject(NotificationStore);
  private readonly fb = inject(FormBuilder);

  protected readonly despachos = this.store.despachos;
  protected readonly busqueda = signal('');
  protected readonly expandidos = signal<Set<string>>(new Set());
  protected readonly filtrosAbiertos = signal(false);

  protected readonly filtrosForm = this.fb.group({
    administradorId: [''],
    vendedorId: [''],
    productorId: [''],
    material: [''],
    chofer: [''],
    fechaDesde: [''],
    fechaHasta: [''],
    minViajes: [''],
    minToneladas: [''],
  });

  private readonly filtros = toSignal(this.filtrosForm.valueChanges, {
    initialValue: this.filtrosForm.getRawValue(),
  });

  protected readonly administradorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.administradores ?? []).map((a) => ({
      value: a.id,
      label: a.nombre,
    })),
  );

  protected readonly vendedorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.vendedores ?? []).map((v) => ({
      value: v.id,
      label: v.nombre,
    })),
  );

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
    for (const despacho of this.store.borradores()) {
      for (const viaje of despacho.viajes) {
        if (viaje.estado === 'borrador' && viaje.chofer && viaje.chofer !== 'Sin asignar') {
          nombres.add(viaje.chofer);
        }
      }
    }
    return [...nombres].sort().map((nombre) => ({ value: nombre, label: nombre }));
  });

  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.administradorId ||
      f.vendedorId ||
      f.productorId ||
      f.material ||
      f.chofer ||
      f.fechaDesde ||
      f.fechaHasta ||
      f.minViajes ||
      f.minToneladas
    );
  });

  protected readonly borradores = computed<BorradorVm[]>(() => {
    const catalogos = this.store.catalogos().data;
    const filtroTexto = this.busqueda().toLowerCase();
    const f = this.filtros();
    const desde = f.fechaDesde ? new Date(`${f.fechaDesde}T00:00:00`) : null;
    const hasta = f.fechaHasta ? new Date(`${f.fechaHasta}T23:59:59`) : null;
    const minViajes = f.minViajes ? Number(f.minViajes) : null;
    const minToneladas = f.minToneladas ? Number(f.minToneladas) : null;

    return this.store
      .borradores()
      .filter((despacho) => {
        if (f.administradorId && despacho.administradorId !== f.administradorId) {
          return false;
        }
        if (f.vendedorId && despacho.vendedorId !== f.vendedorId) {
          return false;
        }
        if (f.productorId && despacho.productorId !== f.productorId) {
          return false;
        }
        if (f.material && despacho.material !== f.material) {
          return false;
        }
        if (desde && despacho.fechaInicio < desde) {
          return false;
        }
        if (hasta && despacho.fechaInicio > hasta) {
          return false;
        }
        const viajesBorrador = despacho.viajes.filter((v) => v.estado === 'borrador');
        if (f.chofer && !viajesBorrador.some((v) => v.chofer === f.chofer)) {
          return false;
        }
        if (minViajes !== null && !Number.isNaN(minViajes) && viajesBorrador.length < minViajes) {
          return false;
        }
        const toneladas = viajesBorrador.reduce((sum, v) => sum + v.toneladas, 0);
        if (minToneladas !== null && !Number.isNaN(minToneladas) && toneladas < minToneladas) {
          return false;
        }
        return true;
      })
      .map((despacho) => {
        const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
        const campo = productor?.campos.find((c) => c.id === despacho.campoId);
        const viajesBorrador = despacho.viajes.filter((viaje) => viaje.estado === 'borrador');
        return {
          id: despacho.id,
          codigo: `DSP-${despacho.id.replace(/\D/g, '').padStart(3, '0')}`,
          nombre: despacho.nombre,
          fecha: this.datePipe.transform(despacho.fechaInicio, 'dd/MM/yyyy') ?? '—',
          administrador:
            catalogos?.administradores.find((a) => a.id === despacho.administradorId)?.nombre ??
            '—',
          vendedor: catalogos?.vendedores.find((v) => v.id === despacho.vendedorId)?.nombre ?? '—',
          desde: `${campo?.nombre ?? '—'}\n${despacho.origen}`,
          totalViajes: viajesBorrador.length,
          totalToneladas: viajesBorrador.reduce((sum, viaje) => sum + viaje.toneladas, 0),
          viajes: viajesBorrador,
        };
      })
      .filter(
        (borrador) =>
          !filtroTexto ||
          borrador.nombre.toLowerCase().includes(filtroTexto) ||
          borrador.codigo.toLowerCase().includes(filtroTexto) ||
          borrador.administrador.toLowerCase().includes(filtroTexto) ||
          borrador.vendedor.toLowerCase().includes(filtroTexto) ||
          borrador.viajes.some(
            (viaje) =>
              viaje.chofer.toLowerCase().includes(filtroTexto) ||
              viaje.dominio.toLowerCase().includes(filtroTexto) ||
              viaje.destino.toLowerCase().includes(filtroTexto),
          ),
      );
  });

  protected readonly emptyMessage = computed(() =>
    this.hayFiltrosActivos() || this.busqueda()
      ? 'No hay borradores que coincidan con los filtros'
      : 'No tenés borradores guardados',
  );

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
  }

  protected toggleFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  protected limpiarFiltros(): void {
    this.filtrosForm.reset({
      administradorId: '',
      vendedorId: '',
      productorId: '',
      material: '',
      chofer: '',
      fechaDesde: '',
      fechaHasta: '',
      minViajes: '',
      minToneladas: '',
    });
  }

  protected toggle(id: string): void {
    this.expandidos.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected iniciarViaje(despachoId: string, viaje: Viaje): void {
    this.store.iniciarViaje(despachoId, viaje.id).subscribe((despacho) => {
      this.notifications.success(
        'Viaje iniciado',
        `${viaje.chofer} (${viaje.dominio}) ya está en Gestión operativa`,
      );
      if (despacho.estado === 'activo') {
        this.notifications.success(
          'Despacho activo',
          `"${despacho.nombre}" completó todos sus viajes en borrador`,
        );
      }
    });
  }

  protected duplicarViaje(despachoId: string, viajeId: string): void {
    this.store.duplicarViaje(despachoId, viajeId).subscribe();
  }

  protected eliminarViaje(despachoId: string, viajeId: string): void {
    this.store.eliminarViaje(despachoId, viajeId).subscribe();
  }

  protected eliminarDespacho(id: string, nombre: string): void {
    this.store.eliminarDespacho(id).subscribe(() => {
      this.notifications.warning('Borrador eliminado', nombre);
    });
  }

  protected editar(id: string): void {
    this.router.navigate(['/despachos'], { queryParams: { borrador: id } });
  }

  protected masOpciones(): void {
    this.notifications.warning('Más opciones', 'Disponible próximamente');
  }

  protected crearDespacho(): void {
    this.router.navigate(['/despachos']);
  }
}

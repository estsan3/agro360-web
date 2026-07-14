import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationStore } from '../../../notifications/state/notification.store';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { SearchBar } from '../../../shared/ui/search-bar/search-bar';
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
  imports: [Badge, Button, Icon, SearchBar, StateWrapper],
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

  protected readonly despachos = this.store.despachos;
  protected readonly busqueda = signal('');
  protected readonly expandidos = signal<Set<string>>(new Set());

  protected readonly borradores = computed<BorradorVm[]>(() => {
    const catalogos = this.store.catalogos().data;
    const filtro = this.busqueda().toLowerCase();

    return this.store
      .borradores()
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
          !filtro ||
          borrador.nombre.toLowerCase().includes(filtro) ||
          borrador.viajes.some((viaje) => viaje.chofer.toLowerCase().includes(filtro)),
      );
  });

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
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

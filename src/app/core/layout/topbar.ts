import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MensajeriaStore } from '../../features/mensajeria/data-access/mensajeria.store';
import { DespachoStore } from '../../features/despachos/data-access/despacho.store';
import { Icon } from '../../shared/ui/icon/icon';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { AuthStore } from '../state/auth.store';

interface ResultadoViaje {
  id: string;
  chofer: string;
  destino: string;
  campania: string;
}

/**
 * Header global (Figma: header de Gestión Operativa): título de la
 * sección + fecha, búsqueda de viajes, notificaciones y perfil.
 */
@Component({
  selector: 'app-topbar',
  imports: [Icon, SearchBar],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly despachoStore = inject(DespachoStore);

  protected readonly authStore = inject(AuthStore);
  protected readonly mensajeriaStore = inject(MensajeriaStore);

  protected readonly busquedaAbierta = signal(false);
  protected readonly terminoBusqueda = signal('');
  protected readonly menuPerfilAbierto = signal(false);

  protected readonly fecha = (() => {
    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const MESES = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${DIAS[hoy.getDay()]}, ${dia} de ${MESES[hoy.getMonth()]} del ${hoy.getFullYear()}`;
  })();

  protected readonly resultados = computed<ResultadoViaje[]>(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    if (!termino) {
      return [];
    }
    return this.despachoStore
      .enOperacion()
      .flatMap((despacho) =>
        despacho.viajes.map((viaje) => ({
          id: viaje.id,
          chofer: viaje.chofer,
          destino: viaje.destino,
          campania: despacho.nombre,
        })),
      )
      .filter(
        (viaje) =>
          viaje.id.toLowerCase().includes(termino) ||
          viaje.chofer.toLowerCase().includes(termino) ||
          viaje.destino.toLowerCase().includes(termino),
      )
      .slice(0, 8);
  });

  constructor() {
    // El badge de la campanita necesita las conversaciones desde el inicio
    this.mensajeriaStore.cargarConversaciones();
    this.despachoStore.cargarDespachos();
  }

  protected abrirBusqueda(): void {
    this.terminoBusqueda.set('');
    this.busquedaAbierta.set(true);
  }

  protected irAViaje(viaje: ResultadoViaje): void {
    this.busquedaAbierta.set(false);
    this.router.navigate(['/gestion-operativa'], { queryParams: { q: viaje.id } });
  }

  protected irAMensajeria(): void {
    this.router.navigate(['/mensajeria']);
  }

  protected irAMiPerfil(): void {
    this.menuPerfilAbierto.set(false);
    this.router.navigate(['/configuracion'], { queryParams: { tab: 'cuenta' } });
  }

  protected irAConfiguracion(): void {
    this.menuPerfilAbierto.set(false);
    this.router.navigate(['/configuracion']);
  }

  protected cerrarSesion(): void {
    this.menuPerfilAbierto.set(false);
    this.authStore.logout().subscribe(() => this.router.navigate(['/login']));
  }
}

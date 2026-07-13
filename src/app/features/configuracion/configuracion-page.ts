import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';
import { ParametrosStore } from '../../core/state/parametros.store';
import { NotificationStore } from '../../notifications/state/notification.store';
import { PreferenciasStore } from '../../notifications/state/preferencias.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { TextInput } from '../../shared/ui/input/text-input';
import { DespachoStore } from '../despachos/data-access/despacho.store';
import { ConfiguracionService, TipoCatalogo } from './data-access/configuracion.service';
import { UsuariosStore } from './data-access/usuarios.store';

type Seccion = 'usuarios' | 'cuenta' | 'catalogos' | 'notificaciones' | 'parametros';

const SECCIONES: { id: Seccion; label: string }[] = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'cuenta', label: 'Mi cuenta' },
  { id: 'catalogos', label: 'Catálogos' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'parametros', label: 'Parámetros' },
];

const USUARIOS_COLUMNS: TableColumn[] = [
  { key: 'nombre', label: 'Nombre y Apellido' },
  { key: 'dni', label: 'DNI' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '130px' },
];

/**
 * Configuración (Figma: 720:839 — tabla de usuarios) ampliada con
 * cuenta, catálogos maestros, preferencias y parámetros del negocio.
 */
@Component({
  selector: 'app-configuracion-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Badge,
    Button,
    Icon,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
    TextInput,
  ],
  templateUrl: './configuracion-page.html',
  styleUrl: './configuracion-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly configService = inject(ConfiguracionService);
  private readonly notifications = inject(NotificationStore);

  protected readonly authStore = inject(AuthStore);
  protected readonly usuariosStore = inject(UsuariosStore);
  protected readonly despachoStore = inject(DespachoStore);
  protected readonly preferenciasStore = inject(PreferenciasStore);
  protected readonly parametrosStore = inject(ParametrosStore);

  protected readonly secciones = SECCIONES;
  protected readonly seccion = signal<Seccion>('usuarios');
  protected readonly usuariosColumns = USUARIOS_COLUMNS;

  protected readonly rolOptions: SelectOption[] = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
  ];

  protected readonly usuariosRows = computed(() =>
    (this.usuariosStore.usuarios().data ?? []).map(
      (usuario) => ({ ...usuario }) as Record<string, unknown>,
    ),
  );

  protected readonly productorOptions = computed<SelectOption[]>(() =>
    (this.despachoStore.catalogos().data?.productores ?? []).map((p) => ({
      value: p.id,
      label: p.nombre,
    })),
  );

  // --- Formularios ---
  protected readonly usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,9}$/)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['vendedor', Validators.required],
  });

  protected readonly parametrosForm = this.fb.group({
    precioPorTonelada: [1000, [Validators.required, Validators.min(1)]],
    moneda: ['ARS' as 'ARS' | 'USD', Validators.required],
  });

  protected readonly monedaOptions: SelectOption[] = [
    { value: 'ARS', label: 'Peso argentino (ARS)' },
    { value: 'USD', label: 'Dólar (USD)' },
  ];

  // Campos de alta de catálogos (template-driven, efímeros)
  protected nuevoProductor = '';
  protected campoProductorId = '';
  protected nuevoCampo = '';
  protected nuevoChofer = '';
  protected nuevoDominio = '';
  protected nuevoModelo = '';
  protected nuevoVendedor = '';
  protected nuevoMaterial = '';

  constructor() {
    this.usuariosStore.cargar();
    this.despachoStore.cargarCatalogos();
    this.preferenciasStore.cargar();
    this.parametrosStore.cargar();

    // Sincroniza el form de parámetros cuando llega el valor del backend
    this.parametrosStore.parametros();
    queueMicrotask(() => this.parametrosForm.patchValue(this.parametrosStore.parametros()));
  }

  // --- Usuarios ---
  protected crearUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }
    const value = this.usuarioForm.getRawValue();
    this.usuariosStore
      .crear({ ...value, rol: value.rol as 'administrador' | 'vendedor' })
      .subscribe(() => {
        this.notifications.success('Usuario creado', `${value.nombre} ya puede acceder`);
        this.usuarioForm.reset({ rol: 'vendedor' });
      });
  }

  protected darDeBaja(id: string, nombre: string): void {
    this.usuariosStore.darDeBaja(id).subscribe(() => {
      this.notifications.warning('Usuario dado de baja', nombre);
    });
  }

  // --- Cuenta ---
  protected cerrarSesion(): void {
    this.authStore.logout().subscribe(() => this.router.navigate(['/login']));
  }

  // --- Catálogos ---
  protected agregarCatalogo(tipo: TipoCatalogo, body: Record<string, string>): void {
    this.configService.agregarCatalogo(tipo, body).subscribe(() => {
      this.despachoStore.recargarCatalogos();
    });
  }

  protected agregarCampo(): void {
    if (!this.campoProductorId || !this.nuevoCampo.trim()) {
      return;
    }
    this.configService.agregarCampo(this.campoProductorId, this.nuevoCampo.trim()).subscribe(() => {
      this.despachoStore.recargarCatalogos();
      this.nuevoCampo = '';
    });
  }

  protected eliminarCatalogo(tipo: TipoCatalogo, id: string): void {
    this.configService.eliminarCatalogo(tipo, id).subscribe(() => {
      this.despachoStore.recargarCatalogos();
    });
  }

  // --- Notificaciones ---
  protected actualizarPreferencia(
    campo: 'viajeRetrasado' | 'viajeCompletado' | 'mensajeChofer',
    valor: boolean,
  ): void {
    this.preferenciasStore
      .actualizar({ ...this.preferenciasStore.preferencias(), [campo]: valor })
      .subscribe(() => this.notifications.success('Preferencias guardadas'));
  }

  // --- Parámetros ---
  protected guardarParametros(): void {
    if (this.parametrosForm.invalid) {
      return;
    }
    const value = this.parametrosForm.getRawValue();
    this.parametrosStore
      .actualizar({
        precioPorTonelada: Number(value.precioPorTonelada),
        moneda: value.moneda,
      })
      .subscribe(() => this.notifications.success('Parámetros actualizados'));
  }
}

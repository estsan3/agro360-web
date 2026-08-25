import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActualizarMetadatosDespachoDto,
  ActualizarViajeDto,
  CartaPorteDto,
  CatalogosDto,
  CrearViajeDto,
  DespachoDto,
  DuplicarDespachoDto,
  EmitirCartaPorteDto,
  SubirAdjuntoViajeDto,
  ViajeAdjuntoDto,
} from './despacho.dto';
import { toCatalogos, toCrearDespachoDto, toDespacho, toViajeAdjunto } from './despacho.mapper';
import {
  ActualizarMetadatosDespachoInput,
  AgregarViajeInput,
  Catalogos,
  Despacho,
  NuevoDespacho,
  TipoAdjuntoViaje,
  ViajeAdjunto,
} from './despacho.model';

@Injectable({ providedIn: 'root' })
export class DespachoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/despachos`;

  getDespachos(): Observable<Despacho[]> {
    return this.http.get<DespachoDto[]>(this.base).pipe(map((dtos) => dtos.map(toDespacho)));
  }

  getDespacho(id: string): Observable<Despacho> {
    return this.http
      .get<DespachoDto>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map(toDespacho));
  }

  crearDespacho(input: NuevoDespacho): Observable<Despacho> {
    return this.http.post<DespachoDto>(this.base, toCrearDespachoDto(input)).pipe(map(toDespacho));
  }

  actualizarDespacho(id: string, input: NuevoDespacho): Observable<Despacho> {
    return this.http
      .put<DespachoDto>(`${this.base}/${id}`, toCrearDespachoDto(input))
      .pipe(map(toDespacho));
  }

  /** Corrige campaña/viajes existentes para regenerar una intención CPE. */
  editarParaIntencionCpe(id: string, input: NuevoDespacho): Observable<Despacho> {
    return this.http
      .patch<DespachoDto>(`${this.base}/${id}/para-intencion-cpe`, toCrearDespachoDto(input))
      .pipe(map(toDespacho));
  }

  eliminarDespacho(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  iniciarViaje(
    despachoId: string,
    viajeId: string,
    checklist: { checklistGasoil: boolean; checklistEfectivo: boolean },
  ): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/iniciar`,
        {
          checklist_gasoil: checklist.checklistGasoil,
          checklist_efectivo: checklist.checklistEfectivo,
        },
      )
      .pipe(map(toDespacho));
  }

  duplicarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/duplicar`,
        {},
      )
      .pipe(map(toDespacho));
  }

  eliminarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .delete<DespachoDto>(`${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}`)
      .pipe(map(toDespacho));
  }

  agregarViaje(despachoId: string, input: AgregarViajeInput): Observable<Despacho> {
    const body: CrearViajeDto = {
      chofer_id: input.choferId || null,
      dominio: input.dominio || null,
      destino: input.destino,
      toneladas: input.toneladas,
      observaciones: input.observaciones ?? '',
    };
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/viajes`, body)
      .pipe(map(toDespacho));
  }

  cerrarDespacho(despachoId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/cerrar`, {})
      .pipe(map(toDespacho));
  }

  activarDespacho(despachoId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/activar`, {})
      .pipe(map(toDespacho));
  }

  actualizarMetadatos(
    despachoId: string,
    input: ActualizarMetadatosDespachoInput,
  ): Observable<Despacho> {
    const body: ActualizarMetadatosDespachoDto = {
      fecha_llegada_estimada: input.fechaLlegadaEstimada,
      observaciones: input.observaciones ?? '',
    };
    return this.http
      .patch<DespachoDto>(`${this.base}/${despachoId}/metadatos`, body)
      .pipe(map(toDespacho));
  }

  duplicarDespacho(despachoId: string, nombre?: string): Observable<Despacho> {
    const body: DuplicarDespachoDto | Record<string, never> = nombre ? { nombre } : {};
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/duplicar`, body)
      .pipe(map(toDespacho));
  }

  getCatalogos(): Observable<Catalogos> {
    return this.http
      .get<CatalogosDto>(`${environment.apiBaseUrl}/catalogos`)
      .pipe(map(toCatalogos));
  }

  buscarTransportistas(
    despachoId: string,
    oferta?: { destino: string; toneladas: number },
  ): Observable<Despacho> {
    const body = oferta ? { destino: oferta.destino, toneladas: oferta.toneladas } : {};
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/buscar-transportistas`, body)
      .pipe(map(toDespacho));
  }

  asignarPorLista(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/asignar-por-lista`,
        {},
      )
      .pipe(map(toDespacho));
  }

  aceptarOfertaLista(despachoId: string, viajeId: string, entradaId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/aceptar-oferta-lista`,
        {},
        { params: { entrada_id: entradaId } },
      )
      .pipe(map(toDespacho));
  }

  rechazarOfertaLista(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/rechazar-oferta-lista`,
        {},
      )
      .pipe(map(toDespacho));
  }

  actualizarViaje(
    despachoId: string,
    viajeId: string,
    datos: { choferId?: string; estado?: string; progreso?: number; observaciones?: string },
  ): Observable<Despacho> {
    const body: ActualizarViajeDto = {};
    if (datos.choferId !== undefined) {
      body.chofer_id = datos.choferId;
    }
    if (datos.estado !== undefined) {
      body.estado = datos.estado as ActualizarViajeDto['estado'];
    }
    if (datos.progreso !== undefined) {
      body.progreso = datos.progreso;
    }
    if (datos.observaciones !== undefined) {
      body.observaciones = datos.observaciones;
    }
    return this.http
      .patch<DespachoDto>(`${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}`, body)
      .pipe(map(toDespacho));
  }

  cancelarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/cancelar`,
        {},
      )
      .pipe(map(toDespacho));
  }

  listarAdjuntos(despachoId: string, viajeId: string): Observable<ViajeAdjunto[]> {
    return this.http
      .get<ViajeAdjuntoDto[]>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/adjuntos`,
      )
      .pipe(map((items) => items.map(toViajeAdjunto)));
  }

  obtenerAdjunto(despachoId: string, viajeId: string, adjuntoId: string): Observable<ViajeAdjunto> {
    return this.http
      .get<ViajeAdjuntoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/adjuntos/${encodeURIComponent(adjuntoId)}`,
      )
      .pipe(map(toViajeAdjunto));
  }

  subirAdjunto(
    despachoId: string,
    viajeId: string,
    input: { tipo: TipoAdjuntoViaje; nombre: string; mime: string; dataUrl: string },
  ): Observable<ViajeAdjunto> {
    const body: SubirAdjuntoViajeDto = {
      tipo: input.tipo,
      nombre: input.nombre,
      mime: input.mime,
      data_url: input.dataUrl,
    };
    return this.http
      .post<ViajeAdjuntoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/adjuntos`,
        body,
      )
      .pipe(map(toViajeAdjunto));
  }

  eliminarAdjunto(despachoId: string, viajeId: string, adjuntoId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/adjuntos/${encodeURIComponent(adjuntoId)}`,
    );
  }

  generarTicketGasoil(despachoId: string, viajeId: string): Observable<ViajeAdjunto> {
    return this.http
      .post<ViajeAdjuntoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/generar-ticket-gasoil`,
        {},
      )
      .pipe(map(toViajeAdjunto));
  }

  emitirCartaPorte(despachoId: string, viajeId: string): Observable<CartaPorteDto> {
    const body: EmitirCartaPorteDto = { despacho_id: despachoId, viaje_id: viajeId };
    return this.http.post<CartaPorteDto>(`${environment.apiBaseUrl}/cartas-porte`, body);
  }

  listarCartasPorte(despachoId?: string): Observable<CartaPorteDto[]> {
    const params = despachoId ? `?despacho_id=${encodeURIComponent(despachoId)}` : '';
    return this.http.get<CartaPorteDto[]>(`${environment.apiBaseUrl}/cartas-porte${params}`);
  }

  obtenerCartaPorte(cartaId: string): Observable<CartaPorteDto> {
    return this.http.get<CartaPorteDto>(
      `${environment.apiBaseUrl}/cartas-porte/${encodeURIComponent(cartaId)}`,
    );
  }

  reintentarCartaPorte(cartaId: string): Observable<CartaPorteDto> {
    return this.http.post<CartaPorteDto>(
      `${environment.apiBaseUrl}/cartas-porte/${encodeURIComponent(cartaId)}/reintentar`,
      {},
    );
  }

  eliminarCartaPorte(cartaId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/cartas-porte/${encodeURIComponent(cartaId)}`,
    );
  }

  resolverTarifaNacional(distanciaKm: number): Observable<{ precioPorTn: number }> {
    return this.http
      .post<{ precio_por_tn: number }>(`${this.base}/tarifas-nacionales/resolver`, {
        distancia_km: distanciaKm,
      })
      .pipe(map((r) => ({ precioPorTn: r.precio_por_tn })));
  }

  listarTarifasNacionales(): Observable<
    { id: string; kmDesde: number; kmHasta: number; precioPorTn: number; vigencia: string }[]
  > {
    return this.http
      .get<import('./despacho.dto').TarifaNacionalDto[]>(`${this.base}/tarifas-nacionales`)
      .pipe(
        map((items) =>
          items.map((t) => ({
            id: t.id,
            kmDesde: t.km_desde,
            kmHasta: t.km_hasta,
            precioPorTn: t.precio_por_tn,
            vigencia: t.vigencia,
          })),
        ),
      );
  }
}

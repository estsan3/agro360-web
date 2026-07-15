import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TransportistaDetalleDto, TransportistaDto } from './transportistas.dto';
import {
  mapTransportista,
  mapTransportistaDetalle,
  toCamionDto,
  toChoferDto,
  toTransportistaDto,
} from './transportistas.mapper';
import {
  CamionTransportista,
  ChoferTransportista,
  FiltroActivo,
  Transportista,
  TransportistaDetalle,
} from './transportistas.model';

@Injectable({ providedIn: 'root' })
export class TransportistasService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listar(filtro: FiltroActivo, busqueda: string): Observable<Transportista[]> {
    let params = new HttpParams().set('filtro', filtro);
    if (busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http
      .get<TransportistaDto[]>(`${this.base}/transportistas`, { params })
      .pipe(map((items) => items.map(mapTransportista)));
  }

  obtener(id: string): Observable<TransportistaDetalle> {
    return this.http
      .get<TransportistaDetalleDto>(`${this.base}/transportistas/${id}`)
      .pipe(map(mapTransportistaDetalle));
  }

  crear(body: Partial<Transportista>): Observable<TransportistaDetalle> {
    return this.http
      .post<TransportistaDetalleDto>(`${this.base}/transportistas`, toTransportistaDto(body))
      .pipe(map(mapTransportistaDetalle));
  }

  actualizar(id: string, body: Partial<Transportista>): Observable<TransportistaDetalle> {
    return this.http
      .put<TransportistaDetalleDto>(`${this.base}/transportistas/${id}`, toTransportistaDto(body))
      .pipe(map(mapTransportistaDetalle));
  }

  cambiarActivo(id: string, activo: boolean): Observable<TransportistaDetalle> {
    return this.http
      .patch<TransportistaDetalleDto>(`${this.base}/transportistas/${id}/activo`, { activo })
      .pipe(map(mapTransportistaDetalle));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/transportistas/${id}`);
  }

  crearChofer(
    transportistaId: string,
    body: Partial<ChoferTransportista>,
  ): Observable<TransportistaDetalle> {
    return this.http
      .post<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/choferes`,
        toChoferDto(body),
      )
      .pipe(map(mapTransportistaDetalle));
  }

  actualizarChofer(
    transportistaId: string,
    choferId: string,
    body: Partial<ChoferTransportista>,
  ): Observable<TransportistaDetalle> {
    return this.http
      .put<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/choferes/${choferId}`,
        toChoferDto(body),
      )
      .pipe(map(mapTransportistaDetalle));
  }

  cambiarActivoChofer(
    transportistaId: string,
    choferId: string,
    activo: boolean,
  ): Observable<TransportistaDetalle> {
    return this.http
      .patch<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/choferes/${choferId}/activo`,
        { activo },
      )
      .pipe(map(mapTransportistaDetalle));
  }

  eliminarChofer(transportistaId: string, choferId: string): Observable<TransportistaDetalle> {
    return this.http
      .delete<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/choferes/${choferId}`,
      )
      .pipe(map(mapTransportistaDetalle));
  }

  crearCamion(
    transportistaId: string,
    body: Partial<CamionTransportista>,
  ): Observable<TransportistaDetalle> {
    return this.http
      .post<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/camiones`,
        toCamionDto(body),
      )
      .pipe(map(mapTransportistaDetalle));
  }

  actualizarCamion(
    transportistaId: string,
    camionId: string,
    body: Partial<CamionTransportista>,
  ): Observable<TransportistaDetalle> {
    return this.http
      .put<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/camiones/${camionId}`,
        toCamionDto(body),
      )
      .pipe(map(mapTransportistaDetalle));
  }

  cambiarActivoCamion(
    transportistaId: string,
    camionId: string,
    activo: boolean,
  ): Observable<TransportistaDetalle> {
    return this.http
      .patch<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/camiones/${camionId}/activo`,
        { activo },
      )
      .pipe(map(mapTransportistaDetalle));
  }

  eliminarCamion(transportistaId: string, camionId: string): Observable<TransportistaDetalle> {
    return this.http
      .delete<TransportistaDetalleDto>(
        `${this.base}/transportistas/${transportistaId}/camiones/${camionId}`,
      )
      .pipe(map(mapTransportistaDetalle));
  }

  listarTiposVehiculo(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/parametria/tipos-vehiculo`);
  }

  listarTiposLicencia(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/parametria/tipos-licencia`);
  }
}

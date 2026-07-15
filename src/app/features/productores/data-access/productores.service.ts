import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductorDetalleDto, ProductorDto } from './productores.dto';
import {
  mapProductor,
  mapProductorDetalle,
  toCampoDto,
  toProductorDto,
  toResponsableDto,
} from './productores.mapper';
import {
  CampoProductor,
  FiltroActivo,
  Productor,
  ProductorDetalle,
  ResponsableProductor,
  VendedorOption,
} from './productores.model';

@Injectable({ providedIn: 'root' })
export class ProductoresService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listar(filtro: FiltroActivo, busqueda: string): Observable<Productor[]> {
    let params = new HttpParams().set('filtro', filtro);
    if (busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http
      .get<ProductorDto[]>(`${this.base}/productores`, { params })
      .pipe(map((items) => items.map(mapProductor)));
  }

  obtener(id: string): Observable<ProductorDetalle> {
    return this.http
      .get<ProductorDetalleDto>(`${this.base}/productores/${id}`)
      .pipe(map(mapProductorDetalle));
  }

  crear(body: Partial<Productor>): Observable<ProductorDetalle> {
    return this.http
      .post<ProductorDetalleDto>(`${this.base}/productores`, toProductorDto(body))
      .pipe(map(mapProductorDetalle));
  }

  actualizar(id: string, body: Partial<Productor>): Observable<ProductorDetalle> {
    return this.http
      .put<ProductorDetalleDto>(`${this.base}/productores/${id}`, toProductorDto(body))
      .pipe(map(mapProductorDetalle));
  }

  cambiarActivo(id: string, activo: boolean): Observable<ProductorDetalle> {
    return this.http
      .patch<ProductorDetalleDto>(`${this.base}/productores/${id}/activo`, { activo })
      .pipe(map(mapProductorDetalle));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/productores/${id}`);
  }

  crearResponsable(
    productorId: string,
    body: Partial<ResponsableProductor>,
  ): Observable<ProductorDetalle> {
    return this.http
      .post<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/responsables`,
        toResponsableDto(body),
      )
      .pipe(map(mapProductorDetalle));
  }

  actualizarResponsable(
    productorId: string,
    responsableId: string,
    body: Partial<ResponsableProductor>,
  ): Observable<ProductorDetalle> {
    return this.http
      .put<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/responsables/${responsableId}`,
        toResponsableDto(body),
      )
      .pipe(map(mapProductorDetalle));
  }

  cambiarActivoResponsable(
    productorId: string,
    responsableId: string,
    activo: boolean,
  ): Observable<ProductorDetalle> {
    return this.http
      .patch<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/responsables/${responsableId}/activo`,
        { activo },
      )
      .pipe(map(mapProductorDetalle));
  }

  eliminarResponsable(productorId: string, responsableId: string): Observable<ProductorDetalle> {
    return this.http
      .delete<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/responsables/${responsableId}`,
      )
      .pipe(map(mapProductorDetalle));
  }

  crearCampo(productorId: string, body: Partial<CampoProductor>): Observable<ProductorDetalle> {
    return this.http
      .post<ProductorDetalleDto>(`${this.base}/productores/${productorId}/campos`, toCampoDto(body))
      .pipe(map(mapProductorDetalle));
  }

  actualizarCampo(
    productorId: string,
    campoId: string,
    body: Partial<CampoProductor>,
  ): Observable<ProductorDetalle> {
    return this.http
      .put<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/campos/${campoId}`,
        toCampoDto(body),
      )
      .pipe(map(mapProductorDetalle));
  }

  cambiarActivoCampo(
    productorId: string,
    campoId: string,
    activo: boolean,
  ): Observable<ProductorDetalle> {
    return this.http
      .patch<ProductorDetalleDto>(
        `${this.base}/productores/${productorId}/campos/${campoId}/activo`,
        { activo },
      )
      .pipe(map(mapProductorDetalle));
  }

  eliminarCampo(productorId: string, campoId: string): Observable<ProductorDetalle> {
    return this.http
      .delete<ProductorDetalleDto>(`${this.base}/productores/${productorId}/campos/${campoId}`)
      .pipe(map(mapProductorDetalle));
  }

  listarVendedores(): Observable<VendedorOption[]> {
    return this.http.get<VendedorOption[]>(`${this.base}/productores/vendedores`);
  }
}

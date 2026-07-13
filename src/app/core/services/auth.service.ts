import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Llamadas HTTP de autenticación. El token viaja en cookie httpOnly
 * seteada por el backend — acá nunca se toca un token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<User>(`${this.base}/login`, credentials);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {});
  }
}

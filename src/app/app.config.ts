import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { AuthStore } from './core/state/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // El mock va último en la cadena: simula ser el backend
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, mockApiInterceptor])),
    // Reconstruye la sesión desde la cookie al recargar
    provideAppInitializer(() => inject(AuthStore).restoreSession()),
  ],
};

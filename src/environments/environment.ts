/**
 * Config de entorno. Cuando exista el backend Python:
 * - apiBaseUrl apunta a su URL (con CORS credentials habilitado)
 * - mockApi pasa a false y el interceptor de mocks se desactiva
 */
export const environment = {
  apiBaseUrl: '/api',
  mockApi: true,
};

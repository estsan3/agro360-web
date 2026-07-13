# Agro360 Web

Backoffice web de **Agro360**: sistema de gestión logística de despachos de granos (agro argentino). Esta aplicación administra campañas/despachos, asigna viajes a choferes, monitorea el estado operativo en tiempo de gestión y mantiene el canal de mensajería con los conductores en ruta.

> **Alcance de este repo:** solo el **front admin** (PC / tablet). El backend Python y la app mobile del chofer son sistemas separados.

---

## Tabla de contenidos

1. [Negocio y alcance](#negocio)
2. [Actores y dominio](#actores)
3. [Funcionalidades y módulos](#funcionalidades)
4. [Stack tecnológico](#stack)
5. [Arquitectura del producto](#arquitectura)
6. [Cómo está implementado](#implementacion)
7. [Estructura de carpetas](#estructura)
8. [Lineamientos y convenciones](#lineamientos)
9. [Autenticación y seguridad](#auth)
10. [API mock y entornos](#api-mock)
11. [Cómo ejecutarlo](#ejecutar)
12. [Testing y calidad](#testing)
13. [Storybook / design system](#storybook)
14. [Estado actual y deuda conocida](#deuda)
15. [Roadmap de integración](#roadmap)

---

<a id="negocio"></a>

## 1. Negocio y alcance

### Problema que resuelve

En la logística de granos, una **campaña de despacho** implica sacar toneladas desde un **campo** hacia un **destino de descarga** (puerto, terminal, etc.) con múltiples **viajes en camión**. La operación necesita:

- Planificar la campaña (productor, campo, material, fechas, responsables).
- Asignar choferes y patentes a cada viaje.
- Seguir el estado de cada viaje (pendiente, en viaje, retrasado, completado).
- Comunicarse con el chofer mientras está en ruta.
- Configurar catálogos maestros y preferencias de notificación.

### Qué es Agro360 Web

Aplicación **admin Angular** para el equipo de administración / ventas. Consume (o simula) un backend REST. Target de uso: **desktop y tablet**, enfoque desktop-first.

### Qué NO incluye este repo

| Fuera de alcance          | Responsable                                 |
| ------------------------- | ------------------------------------------- |
| API / persistencia real   | Backend Python (futuro)                     |
| App del chofer            | Mobile separada                             |
| Tracking GPS en mapa      | No implementado en este front               |
| Facturación / liquidación | Fuera del dominio actual                    |
| Roles granulares en rutas | Modelo de rol existe; guards por rol aún no |

### Flujo de negocio punta a punta

```text
Productor + Campo + Material
        │
        ▼
  Crear Despacho (campaña)
  ├─ datos de origen / fechas / responsables
  └─ N viajes (chofer, patente, destino, toneladas)
        │
        ├─ Guardar como BORRADOR
        └─ Enviar como ACTIVO
                │
                ▼
        Gestión Operativa
        (KPIs, progreso, retrasos, observaciones)
                │
        ┌───────┴───────┐
        ▼               ▼
   Mensajería      Reportería
   admin ↔ chofer   métricas / charts
```

---

<a id="actores"></a>

## 2. Actores y dominio

### Actores

| Actor                                   | Dónde interactúa        | Rol                                                                                   |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| **Administrador**                       | Esta web                | Login con rol `administrador`. Opera despachos, gestión, mensajería, configuración.   |
| **Vendedor**                            | Esta web                | Login con rol `vendedor`. Mismo front; autorización por rol en rutas aún no aplicada. |
| **Productor**                           | Catálogo                | Dueño del campo / carga (ej. Agro SA). No es usuario de login.                        |
| **Chofer**                              | App mobile + mensajería | Conductor del camión. En esta web solo aparece en catálogos, viajes y chat.           |
| **Administrador / Vendedor de campaña** | Catálogo del despacho   | Personas asignadas a la campaña (distintos del usuario logueado).                     |

### Conceptos de dominio

| Concepto               | Descripción                                                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Despacho / Campaña** | Unidad de planificación. Agrupa origen, material, fechas y varios viajes. Estado: `borrador` \| `activo`.                                                              |
| **Viaje**              | Un traslado concreto: chofer, dominio (patente), destino, toneladas, progreso 0–100, observaciones. Estados: `pendiente` \| `en-viaje` \| `retrasado` \| `completado`. |
| **Material**           | Grano a transportar (Soja, Maíz, Girasol, Trigo).                                                                                                                      |
| **Campo**              | Lugar de carga asociado a un productor.                                                                                                                                |
| **Conversación**       | Hilo de chat admin ↔ chofer (por chofer/patente).                                                                                                                      |

### Credenciales de demo (mock)

Con `mockApi: true` (default):

| Campo    | Valor                                                    |
| -------- | -------------------------------------------------------- |
| Email    | `admin@agro360.com`                                      |
| Password | cualquier string de **≥ 8 caracteres** (ej. `demo12345`) |

---

<a id="funcionalidades"></a>

## 3. Funcionalidades y módulos

### Mapa de rutas

| Ruta                 | Módulo            | Descripción                                                |
| -------------------- | ----------------- | ---------------------------------------------------------- |
| `/login`             | Login             | Autenticación.                                             |
| `/despachos`         | Despachos         | Crear campaña + asignar viajes.                            |
| `/borradores`        | Despachos         | Listado / gestión de despachos en borrador.                |
| `/gestion-operativa` | Gestión operativa | Tablero en vivo de campañas y viajes activos.              |
| `/reportes`          | Reportería        | Dashboard de métricas (charts).                            |
| `/mensajeria`        | Mensajería        | Chat con choferes.                                         |
| `/configuracion`     | Configuración     | Usuarios, catálogos, preferencias de notificación, logout. |

Todas las rutas autenticadas viven bajo un **Shell** (sidebar + topbar) protegido por `authGuard`.

### Detalle por módulo funcional

#### Login

- Formulario reactivo tipado (email + password).
- Restauración de sesión al iniciar la app (`AuthStore.restoreSession()`).
- Errores de login se muestran en la página (el interceptor global no toastea rutas `/auth/`).

#### Crear despacho

- Datos de campaña: nombre, productor, campo (dependiente del productor), origen, entrada al campo, material, administrador, vendedor, fechas.
- Alta de viajes: chofer (trae patente), destino, toneladas.
- Envío como activo o guardado como borrador.
- Comunicación vía `DespachoStore` → `DespachoService`.

#### Borradores

- Despachos con estado `borrador` listos para retomar / publicar.

#### Gestión operativa

- Vista por campaña con KPIs (viajes totales, toneladas, en viaje, completados, con problemas).
- Tabla de viajes con badges de estado y barras de progreso.
- Búsqueda / deep-link desde el topbar (`?q=`).

#### Reportería

- Visualización agregada (bar chart, donut chart del kit compartido).

#### Mensajería

- Lista de conversaciones (chofer + patente + no leídos).
- Hilo de mensajes admin/chofer.
- Preferencias de notificación controlan si un mensaje del chofer dispara toast.

#### Configuración

- ABM liviano de usuarios del sistema.
- Catálogos: productores/campos, administradores, vendedores, materiales, choferes.
- Preferencias: viaje retrasado, viaje completado, mensaje de chofer.
- Cierre de sesión.

#### Notificaciones (módulo transversal)

- Toasts globales alimentados por:
  1. Errores HTTP del interceptor.
  2. Acciones de features (`NotificationStore.success/error/warning`).
  3. Eventos de mensajería (según preferencias).
- UI: `ToastContainer` montado en la raíz de la app + componente presentacional `Toast`.

---

<a id="stack"></a>

## 4. Stack tecnológico

| Capa             | Tecnología                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | **Angular 21** (standalone components, sin NgModules)                 |
| Lenguaje         | TypeScript 5.9 (strict)                                               |
| Change detection | **Zone.js** + `ChangeDetectionStrategy.OnPush` en componentes         |
| Estado           | Angular **Signals** (stores singleton, sin NgRx)                      |
| HTTP             | `HttpClient` + interceptors funcionales                               |
| Formularios      | Reactive Forms (`NonNullableFormBuilder`) + CVA en inputs compartidos |
| Estilos          | SCSS + design tokens (`src/styles/_tokens.scss`)                      |
| Unit tests       | Vitest (`ng test`)                                                    |
| E2E              | Playwright (`npm run e2e`)                                            |
| UI kit vivo      | Storybook 10                                                          |
| Lint / format    | angular-eslint + Prettier + Husky + lint-staged                       |
| Package manager  | npm                                                                   |

### Dependencias de runtime relevantes

- `@angular/*` ^21.2
- `rxjs` ~7.8
- `zone.js` ~0.16

No hay librería de estado externa ni UI kit de terceros: el design system es propio (alineado a Figma Agro360, paleta verde de marca).

---

<a id="arquitectura"></a>

## 5. Arquitectura del producto

### Visión en capas

```text
┌─────────────────────────────────────────────────────────────┐
│  Features (pantallas smart)                                 │
│  login · despachos · gestión · mensajería · configuración   │
└────────────┬───────────────────────────────┬────────────────┘
             │ input/output                  │ inject stores
             ▼                               ▼
┌────────────────────────┐     ┌──────────────────────────────┐
│  shared/ui (dumb)      │     │  Stores (Signals)            │
│  button, table, toast… │     │  core/state + feature/stores │
└────────────────────────┘     └──────────────┬───────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │  Services HTTP (data-access) │
                               │  DTO → mapper → Model        │
                               └──────────────┬───────────────┘
                                              │
                     ┌────────────────────────┼────────────────┐
                     ▼                        ▼                ▼
              authInterceptor          errorInterceptor   mockApiInterceptor
                     │                        │                │
                     └────────────────────────┴────────────────┘
                                              │
                              Backend real  ←─┴─→  Mock in-memory
                              (Python REST)        (si mockApi=true)
```

### Principios

1. **Feature-based**, no por tipo de archivo.
2. **Smart vs dumb:** solo la pantalla (smart) inyecta stores/services. `shared/ui` y `features/*/ui` son presentacionales (`input` / `output`).
3. **Un feature no importa el interior de otro feature.** Solo `shared/`, `core/` o su propio `data-access/`.
4. **Comunicación entre features vía stores** (Signals), nunca directa.
5. **DTO ≠ Model:** el backend habla snake_case / strings; el front usa camelCase / `Date`. La conversión ocurre solo en mappers.
6. **Lazy loading** de rutas (`loadComponent` / `loadChildren`).
7. **Estilos encapsulados** por componente + tokens globales; sin estilos inline en el `.ts`.

### Stores existentes

| Store               | Ubicación                             | Responsabilidad                                    |
| ------------------- | ------------------------------------- | -------------------------------------------------- |
| `AuthStore`         | `core/state/`                         | Sesión, `isAuthenticated`, restore                 |
| `ParametrosStore`   | `core/state/`                         | Parámetros globales de la app                      |
| `DespachoStore`     | `features/despachos/data-access/`     | Despachos, catálogos, derivados borradores/activos |
| `MensajeriaStore`   | `features/mensajeria/data-access/`    | Conversaciones, selección, no leídos               |
| `UsuariosStore`     | `features/configuracion/data-access/` | Usuarios del sistema                               |
| `NotificationStore` | `notifications/state/`                | Cola de toasts                                     |
| `PreferenciasStore` | `notifications/state/`                | Preferencias de alerta del usuario                 |

Patrón de store:

```ts
private readonly _data = signal(...);
readonly data = this._data.asReadonly();
readonly derivado = computed(() => ...);
// mutaciones solo vía métodos públicos del store
```

### Capa de datos (referencia: despachos / mensajería)

Por recurso en `data-access/`:

| Archivo                | Rol                                        |
| ---------------------- | ------------------------------------------ |
| `<recurso>.dto.ts`     | Forma exacta del backend                   |
| `<recurso>.model.ts`   | Forma del front                            |
| `<recurso>.mapper.ts`  | `toModel(dto)` — único punto de conversión |
| `<recurso>.service.ts` | `HttpClient` tipado                        |
| `<recurso>.store.ts`   | Estado con Signals + `AsyncState<T>`       |

Estado async compartido (`core/models/async-state.ts`):

```ts
type AsyncState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: string;
};
```

UI de carga/error/vacío: `shared/ui/state-wrapper`.

---

<a id="implementacion"></a>

## 6. Cómo está implementado

### Bootstrap

- `src/main.ts` → `App` con `appConfig`.
- `app.config.ts` registra:
  - Router
  - Zone change detection
  - HTTP con cadena de interceptors: **auth → error → mock**
  - `provideAppInitializer` para restaurar sesión

### Shell de la app autenticada

- `core/layout/shell` — layout con sidebar + router-outlet + topbar.
- Navegación definida en el shell; el `Sidebar` solo emite el id seleccionado (dumb).
- `Topbar` — título de sección, fecha, búsqueda de viajes, acceso a mensajería/perfil.

### Interceptors

| Interceptor          | Función                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `authInterceptor`    | Agrega `withCredentials: true` a requests del `apiBaseUrl` (cookies). |
| `errorInterceptor`   | Errores HTTP → `NotificationStore` (excepto `/auth/`).                |
| `mockApiInterceptor` | Si `environment.mockApi`, responde in-memory a `/api/*`.              |

### Guards

- `authGuard` (`CanActivateFn`): redirige a `/login` si no hay sesión.

### Formularios

- Reactive Forms en login, crear despacho y configuración (usuarios).
- Controles compartidos CVA: `TextInput`, `SelectInput`.
- Algunos campos auxiliares (chat, altas rápidas de catálogo) usan `ngModel`.

### Estilos

- Tokens: `src/styles/_tokens.scss` (colores de marca, spacing, radius, sombras, breakpoints).
- Tipografía: `src/styles/_typography.scss`.
- Entry global: `src/styles.scss`.
- `angular.json` incluye `includePaths: ["src/styles"]` para `@use 'tokens'`.
- Breakpoints: `$breakpoint-tablet: 768px`, `$breakpoint-desktop: 1280px` (desktop-first).

### Mock API

Archivos:

- `core/interceptors/mock-api.interceptor.ts` — routing de endpoints simulados.
- `core/interceptors/mock-data.ts` — datos semilla (catálogos, despachos, conversaciones).

Endpoints simulados (bajo `/api`): auth, catálogos, usuarios, parámetros, preferencias, despachos, conversaciones/mensajes. Latencia artificial ~400 ms. Sesión mock en memoria (no cookie real del browser).

---

<a id="estructura"></a>

## 7. Estructura de carpetas

```text
src/
├── app/
│   ├── core/                      # Singleton transversal
│   │   ├── guards/                # auth.guard.ts
│   │   ├── interceptors/          # auth, error, mock-api + mock-data
│   │   ├── layout/                # shell, topbar
│   │   ├── models/                # User, AsyncState
│   │   ├── services/              # AuthService, ParametrosService
│   │   └── state/                 # AuthStore, ParametrosStore
│   ├── shared/
│   │   ├── ui/                    # Kit presentacional (button, table, toast…)
│   │   ├── directives/            # (reservado)
│   │   ├── pipes/                 # (reservado)
│   │   └── validators/            # (reservado)
│   ├── features/
│   │   ├── login/
│   │   ├── despachos/
│   │   │   ├── data-access/       # dto, model, mapper, service, store
│   │   │   ├── crear-despacho/
│   │   │   ├── borrador-despachos/
│   │   │   ├── reportes-despachos/
│   │   │   ├── ui/                # (reservado para dumb del feature)
│   │   │   └── despachos.routes.ts
│   │   ├── gestion-operativa/
│   │   ├── mensajeria/
│   │   └── configuracion/
│   ├── notifications/             # Módulo desacoplado
│   │   ├── data-access/           # (reservado — transporte push)
│   │   ├── state/                 # NotificationStore, PreferenciasStore
│   │   └── ui/                    # toast-container
│   ├── app.ts / app.config.ts / app.routes.ts
├── styles/
│   ├── _tokens.scss
│   └── _typography.scss
├── environments/
│   └── environment.ts
└── styles.scss
```

### Shared UI (kit)

Badge, Button, Icon, Logo, TextBar, Sidebar, KpiCard, ProgressBar, StateWrapper, Table (+ cell def), Toast, TextInput, SelectInput, BarChart, DonutChart.

Cada uno tiene SCSS propio y, en la mayoría, stories de Storybook.

---

<a id="lineamientos"></a>

## 8. Lineamientos y convenciones

### Componentes

- Siempre `ChangeDetectionStrategy.OnPush`.
- Standalone: declarar `imports: [...]` en el decorador.
- Selectors: elementos `app-*` kebab-case; directivas `app*` camelCase.
- Smart = una por pantalla. Dumb = solo `input()` / `output()`.
- Templates y estilos en archivos separados (`.html` / `.scss`), no inline en el `.ts`.

### Estado

- Mutaciones **solo** dentro del store.
- Exponer señales con `.asReadonly()`.
- Derivados con `computed()`.
- Datos cross-feature → `core/state/`. Datos de un dominio → `features/<dominio>/data-access/`.
- Eventos puntuales sin estado persistente (toasts) → store de notificaciones / bus liviano, no stores de dominio.

### Datos

- La UI **nunca** llama `HttpClient` directo.
- Mapping DTO→Model solo en mappers.
- Preferir `AsyncState<T>` + `state-wrapper` para listas/cargas.

### Routing

- Lazy load siempre.
- Rutas del feature en `features/<dominio>/<dominio>.routes.ts` cuando sea posible.
- Datos transitorios de navegación: query params / router state (no stores).

### Imports entre features

```text
✅ feature → shared/
✅ feature → core/
✅ feature → su propio data-access/
❌ feature A → feature B (interno)
```

### Commits y calidad local

- Husky pre-commit ejecuta **lint-staged** (Prettier + ESLint solo sobre archivos staged).
- Estilo de mensaje recomendado: Conventional Commits (`feat:`, `fix:`, `refactor:`, …). _(Commitlint aún no está cableado.)_

### Responsive

- Tokens de breakpoint únicamente desde `_tokens.scss`.
- Desktop-first con `@media (max-width: $breakpoint-tablet)`.
- Preferir unidades relativas (`rem`, `%`, `fr`).

---

<a id="auth"></a>

## 9. Autenticación y seguridad

### Diseño objetivo (con backend real)

- Token de sesión en **cookie httpOnly + SameSite**, seteada por el backend.
- Front: `withCredentials: true` (interceptor de auth).
- CORS del backend con origin explícito (no `*`) y credentials habilitados.
- **No** guardar tokens en `localStorage` / `sessionStorage`.

### Implementación actual

- Contrato de auth listo (`AuthService`: login / me / logout; `AuthStore`; guard).
- Con mock: sesión in-memory (`sessionActive`), no cookie real del browser.
- Sin `innerHTML` / bypass de sanitizer en el código.
- Sin secrets committeados en environment (solo `apiBaseUrl` + flag mock).

### Roles

`User.rol`: `'administrador' | 'vendedor'`. Hoy el guard solo valida autenticación, no permisos por rol.

---

<a id="api-mock"></a>

## 10. API mock y entornos

### Environment actual

`src/environments/environment.ts`:

```ts
export const environment = {
  apiBaseUrl: '/api',
  mockApi: true,
};
```

| Flag             | Efecto                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| `mockApi: true`  | El interceptor mock responde todas las llamadas a `/api`. No hace falta backend. |
| `mockApi: false` | Las requests van al backend real en `apiBaseUrl`.                                |

> Hoy solo existe un archivo de environment. Al integrar producción conviene agregar `environment.production.ts` (o file replacements de Angular) con `mockApi: false`.

### Cuando exista el backend Python

1. Apuntar `apiBaseUrl` a la URL del API.
2. Poner `mockApi: false`.
3. Asegurar CORS + cookies en el backend.
4. El mock (`mock-api.interceptor.ts` + `mock-data.ts`) puede retirarse o quedar solo para demos locales.

---

<a id="ejecutar"></a>

## 11. Cómo ejecutarlo

### Requisitos

- **Node.js** compatible con Angular 21 (recomendado: LTS actual)
- **npm** (el repo declara `packageManager: npm@11.11.0`)

### Instalación

```bash
git clone <url-del-repo>
cd agro360-web
npm install
```

### Desarrollo (app)

```bash
npm start
# o: ng serve
```

Abrir [http://localhost:4200/](http://localhost:4200/).

Login demo:

- Email: `admin@agro360.com`
- Password: `demo12345` (u otra clave ≥ 8 caracteres)

### Build de producción

```bash
npm run build
# artefactos en dist/
```

### Storybook (kit UI)

```bash
npm run storybook
```

Build estático:

```bash
npm run build-storybook
```

### Lint

```bash
npm run lint
```

### Tests unitarios

```bash
npm test
# o: ng test
```

### Tests E2E (Playwright)

Asegura browsers de Playwright instalados la primera vez:

```bash
npx playwright install
```

Luego:

```bash
npm run e2e
```

El config levanta (o reutiliza) `npm start` en `http://localhost:4200` y corre el flujo crítico:

**login → crear despacho → verlo en gestión operativa → logout.**

---

<a id="testing"></a>

## 12. Testing y calidad

### Prioridades (según arquitectura del producto)

| Prioridad  | Qué                                   | Estado aproximado                                           |
| ---------- | ------------------------------------- | ----------------------------------------------------------- |
| Alta       | Services data-access, mappers, stores | Cubierto en despachos (store + mapper) y notification store |
| Media      | Smart pages                           | Pendiente ampliar                                           |
| Baja/media | Dumb UI                               | Cubierto vía Storybook / Vitest browser                     |
| E2E        | Flujos críticos                       | 1 spec Playwright                                           |

### Tooling de calidad

| Herramienta               | Uso                                                         |
| ------------------------- | ----------------------------------------------------------- |
| ESLint (`angular-eslint`) | Reglas TS + templates Angular                               |
| Prettier                  | Formato (integrado con ESLint via `eslint-config-prettier`) |
| Husky                     | Hook `pre-commit`                                           |
| lint-staged               | Lint/format solo archivos del commit                        |
| TypeScript strict         | `strict`, templates e injection strict                      |

---

<a id="storybook"></a>

## 13. Storybook / design system

- Stories bajo `src/app/shared/ui/**/*.stories.ts`.
- Fundación de color: `shared/ui/foundations/color-palette.stories.ts`.
- Tokens alineados al kit Figma Agro360 (verde de marca `#00a63e`, superficies, semánticos success/danger/warning).
- Storybook sirve como **espejo vivo** del kit de componentes (botones, badges, toasts, tablas, inputs, charts, sidebar, etc.).

---

<a id="deuda"></a>

## 14. Estado actual y deuda conocida

El proyecto es una **implementación temprana sólida** de la arquitectura objetivo. Puntos a tener en cuenta al leer el código:

| Área                        | Situación                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Capa DTO/mapper             | Completa en **despachos** y **mensajería**; parcial o inline en auth, usuarios, parámetros, preferencias |
| `features/*/ui`             | Carpetas reservadas; páginas smart aún concentran mucha UI                                               |
| Rutas por feature           | Solo `despachos.routes.ts`; resto inline en `app.routes.ts`                                              |
| `shared/validators`         | Reservado (vacío)                                                                                        |
| `notifications/data-access` | Reservado; HTTP de preferencias vive hoy en el store                                                     |
| Environment prod            | Falta archivo / file replacement con `mockApi: false`                                                    |
| Commitlint                  | Conventional Commits recomendados, no enforced                                                           |
| Auth real                   | Diseño listo; cookies reales dependen del backend                                                        |
| Guards por rol              | No implementados                                                                                         |
| Acoplamiento shell          | `Topbar` (core) inyecta stores de features (despacho / mensajería)                                       |

Estos gaps no impiden desarrollar ni demos locales con mock; sí conviene cerrarlos antes de producción.

---

<a id="roadmap"></a>

## 15. Roadmap de integración

1. **Backend Python REST** con CORS + cookies httpOnly.
2. Desactivar mock (`mockApi: false`) y environments por entorno.
3. Homogeneizar DTO/mapper/service en todos los dominios.
4. Extraer dumb components a `features/*/ui` donde haya reutilización.
5. Rutas autocontenidas por feature + guards por rol si el negocio lo exige.
6. Transporte real de notificaciones (WebSocket/SSE) en `notifications/data-access`.
7. Ampliar cobertura de tests (stores restantes, guards, interceptors, smart pages).
8. Conectar app mobile del chofer al mismo backend de mensajería / estado de viaje.

---

## Scripts npm de referencia

| Script            | Comando                                        | Descripción                    |
| ----------------- | ---------------------------------------------- | ------------------------------ |
| `start`           | `ng serve`                                     | Dev server                     |
| `build`           | `ng build`                                     | Build producción               |
| `watch`           | `ng build --watch --configuration development` | Build continuo                 |
| `test`            | `ng test`                                      | Unit tests (Vitest)            |
| `lint`            | `ng lint`                                      | ESLint                         |
| `storybook`       | Storybook dev                                  | Kit UI                         |
| `build-storybook` | Build Storybook                                | Estático                       |
| `e2e`             | `playwright test`                              | E2E crítico                    |
| `prepare`         | `husky`                                        | Instala hooks en `npm install` |

---

## Resumen en una frase

**Agro360 Web** es el backoffice Angular para planificar campañas de despacho de granos, asignar viajes a choferes, operar el tablero logístico y chatear con conductores en ruta — implementado con arquitectura feature-based, stores de Signals, capa DTO/mapper y mock API listo para reemplazar por un backend Python.
`)

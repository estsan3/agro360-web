# Definiciones de producto — Pantalla Crear despacho

Documento de decisiones (2026-08-06).  
**No implementado aún** — guía para rediseñar la UI y alinear backend/flujo operativo.

Casuística de referencia CPE: ver `agro360-api/postman/arca-wscpe/docs/gap-analisis-cpe-agro360.md`.

---

## 1. Qué es un despacho

Un **despacho** es un **pedido concreto** de logística de granos.

- Involucra **uno o muchos viajes** (ej. 200.000 tn de soja desde un campo → decenas de viajes).
- Los transportistas pueden:
  - ya estar conocidos (asignación directa),
  - tomarse desde **lista de espera**,
  - buscarse por teléfono / oferta,
  - o asignarse luego por un **agente de IA**.
- Los viajes **no siempre** comparten el mismo transportista/camión/chofer; cambian por unidad.
- Destino, cereal, intervinientes y tarifas de cabecera: los viajes **los heredan** por defecto (pueden existir overrides operativos más adelante).

### Glosario (corrección de naming)

| Hoy en UI (incorrecto / confuso)            | Concepto real                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| “Viajes” al cargar filas con chofer/patente | En la creación, lo que se carga son **asignaciones de transportista/unidad** a cupos del pedido                |
| Viaje                                       | Unidad de traslado (tn + estado + eventual CPE) que se **inicia** cuando está checklist OK                     |
| Despacho                                    | Pedido / campaña operativa del pedido                                                                          |
| Borrador en búsqueda                        | Pedido publicado sin (todas) las unidades asignadas; estado orientado a “en búsqueda de viajes/transportistas” |

> En la UI nueva hay que separar visualmente: **cupos/viajes del pedido** vs **asignación de transportista** vs **iniciar viaje**.

---

## 2. Quién opera la pantalla

| Rol                                                     | Responsabilidad                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Personal operativo de la empresa de logística de granos | Toma el pedido, carga datos, busca/asigna transportistas, emite CPE, inicia viajes                                      |
| Vendedor                                                | **No** es el operador principal de esta pantalla. Es un dato del pedido (referencia comercial), no el “dueño” del flujo |

En el flujo ideal, **la misma persona** crea el despacho, asigna transportistas y genera cartas de porte (puede ser en momentos sucesivos sobre el mismo pedido).

---

## 3. Estructura de pantalla deseada

### 3.1 Una sola pantalla, tabs por dominio

Orden de secciones / tabs (prioridad de negocio):

1. **Origen**
2. **Cereal** (material / grano)
3. **Destino**
4. **Intervinientes**
5. **Vendedor** (dato comercial del pedido; no implica que el vendedor opere la pantalla)
6. **Transporte / tarifas**
7. **Transportistas** (cantidad de viajes requeridos + agente IA + tabla de viajes manual)

Tipo CPE + sucursal van en **Transporte** (nivel pedido). No hay tab ARCA aparte: origen/destino/cosecha/intervinientes viven en sus tabs.

Principio: poder cargar **todos los datos que ya se tienen**. A medida que se van cargando transportistas (hoy mal llamados “viajes” en la grilla), se pueden ir **agregando unidades y generando CPE** cuando los datos estén completos. Si falta algo para ARCA, no se emite.

### 3.2 Catálogos ARCA (origen / destino)

- Provincia, localidad, planta: **selects**.
- Los códigos deben ser los de **ARCA/WSCPE** (no texto libre como fuente de verdad).

### 3.3 Intervinientes

- Campos de **CUIT**.
- Al cargar el CUIT, mostrar al lado la **razón social** (idealmente consultada a ARCA / padrón cuando exista integración; mientras tanto placeholder o cache local).

---

## 4. Modelo de viajes / asignación (escala ~40+)

### 4.1 Herencia

Cabecera del pedido define defaults:

- destino (operativo + ARCA),
- cereal,
- intervinientes,
- tarifas / km,
- pesos default (tara, etc.).

Cada viaje/cupo **hereda** esos valores. La variación típica entre viajes es el **transportista / camión / chofer** (y luego datos de CPE que dependen de esa unidad: dominio, turno, etc.).

### 4.2 Dos modos de cierre al guardar

**Modo A — Borrador / en búsqueda de viajes**

- Puede terminar **sin viajes asignados** (o con parcial).
- Estado conceptual: **en búsqueda de viajes/transportistas**.
- A medida que toman viajes (lista de espera, IA o asignación directa):
  - se generan cartas de porte cuando corresponda,
  - se pueden iniciar y pasar a **Gestión operativa**.

**Modo B — Pedido completo con unidades cargadas**

- Se cargan todos los transportistas/unidades necesarios.
- Se pueden generar CPE e **iniciar viajes directamente** sin pasar por borrador de búsqueda.
- Requisito: tener todos los datos necesarios (checklist).

Ambos modos conviven en la misma pantalla.

### 4.3 Canales de asignación (todos válidos)

1. Lista de espera
2. Agente de IA
3. Asignación directa (operador ya tiene el transportista)

La pantalla de crear/editar despacho **debe mostrar estados** de cada cupo/viaje (ej. sin asignar / en búsqueda / asignado / CPE pendiente / CPE emitida / listo para iniciar / en gestión operativa). El agente IA puede asignar sin que el usuario “vuelva” solo por eso, pero el estado debe verse acá.

### 4.4 No sacar la asignación de esta pantalla

La creación/edición del despacho **sigue siendo el lugar** donde, si el operador ya tiene todos los datos y transportistas, carga todo, guarda (borrador o listo) y desde ahí puede **iniciar viaje**.

Al **iniciar viaje** se valida checklist, por ejemplo:

- [ ] Ticket / control gasoil
- [ ] Entrega de efectivo (si aplica)
- [ ] Carta de porte OK
- [ ] Datos de unidad (chofer, dominio, etc.)

Si está todo OK → el viaje inicia y pasa a **Gestión operativa**.

---

## 5. Carta de porte (CPE)

### 5.1 Momento de emisión

- **A)** Recién con transportista + chofer + dominio confirmados (datos de transporte completos).
- **C)** También **masiva** cuando varios viajes ya están asignados.

No se emite CPE “a ciegas” sin unidad asignada.

### 5.2 Relación con la carga del pedido

Misma pantalla: datos de pedido + unidades + emisión CPE.  
Si faltan campos para ARCA, la UI debe dejar claro qué falta (alineado al gap analysis del API).

### 5.3 Campos gap (decisión: reservar en UI)

**Decisión (2026-08-06): sí reservar** lugar en la UI para los gaps detectados, aunque el backend aún no los persista todos.

Campos a contemplar en UI (habilitados cuando CPE está activa; opcionales hasta que el API los soporte):

| Campo CPE / negocio                      | Notas                                       |
| ---------------------------------------- | ------------------------------------------- |
| `codigoTurno`                            | Por viaje/unidad (ej. COSM6752…, LAG-SOJ-…) |
| 2° dominio (acoplado)                    | Además del dominio tractor                  |
| Hora exacta de partida                   | Además de la fecha de carga                 |
| `cuitRemitenteComercialProductor`        | Retiro productor                            |
| `nroRenspa`                              | Origen / productor                          |
| `cuitRemitenteComercialVentaSecundaria2` | Opcional WSCPE                              |

En la implementación: mostrar el control en el tab correspondiente / viaje; si el API aún no acepta el campo, no bloquear el guardado del resto (degradación temporal documentada en el gap analysis del API).

---

## 6. Relación con otras pantallas

| Pantalla                    | Rol en el flujo                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Crear / editar despacho** | Carga del pedido, defaults ARCA, asignación de unidades, emisión CPE, iniciar viaje (checklist) |
| **Borradores**              | Pedidos en búsqueda / incompletos                                                               |
| **Lista de espera**         | Cola FIFO de unidades que pueden tomar cupos                                                    |
| **Gestión operativa**       | Viajes ya iniciados / en ruta                                                                   |
| **Cartas de porte**         | Bandeja de intenciones / estados ARCA (consulta, reintento, PDF)                                |

---

## 7. Respuestas originales (trazabilidad)

| #    | Pregunta                             | Respuesta                                                                                      |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1.1  | ¿Campaña o pedido?                   | Pedido concreto, 1..N viajes; transportistas propios o a contratar (lista / teléfono)          |
| 1.2  | ¿Mismo destino/intervinientes?       | No siempre los mismos transportistas; ej. 200.000 tn → muchos transportistas/camiones/choferes |
| 2.3  | ¿Quién crea?                         | Mal el vendedor como operador; es personal operativo de logística de granos                    |
| 2.4  | ¿Mismos roles en el flujo?           | Idealmente sí (misma persona)                                                                  |
| 3.5  | Orden secciones                      | Origen → Cereal → Destino → Intervinientes → Vendedor → Transporte/tarifas → Viajes → ARCA     |
| 3.6  | ¿CPE separada?                       | Una sola pantalla; ir cargando transportistas y generando CPE cuando esté OK                   |
| 4.7  | ¿Cabecera N viajes vs filas?         | No entendida — ver §4 (herencia + modos A/B)                                                   |
| 4.8  | ¿Destino/tn verdad en cabecera?      | Los viajes **heredan**                                                                         |
| 5.9  | Canal asignación                     | Lista de espera, IA o asignación directa                                                       |
| 5.10 | ¿Mostrar estados si asigna IA?       | Sí                                                                                             |
| 5.11 | ¿Sacar asignación de crear despacho? | No; checklist al iniciar viaje (gasoil, efectivo, CPE…)                                        |
| 6.12 | Momento CPE                          | A y C (con unidad confirmada + masiva)                                                         |
| 6.13 | ¿Reservar gaps en UI?                | **Sí** — ver §5.3                                                                              |
| 7.14 | Códigos ARCA                         | Selects con códigos ARCA                                                                       |
| 7.15 | Intervinientes                       | CUIT + razón social al lado (ideal ARCA)                                                       |
| 8.16 | Forma UI                             | Tabs por dominio                                                                               |
| 8.17 | Resultado al guardar                 | Borrador sin viajes (en búsqueda) **o** completo con viajes/CPE/inicio directo                 |

---

## 8. Próximos pasos (cuando se autorice impacto)

1. ~~Confirmar §5.3 (campos gap en UI).~~ → **Sí reservar.**
2. ~~Proponer wireframe / estructura de tabs + estados de fila.~~ → **Ver §10.**
3. ~~Validar §10 con negocio.~~ → Aprobado.
4. ~~Impactar front (`crear-despacho`) tabs por dominio.~~ → Hecho (UI); gaps reservados aún no todos persisten en API.
5. Pendiente: checklist “Iniciar viaje” en UI + persistir gaps en backend (`codigoTurno`, acoplado, hora, RENSPA, VS2, rte. productor).
6. Pendiente: selects ARCA completos vía WSCPE (hoy catálogo mínimo local) + padrón razón social.

---

## 9. Fuera de alcance de este documento

- Implementación Angular/API.
- Diseño visual pixel-perfect.
- Integración real padrón ARCA para razón social (solo requisito funcional).

---

## 10. Wireframe / estructura propuesta (tabs)

Layout general (una sola ruta `/despachos`):

```
┌─────────────────────────────────────────────────────────────────┐
│ Pedido: [nombre]     Estado: Borrador | En búsqueda | Activo    │
│ Resumen: Origen · Cereal · Destino · Tn pedidas · Cupos X/Y     │
├─────────────────────────────────────────────────────────────────┤
│ [Origen] [Cereal] [Destino] [Intervinientes] [Vendedor]         │
│ [Transporte] [Transportistas]                                   │
├─────────────────────────────────────────────────────────────────┤
│  (contenido del tab activo)                                     │
├─────────────────────────────────────────────────────────────────┤
│ Guardar borrador │ Publicar en búsqueda │ Generar CPE │         │
│ Iniciar seleccionados │ Crear / Activar pedido                  │
└─────────────────────────────────────────────────────────────────┘
```

Barra de progreso liviana (opcional): checks por tab con datos mínimos OK  
(Origen ✓ Cereal ✓ Destino ✓ … Viajes 3/40 · CPE 2/3).

### Tab 1 — Origen

| Campo               | Tipo                    | Notas                              |
| ------------------- | ----------------------- | ---------------------------------- |
| Productor *         | select catálogo         |                                    |
| Campo *             | select dependiente      |                                    |
| Entrada campo *     | select puntos GPS       |                                    |
| Descripción origen  | texto (auto o editable) | etiqueta humana; no reemplaza ARCA |
| Prov. origen ARCA * | select códigos ARCA     |                                    |
| Loc. origen ARCA *  | select filtrada         |                                    |
| Planta origen RUCA  | select / opcional       |                                    |
| N° RENSPA           | texto                   | **gap reservado**                  |
| Retiro productor    | checkbox                |                                    |
| Solicitante campo   | checkbox                |                                    |
| GPS (lat/lng)       | readonly desde entrada  |                                    |

### Tab 2 — Cereal

| Campo                   | Tipo              | Notas                             |
| ----------------------- | ----------------- | --------------------------------- |
| Material *              | select            | muestra código grano AFIP al lado |
| Cosecha *               | número (ej. 2425) |                                   |
| Mercadería fumigada     | checkbox          |                                   |
| Tara default (kg)       | número            | hereda a viajes                   |
| Tn totales del pedido * | número            | para planificar cupos             |

### Tab 3 — Destino

| Campo                  | Tipo                  | Notas                                |
| ---------------------- | --------------------- | ------------------------------------ |
| Destino (etiqueta) *   | texto / select futuro | “COFCO Puerto…”, “LDC General Lagos” |
| CUIT destinatario *    | CUIT + razón social   |                                      |
| Destino a campo        | checkbox              |                                      |
| Prov. destino ARCA *   | select                |                                      |
| Loc. destino ARCA *    | select                |                                      |
| Planta destino *       | select ARCA           |                                      |
| Fecha llegada estimada | date                  |                                      |

Defaults heredados por cada viaje; override por fila en tab Viajes si hace falta.

### Tab 4 — Intervinientes

Patrón de fila: `[ CUIT ]  Razón social…` (lookup ARCA/cache).

| Campo                                  |
| -------------------------------------- |
| CUIT solicitante CPE *                 |
| Pagador de flete                       |
| Intermediario de flete                 |
| Remitente comercial VP                 |
| Remitente comercial VS                 |
| Remitente comercial VS2                | **gap reservado** |
| Remitente comercial productor (retiro) | **gap reservado** |
| Mercado a término                      |
| Corredor VP / Corredor VS              |
| Representante entregador / recibidor   |

### Tab 5 — Vendedor (comercial)

| Campo               | Notas                                            |
| ------------------- | ------------------------------------------------ |
| Nombre del pedido * | ex “Nombre campaña”                              |
| Vendedor *          | select; dato del pedido, no operador de pantalla |
| Administrador *     | responsable interno logística                    |
| Fecha inicio *      |                                                  |
| Observaciones       |                                                  |

### Tab 6 — Transporte / tarifas

| Campo                                         | Notas                               |
| --------------------------------------------- | ----------------------------------- |
| Dador de viaje                                |                                     |
| Distancia km                                  |                                     |
| Tarifa $/tn + tarifa llena                    |                                     |
| Cuando (ahora / mañana / fecha) + fecha carga |                                     |
| Hora partida default                          | **gap reservado** (además de fecha) |

### Tab 7 — Transportistas

Bloque superior:

- Input **Cantidad de viajes requeridos** (ej. 30)
- Acción **Buscar con agente IA** → el agente busca N transportistas y llena la tabla con N viajes (canal `ia`)

Tabla inferior (carga manual, como antes):

- Título: **Viajes del despacho**
- Acciones: `Agregar Viaje` · `Crear Carta de Porte` · `Ticket Gasoil` · duplicar/eliminar
- Columnas: estado, canal, chofer, dominio, acoplado, turno, destino, tn

Tabla (escala 40+):

| Col           | Contenido                                             |
| ------------- | ----------------------------------------------------- |
| ☐             | selección masiva                                      |
| Cupo / ID     | id viaje                                              |
| Estado        | ver §10.1                                             |
| Canal         | Directo · Lista espera · IA · Teléfono                |
| Transportista |                                                       |
| Chofer        |                                                       |
| Dominio       | tractor                                               |
| Acoplado      | **gap reservado** 2° dominio                          |
| Tn            | hereda / editable                                     |
| Destino       | hereda (badge si override)                            |
| Turno         | **gap reservado** `codigoTurno`                       |
| CPE           | sin datos · lista · emitida · error                   |
| Acciones      | asignar · CPE · checklist iniciar · duplicar · quitar |

Sin filas obligatorias al crear: válido guardar **en búsqueda** con 0 cupos o solo cupos vacíos.

### Tab Transporte — bloque CPE (pedido)

| Campo                | Notas                           |
| -------------------- | ------------------------------- |
| Habilitar CPE        | toggle                          |
| Tipo CPE 74 / 274    | nivel pedido (todos los viajes) |
| Sucursal / talonario | nivel pedido                    |

Emisión: por fila o masiva desde tab Transportistas (requiere unidad asignada).

### 10.1 Estados de fila (visibles siempre)

Propuesta de máquina de estados (UI):

```
sin_asignar → en_busqueda → asignado → cpe_pendiente → cpe_ok → listo_iniciar → iniciado
                                   ↘ cpe_error ↗
```

| Estado UI       | Significado                          |
| --------------- | ------------------------------------ |
| `sin_asignar`   | Cupo creado, sin transportista       |
| `en_busqueda`   | Publicado a lista/oferta/IA          |
| `asignado`      | Transportista+chofer+dominio OK      |
| `cpe_pendiente` | Listo para emitir / intención creada |
| `cpe_ok`        | CPE autorizada / PDF                 |
| `cpe_error`     | Falló ARCA; reintentar               |
| `listo_iniciar` | Checklist completo                   |
| `iniciado`      | Pasó a Gestión operativa             |

### 10.2 Checklist “Iniciar viaje”

Al confirmar inicio (uno o varios):

- [ ] Chofer y dominio (y acoplado si aplica)
- [ ] Carta de porte OK (si CPE habilitada)
- [ ] Ticket / control gasoil (si aplica al flujo)
- [ ] Entrega de efectivo (si aplica)
- [ ] Datos ARCA mínimos sin gaps bloqueantes

Si falla un ítem → no inicia; se muestra qué falta.

### 10.3 Acciones del footer (según contexto)

| Acción                 | Resultado                                                             |
| ---------------------- | --------------------------------------------------------------------- |
| Guardar borrador       | Pedido incompleto; puede tener 0 cupos                                |
| Publicar en búsqueda   | Estado “en búsqueda”; lista/IA/teléfono pueden tomar cupos            |
| Crear / Activar pedido | Pedido operativo; si ya hay unidades completas, permite CPE + iniciar |
| Generar CPE            | Solo filas con unidad asignada y datos OK                             |
| Iniciar seleccionados  | Checklist → Gestión operativa                                         |

### 10.4 Naming UI propuesto

| Evitar                                     | Usar                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| “Viajes” para la grilla de alta con chofer | **Cupos / Unidades** (o “Viajes del pedido”) con subtítulo “Asignación de transportistas” |
| “Información 1”                            | tabs por dominio (§10)                                                                    |
| Vendedor como dueño del flujo              | Vendedor = dato comercial del pedido                                                      |

### 10.5 Mapeo desde la pantalla actual

| Hoy                                       | Mañana                                             |
| ----------------------------------------- | -------------------------------------------------- |
| Tab “Información 1” (mezcla)              | Tabs Origen, Cereal, Destino, Vendedor, Transporte |
| Tab “Carta de porte”                      | Tab ARCA + parte Intervinientes + gaps             |
| Tabla “Viajes del Despacho” siempre abajo | Tab Viajes (misma pantalla; no otro wizard)        |
| Destino/tn oferta duplicados              | Tn/destino en Cereal/Destino; viajes heredan       |
| Códigos ARCA numéricos libres             | Selects códigos ARCA                               |
| Sin estados de canal/CPE en grilla        | Columnas Estado / Canal / CPE                      |

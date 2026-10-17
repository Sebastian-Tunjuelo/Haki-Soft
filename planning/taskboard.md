# Tablero Maestro de Tareas, Prioridades y Decisiones — TaskStream AI (`taskboard.md`)

> **Documento Operativo Oficial (`taskboard.md`):** Centraliza todas las tareas de ingeniería de **TaskStream AI**, organizadas por fase, prioridad, especificación (`SPEC-00` a `SPEC-12`) y rol dentro del equipo de **5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`)**, junto con las reglas cerradas del flujo financiero, el alcance del Consejero de IA (exclusivo para **imagen y texto** en el MVP) y las decisiones técnicas operativas.
>
> 🔗 **Sincronizado con:** `CONTEXT.md`, `architecture-overview.md`, `pbp-development.md`, `sdd-process.md` y `AI_USAGE.md`.

---

## 1. Convenciones del Tablero, Prioridades y Asignación de Roles

### 1.1. Niveles de Prioridad

| Nivel | Etiqueta | Criterio de Clasificación |
| :---- | :---- | :---- |
| 🔴 **`P0`** | **Crítico / Bloqueante de Fase** | Creación de la carpeta `specs` y su `README.md` (`SPEC-00`), contratos globales (`SPEC-01`), custodia financiera en Open Payments (`96 % / 4 %` y reembolsos `100 %`), contrato exacto de entrada para `AiAdvisorService` (`SPEC-08`), relojes independientes (`7d`, `24h`, `+7d`, `32h`, `30m`), seguridad del *Protected Preview* y `Deploy` final (`SPEC-12`). |
| 🟠 **`P1`** | **Alto / Core Funcional MVP** | Flujos completos de negociación (Caminos 1 y 2), escenas 3D con `GSAP ScrollTrigger`, auditoría consultiva de IA para **imagen y texto**, y consola de disputas administrativas justificadas. |
| 🟡 **`P2`** | **Medio / UX, Observabilidad y Refinamiento** | Etiqueta W3C Web Monetization en portafolios, notificaciones claras al Buyer y Freelancer (`Resend`), filtros del catálogo y métricas de reputación. |
| 🔵 **`P3`** | **Post-MVP / Planteado a Futuro** | Suscripción opcional `Buyer AI Pro Subscription` y auditoría de IA para formatos distintos a imagen y texto (video, audio, archivos complejos de código), que quedan únicamente planteados pero no entran dentro del MVP. |

### 1.2. Estados de Tareas

* **`[DONE]`** — Completado, verificado y registrado en `AI_USAGE.md`.
* **`[IN_PROGRESS]`** — En ejecución activa en la fase actual.
* **`[READY_UNBLOCKED]`** — Listo para iniciar de inmediato (contrato y mocks disponibles, sin bloqueo de otros roles).
* **`[WAITING_SYNC]`** — Tarea de integración final que une el trabajo paralelo de Frontend, Backend e IA al cierre de una fase.
* **Indicador Especial `🛡️ [MANUAL / IA MÍNIMA-NULA]`:** Identifica las tareas reservadas para implementación y auditoría manual directa por el equipo humano según `AI_USAGE.md`.

---

## 2. Tablero de Tareas por Fase y por Rol (`2 FE / 2 BE / 1 IA`)

### Fase 0 — Gobernanza, Estructura `specs/` (`SPEC-00`) y Contratos Globales (`SPEC-01`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F0-01`** | Todos | 🔴 `P0` | — | Definir la Única Fuente de Verdad en `CONTEXT.md` integrando el flujo completo de plazos (`7d`, `24h`, `+7d`, `32h`, `30m`), máximo 2 correcciones globales y alcance de IA exclusivo para imagen y texto en el MVP. | Ninguna | `[DONE]` |
| **`T-F0-02`** | Todos | 🔴 `P0` | — | Instaurar la Política Inmutable de Uso y Trazabilidad de IA en `AGENTS.md`, `AI_USAGE.md` y `promptsAI_USAGE.md`. | `T-F0-01` | `[DONE]` |
| **`T-F0-03`** | Todos | 🔴 `P0` | — | Generar los 4 documentos rectores de ingeniería: `architecture-overview.md` (con modelo de datos 3NF libre de *God-Entities*), `taskboard.md`, `pbp-development.md` y `sdd-process.md`. | `T-F0-02` | `[DONE]` |
| **`T-F0-04`** | `AI-1` | 🔴 `P0` | `SPEC-00` | Ejecutar `SPEC-00.md`: crear la carpeta `specs` y su `README.md` con el índice maestro desde `SPEC-00` hasta `SPEC-12` (`Deploy`). | `T-F0-03` | `[DONE]` |
| **`T-F0-05`** | `AI-1` | 🔴 `P0` | `SPEC-01` | Inicializar `shared-schemas` con los esquemas Zod globales (`TaskOrderCardSchema`, `DeadlineExtensionRequestSchema`, `AiAdvisorInputContractSchema`, `AiAdvisorReportSchema`) y generadores de *mocks* para desbloquear a los 5 desarrolladores. | `T-F0-04` | `[DONE]` |
| **`T-F0-06`** | `FE-1` + `BE-2` | 🔴 `P0` | `SPEC-01` | Configurar la raíz del monorepo (`pnpm-workspace.yaml`, `turbo.json`), aplicación Frontend (Next.js 15.5 + React 19) y aplicación Backend (NestJS 10.4 + Prisma 6). | `T-F0-03` | `[DONE]` |

---

### Fase 1 — Identidad Multimoneda en América (`SPEC-02`) y Motor 3D Base (`SPEC-03`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F1-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-02` | Implementar la sesión local (correo y contraseña), el selector `Buyer Mode / Seller Mode` y el formulario de vinculación de `walletAddress`. La decisión vigente es el registro local de `.agents/CONTEXT.md` §4; esta fila ya no pide Clerk. | `T-F0-05` | `[DONE]` |
| **`T-F1-FE2-01`** | `FE-2` | 🔴 `P0` | `SPEC-03` | Configurar el proveedor global de Smooth Scroll (`Lenis`) sincronizado con `GSAP ScrollTrigger` y el contenedor `<Canvas>` de `@react-three/fiber v9` + `@react-three/drei v10` aislado en cliente. | `T-F0-06` | `[DONE]` |
| **`T-F1-FE2-02`** | `FE-2` | 🟠 `P1` | `SPEC-03` | Construir la Hero Scene 3D de la Landing Page impulsada por `ScrollTrigger` a 60–120 FPS sin provocar re-renders en React. | `T-F1-FE2-01` | `[DONE]` |
| **`T-F1-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-02` | 🛡️ **`[MANUAL / IA MÍNIMA-NULA]`** Configurar credenciales `Ed25519` de la Test Wallet / Rafiki e implementar manualmente en `open-payments.service.ts` el descubrimiento con `UnauthenticatedClient` y la verificación de titularidad `Subject Grant` + verificación de hash `SHA-256`. | `T-F0-05` | `[READY_UNBLOCKED]` |
| **`T-F1-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-01`, `SPEC-02` | Desplegar el esquema normalizado Prisma 6 (`schema.prisma`) en PostgreSQL con la capa física de `prisma/sql/domain_checks.sql` (`CHECK`, índices parciales, triggers y vistas del modelo v2). La cuenta nace por registro local; no hay webhook de Clerk. | `T-F0-06` | `[READY_UNBLOCKED]` |
| **`T-F1-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-01` | Crear la suite de pruebas de contratos en `shared-schemas` para validar invariantes de presupuestos, plazos y esquemas de IA. | `T-F0-05` | `[DONE]` |

---

### Fase 2 — Marketplace de 6 Categorías (`SPEC-04`) y Negociación de Presupuesto (`SPEC-05`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F2-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-04` | Construir el catálogo de las 6 categorías oficiales del MVP (`Gigs` de freelancers + tablón de tareas abiertas publicadas por Buyers) con presupuesto tope inicial y plazo inicial de hasta 7 días. | `T-F1-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE1-02`** | `FE-1` | 🔴 `P0` | `SPEC-05` | Construir la Sala de Negociación entre Buyer y Freelancer: validación de propuesta `<= presupuesto inicial`, acuerdo para iniciar orden (Camino 1) y cierre de contacto por discrepancia manteniendo activa la publicación (Camino 2). | `T-F2-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE1-03`** | `FE-1` | 🟡 `P2` | `SPEC-04` | Inyectar la etiqueta W3C Web Monetization (`<link rel="monetization">`) en las páginas públicas de perfil de cada Freelancer verificado. | `T-F2-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE2-01`** | `FE-2` | 🟠 `P1` | `SPEC-04` | Diseñar las transiciones espaciales con `GSAP ScrollTrigger` para las tarjetas de las 6 categorías del Marketplace. | `T-F1-FE2-01` | `[READY_UNBLOCKED]` |
| **`T-F2-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-05` | Implementar el módulo de negociación en Backend: validación estricta `proposedBudget <= initialBudget`, transición atómica de Camino 1 (crea `TaskOrder` + `EscrowLedger`) y Camino 2 (`DISCREPANCY_CLOSED_PATH_2` manteniendo `OPEN_FOR_PROPOSALS`). | `T-F1-BE2-01` | `[DONE]` |
| **`T-F2-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-04` | Implementar el módulo de Marketplace (CRUD de `Gig` y `ClientTaskPublication`, paginación por las 6 categorías y semillas de datos). | `T-F1-BE2-01` | `[DONE]` |
| **`T-F2-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-05` | Implementar el clasificador automático de modalidad auditable (`IMAGE | TEXT` vs. no auditable en MVP) al crearse una `TaskOrder`. | `T-F1-AI1-01` | `[DONE]` |

---

### Fase 3 — Orquestación de Pago Único en Escrow (`96 % / 4 %` y Reembolsos `100 %`) (`SPEC-06`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F3-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-06` | 🛡️ **`[MANUAL / IA MÍNIMA-NULA]`** `escrow-payment.service.ts`: **(1)** Depósito 100 % en escrow; **(2)** Dos payouts: **96 %** Freelancer + **4 %** wallet dueño; **(3)** Reembolso **100 %** (7d sin extensión, rechazo/silencio extensión, fallo extensión, Admin→Buyer) — actividad muere; **(4)** Grants / rotate / revoke. | `T-F1-BE1-01` | `[READY_UNBLOCKED]` |
| **`T-F3-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-06` | Implementar el guardia de idempotencia financiera (`SHA256` en `OpenPaymentsTransaction`), bloqueo transaccional sobre `EscrowLedger` y el receptor de Webhooks de Rafiki. | `T-F1-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F3-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-06` | Construir el Checkout de Custodia en Escrow: resumen del depósito del 100 %, distribución futura (`96 % Freelancer / 4 % TaskStream`), redirección al consentimiento GNAP y activación del plazo inicial de 7 días (`ESCROW_LOCKED`). | `T-F2-FE1-02` | `[READY_UNBLOCKED]` |
| **`T-F3-FE2-01`** | `FE-2` | 🔴 `P0` | `SPEC-06` | Construir la **Escena 3D de Bóveda Escrow** en `@react-three/fiber v9` controlada por `GSAP ScrollTrigger` y eventos de estado de la orden. | `T-F1-FE2-02` | `[READY_UNBLOCKED]` |
| **`T-F3-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-06` | Automatizar las pruebas de invariantes matemáticas de pagos (`100 % = 96 % + 4 %` e idempotencia ante reintentos concurrentes). | `T-F0-05` | `[READY_UNBLOCKED]` |

---

### Fase 4 — Storage R2 Sin Límite, *Protected Preview* (`SPEC-07`) y Consejero IA para Imagen y Texto (`SPEC-08`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F4-AI1-01`** | `AI-1` | 🔴 `P0` | `SPEC-08` | Redactar y cerrar en `SPEC-08.md` el **contrato exacto de entrada (`AiAdvisorInputContractSchema`)** que recibe `AiAdvisorService` y el contrato de salida (`AiAdvisorReportSchema`), asegurando que **solo audite y asesore tareas de imagen y texto en el MVP**. | `T-F2-AI1-01` | `[READY_UNBLOCKED]` |
| **`T-F4-AI1-02`** | `AI-1` | 🔴 `P0` | `SPEC-08` | Implementar `advise()` en `packages/ai-advisor` para **imagen y texto**: validación determinista previa, encapsulamiento anti-*Prompt Injection* (`<untrusted_deliverable_artifact>`) y llamada estructurada (`generateObject`). La persistencia de `AiAdvisorReport` y `AiCriterionEvaluation` la hace `BE-2` por el puerto de `SPEC-08`. | `T-F4-AI1-01` | `[READY_UNBLOCKED]` |
| **`T-F4-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-07` | Implementar el módulo de almacenamiento en Cloudflare R2: Presigned URLs de subida directa a `/originals/{taskId}/{revision}/` sin límite de peso en el MVP y resguardo del archivo original hasta la ventana final. | `T-F1-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F4-BE2-02`** | `BE-2` | 🔴 `P0` | `SPEC-07` | Implementar el Worker de marcas de agua con `sharp` y `fluent-ffmpeg` para generar `/previews/{taskId}/{revision}/` en las 6 categorías. | `T-F4-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F4-FE2-01`** | `FE-2` | 🔴 `P0` | `SPEC-07` | Construir los 6 visores del módulo **Protected Preview** para el periodo de revisión de 32 horas (`IN_REVIEW`). | `T-F0-05` | `[READY_UNBLOCKED]` |
| **`T-F4-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-08` | Construir el Panel de Entrega del Freelancer y la vista de revisión del Buyer (mostrando el informe consultivo de IA cuando la tarea es de **imagen o texto**, y el visor protegido en todas las categorías). | `T-F3-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F4-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-07` | Implementar los Guards de autorización sobre entregables para que el archivo original solo se desbloquee tras la aceptación expresa o automática (al iniciar la ventana final de 30 minutos). | `T-F4-BE2-01` | `[READY_UNBLOCKED]` |

---

### Fase 5 — Relojes (`7d`, `24h`, `+7d`, `32h`, `30m`), Correcciones (`SPEC-09`), Disputas (`SPEC-10`), Validación E2E (`SPEC-11`) y Deploy (`SPEC-12`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F5-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-09` | Implementar los **5 Relojes Independientes en BullMQ**: **(1)** `INITIAL_DELIVERY_7D` (7 días iniciales); **(2)** `EXTENSION_RESPONSE_24H` (24 horas para responder a la solicitud única de extensión; sin respuesta -> reembolso automático del 100 %); **(3)** `EXTENDED_DELIVERY_UP_TO_7D` (hasta 7 días adicionales aprobados, máx. 14 días totales; si vence sin entrega -> reembolso automático del 100 %); **(4)** `DELIVERY_REVIEW_32H` (32 horas por entrega; sin respuesta -> aceptación automática y paso a ventana de 30m); **(5)** `FINAL_CLAIM_WINDOW_30M` (30 minutos finales; sin reclamación -> libera 96 % Freelancer / 4 % TaskStream). | `T-F3-BE1-01`, `T-F4-BE2-02` | `[READY_UNBLOCKED]` |
| **`T-F5-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-09` | Implementar las reglas de negocio de extensiones y correcciones: validación de **1 sola extensión por orden** (hasta +7 días), validación de **máximo 2 correcciones globales por orden** (sin reiniciarse con nuevas entregas ni extensión) y reinicio del reloj de 32 horas en cada re-entrega. | `T-F5-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F5-BE1-02`** | `BE-1` | 🔴 `P0` | `SPEC-10` | Implementar el módulo de Reclamaciones y Disputas Administrativas: **(1)** Suspensión inmediata del job `FINAL_CLAIM_WINDOW_30M` si se presenta una reclamación válida durante los 30 minutos; **(2)** Apertura de disputa al agotarse las 2 correcciones sin acuerdo; **(3)** Bloqueo de pagos/reembolsos automáticos mientras la disputa esté pendiente; **(4)** Resolución binaria con justificación obligatoria del Administrador (`100 % Buyer` o `96 % / 4 % Freelancer`). | `T-F5-BE1-01` | `[READY_UNBLOCKED]` |
| **`T-F5-BE2-02`** | `BE-2` | 🟡 `P2` | `SPEC-09`, `SPEC-10` | Implementar el servicio de notificaciones claras para Buyer y Freelancer (solicitud de extensión, vencimiento y reembolso por falta de respuesta en 24h o en extensión, aceptación automática tras 32h, apertura de disputa y resultado). | `T-F5-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F5-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-09` | Construir la UI de plazos, extensión única (hasta +7 días con cuenta regresiva de 24h para el Buyer), revisión de 32 horas, contador global de correcciones (`0/2`, `1/2`, `2/2`) y ventana final de reclamaciones de 30 minutos. | `T-F4-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F5-FE1-02`** | `FE-1` | 🟠 `P1` | `SPEC-10` | Construir la Consola de Arbitraje del Administrador: visualización de requisitos originales, entregas, solicitudes de corrección, mensajes, campo obligatorio de justificación basada en evidencias y botones de decisión binaria (**100 % al Buyer** o **96 % / 4 % al Freelancer**). | `T-F5-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F5-ALL-01`** | Todos | 🔴 `P0` | `SPEC-11` | Ejecutar la validación integral E2E del flujo completo sin mocks verificando todos los escenarios de contratación, escrow, entregas, revisiones, extensiones y disputas. | Todas las anteriores | `[WAITING_SYNC]` |
| **`T-F5-ALL-02`** | Todos | 🔴 `P0` | `SPEC-12` | Ejecutar el `Deploy` final del MVP/Demo a producción, configurar variables de entorno productivas y cerrar la auditoría en `AI_USAGE.md` y `promptsAI_USAGE.md`. | `T-F5-ALL-01` | `[WAITING_SYNC]` |

---

## 3. Reglas de Negocio y Decisiones Operativas Cerradas

| # | Regla / Decisión | Definición Vigente en el Proyecto |
| :---- | :---- | :---- |
| **1** | **Plazo Inicial y Extensión Solo al Vencer** | **7 días** iniciales. Extensión **única** de hasta **+7 días** **solo al vencer** (no antes). Sin pedir extensión al vencer → `AUTO_REFUNDED_INITIAL_EXPIRED`. Buyer tiene **24h**; rechazo, silencio o fallo de extensión → reembolso **100 %**. Todo reembolso **mata la actividad** y desliga al Freelancer. |
| **2** | **Revisión 32h y Máx. 2 Correcciones** | Cada entrega: **32h**. Máx. **2** correcciones globales. Tras la **2ª** re-entrega: Buyer **acepta** o **pide mediación** (Admin). Timeout 32h = aceptación automática → ventana **30m**. |
| **3** | **Ventana Final 30m** | Sin petición de disputa → **96 % Freelancer + 4 % wallet del dueño**. Con petición → `DISPUTED` (se cancela el job automático). |
| **4** | **Disputa Admin Binaria** | Fondos retenidos. Decisión justificada: **100 % Buyer** o **96 % / 4 % wallet dueño**. |
| **5** | **Gig Fijo vs Publicación + Arranque Mutuo** | Gig = precio **fijo no negociable**. Publicación = ofertas **`<=` tope**; Buyer elige una. Flujo escrow/relojes **solo tras aceptación mutua + fondeo**; cancelable antes de aceptar. |
| **6** | **Una Wallet Activa + Comisión a Wallet Dueño** | Una sola wallet verificada activa por usuario (reemplazo al cambiar). El **4 %** se transfiere a la wallet del dueño/plataforma. |
| **7** | **Alcance IA (`SPEC-08`)** | Solo imagen/texto en MVP vía `AiAdvisorInputContractSchema`. |
| **8** | **Redondeo Exacto (`96 % / 4 %`)** | `platformFeeUSDInCents = Math.floor((totalAmountUSDInCents * 4) / 100)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`, con `totalAmountUSDInCents` entero en `[100, 50_000_000]`. Aritmética entera idéntica en `money.ts` y en `chk_escrow_exact_96_4_split` (`total::bigint * 4 / 100`). |

---

## 4. Pendientes Urgentes, Decisiones Abiertas Críticas y Brechas de Seguridad Detectadas (Solo Planteamiento — Sin Implementar)

> **Nota de Gobernanza SDD:** Esta sección consolida los hallazgos de seguridad de grado fintech, casos límite de concurrencia y decisiones de negocio/producto que requieren definición o cierre técnico antes de pasar a la implementación de las Fases 2 a 5. Se registran exclusivamente como planteamiento arquitectónico sin alterar código de aplicación.

### 4.1. Brechas de Seguridad Fintech Detectadas en el Flujo

| ID Brecha | Severidad | Módulo / Spec Afectada | Descripción Técnica de la Vulnerabilidad / Brecha | Mitigación Planteada (Para Implementar en la Fase Correspondiente) |
| :---- | :---- | :---- | :---- | :---- |
| **`SEC-GAP-01`** | 🔴 Crítica | `SPEC-05` / `schema.prisma` (`task_orders`) | **Falta de índice único parcial sobre `publication_id` en `task_orders`:** Actualmente `proposalId` tiene `@unique`, pero `publicationId` solo posee `@@index([publicationId])`. Si por un fallo de bloqueo dos transacciones aceptaran dos propuestas distintas (`P1` y `P2`) de la misma publicación, la base de datos permitiría crear dos órdenes (`TaskOrder`) para una sola publicación. | Además del `SELECT ... FOR UPDATE` sobre `client_task_publications` definido en `SPEC-05`, añadir en migración SQL un índice único parcial: `CREATE UNIQUE INDEX uq_task_orders_publication_id ON task_orders (publication_id) WHERE publication_id IS NOT NULL;`. **✅ Resuelto en el modelo v2:** `task_orders` ya no tiene `publication_id`; la garantía se movió a la fuente con `negotiation_proposals_one_agreement_per_publication` (único parcial `WHERE status = 'AGREED_PATH_1'`) más `proposal_id @unique` en la orden. |
| **`SEC-GAP-02`** | 🔴 Crítica | `SPEC-04`, `SPEC-05`, `SPEC-06` / `domain_checks.sql` | **Riesgo de *Fee Truncation* (`platformFee = 0`) e *Integer Overflow* (`INT4`) en PostgreSQL:** Con `Math.floor(total * 0.04)`, cualquier orden con `totalAmountUSDInCents < 25` centavos genera `platformFeeUSDInCents = 0`, provocando el rechazo del Outgoing Payment del `4 %` en Rafiki. En el extremo opuesto, el `CHECK` SQL `("total_amount_usd_in_cents" * 4) / 100` multiplica en `INT4` (`máx. 2,147,483,647`), desbordando si `total > 536,870,911` centavos. | Imponer el rango `[100 .. 50_000_000]` centavos (`$1.00 USD` a `$500,000.00 USD`) en Zod y SQL, y actualizar `chk_task_order_exact_96_4_split` para operar con casteo explícito a `BIGINT` (`("total_amount_usd_in_cents"::bigint * 4) / 100`). **✅ Resuelto en el modelo v2:** rango en `money.ts`, Zod y `CHECK` (`chk_escrow_amount_range`, gigs, publicaciones, propuestas y mensajes); `chk_escrow_exact_96_4_split` vive ahora en `escrow_ledgers` con `::bigint`. |
| **`SEC-GAP-03`** | 🔴 Crítica | `SPEC-05` / `domain_checks.sql` | **Ausencia de `CHECK` SQL Anti-*Self-Dealing* en `task_orders` y `negotiation_proposals`:** Dado que una misma cuenta alterna entre `Buyer Mode` y `Seller Mode`, si solo se valida en capa de aplicación podría colarse una auto-contratación (*wash trading* o desvío de fondos) ante un error de guardas. | Añadir restricciones SQL `chk_proposal_no_self_dealing` (`buyer_id <> freelancer_id`) en `negotiation_proposals` y `chk_task_order_no_self_dealing` (`buyer_id <> seller_id AND buyer_wallet_id <> seller_wallet_id`) en `task_orders`. **✅ Resuelto en el modelo v2:** `chk_proposal_no_self_dealing`, `chk_task_order_no_self_dealing` (`buyer_id <> seller_id`) y, como las wallets pasaron al ledger, `chk_escrow_distinct_party_wallets`. |
| **`SEC-GAP-04`** | 🟠 Alta | `SPEC-02`, `SPEC-05`, `SPEC-06` | **Mutación o desactivación de `UserWallet` durante una orden con fondos en custodia:** La Regla 6 establece una única wallet activa por usuario (reemplazando la anterior al cambiar). Si el Buyer o el Freelancer reemplaza su wallet mientras tiene una `TaskOrder` en `ESCROW_LOCKED`, `IN_REVIEW` o `DISPUTED`, la referencia `buyerWalletId`/`sellerWalletId` apuntaría a una wallet con `isActive = false`. | Definir e implementar dos defensas complementarias: **(1)** Prohibir desvincular/reemplazar la `UserWallet` activa si existen órdenes no terminales o, en su defecto, **(2)** garantizar que los reembolsos (`100 %`) y liberaciones (`96 %`) utilicen la `walletAddressUrl` inmutable congelada en el contrato de la orden. **✅ Defensa (2) resuelta en el modelo v2:** `EscrowLedger` referencia las filas de `UserWallet` (cuya `walletAddressUrl` es inmutable) vigentes al contratar; `trg_escrow_ledger_wallets_match` exige que pertenezcan a las partes y estén verificadas y activas al crear el ledger. Desactivar la wallet después no altera el destino del pago. |
| **`SEC-GAP-05`** | 🟠 Alta | `SPEC-04`, `SPEC-05` | **Ataque *Time-of-Check to Time-of-Use (TOCTOU)* / *Bait-and-Switch* en negociación:** Un Freelancer malicioso podría enviar un mensaje subiendo su oferta (dentro del tope) un milisegundo antes de que el Buyer pulse *"Aceptar oferta"*, induciendo al Buyer a aceptar un monto mayor al que vio en pantalla. | Cerrado a nivel de diseño en `SPEC-05` exigiendo `expectedAmountUSDInCents` y `expectedDeliveryDays` firmados en el payload de `POST /proposals/:id/accept` y validados bajo `SELECT ... FOR UPDATE`. Pendiente de implementar en `BE-1` y `FE-1`. |
| **`SEC-GAP-06`** | 🔴 Crítica | `SPEC-06`, `SPEC-10` | **Riesgo de liquidación parcial (*Split Settlement Failure*) entre el pago del `96 %` y el pago del `4 %` en Rafiki:** En la liberación final se ejecutan 2 transferencias Open Payments independientes desde `escrowWalletAddress` (`96 %` al Seller y `4 %` al Owner). Si la primera tiene éxito y la segunda falla por red, un reintento sin estado por pierna duplicaría el pago del `96 %`. | Diseñar en `SPEC-06` persistencia de estado e `idempotencyKey` independiente por cada pierna de liquidación (`LEG_FREELANCER_96` y `LEG_PLATFORM_04`), reintentando únicamente la pierna pendiente en BullMQ. **🟡 Soporte de datos listo en el modelo v2:** `(escrow_ledger_id, operation_type, attempt_number)` único e índices parciales de un intento `COMPLETED` y uno en curso por pierna; el estado de cada pierna se lee de `v_escrow_ledger_settlement`. Falta la lógica de reintento en `SPEC-06`. |
| **`SEC-GAP-07`** | 🟠 Alta | `SPEC-07`, `SPEC-08` | **Agotamiento de recursos (*DoS / Zip Bomb / Pixel Flood*) por la regla de subida sin límite de peso:** Aunque por regla de negocio `maxFileSizeBytes = null` en el MVP, procesar archivos ilimitados en memoria dentro de los workers de `sharp`, `fluent-ffmpeg` o extracción de texto puede derribar el backend por `Out-Of-Memory (OOM)`. | Aislar el worker de marcas de agua y pre-check en procesos con límites estrictos de píxeles (`limitInputPixels` en `sharp`), streaming desde R2 sin cargar el archivo completo en RAM y tiempo máximo de ejecución por job (`timeout` en BullMQ). |

---

### 4.2. Decisiones Abiertas Muy Necesarias (Producto y Operaciones Financieras)

| ID Decisión | Prioridad | Specs Implicadas | Planteamiento del Problema / Ambigüedad Operativa | Opciones Propuestas para Decisión del Equipo |
| :---- | :---- | :---- | :---- | :---- |
| **`DEC-OPEN-01`** | 🔴 Urgente | `SPEC-05`, `SPEC-06` | **Mecánica exacta de la "aceptación mutua" en Gigs a precio fijo:** En publicaciones con ofertas, el Freelancer postula y el Buyer acepta. En un Gig fijo, ¿la publicación activa del Gig (`isActive = true`) ya cuenta como aceptación previa del Freelancer, o se requiere un paso explícito de confirmación del Freelancer antes de que el Buyer fondee el escrow? | **Opción A (Recomendada para agilidad con protección):** El Freelancer confirma el encargo antes de activar el fondeo (o tras el fondeo antes de arrancar el reloj de 7d) para evitar que un Freelancer inactivo sufra un vencimiento automático sin haberse enterado.<br>**Opción B:** Contratación directa inmediata si el Gig está `isActive = true`. |
| **`DEC-OPEN-02`** | 🔴 Urgente | `SPEC-05`, `SPEC-06`, `SPEC-09` | **Tiempo máximo de vida (TTL) de una orden en `PENDING_ESCROW_FUNDING`:** Cuando el Buyer acepta una oferta en Camino 1, la publicación se bloquea (`AGREED_AND_LOCKED`) y las demás ofertas se cierran, pero los relojes no arrancan hasta que el Buyer fondee el escrow. Si el Buyer nunca completa el pago en Rafiki, el Freelancer queda bloqueado indefinidamente. | Definir un job de limpieza (`ESCROW_FUNDING_TIMEOUT_24H`) que, si el Buyer no fondea en **24 horas**, cancele la `TaskOrder` no fondeada y desvincule al Freelancer sin impacto financiero (dado que aún no hubo depósito). |
| **`DEC-OPEN-03`** | 🔴 Urgente | `SPEC-09` | **Coordinación milimétrica entre *"la extensión solo se pide al vencer el plazo inicial"* y *"si vence sin pedir extensión se reembolsa el 100 % automáticamente"*:** Ambas reglas tienen como disparador el vencimiento del día 7 (`INITIAL_DELIVERY_7D`). Si el job reembolsa en el segundo exacto en que vence el día 7, el Freelancer tendría `0 ms` para pulsar el botón de extensión "al vencer". | **Opción A (Pre-solicitud diferida):** Permitir al Freelancer dejar marcada la solicitud de extensión durante las últimas horas del plazo inicial para que se active en el instante del vencimiento.<br>**Opción B (Ventana de transición al vencer):** Al cumplirse el día 7 sin entrega, otorgar una ventana corta de activación en el corte antes de disparar `AUTO_REFUNDED_INITIAL_EXPIRED`. |
| **`DEC-OPEN-04`** | 🟠 Alta | `SPEC-06`, `SPEC-09`, `SPEC-10` | **Flujo de Grants GNAP para desembolsos diferidos desde la cuenta Escrow (`escrowWalletAddress`):** El depósito entra en el Día 0, pero el desembolso (`96 % / 4 %` o `100 %` reembolso) ocurre hasta ~19 días después. Los tokens de acceso de Buyer expiran mucho antes. | Confirmar en `SPEC-06` el modelo de **Custodia en Dos Etapas**: (1) En `ESCROW_LOCKED`, el Buyer ejecuta un `OutgoingPayment` inmediato hacia `escrowWalletAddress`; (2) Al liberar o reembolsar días después, el backend de TaskStream autentica con su propia clave privada `Ed25519` sobre `escrowWalletAddress` para emitir los `OutgoingPayment` de salida sin requerir interacción del Buyer. |
| **`DEC-OPEN-05`** | 🟠 Alta | `SPEC-06`, `SPEC-10` | **Tratamiento del *Slippage* cambiario (FX) en reembolsos del `100 %` semanas después del depósito:** La regla establece que el Buyer asume la doble conversión FX (`Divisa Buyer -> USD Escrow -> Divisa Destino`) y que en reembolso recibe el `100 %` del monto en custodia. | Aclarar en `SPEC-06` y en la UI que el reembolso del `100 %` envía exactamente el **`100 %` de los centavos de USD custodiados en el escrow (`totalAmountUSDInCents`)** sin comisión de plataforma (`0 %`), pudiendo variar el monto final acreditado en la divisa local del Buyer (`MXN`, `EUR`, etc.) según el tipo de cambio vigente de Rafiki al momento de la devolución. |

---

### 4.3. Pendientes Técnicos Urgentes de Sincronización del Repositorio

1. **`URG-SYNC-01` — Extensión de `packages/shared-schemas` para Fase 2:** Antes de iniciar la codificación de `T-F2-FE1-01`, `T-F2-FE1-02`, `T-F2-BE1-01` y `T-F2-BE2-01`, exportar en `packages/shared-schemas` los esquemas de entrada/salida y constantes especificados en `SPEC-04` §4.1 y `SPEC-05` §4.1 (`CATEGORY_MEDIA_CONSTRAINTS_MAP`, `CreateGigInputSchema`, `CreatePublicationInputSchema`, `AcceptProposalPath1InputSchema`, `HireFixedGigInputSchema`).
2. **`URG-SYNC-02` — Rate Limiting transaccional por usuario e IP (`@nestjs/throttler`):** Definir umbrales estrictos en endpoints de creación de publicaciones, envío de propuestas/mensajes y disparo de auditorías del Consejero de IA para mitigar *spam*, enumeración de recursos y consumo abusivo de cuota de inferencia multimodal.
3. **`URG-SYNC-03` — Redacción de `SPEC-06` (Motor de Pagos Open Payments / Rafiki) y `SPEC-09` (5 Relojes BullMQ):** Son las siguientes especificaciones críticas en la ruta del proyecto y deben incorporar desde su borrador inicial las mitigaciones `SEC-GAP-02`, `SEC-GAP-04`, `SEC-GAP-06` y las decisiones `DEC-OPEN-02`, `DEC-OPEN-03`, `DEC-OPEN-04` y `DEC-OPEN-05`.


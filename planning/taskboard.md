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
| **`T-F0-04`** | `AI-1` | 🔴 `P0` | `SPEC-00` | Ejecutar `SPEC-00.md`: crear la carpeta `specs` y su `README.md` con el índice maestro desde `SPEC-00` hasta `SPEC-12` (`Deploy`). | `T-F0-03` | `[READY_UNBLOCKED]` |
| **`T-F0-05`** | `AI-1` | 🔴 `P0` | `SPEC-01` | Inicializar `shared-schemas` con los esquemas Zod globales (`TaskOrderCardSchema`, `DeadlineExtensionRequestSchema`, `AiAdvisorInputContractSchema`, `AiAdvisorReportSchema`) y generadores de *mocks* para desbloquear a los 5 desarrolladores. | `T-F0-04` | `[READY_UNBLOCKED]` |
| **`T-F0-06`** | `FE-1` + `BE-2` | 🔴 `P0` | `SPEC-01` | Configurar la raíz del monorepo (`pnpm-workspace.yaml`, `turbo.json`), aplicación Frontend (Next.js 15.5 + React 19) y aplicación Backend (NestJS 10.4 + Prisma 6). | `T-F0-03` | `[READY_UNBLOCKED]` |

---

### Fase 1 — Identidad Multimoneda en América (`SPEC-02`) y Motor 3D Base (`SPEC-03`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F1-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-02` | Implementar autenticación con Clerk v6, selector `Buyer Mode / Seller Mode` y formulario de vinculación de `walletAddress` americana (usando adaptador Mock mientras `BE-1` finaliza el endpoint). | `T-F0-05` | `[READY_UNBLOCKED]` |
| **`T-F1-FE2-01`** | `FE-2` | 🔴 `P0` | `SPEC-03` | Configurar el proveedor global de Smooth Scroll (`Lenis`) sincronizado con `GSAP ScrollTrigger` y el contenedor `<Canvas>` de `@react-three/fiber v9` + `@react-three/drei v10` aislado en cliente. | `T-F0-06` | `[READY_UNBLOCKED]` |
| **`T-F1-FE2-02`** | `FE-2` | 🟠 `P1` | `SPEC-03` | Construir la Hero Scene 3D de la Landing Page impulsada por `ScrollTrigger` a 60–120 FPS sin provocar re-renders en React. | `T-F1-FE2-01` | `[READY_UNBLOCKED]` |
| **`T-F1-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-02` | 🛡️ **`[MANUAL / IA MÍNIMA-NULA]`** Configurar credenciales `Ed25519` de la Test Wallet / Rafiki e implementar manualmente en `open-payments.service.ts` el descubrimiento con `UnauthenticatedClient` y la verificación de titularidad `Subject Grant` + verificación de hash `SHA-256`. | `T-F0-05` | `[READY_UNBLOCKED]` |
| **`T-F1-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-01`, `SPEC-02` | Desplegar el esquema normalizado Prisma 6 (`schema.prisma`) en PostgreSQL con las restricciones `CHECK` SQL y el webhook de sincronización de usuarios de Clerk. | `T-F0-06` | `[READY_UNBLOCKED]` |
| **`T-F1-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-01` | Crear la suite de pruebas de contratos en `shared-schemas` para validar invariantes de presupuestos, plazos y esquemas de IA. | `T-F0-05` | `[READY_UNBLOCKED]` |

---

### Fase 2 — Marketplace de 6 Categorías (`SPEC-04`) y Negociación de Presupuesto (`SPEC-05`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F2-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-04` | Construir el catálogo de las 6 categorías oficiales del MVP (`Gigs` de freelancers + tablón de tareas abiertas publicadas por Buyers) con presupuesto tope inicial y plazo inicial de hasta 7 días. | `T-F1-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE1-02`** | `FE-1` | 🔴 `P0` | `SPEC-05` | Construir la Sala de Negociación entre Buyer y Freelancer: validación de propuesta `<= presupuesto inicial`, acuerdo para iniciar orden (Camino 1) y cierre de contacto por discrepancia manteniendo activa la publicación (Camino 2). | `T-F2-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE1-03`** | `FE-1` | 🟡 `P2` | `SPEC-04` | Inyectar la etiqueta W3C Web Monetization (`<link rel="monetization">`) en las páginas públicas de perfil de cada Freelancer verificado. | `T-F2-FE1-01` | `[READY_UNBLOCKED]` |
| **`T-F2-FE2-01`** | `FE-2` | 🟠 `P1` | `SPEC-04` | Diseñar las transiciones espaciales con `GSAP ScrollTrigger` para las tarjetas de las 6 categorías del Marketplace. | `T-F1-FE2-01` | `[READY_UNBLOCKED]` |
| **`T-F2-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-05` | Implementar el módulo de negociación en Backend: validación estricta `proposedBudget <= initialBudget`, transición atómica de Camino 1 (crea `TaskOrder` + `EscrowLedger`) y Camino 2 (`DISCREPANCY_CLOSED_PATH_2` manteniendo `OPEN_FOR_PROPOSALS`). | `T-F1-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F2-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-04` | Implementar el módulo de Marketplace (CRUD de `Gig` y `ClientTaskPublication`, paginación por las 6 categorías y semillas de datos). | `T-F1-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F2-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-05` | Implementar el clasificador automático de modalidad auditable (`IMAGE | TEXT` vs. no auditable en MVP) al crearse una `TaskOrder`. | `T-F1-AI1-01` | `[READY_UNBLOCKED]` |

---

### Fase 3 — Orquestación de Pago Único en Escrow (`96 % / 4 %` y Reembolsos `100 %`) (`SPEC-06`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F3-BE1-01`** | `BE-1` | 🔴 `P0` | `SPEC-06` | 🛡️ **`[MANUAL / IA MÍNIMA-NULA]`** Implementar manualmente `escrow-payment.service.ts` usando `@interledger/open-payments`: **(1)** Depósito del 100 % en `taskstream-escrow` al iniciar la orden (`receiveAmount = 100% USD`); **(2)** Liberación final del **96 % para el Freelancer y 4 % para TaskStream** (`debitAmount = 96% USD`); **(3)** Reembolso del **100 %** al Buyer (`debitAmount = 100% USD`) por vencimiento, falta de respuesta a extensión o disputa ganada por el Buyer; **(4)** Verificación de `GET /outgoing-payment-grant` y rotación/revocación de tokens. | `T-F1-BE1-01` | `[READY_UNBLOCKED]` |
| **`T-F3-BE2-01`** | `BE-2` | 🔴 `P0` | `SPEC-06` | Implementar el guardia de idempotencia financiera (`SHA256` en `OpenPaymentsTransaction`), bloqueo transaccional sobre `EscrowLedger` y el receptor de Webhooks de Rafiki. | `T-F1-BE2-01` | `[READY_UNBLOCKED]` |
| **`T-F3-FE1-01`** | `FE-1` | 🔴 `P0` | `SPEC-06` | Construir el Checkout de Custodia en Escrow: resumen del depósito del 100 %, distribución futura (`96 % Freelancer / 4 % TaskStream`), redirección al consentimiento GNAP y activación del plazo inicial de 7 días (`ESCROW_LOCKED`). | `T-F2-FE1-02` | `[READY_UNBLOCKED]` |
| **`T-F3-FE2-01`** | `FE-2` | 🔴 `P0` | `SPEC-06` | Construir la **Escena 3D de Bóveda Escrow** en `@react-three/fiber v9` controlada por `GSAP ScrollTrigger` y eventos de estado de la orden. | `T-F1-FE2-02` | `[READY_UNBLOCKED]` |
| **`T-F3-AI1-01`** | `AI-1` | 🟠 `P1` | `SPEC-06` | Automatizar las pruebas de invariantes matemáticas de pagos (`100 % = 96 % + 4 %` e idempotencia ante reintentos concurrentes). | `T-F0-05` | `[READY_UNBLOCKED]` |

---

### Fase 4 — Storage R2 Sin Límite, *Protected Preview* (`SPEC-07`) y Consejero IA para Imagen y Texto (`SPEC-08`)

| ID Tarea | Rol | Prioridad | Spec Asociada | Descripción de la Tarea | Dependencias | Estado |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **`T-F4-AI1-01`** | `AI-1` | 🔴 `P0` | `SPEC-08` | Redactar y cerrar en `SPEC-08.md` el **contrato exacto de entrada (`AiAdvisorInputContractSchema`)** que recibe `AiAdvisorService` y el contrato de salida (`AiAdvisorReportSchema`), asegurando que **solo audite y asesore tareas de imagen y texto en el MVP**. | `T-F2-AI1-01` | `[READY_UNBLOCKED]` |
| **`T-F4-AI1-02`** | `AI-1` | 🔴 `P0` | `SPEC-08` | Implementar `AiAdvisorService` para **imagen y texto**: validación determinista previa, encapsulamiento anti-*Prompt Injection* (`<untrusted_deliverable_artifact>`), llamada estructurada (`generateObject`) y persistencia en `AiAdvisorReport` + `AiCriterionEvaluation`. | `T-F4-AI1-01` | `[READY_UNBLOCKED]` |
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
| **1** | **Plazo de Entrega Inicial y Extensión Única** | El Freelancer tiene **7 días** iniciales para entregar. Si vence sin entrega, puede solicitar **una única extensión de hasta 7 días adicionales** (hasta **14 días** totales desde el inicio). El Buyer tiene **24 horas** para aprobar o rechazar; si no responde en 24h o si el Freelancer tampoco entrega en la extensión aprobada, se reembolsa automáticamente el **100 %** al Buyer. |
| **2** | **Revisión de 32 Horas y Máximo 2 Correcciones Globales** | Cada entrega abre un plazo de **32 horas** para el Buyer. El Buyer puede pedir máximo **2 correcciones globales por orden** (no se reinicia con nuevas entregas ni con una extensión). Si el Buyer acepta o no responde en 32 horas (aceptación automática), comienza la ventana final de **30 minutos**. |
| **3** | **Ventana Final de 30 Minutos y Suspensión por Reclamación** | La aceptación expresa o automática inicia una ventana de **30 minutos**. Si transcurre sin reclamación, se libera el **96 % al Freelancer y 4 % a TaskStream**. Si alguien presenta una reclamación válida durante los 30 minutos (o si se agotan las 2 correcciones sin acuerdo), **se suspende inmediatamente la liberación automática de fondos** y pasa a disputa administrativa. |
| **4** | **Disputa Administrativa Justificada y Binaria** | Mientras una disputa esté abierta, el dinero permanece retenido en el escrow sin automatismos. El Administrador evalúa todas las evidencias y emite una decisión acompañada de justificación: **100 % de reembolso al Buyer** o **96 % Freelancer / 4 % TaskStream**. |
| **5** | **Alcance del Consejero de IA (`SPEC-08`)** | En el MVP, `AiAdvisorService` **solo audita y asesora tareas de imagen y texto** a partir del contrato exacto `AiAdvisorInputContractSchema`. El resto de tipos de tareas y la suscripción se dejan planteados pero fuera del MVP. |
| **6** | **Redondeo Exacto en Centavos (`96 % / 4 %`)** | `platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`, asegurando suma exacta al 100 %. |

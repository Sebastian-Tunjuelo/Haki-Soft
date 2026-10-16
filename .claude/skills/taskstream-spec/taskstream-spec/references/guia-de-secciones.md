# Guía de Secciones y Plantilla Oficial de Especificaciones — TaskStream AI (`guia-de-secciones.md`)

Esta guía define la estructura obligatoria de **cabecera + 12 secciones** para cualquier especificación `specs/SPEC-00.md` a `specs/SPEC-12.md` de **TaskStream AI**, garantizando coherencia total con `.agents/CONTEXT.md`, `planning/architecture-overview.md`, `planning/sdd-process.md`, `planning/pbp-development.md` y `planning/taskboard.md`.

---

## 1. Plantilla Canónica (`specs/_template.md`)

Al ejecutar el **Modo 1 — Arranque (`SPEC-00`)**, `specs/_template.md` debe crearse con el siguiente bloque exacto (y toda nueva spec `SPEC-NN.md` debe partir de él manteniendo los 12 encabezados `## N.` sin alterar su numeración ni su título):

```markdown
# SPEC-NN: <Título Descriptivo de la Especificación>

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-NN` |
| **Archivo** | `specs/SPEC-NN.md` |
| **Fase de Desarrollo** | `Fase X — <Nombre de la Fase según pbp-development.md>` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `<FE-1, FE-2, BE-1, BE-2, AI-1>` |
| **Tareas Asociadas (`taskboard.md`)** | `<T-FX-XX, ...>` |
| **Intervención Manual / IA Mínima-Nula** | `<Sí (🛡️ BE-1 en Open Payments) / No aplica>` |
| **Dependencias SDD** | `<SPEC-XX / Ninguna>` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)
<Describe en 1-2 párrafos qué problema resuelve esta especificación en el aplicativo final y cómo impacta la experiencia de Buyer, Freelancer o Administrador.>

### 1.2. En Alcance del MVP
- <Elemento concreto 1>
- <Elemento concreto 2>

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)
- <Explicitar qué NO se construye aquí (ej. sin pagos fraccionados por hitos, sin auditoría de IA para video/audio/código en el MVP, sin suscripción Buyer AI Pro Subscription en el MVP).>

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§<secciones>), `planning/architecture-overview.md` (§<secciones>) y `planning/taskboard.md` (§3).
- **Invariantes del Módulo:**
  1. <Invariante 1 con valores exactos: ej. 96% Freelancer / 4% TaskStream, o plazos 7d / 24h / +7d / 32h / 30m, o máximo 2 correcciones globales.>

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | <Alcance Core UI / Negociación / Plazos / Disputas> | <MSW + `packages/shared-schemas`> | No |
| **`FE-2`** | <Alcance 3D `GSAP ScrollTrigger` + `Lenis` / Visores `Protected Preview`> | <Eventos simulados / Blobs locales> | No |
| **`BE-1`** | <Alcance Pagos Open Payments / Negociación / Arbitraje / Guards> | <Sandbox Test Wallet / Interfaces> | <`🛡️ Sí` si toca Open Payments o claves `Ed25519`, o `No`> |
| **`BE-2`** | <Alcance Prisma 3NF / Storage R2 / Marcas de agua / Relojes BullMQ> | <`IEscrowPaymentGateway` / Relojes simulados> | No |
| **`AI-1`** | <Alcance `shared-schemas` / `AiAdvisorService` Imagen y Texto / Tests> | <Fixtures deterministas locales> | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)
<Definición de los esquemas Zod de entrada/salida que desbloquean a los equipos y sus invariantes `.refine(...)`.>

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL
<Tablas de `architecture-overview.md` §5 involucradas, claves foráneas, índices y restricciones `CHECK` SQL aplicables.>

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)
<Tabla o detalle de rutas `/api/v1/...`, método HTTP, rol requerido, schema de request/response y códigos de error en inglés (`UPPER_SNAKE_CASE`).>

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`
<Detalle de colas/relojes (`INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`), prefijos R2 (`/originals`, `/previews`), operaciones `@interledger/open-payments` o llamadas a `AiAdvisorService`.>

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)
<Páginas de Next.js 15.5 App Router, estados de carga/error/vacío y acciones disponibles para Buyer, Seller o Admin.>

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)
<Reglas de aislamiento `"use client"` + `next/dynamic(..., { ssr: false })`, sincronización `Lenis` + `GSAP ScrollTrigger` vía `useGSAP()` mutando `useRef` a 60–120 FPS con cero `useState` durante el scroll, o comportamiento de los visores protegidos.>

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** <Validación Clerk v6, `UserWallet.isVerified === true`, `PlatformRole.ADMIN` o bloqueo de `/originals` durante las 32h de `IN_REVIEW`.>
- **Idempotencia e Integridad Criptográfica:** <Claves `SHA-256` en `OpenPaymentsTransaction`, verificación de hash GNAP o encapsulamiento `<untrusted_deliverable_artifact>` y pre-check determinista.>

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — <Título conciso del requisito>
- **Origen:** `<Tarea T-FX-XX / CONTEXT.md §X / architecture-overview.md §Y>`
- **Rol(es):** `<FE-1 / FE-2 / BE-1 / BE-2 / AI-1>`
- **Criterios de Aceptación (BDD):**
  - **Dado** <precondición verificable del sistema o estado de la orden>
  - **Cuando** <acción ejecutada por el usuario, worker BullMQ o servicio externo>
  - **Entonces** <resultado observable, transición de estado, persistencia o código de error>

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01` | <Nivel> | <Qué comprueba exactamente la prueba> | <Rol> |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| <Caso límite 1> | `<ERROR_CODE_EN_INGLES>` | <Comportamiento exacto: rollback transaccional, suspensión de job BullMQ, etc.> |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

<Si no existen preguntas abiertas bloqueantes, escribir explícitamente: "Sin preguntas abiertas bloqueantes." Si existen decisiones técnicas operativas concretadas en esta spec, listarlas aquí para revisión del líder.>

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `YYYY-MM-DD` | `Redactada (DRAFTED)` | `Antigravity` + Equipo | Redacción inicial de `SPEC-NN` alineada con `CONTEXT.md`, `architecture-overview.md` y `taskboard.md`. |
```

---

## 2. Reglas de Calidad Sección por Sección

### Cabecera de Metadatos
- **Estado del Ciclo SDD:** Debe ser exactamente uno de los 4 valores oficiales:
  - `Redactada (DRAFTED)`
  - `Implementada (IMPLEMENTED)`
  - `Testeada (TESTED)`
  - `Aprobada (APPROVED)`
- **Tareas Asociadas (`taskboard.md`):** Debe listar **todos** los IDs `T-F*` cuya columna `Spec Asociada` en `planning/taskboard.md` §2 incluya esta spec.
- **Intervención Manual / IA Mínima-Nula:** En `SPEC-02`, `SPEC-06`, `SPEC-09` y `SPEC-10` (donde participa `open-payments.service.ts` o `escrow-payment.service.ts`), debe indicar explícitamente el símbolo `🛡️` y la autoría manual de `BE-1`.

### Sección 1 — Propósito y Alcance del Módulo
- Debe explicar cómo esta spec contribuye a las 5 garantías del aplicativo final descritas en `planning/sdd-process.md` §1 (exactitud financiera 96%/4% y 100%, sincronización de relojes `7d`/`24h`/`+7d`/`32h`/`30m`, coherencia visual 3D + visor protegido + dinero, auditoría consultiva de IA en imagen y texto, o estabilidad E2E).
- En **1.3 (Fuera de Alcance)** recuerda blindar la spec contra desvíos frecuentes:
  - Prohibido fraccionar pagos en hitos parciales (siempre es **Single-Block Escrow del 100 %**).
  - En el MVP, `AiAdvisorService` **solo audita imagen y texto** (`IMAGE` y `TEXT`); video, audio, archivos de código y datasets tabulares, así como la suscripción `Buyer AI Pro Subscription`, están fuera del MVP.
  - En el MVP **no hay límite de tamaño de subida** hacia Cloudflare R2 (`maxFileSizeBytes = null`).

### Sección 2 — Reglas de Dominio e Invariantes Vigentes
- Enlaza a las secciones específicas de `.agents/CONTEXT.md` y `planning/architecture-overview.md` sin copiar páginas enteras.
- Si la spec toca cálculos monetarios, incluye siempre la regla exacta de redondeo en centavos (`taskboard.md` §3 Regla 6):
  - `platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04)`
  - `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`
  - Garantizando `freelancerPayoutUSDInCents + platformFeeUSDInCents === totalAmountUSDInCents`.

### Sección 3 — Protocolo de Trabajo Paralelo por Rol (`2 FE / 2 BE / 1 IA`)
- Toda spec debe explicar cómo pueden avanzar en paralelo los 5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`) sin bloquearse mutuamente (`planning/pbp-development.md` §1.2).
- Si un rol no tiene tareas directas en `taskboard.md` para esa spec, indícalo en su fila (`"Sin entregable directo en esta spec; consume contratos de shared-schemas"`), pero mantén las 5 filas de la tabla.

### Sección 4 — Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)
- Los nombres de los esquemas Zod y los modelos Prisma deben coincidir **exactamente** con `.agents/CONTEXT.md` §8.2 y `planning/architecture-overview.md` §5.3 (`User`, `SellerProfile`, `UserWallet`, `WalletVerificationChallenge`, `Gig`, `ClientTaskPublication`, `NegotiationProposal`, `NegotiationMessage`, `TaskOrder`, `TaskAcceptanceCriterion`, `TaskTechnicalConstraint`, `DeadlineExtensionRequest`, `EscrowLedger`, `OpenPaymentsTransaction`, `RafikiWebhookEvent`, `TaskDeliverable`, `AiAdvisorReport`, `AiCriterionEvaluation`, `DisputeCase`, `ScheduledTimerJob`).
- En **`SPEC-08.md`**, es obligatorio detallar campo por campo el contrato exacto de entrada **`AiAdvisorInputContractSchema`** que recibe `AiAdvisorService` y el contrato de salida **`AiAdvisorReportSchema`**.

### Sección 5 — Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas
- Especifica rutas bajo el prefijo `/api/v1/...`, métodos HTTP, códigos de respuesta y catálogo de códigos de error en inglés (`UPPER_SNAKE_CASE`, ej. `PROPOSED_BUDGET_EXCEEDS_INITIAL`, `WALLET_NOT_VERIFIED`, `EXTENSION_ALREADY_USED`, `MAX_REVISIONS_EXHAUSTED`, `ORIGINAL_FILE_LOCKED_DURING_REVIEW`, `INVALID_CLAIM_OUTSIDE_30M_WINDOW`).
- Cuando intervengan temporizadores de BullMQ, usa siempre los 5 identificadores canónicos de `TimerJobType` (`architecture-overview.md` §5.3):
  1. `INITIAL_DELIVERY_7D` (7 días iniciales)
  2. `EXTENSION_RESPONSE_24H` (24 horas para respuesta del Buyer; silencio -> auto-reembolso 100 %)
  3. `EXTENDED_DELIVERY_UP_TO_7D` (hasta 7 días adicionales aprobados, máx. 14d totales; vencimiento -> auto-reembolso 100 %)
  4. `DELIVERY_REVIEW_32H` (32 horas por entrega; silencio -> aceptación automática y paso a ventana de 30m)
  5. `FINAL_CLAIM_WINDOW_30M` (30 minutos finales tras aceptación expresa o automática; sin reclamación -> libera 96 % / 4 %)

### Sección 6 — Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido
- Para componentes 3D (`FE-2`), exige siempre las 3 reglas de arquitectura de `.agents/CONTEXT.md` §3.2:
  1. `"use client"` + importación dinámica con `next/dynamic(..., { ssr: false })`.
  2. Sincronización de `Lenis` con `GSAP ScrollTrigger` (`lenis.on('scroll', ScrollTrigger.update)` y `gsap.ticker`).
  3. Prohibición absoluta de guardar la posición de scroll en `useState`: mutación directa de `useRef<THREE.Group | THREE.Mesh>()` dentro de `useGSAP()`.

### Sección 7 — Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection
- En specs financieras (`SPEC-06`, `SPEC-09`, `SPEC-10`), especifica las fórmulas deterministas de `idempotencyKey` (`CONTEXT.md` §5.4):
  - `SHA256(taskId + ":" + attemptNumber + ":ESCROW_LOCK")`
  - `SHA256(taskId + ":FREELANCER_PAYOUT_96_4")`
  - `SHA256(taskId + ":" + attemptNumber + ":BUYER_REFUND_100")`
- En `SPEC-08`, exige el encapsulamiento `<untrusted_deliverable_artifact>...</untrusted_deliverable_artifact>`, el pre-check determinista (`extensionAllowed`, `nonEmptyFile`, `technicalConstraintsMet`) y el `mandatoryDisclaimer` literal.

### Sección 8 — Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)
- Cada requisito se numera secuencialmente: `RF-01`, `RF-02`, `RF-03`...
- Todo `RF-NN` debe incluir al menos un escenario BDD con las palabras clave en negrita **`**Dado**`**, **`**Cuando**`** y **`**Entonces**`** (pudiendo añadir **`**Y**`** / **`**Pero**`**).
- Cada criterio debe ser determinista y verificable en una prueba automatizada (evita adjetivos vagos como *"rápido"*, *"intuitivo"* o *"adecuado"*).

### Sección 9 — Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)
- Todo `RF-NN` declarado en la Sección 8 debe aparecer citado explícitamente por su código (`RF-01`, `RF-02`, ...) en la columna `RF Cubiertos` de al menos una fila de la tabla de pruebas de la Sección 9.

### Sección 10 — Casos de Borde, Manejo de Errores y Rollbacks
- Incluye siempre los casos límite críticos de la capacidad (ej. concurrencia, desconexión en callback GNAP, intento de segunda extensión sobre la misma orden bloqueado por `UNIQUE(task_order_id)`, reclamación en el minuto 29 de `FINAL_CLAIM_WINDOW_30M` que cancela atómicamente el job de BullMQ).

### Sección 11 — Preguntas Abiertas y Decisiones Técnicas Operativas
- Si todo está cerrado por `CONTEXT.md` y `architecture-overview.md`, escribe `"Sin preguntas abiertas bloqueantes."` y enumera las concreciones técnicas operativas tomadas en la spec.
- Nunca dejes una pregunta abierta que contradiga las reglas ya cerradas en `CONTEXT.md` §12 o `taskboard.md` §3.

### Sección 12 — Registro de Cambios y Trazabilidad de Gobernanza IA
- Toda creación o edición añade una fila a la tabla con versión semántica (`1.0.0`, `1.1.0`, etc.), fecha (`YYYY-MM-DD`), estado del ciclo SDD, autor/herramienta (`Antigravity` + rol) y resumen del cambio.

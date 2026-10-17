# SPEC-01: Contratos globales Zod, mocks y modelo relacional Prisma 6

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-01` |
| **Archivo** | `specs/SPEC-01.md` |
| **Fase de Desarrollo** | `Fase 0 — Gobernanza, estructura specs/ y contratos globales` |
| **Estado del Ciclo SDD** | `Testeada (TESTED)` |
| **Roles Responsables** | `AI-1`, `FE-1`, `BE-2` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F0-05`, `T-F0-06`, `T-F1-BE2-01`, `T-F1-AI1-01` |
| **Intervención Manual / IA Mínima-Nula** | `No aplica` |
| **Dependencias SDD** | `SPEC-00` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

`SPEC-01` fija el lenguaje común del dinero y de los plazos para que la demo no pueda mostrar un reparto distinto del que guarda PostgreSQL. El paquete `@taskstream/shared-schemas` obliga el bloque único, el redondeo entero `floor(total * 4 / 100)` hacia la wallet del dueño, el tope de las ofertas, los relojes y el hecho de que el Consejero de IA solo existe para imagen y texto. El modelo de datos v2 (Prisma 6 + capa SQL) separa identidad, marketplace, contratación, finanzas y ejecución, de modo que `TaskOrder` ya no guarda dinero, wallets, contadores ni plazos.

### 1.2. En Alcance del MVP

- Monorepo pnpm + Turborepo: `apps/web` (Next.js 15.5 + React 19), `apps/api` (NestJS 10.4 + Prisma 6) y `packages/shared-schemas` (`T-F0-06`).
- Esquemas Zod de `.agents/CONTEXT.md` §8.2, generadores de mocks y helpers de reparto e idempotencia (`T-F0-05`).
- `apps/api/prisma/schema.prisma` alineado con `planning/architecture-overview.md` §5 (modelo v2 en tres pasos) y capa física en `apps/api/prisma/sql/domain_checks.sql` (`CHECK`, índices parciales, triggers y vistas) (`T-F1-BE2-01`, parte de esquema).
- Suite Vitest de invariantes (`T-F1-AI1-01`).
- `GET /api/v1/health` y página `/` que consumen el paquete compartido.
- Adaptador MSW en `apps/web/src/mocks/handlers.ts` para que `FE-1` no espere al backend.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se implementa el webhook de Clerk ni el login. Eso es `SPEC-02`, aunque `T-F1-BE2-01` también lo nombre: aquí solo queda el modelo `User` listo para sincronizarse.
- No se escribe `open-payments.service.ts` ni `escrow-payment.service.ts`.
- No hay hitos de pago, ni `REFUNDED_AND_REOPENED`, ni auditoría de IA para video, audio, código o datos tabulares, ni suscripción `Buyer AI Pro Subscription`.
- `maxFileSizeBytes` permanece `null` en el MVP.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§1.2, §5.1–§5.4, §6, §8.2, §12), `planning/architecture-overview.md` (§5) y `planning/taskboard.md` (§3 reglas 1–8).
- **Invariantes del Módulo:**
  1. `platformFeeUSDInCents = Math.floor((totalAmountUSDInCents * 4) / 100)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`, con total entero en `[100, 50_000_000]`. La suma es el total. El 4 % va a una wallet distinta de `taskstream-escrow` y distinta de la del Freelancer.
  2. Oferta: `proposedBudgetUSDInCents <= initialBudgetUSDInCents`. Gig: precio fijo, sin negociación.
  3. Plazos: entrega inicial 1–7 días (default 7), extensión única de 1–7 días solo al vencer, respuesta del Buyer a las 24 h exactas, revisión 32 h, ventana 30 min, máximo 2 correcciones.
  4. `MvpAiAuditableModalityEnum` es solo `IMAGE | TEXT`, y solo cuando el medio es `IMAGE_RASTER_VECTOR` o `DOCUMENT_TEXT`.
  5. Como máximo una `UserWallet` con `isActive = true` por usuario.
  6. Una orden nace de un Gig (`gigId`) o de una propuesta acordada (`proposalId`), exactamente uno. La publicación se alcanza a través de la propuesta.
  7. `TaskOrder` solo guarda partes, origen, términos congelados y estado. El dinero y las cuatro wallets viven en `EscrowLedger`; cada plazo, en su `ScheduledTimerJob`; las correcciones usadas se derivan de `TaskDeliverable`.
  8. Nadie contrata ni negocia consigo mismo (buyer ≠ seller, freelancer ≠ buyer).

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Arranca `apps/web` y pinta la home con un mock de orden (`T-F0-06`). | MSW + `mockTaskOrderCard()` | No |
| **`FE-2`** | Sin entregable directo en esta spec; consume los mismos mocks para estados futuros de escrow. | Eventos simulados a partir de `TaskLifecycleStatusEnum` | No |
| **`BE-1`** | Sin entregable de pagos. Puede importar las funciones de idempotencia sin tocar el servicio nuclear. | Interfaces; la firma GNAP queda para `SPEC-02` | No |
| **`BE-2`** | Esquema Prisma 6, cliente y `GET /api/v1/health` (`T-F0-06`, parte de esquema de `T-F1-BE2-01`). | Prisma sin conexión obligatoria si falta `DATABASE_URL` | No |
| **`AI-1`** | Paquete `@taskstream/shared-schemas` y pruebas de contrato (`T-F0-05`, `T-F1-AI1-01`). | Fixtures en `src/mocks.ts` | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

Exportados desde `packages/shared-schemas/src/index.ts`, fieles a `.agents/CONTEXT.md` §8.2, con refinamientos:

| Esquema | Refinamiento |
| :--- | :--- |
| `ClientTaskPublicationSchema` | Presupuesto entero en `[100, 50_000_000]`; `initialDeliveryDays` entre 1 y 7; estados `OPEN_FOR_PROPOSALS`, `AGREED_AND_LOCKED`, `CANCELLED`. |
| `FreelancerNegotiationProposalSchema` | `proposedBudgetUSDInCents <= initialBudgetUSDInCents`; montos en rango; `proposedDeliveryDays` 1..7; freelancer distinto del buyer. |
| `DeadlineExtensionRequestSchema` | `requestedExtraDays` de 1 a 7; `buyerDecisionDeadlineAt = requestedAt + 24h`. |
| `TaskOrderCardSchema` | Total en rango y reparto exacto; wallets distintas; origen `gigId` XOR `proposalId` (`publicationId` solo junto a `proposalId`); buyer distinto del seller; modalidad de IA solo si el medio es imagen o texto; `maxFileSizeBytes = null`; revisión 32 y ventana 30 literales; máximo 2 correcciones. |
| `AiAdvisorInputContractSchema` | `revisionNumber` 0..2; modalidad `IMAGE \| TEXT`; el pre-check declara `failureReasons` si alguna bandera falla. |
| `AiAdvisorReportSchema` | `mandatoryDisclaimer` literal de `CONTEXT.md` §8.2. |
| `WalletLinkRequestSchema` / `ActiveModeSwitchSchema` | URL `https` y modo `BUYER \| SELLER`, para que `SPEC-02` no redefina el contrato. |

Mocks: `mockClientTaskPublication`, `mockFreelancerNegotiationProposal`, `mockDeadlineExtensionRequest`, `mockTaskOrderCard`, `mockGigOrderCard`, `mockAiAdvisorInputContract`, `mockAiAdvisorReport`.

Helpers y constantes: `splitSingleBlockEscrow`, `MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS`, `MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS`, `buyerExtensionDecisionDeadline`, `resolveMvpAiAuditableModality`, `escrowLockIdempotencyKey`, `freelancerPayoutIdempotencyKey`, `platformFeePayoutIdempotencyKey`, `buyerRefundIdempotencyKey`, `gnapInteractHash`.

Las claves siguen `.agents/CONTEXT.md` §5.4: `ESCROW_LOCK`, `FREELANCER_PAYOUT_96`, `PLATFORM_FEE_PAYOUT_4` y `BUYER_REFUND_100`.

### 4.2. Entidades en PostgreSQL + Prisma 6 (Modelo v2 Desacoplado) y Capa Física SQL

El modelo v2 está documentado en sus tres pasos en `planning/architecture-overview.md` §5. Este documento no copia el esquema; las fuentes canónicas son:

- `apps/api/prisma/schema.prisma`: 22 modelos agrupados por contexto. **Identidad:** `User`, `SellerProfile`, `UserWallet`, `WalletVerificationChallenge`, `PlatformWallet`. **Marketplace:** `TaskCategoryMediaType`, `Gig`, `ClientTaskPublication`, `NegotiationProposal`, `NegotiationMessage`. **Contratación:** `TaskOrder`, `TaskAcceptanceCriterion`, `TaskTechnicalConstraint`, `DeadlineExtensionRequest`. **Finanzas:** `EscrowLedger`, `OpenPaymentsTransaction`, `RafikiWebhookEvent`. **Ejecución:** `TaskDeliverable`, `AiAdvisorReport`, `AiCriterionEvaluation`, `DisputeCase`, `ScheduledTimerJob`.
- `apps/api/prisma/sql/domain_checks.sql`: capa física canónica que Prisma no modela. Contiene los `CHECK` de §5.3.4, los índices únicos parciales de §5.3.5 (wallet activa, acuerdo único por publicación, pierna de pago completada, revisión pendiente y reloj activo únicos), los triggers de §5.3.6, las vistas derivadas de §5.3.7 y los seis pares categoría ↔ medio.
- `apps/api/prisma/migrations/20261017000000_decouple_task_order/migration.sql`: migración v1 → v2.

Cambios respecto al modelo v1:

- `TaskOrder` pasa de 31 a 14 columnas. Sus wallets, montos, contadores y plazos se movieron a `EscrowLedger`, `ScheduledTimerJob` y `TaskDeliverable`.
- `chk_task_order_exact_96_4_split` se reemplaza por `chk_escrow_exact_96_4_split` (con `::bigint`) en `escrow_ledgers`.
- `AiAdvisorReport` y `OpenPaymentsTransaction` pierden su FK redundante a `task_orders`.
- Los relojes guardan `started_at` y `expires_at`; son la única fuente de verdad de cada plazo.
- Todas las relaciones de contratos y dinero usan `ON DELETE RESTRICT`.

No existe el estado `REFUNDED_AND_REOPENED`.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

| Método | Ruta | Rol | Respuesta | Errores |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Público | `{ status: "ok", service: "taskstream-api", databaseConfigured, sampleSplit }` | Ninguno en el camino feliz |

`sampleSplit` de 10000 centavos devuelve 9600 y 400. El webhook de Clerk (`user.created`, `user.updated`) se especifica en `SPEC-02` y persiste sobre este `User`.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

No aplica la ejecución de workers en esta especificación. Sí queda el enum `TimerJobType`: `INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`, persistido en `ScheduledTimerJob`. No hay llamadas a Open Payments ni a `AiAdvisorService`.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

- `apps/web/app/page.tsx` es un Server Component. Muestra una orden mock, el reparto 96/4, la modalidad `IMAGE` y el contador `0/2`.
- Estados: la página no tiene formulario. Si el mock dejara de parsear, el build de Next.js falla: no hay estado vacío silencioso.
- `apps/web/src/mocks/handlers.ts` responde `GET /api/v1/contracts/sample-publication` y `GET /api/v1/contracts/sample-order`.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No aplica en esta especificación. No se monta `<Canvas>` ni se lee la posición de scroll. `SPEC-03` prohíbe guardarla en `useState`.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** `/api/v1/health` es público y no revela secretos. `DATABASE_URL` vive en `.env`, no en el repositorio. `.env.example` solo trae una URL local de ejemplo.
- **Idempotencia e Integridad Criptográfica:** las cuatro claves y `gnapInteractHash` son funciones puras. Comparar el hash del callback y mover fondos corresponde a `BE-1` en `SPEC-02` y `SPEC-06`. El informe de IA exige el disclaimer literal; no aprueba pagos.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Esquemas Zod globales
- **Origen:** `T-F0-05` / `.agents/CONTEXT.md` §8.2
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el paquete `@taskstream/shared-schemas`
  - **Cuando** se importa `TaskOrderCardSchema`, `DeadlineExtensionRequestSchema`, `AiAdvisorInputContractSchema` y `AiAdvisorReportSchema`
  - **Entonces** un objeto que cumple §8.2 parsea y uno con plazo de entrega 8, revisión distinta de 32 o disclaimer alterado es rechazado

### `RF-02` — Generadores de mocks
- **Origen:** `T-F0-05` / `planning/pbp-development.md` §1.2
- **Rol(es):** `AI-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** los generadores de `src/mocks.ts`
  - **Cuando** `FE-1` llama `mockTaskOrderCard()` o `mockGigOrderCard()`
  - **Entonces** el resultado ya pasó `schema.parse` y puede alimentar MSW sin esperar a NestJS

### `RF-03` — Reparto exacto 96/4
- **Origen:** `planning/taskboard.md` §3 regla 8 / `.agents/CONTEXT.md` §5.1
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un total de 10000 centavos
  - **Cuando** se calcula `splitSingleBlockEscrow`
  - **Entonces** la comisión es 400, el freelancer recibe 9600 y la suma sigue siendo 10000; un fee inventado no parsea en `TaskOrderCardSchema`
  - **Y** 100 centavos dan 4 + 96, 50.000.000 dan 2.000.000 de comisión, y 99 o 50.000.001 lanzan `INVALID_TOTAL_AMOUNT`

### `RF-04` — Oferta dentro del tope
- **Origen:** `.agents/CONTEXT.md` §5.2 / §8.2
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una publicación con tope de 10000 centavos
  - **Cuando** la oferta es 10000
  - **Entonces** el esquema la acepta
  - **Y** cuando la oferta es 10001 el esquema la rechaza

### `RF-05` — IA solo imagen y texto
- **Origen:** `.agents/CONTEXT.md` §6.1 / §12 regla 6
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un medio `VIDEO_STREAM`, `AUDIO_TRACK`, `CODE_ARCHIVE` o `DATA_CAMPAIGN`
  - **Cuando** se resuelve la modalidad auditable
  - **Entonces** el resultado es nulo y la orden no puede declarar `aiAuditableModality`
  - **Y** `IMAGE_RASTER_VECTOR` exige `IMAGE` y `DOCUMENT_TEXT` exige `TEXT`

### `RF-06` — Monorepo Next.js y NestJS
- **Origen:** `T-F0-06` / `.agents/CONTEXT.md` §11
- **Rol(es):** `FE-1`, `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** la raíz del repositorio
  - **Cuando** se instalan los workspaces
  - **Entonces** existen `pnpm-workspace.yaml`, `turbo.json`, `apps/web` en Next.js 15.5 con React 19 y `apps/api` en NestJS 10.4

### `RF-07` — Modelo de datos v2 y capa física SQL
- **Origen:** `T-F1-BE2-01` / `planning/architecture-overview.md` §5.1–§5.3
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** `schema.prisma` y `domain_checks.sql`
  - **Cuando** `prisma validate` revisa el esquema
  - **Entonces** el esquema es válido, `TaskOrder` no tiene columnas de dinero, wallets, contadores ni plazos, y hay una sola extensión por orden (`taskOrderId` único)
  - **Y** al aplicar las migraciones en PostgreSQL, la base rechaza un reparto distinto de `floor(total*4/100)`, una orden sin origen o con partes distintas a las de su origen, wallets ajenas en el ledger, un reloj con duración distinta a la de su tipo, una revisión fuera de secuencia y una segunda pierna de pago completada

### `RF-08` — Salud del API con el mismo reparto
- **Origen:** `T-F0-06`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** el proceso NestJS en marcha
  - **Cuando** se llama `GET /api/v1/health`
  - **Entonces** `sampleSplit` de 10000 centavos informa 9600 y 400

### `RF-09` — Suite de contratos
- **Origen:** `T-F1-AI1-01`
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** `packages/shared-schemas/src/contracts.test.ts`
  - **Cuando** se ejecuta Vitest
  - **Entonces** pasan los casos de reparto y rango de montos, tope de oferta, anti self-dealing, origen de la orden, modalidad de IA, plazos de 24 h y claves de idempotencia distintas

### `RF-10` — Una wallet activa
- **Origen:** `.agents/CONTEXT.md` §1.2 / `planning/architecture-overview.md` §5.3 `UserWallet`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** el índice parcial `user_wallets_one_active_per_user`
  - **Cuando** se intenta insertar una segunda fila activa para el mismo `user_id`
  - **Entonces** PostgreSQL rechaza la fila; el reemplazo consiste en desactivar la anterior dentro de la misma transacción (`SPEC-02`)

### `RF-11` — Claves de idempotencia deterministas
- **Origen:** `.agents/CONTEXT.md` §5.4
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un `taskId` y un `attemptNumber`
  - **Cuando** se calculan las cuatro claves
  - **Entonces** cada una es SHA-256 hexadecimal de 64 caracteres, la de bloqueo cambia si cambia el intento, y la de payout 96 % es distinta de la del 4 %

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-02`, `RF-04`, `RF-05` | `Contrato Zod` | `contracts.test.ts` acepta mocks válidos y rechaza plazo 8, oferta por encima del tope, disclaimer alterado y modalidad de IA en video. | `AI-1` |
| `TEST-02` | `RF-03`, `RF-11` | `Unitaria` | 100 → 4 + 96; 10000 → 400 + 9600; 10001 → 400 + 9601; 50.000.000 → 2.000.000; 99 y 50.000.001 lanzan; cuatro claves distintas y estables. | `AI-1` |
| `TEST-03` | `RF-09` | `Contrato Zod` | `pnpm --filter @taskstream/shared-schemas test` termina en verde. | `AI-1` |
| `TEST-04` | `RF-06`, `RF-08` | `Integración` | `GET /api/v1/health` devuelve el reparto de ejemplo y la home de Next muestra el mismo mock. | `FE-1`, `BE-2` |
| `TEST-05` | `RF-07`, `RF-10` | `Integración` | `prisma validate` pasa; las tres migraciones se aplican en orden sobre PostgreSQL (PGlite) y 45 escenarios positivos y negativos se comportan como se espera: `chk_escrow_exact_96_4_split`, `user_wallets_one_active_per_user`, triggers de origen, wallets, relojes y secuencia, piernas de liquidación y `RESTRICT`. `domain_checks.sql` también se aplica sobre el DDL fresco del esquema. | `BE-2` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| Total no entero o fuera de `[100, 50_000_000]` | `INVALID_TOTAL_AMOUNT` | `splitSingleBlockEscrow` lanza y no produce un reparto. |
| Oferta por encima del tope | `PROPOSED_BUDGET_EXCEEDS_INITIAL` | Zod rechaza la propuesta; no se persiste. |
| Orden con Gig y propuesta a la vez, o sin ninguno | `ORDER_ORIGIN_AMBIGUOUS` | Zod y `chk_task_order_single_origin` rechazan la fila. |
| Orden cuyas partes, días o categoría no coinciden con su origen, o propuesta no acordada | `TASK_ORDER_ORIGIN_MISMATCH` | `trg_task_order_origin_guard` aborta el `INSERT`. |
| Cambio de términos de una orden ya creada | `TASK_ORDER_TERMS_IMMUTABLE` | El trigger aborta el `UPDATE`. |
| Ledger con wallets de otro usuario, sin verificar o con rol de plataforma equivocado | `ESCROW_PARTY_WALLET_MISMATCH` / `ESCROW_PLATFORM_WALLET_MISMATCH` | `trg_escrow_ledger_wallets_match` aborta la escritura. |
| Total del ledger distinto del presupuesto acordado | `ESCROW_TOTAL_MISMATCH` | El mismo trigger aborta la escritura. |
| Plazo modificado o reloj con duración distinta a la pactada | `TIMER_DEADLINE_IMMUTABLE` / `TIMER_DURATION_MISMATCH` | `trg_timer_job_guard` y `chk_timer_duration_by_type` rechazan la fila. |
| Revisión entregada sin que la anterior fuera devuelta | `DELIVERABLE_REVISION_OUT_OF_SEQUENCE` | `trg_deliverable_revision_sequence` aborta el `INSERT`. |
| Segunda wallet activa del mismo usuario | `ACTIVE_WALLET_ALREADY_EXISTS` | El índice parcial aborta el `INSERT`. La transacción de reemplazo debe apagar la anterior primero. |
| Fee que no cuadra con `floor(total * 4 / 100)` | `INVALID_FEE_SPLIT` | Zod y el `CHECK` rechazan la orden. |
| Extensión de 0 u 8 días, o deadline distinto de +24 h | `EXTENSION_WINDOW_INVALID` | `DeadlineExtensionRequestSchema` y `chk_extension_days_1_to_7` rechazan el dato. |
| `DATABASE_URL` ausente al arrancar el API | `DATABASE_NOT_CONFIGURED` | El proceso igual responde health con `databaseConfigured: false`. No se abre conexión. |
| Pre-check de IA con bandera en falso y sin motivos | `AI_PRECHECK_INCONSISTENT` | `AiAdvisorInputContractSchema` rechaza el contrato de entrada. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes.

Decisiones operativas:

1. El `CHECK` de reparto (`chk_escrow_exact_96_4_split`, en `escrow_ledgers`) exige la fórmula entera de `taskboard.md` §3 regla 8 con `::bigint`; `architecture-overview.md` §5.3.3 la documenta como canónica.
2. `chk_task_order_single_origin` usa `num_nonnulls(gig_id, proposal_id) = 1`. La coherencia entre la orden y su origen se impone con trigger porque el origen es condicional y Prisma no modela FK compuestas opcionales con un campo obligatorio.
3. `T-F1-BE2-01` se parte: el esquema y los `CHECK` son de esta spec; el webhook de Clerk se implementa con `SPEC-02` y no en este turno.
4. Prisma permanece en la línea 6 (`prisma-client-js` y `url` en el datasource), como fija `.agents/CONTEXT.md` §11.
5. Zod permanece en 3.23.8 para coincidir con los ejemplos de §8.2.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` + `AI-1` | Contratos Zod, mocks, fórmula 96/4, esquema Prisma 6 y `CHECK` SQL de Fase 0. |
| `1.1.0` | `2026-10-16` | `Implementada (IMPLEMENTED)` | `Cursor` + `AI-1`, `FE-1`, `BE-2` | Monorepo, `@taskstream/shared-schemas`, `apps/web`, `apps/api` y `schema.prisma` con migración SQL. |
| `1.2.0` | `2026-10-16` | `Testeada (TESTED)` | `Cursor` + `AI-1` | Vitest 10/10, `prisma validate`, build de Nest y Next, `GET /api/v1/health` con reparto 9600/400 y home en el navegador. La migración no se aplicó a un PostgreSQL en marcha. |
| `1.3.0` | `2026-10-16` | `Testeada (TESTED)` | `Cursor` + `AI-1`, `BE-2` | Modelo de datos v2: `TaskOrder` desacoplada (dinero y wallets en `EscrowLedger`, plazos en `ScheduledTimerJob`, correcciones derivadas), `PlatformWallet`, `TaskCategoryMediaType`, capa física con `CHECK`, índices parciales, triggers y vistas, fórmula entera `floor(total*4/100)` con rango `[100, 50_000_000]`, `proposalId` en `TaskOrderCardSchema`. Vitest 13/13 y migraciones aplicadas sobre PGlite con 45/45 escenarios. |

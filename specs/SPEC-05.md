# SPEC-05: Contratación de Gig fijo, bandeja de ofertas a la baja, aceptación mutua y clasificador de modalidad IA

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-05` |
| **Título del Módulo** | Contratación de Gig fijo, bandeja de ofertas a la baja, aceptación mutua y clasificador de modalidad IA |
| **Fase del Roadmap** | Fase 2 — Marketplace de 6 Categorías, Gigs Fijos y Negociación a la Baja |
| **Roles Propietarios** | `FE-1`, `BE-1`, `AI-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F2-FE1-02`, `T-F2-BE1-01`, `T-F2-AI1-01` |
| **Dependencias Previas** | `SPEC-00`, `SPEC-01`, `SPEC-02`, `SPEC-03`, `SPEC-04` |
| **Estado del Ciclo SDD** | `Implementada (IMPLEMENTED)` — backend Negotiations + harness FE mínimo |
| **Última Actualización** | `2026-10-17` (v0.4.0) |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo Ejecutivo
Especificar el motor transaccional de **contratación y negociación precontractual (`NegotiationsModule`)** y el **clasificador determinista de modalidad auditable por IA (`resolveMvpAiAuditableModality`)**, cubriendo las dos vías excluyentes de origen de una orden en TaskStream AI:
1. **Contratación de Gig a precio fijo (`Gig`):** Flujo sin regateo donde Buyer y Freelancer confirman la actividad al precio cerrado publicado (`priceUSDInCents`).
2. **Negociación en Publicación de Tarea (`ClientTaskPublication`):** Bandeja de ofertas competitivas donde múltiples Freelancers verificados postulan propuestas y contraofertas únicamente **iguales o a la baja** (`proposedBudgetUSDInCents <= initialBudgetUSDInCents`), resolviéndose por **Camino 1 (`AGREED_PATH_1` — Acuerdo Mutuo)** o **Camino 2 (`DISCREPANCY_CLOSED_PATH_2` — Cierre por Discrepancia sin bloquear la publicación)**.
3. **Instanciación Atómica de `TaskOrder` (`PENDING_ESCROW_FUNDING`) y `EscrowLedger` (`AWAITING_FUNDS`):** Creación transaccional del contrato inmutable (`TaskOrderCard`), congelamiento de criterios de aceptación y restricciones técnicas, cálculo entero `96 % / 4 %` en el `EscrowLedger` y modalidad auditable `aiAuditableModality` (`IMAGE`, `TEXT` o `null`) derivada de `expectedMediaType` en la `TaskOrderCard`, garantizando que ningún temporizador arranque antes del fondeo efectivo del escrow en `SPEC-06`.

### 1.2. Límites del Módulo (In-Scope vs. Out-of-Scope)
- **Dentro del alcance (In-Scope):**
  - Endpoints y lógica de dominio en `apps/api/src/modules/negotiations/` (`BE-1`) para crear propuestas (`NegotiationProposal`), enviar mensajes/contraofertas (`NegotiationMessage`), aceptar oferta en Camino 1 (`AGREED_PATH_1`), descartar propuesta en Camino 2 (`DISCREPANCY_CLOSED_PATH_2`), contratar Gig fijo con aceptación bilateral y emitir la `TaskOrder` en `PENDING_ESCROW_FUNDING` junto con `EscrowLedger` en `AWAITING_FUNDS`.
  - Clasificador determinista `resolveMvpAiAuditableModality` e integración de pre-etiquetado en la creación de `TaskOrder` (`AI-1`).
  - Bandeja de ofertas recibidas para el Buyer, vista de perfil resumido del Freelancer postulante, sala de negociación con bloqueo visual y numérico `<= initialBudgetUSDInCents` y resumen de orden previo al fondeo (`FE-1`).
- **Fuera del alcance (Out-of-Scope):**
  - El CRUD del catálogo de Gigs y publicaciones abiertas (`SPEC-04`).
  - La creación de cotizaciones FX en Rafiki, el redireccionamiento GNAP de Interactive Grant, la captura del pago en `ESCROW_LOCKED` y el disparo del job `INITIAL_DELIVERY_7D` en BullMQ (`SPEC-06`).

---

## 2. Reglas de Dominio e Invariantes Vigentes

| ID Regla | Origen SSoT | Descripción de la Invariante | Impacto en `SPEC-05` |
| :--- | :--- | :--- | :--- |
| **`INV-05-01`** | `CONTEXT.md` §5.1, `taskboard.md` §3 Reglas 3 y 4 | **Origen Excluyente de `TaskOrder` (`chk_task_order_single_origin`):** Toda `TaskOrder` nace o bien de un `Gig` a precio fijo o bien de una propuesta `AGREED_PATH_1`: `num_nonnulls(gig_id, proposal_id) = 1`. `task_orders` no guarda `publication_id`; la publicación se alcanza por la propuesta. El trigger `trg_task_order_origin_guard` exige que buyer, seller, días, categoría y medio coincidan con el origen. | Validación estricta en Zod (`TaskOrderCardSchema`: `gigId` XOR `proposalId`), `CHECK` SQL y trigger en `task_orders`. En contratación de Gig fijo está prohibido abrir propuestas de regateo (`400 GIG_PRICE_NOT_NEGOTIABLE`). |
| **`INV-05-02`** | `CONTEXT.md` §5.1.B, `taskboard.md` §3 Regla 4 | **Negociación Estrictamente Igual o a la Baja (`chk_proposal_downward_only`, `chk_message_offer_range`):** En toda `NegotiationProposal` y `NegotiationMessage`, el monto ofrecido (`proposedBudgetUSDInCents` / `offeredAmountUSDInCents`) debe ser un entero positivo `>= 100` y `<= publication.initialBudgetUSDInCents`. | Cualquier intento de ofertar o contraofertar por encima del tope original de la publicación es rechazado en UI, en Zod (`400 OFFER_EXCEEDS_INITIAL_BUDGET`) y en PostgreSQL. |
| **`INV-05-03`** | `CONTEXT.md` §5.2, `taskboard.md` §3 Regla 4 | **Arranque Exclusivo tras Aceptación Mutua y Separación entre Acuerdo y Fondeo:** La actividad nunca arranca de forma unilateral. Tras el acuerdo mutuo (Camino 1 o confirmación de Gig fijo), la orden nace en `PENDING_ESCROW_FUNDING` sin ningún `ScheduledTimerJob` (los plazos solo existen como relojes). Los relojes de ejecución solo se activan cuando el Buyer fondea el escrow en `SPEC-06`. | `SPEC-05` crea `TaskOrder` en `PENDING_ESCROW_FUNDING` y `EscrowLedger` en `AWAITING_FUNDS` sin encolar jobs `INITIAL_DELIVERY_7D` todavía. |
| **`INV-05-04`** | `CONTEXT.md` §5.2.A, §5.2.B | **Bifurcación Camino 1 vs. Camino 2:** En Camino 1 (`AGREED_PATH_1`), la publicación pasa a `AGREED_AND_LOCKED` y todas las demás propuestas abiertas de esa publicación se cierran automáticamente. En Camino 2 (`DISCREPANCY_CLOSED_PATH_2`), solo se cierra esa propuesta individual y la publicación continúa en `OPEN_FOR_PROPOSALS`. | Transacción ACID con `SELECT ... FOR UPDATE` sobre `client_task_publications` al aceptar una propuesta en Camino 1. |
| **`INV-05-05`** | `CONTEXT.md` §3.1, `taskboard.md` §3 Regla 8 | **Reparto Exacto `96 % / 4 %` y Separación de 4 Wallets (`chk_escrow_exact_96_4_split`):** `platformFeeUSDInCents = Math.floor((total * 4) / 100)` y `freelancerPayoutUSDInCents = total - platformFeeUSDInCents`, con total en `[100, 50_000_000]`. Las cuatro wallets son FK de `EscrowLedger`: buyer y seller (`user_wallets`, distintas entre sí), custodia y fee del dueño (`platform_wallets`, distintas entre sí). | El cálculo financiero se ejecuta exclusivamente en servidor mediante `splitSingleBlockEscrow(totalAmountUSDInCents)` al instanciar `TaskOrder` + `EscrowLedger`. |
| **`INV-05-06`** | `CONTEXT.md` §4.1, §6.1, `taskboard.md` §3 Regla 10 | **Clasificación Determinista de Modalidad IA (`resolveMvpAiAuditableModality`):** `aiAuditableModality` es `'IMAGE'` si y solo si `expectedMediaType === 'IMAGE_RASTER_VECTOR'`, `'TEXT'` si y solo si `expectedMediaType === 'DOCUMENT_TEXT'`, y `null` para los otros 4 medios. | `aiAuditableModality` no se almacena: es un valor derivado de `task_orders.expected_media_type` que el clasificador de `AI-1` calcula al construir la `TaskOrderCard`. El trigger `trg_ai_report_mvp_modality` impide crear reportes de IA para otros medios. |
| **`INV-05-07`** | `CONTEXT.md` §1.2, §2.3, §8.1 | **Prohibición de Auto-Contratación (*Anti Self-Dealing*):** Aunque una cuenta puede alternar entre `Buyer Mode` y `Seller Mode`, un usuario jamás puede postular a su propia publicación ni contratar su propio Gig, ni usar la misma `walletAddressUrl` como Buyer y Seller en una orden. | Validación obligatoria `buyerId !== sellerId` y `buyerWallet.walletAddressUrl !== sellerWallet.walletAddressUrl` (`403 SELF_DEALING_FORBIDDEN`), respaldada en SQL por `chk_proposal_no_self_dealing`, `chk_task_order_no_self_dealing` y `chk_escrow_distinct_party_wallets`. |

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

### 3.1. Asignación de Responsabilidades y Fronteras de Directorio

| Rol | Tareas Asignadas (`taskboard.md`) | Directorios y Archivos de su Propiedad Exclusiva | Responsabilidad en esta Spec | Entregable Verificable |
| :--- | :--- | :--- | :--- | :--- |
| **`FE-1`** | `T-F2-FE1-02` | `apps/web/src/app/(marketplace)/publications/[publicationId]/proposals/`, `apps/web/src/features/negotiations/components/`, `apps/web/src/features/negotiations/hooks/` | Bandeja de ofertas recibidas por publicación con comparación de perfiles de Freelancers, sala de negociación en tiempo real/polling con validación `<= initialBudgetUSDInCents`, botones de Camino 1 (`Aceptar Oferta`) / Camino 2 (`Cerrar por Discrepancia`), flujo de solicitud/confirmación de Gig fijo y tarjeta resumen `TaskOrderCard` en estado `PENDING_ESCROW_FUNDING`. | Componentes tipados con React Hook Form + Zod y tests de interfaz en Vitest. |
| **`FE-2`** | *(Sin tarea directa en `SPEC-05`)* | `apps/web/src/canvas/`, `apps/web/src/animations/` | Sin intervención requerida en la bandeja de negociación transaccional. | Sin modificación de archivos en `SPEC-05`. |
| **`BE-1`** | `T-F2-BE1-01` | `apps/api/src/modules/negotiations/`, `packages/shared-schemas/src/` (contratos de negociación y creación de orden) | Implementación de `NegotiationsModule`, `ProposalsService`, `OrderCreationService`: postulación de freelancers, contraofertas a la baja, bloqueo pesimista `FOR UPDATE` en Camino 1, cierre individual en Camino 2, contratación de Gig fijo con aceptación bilateral y creación atómica de `TaskOrder` + `TaskAcceptanceCriterion` + `TaskTechnicalConstraint` + `EscrowLedger`. | Endpoints `/api/v1/negotiations/*` y suite de integración de concurrencia y seguridad en Vitest + Supertest. |
| **`BE-2`** | *(Sin tarea directa; provee lecturas de `MarketplaceModule`)* | `apps/api/src/modules/marketplace/` | Proveer métodos de lectura de `Gig` y `ClientTaskPublication` consumidos por `NegotiationsModule`. | Interfaces estables de `SPEC-04`. |
| **`AI-1`** | `T-F2-AI1-01` | `packages/shared-schemas/src/modality.ts` | Función pura `resolveMvpAiAuditableModality` (`IMAGE`, `TEXT` o `null`). `BE-1` la llama al armar la `TaskOrderCard`. `AI-1` no crea archivos en `apps/api`. | La función pura cubierta al 100 % por tests unitarios en Vitest. |

### 3.2. Orden de Congelación de Contratos y Mocks
1. **Día 1 (Congelación de Contratos):** `BE-1`, `FE-1` y `AI-1` congelan en `packages/shared-schemas` los esquemas `CreateNegotiationProposalInputSchema`, `SendNegotiationMessageInputSchema`, `AcceptProposalPath1InputSchema`, `CloseProposalPath2InputSchema`, `RequestFixedGigOrderInputSchema` y `NegotiationThreadViewSchema`, junto con sus mocks en `packages/shared-schemas/src/mocks.ts`.
2. **Trabajo Simultáneo sin Bloqueo:**
   - `FE-1` construye la bandeja de ofertas del Buyer y la sala de negociación consumiendo los mocks de `@taskstream/shared-schemas`.
   - `AI-1` implementa y prueba `resolveMvpAiAuditableModality` en `packages/shared-schemas`. `BE-1` la invoca desde `OrderCreationService`.
   - `BE-1` implementa las transacciones ACID en `apps/api/src/modules/negotiations/` con Prisma y PostgreSQL.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod en `packages/shared-schemas`

Se preservan `FreelancerNegotiationProposalSchema`, `NegotiationProposalStatusEnum` y `TaskOrderCardSchema`, y se incorporan los contratos de entrada/salida para el ciclo completo de negociación y contratación:

```typescript
import { z } from 'zod';
import {
  NegotiationProposalStatusEnum,
  AcceptanceCriterionSchema,
  TaskOrderCardSchema,
} from './schemas';
import {
  MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS,
} from './marketplace';

export const CreateNegotiationProposalInputSchema = z.object({
  publicationId: z.string().uuid(),
  proposedBudgetUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
  proposedDeliveryDays: z.number().int().min(1).max(7),
  coverMessage: z.string().trim().min(15).max(2000),
});

export const SendNegotiationMessageInputSchema = z.object({
  proposalId: z.string().uuid(),
  body: z.string().trim().min(2).max(2000),
  offeredAmountUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .optional(),
  offeredDeliveryDays: z.number().int().min(1).max(7).optional(),
});

/**
 * Protección Anti-TOCTOU (Bait-and-Switch):
 * Al aceptar una oferta en Camino 1, la parte que acepta debe declarar explícitamente
 * el monto exacto (expectedAmountUSDInCents) y el plazo (expectedDeliveryDays) que ve en pantalla.
 * Si la contraparte envió un mensaje modificando la oferta un milisegundo antes, la transacción aborta con 409.
 */
export const AcceptProposalPath1InputSchema = z.object({
  proposalId: z.string().uuid(),
  expectedAmountUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
  expectedDeliveryDays: z.number().int().min(1).max(7),
  buyerAssumesDoubleFxConversion: z.literal(true),
});

export const CloseProposalPath2InputSchema = z.object({
  proposalId: z.string().uuid(),
  closedReason: z.string().trim().min(5).max(500),
});

/**
 * Contratación de Gig a precio fijo:
 * El cliente no puede enviar un precio distinto; debe confirmar explícitamente
 * el expectedPriceUSDInCents publicado en el Gig y la aceptación bilateral.
 */
export const HireFixedGigInputSchema = z.object({
  gigId: z.string().uuid(),
  expectedPriceUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
  projectBrief: z.string().trim().min(20).max(3000),
  buyerAssumesDoubleFxConversion: z.literal(true),
});

export const NegotiationMessageViewSchema = z.object({
  messageId: z.string().uuid(),
  proposalId: z.string().uuid(),
  senderUserId: z.string().uuid(),
  body: z.string(),
  offeredAmountUSDInCents: z.number().int().positive().nullable(),
  createdAt: z.string().datetime(),
});
```

### 4.2. Tablas, Relaciones e Índices en `apps/api/prisma/schema.prisma`

`SPEC-05` coordina las siguientes tablas del modelo v2 (`planning/architecture-overview.md` §5) en `apps/api/prisma/schema.prisma` bajo las restricciones de `apps/api/prisma/sql/domain_checks.sql`:
1. **`NegotiationProposal` (`negotiation_proposals`):**
   - FK compuesta `(publicationId, buyerId, initialBudgetUSDInCents)` → `ClientTaskPublication(id, buyerId, initialBudgetUSDInCents)`, de modo que el tope y el buyer replicados nunca divergen de la publicación; `freelancerId` → `User.id`.
   - Índices únicos parciales `negotiation_proposals_one_agreement_per_publication` (un solo `AGREED_PATH_1` por publicación, SEC-GAP-01) y `negotiation_proposals_one_active_per_freelancer`.
   - Gobernada por `chk_proposal_downward_only` (`proposed_budget_usd_in_cents >= 100 AND proposed_budget_usd_in_cents <= initial_budget_usd_in_cents AND proposed_delivery_days BETWEEN 1 AND 7`), `chk_proposal_no_self_dealing` y `chk_proposal_closed_at_coherent`.
2. **`NegotiationMessage` (`negotiation_messages`):**
   - Vincula `proposalId` → `NegotiationProposal.id` (`ON DELETE CASCADE`) y `senderId` → `User.id`.
   - Gobernada por `chk_message_offer_range`: `offered_amount_usd_in_cents` nulo o en `[100, 50_000_000]` y `offered_delivery_days` nulo o en `1..7`. El tope contra la publicación se valida en servidor y vuelve a imponerse al copiar la oferta a la propuesta (`chk_proposal_downward_only`).
3. **`TaskOrder` (`task_orders`), `TaskAcceptanceCriterion`, `TaskTechnicalConstraint` y `EscrowLedger` (`escrow_ledgers`):**
   - Al concretarse el acuerdo mutuo (Camino 1 o Gig fijo), se inserta en la misma transacción:
     - `TaskOrder` en `lifecycleStatus = 'PENDING_ESCROW_FUNDING'` con los términos congelados (`title`, `scopeDescription`, `category`, `expectedMediaType`, `initialDeliveryDays`), cumpliendo `chk_task_order_single_origin`, `chk_task_order_no_self_dealing`, `chk_task_order_initial_days` y el trigger `trg_task_order_origin_guard`.
     - Filas normalizadas en `task_acceptance_criteria` (`1..10` criterios congelados con `sortOrder`) y 1 fila en `task_technical_constraints` (`max_file_size_bytes = NULL` verificado por `chk_technical_constraint_ranges`).
     - 1 fila en `escrow_ledgers` con `status = 'AWAITING_FUNDS'`, las wallets activas y verificadas de buyer y seller (`buyerWalletId`, `sellerWalletId`), las `PlatformWallet` activas de custodia y de fee (`custodyWalletId`, `ownerFeeWalletId`), `totalAmountUSDInCents`, `freelancerPayoutUSDInCents` y `platformFeeUSDInCents`. Lo verifican `chk_escrow_exact_96_4_split`, `chk_escrow_distinct_party_wallets`, `chk_escrow_distinct_platform_wallets` y `trg_escrow_ledger_wallets_match` (que además exige total = presupuesto acordado en Camino 1).

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST (`apps/api`)

La autenticación es la de `SPEC-02` v1.5.0: sesión HMAC local, no Clerk. El BFF reenvía la cookie httpOnly `taskstream_session` como `Authorization: Bearer`. `SessionAuthGuard` fija `req.userId` = `User.id`. Sin sesión válida la respuesta es `401 UNAUTHENTICATED`. No hay webhook de Clerk ni columna `clerk_id`.

| Método y Ruta | Guardas de Seguridad | Request (Params / Query / Body) | Response `200/201` | Códigos de Error Esperados |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/negotiations/proposals` | `SessionAuthGuard`, `WalletVerifiedGuard` | Body: `CreateNegotiationProposalInputSchema` + Header `Idempotency-Key` | `201 Created` → `FreelancerNegotiationProposal` en `IN_NEGOTIATION` + primer `NegotiationMessage`. | `401 UNAUTHENTICATED`, `400 OFFER_EXCEEDS_INITIAL_BUDGET`, `403 SELF_DEALING_FORBIDDEN`, `403 WALLET_NOT_VERIFIED`, `409 ACTIVE_PROPOSAL_ALREADY_EXISTS`, `409 PUBLICATION_NOT_OPEN` |
| `GET /api/v1/negotiations/publications/:publicationId/proposals` | `SessionAuthGuard` (Solo Buyer titular de la publicación) | Param: `publicationId` | Bandeja de ofertas recibidas con resumen del perfil y wallet verificada de cada Freelancer postulante. | `401 UNAUTHENTICATED`, `403 FORBIDDEN_PUBLICATION_INBOX`, `404 PUBLICATION_NOT_FOUND` |
| `GET /api/v1/negotiations/proposals/:proposalId` | `SessionAuthGuard` (Solo `buyerId` o `freelancerId` de esa propuesta) | Param: `proposalId` | Detalle de `NegotiationProposal` + historial cronológico de `NegotiationMessage`. | `401 UNAUTHENTICATED`, `403 PROPOSAL_ACCESS_FORBIDDEN`, `404 PROPOSAL_NOT_FOUND` |
| `POST /api/v1/negotiations/proposals/:proposalId/messages` | `SessionAuthGuard`, `WalletVerifiedGuard` | Param: `proposalId`, Body: `SendNegotiationMessageInputSchema` + Header `Idempotency-Key` | `201 Created` → `NegotiationMessageView` (si incluye `offeredAmountUSDInCents`, actualiza `proposedBudgetUSDInCents` siempre que sea `<= initialBudgetUSDInCents`). | `401 UNAUTHENTICATED`, `400 OFFER_EXCEEDS_INITIAL_BUDGET`, `403 PROPOSAL_ACCESS_FORBIDDEN`, `409 PROPOSAL_NOT_IN_NEGOTIATION` |
| `POST /api/v1/negotiations/proposals/:proposalId/accept` | `SessionAuthGuard`, `WalletVerifiedGuard` | Param: `proposalId`, Body: `AcceptProposalPath1InputSchema` + Header `Idempotency-Key` | `201 Created` → `{ proposalStatus: 'AGREED_PATH_1', publicationStatus: 'AGREED_AND_LOCKED', taskOrder: TaskOrderCard }` (en `PENDING_ESCROW_FUNDING`). | `401 UNAUTHENTICATED`, `403 FORBIDDEN_PROPOSAL_ACCEPTANCE`, `409 OFFER_TERMS_CHANGED_CONFLICT`, `409 PUBLICATION_ALREADY_LOCKED`, `422 WALLET_COLLISION_DETECTED` |
| `POST /api/v1/negotiations/proposals/:proposalId/close` | `SessionAuthGuard` (Buyer o Freelancer de la propuesta) | Param: `proposalId`, Body: `CloseProposalPath2InputSchema` | `200 OK` → `{ proposalStatus: 'DISCREPANCY_CLOSED_PATH_2', publicationStatus: 'OPEN_FOR_PROPOSALS' }`. | `401 UNAUTHENTICATED`, `403 PROPOSAL_ACCESS_FORBIDDEN`, `409 PROPOSAL_ALREADY_RESOLVED` |
| `POST /api/v1/negotiations/gigs/:gigId/hire` | `SessionAuthGuard`, `WalletVerifiedGuard` | Param: `gigId`, Body: `HireFixedGigInputSchema` + Header `Idempotency-Key` | `201 Created` → `{ taskOrder: TaskOrderCard }` en `PENDING_ESCROW_FUNDING` tras validación de Gig activo y acuerdo bilateral al precio fijo. | `401 UNAUTHENTICATED`, `400 GIG_PRICE_NOT_NEGOTIABLE`, `403 SELF_DEALING_FORBIDDEN`, `409 GIG_PRICE_CHANGED_OR_INACTIVE` |

### 5.2. Jobs y Colas en BullMQ (`apps/api/src/modules/timers`)
- Conforme a `CONTEXT.md` §5.2 (`INV-05-03`), la aceptación mutua en `SPEC-05` deja la `TaskOrder` en `PENDING_ESCROW_FUNDING` y el `EscrowLedger` en `AWAITING_FUNDS`. **Los temporizadores contractuales (`INITIAL_DELIVERY_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`) no se encolan en `SPEC-05`**, sino exclusivamente cuando `SPEC-06` confirma la captura del depósito en Rafiki (`ESCROW_LOCKED`).

### 5.3. Flujos de Almacenamiento en Cloudflare R2 o Integraciones Externas
- No se suben archivos a Cloudflare R2 ni se invocan LLMs externos durante la negociación. El clasificador `resolveMvpAiAuditableModality` (`AI-1`) es 100 % determinista y libre de llamadas de red.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas y Componentes Next.js 15 (`FE-1`)
- `apps/web/src/app/(marketplace)/marketplace/publications/[publicationId]/inbox/page.tsx`: **Bandeja de Ofertas Recibidas del Buyer**. Muestra todas las propuestas (`NegotiationProposal`) postuladas por distintos Freelancers sobre una publicación, permitiendo comparar:
  - Monto ofertado (`proposedBudgetUSDInCents`) y porcentaje de ahorro respecto al tope (`initialBudgetUSDInCents`).
  - Plazo propuesto (`1..7` días).
  - Perfil del Freelancer (`displayName`, `headline`, `skills`, divisa de recepción `targetCurrency` y sello de wallet Open Payments verificada).
  - Estado de cada propuesta (`IN_NEGOTIATION`, `AGREED_PATH_1`, `DISCREPANCY_CLOSED_PATH_2`).
- `apps/web/src/features/negotiations/components/NegotiationRoomDrawer.tsx`: **Sala de Negociación Bilateral**.
  - Muestra el tope inmutable de la publicación (`Presupuesto máximo: $X USD`).
  - El input numérico de oferta/contraoferta bloquea cualquier valor `> initialBudgetUSDInCents` o `< $1.00 USD` en tiempo real con validación Zod.
  - Incluye dos acciones claramente diferenciadas con confirmación modal:
    1. **Camino 1 (`Aceptar Oferta y Generar Orden de Escrow`):** Muestra el resumen vinculante (`96 %` para el Freelancer, `4 %` comisión de plataforma, aviso de doble conversión FX asumida por el Buyer y modalidad del Consejero de IA) antes de enviar `AcceptProposalPath1InputSchema`.
    2. **Camino 2 (`Descartar Propuesta por Discrepancia`):** Cierra únicamente el hilo con ese Freelancer mantendo la publicación abierta para los demás postulantes.
- `apps/web/src/features/negotiations/components/FixedGigCheckoutModal.tsx`: Modal de contratación directa sobre un Gig a precio fijo. No contiene campos de regateo; solicita el brief específico dentro de los criterios por defecto del Gig y conduce a la `TaskOrderCard` en `PENDING_ESCROW_FUNDING`.

### 6.2. Escena 3D y Animaciones GSAP (`FE-2`)
- No aplica escena WebGL pesada dentro de la bandeja transaccional para priorizar la legibilidad financiera y tiempos de respuesta inmediatos en formularios de negociación. Las transiciones de apertura del panel lateral (`NegotiationRoomDrawer`) utilizan micro-interacciones CSS/GSAP ligeras con soporte para `prefers-reduced-motion`.

### 6.3. Controles Anti-Fuga en Visor Protegido (si aplica)
- No aplica visor de entregables en `SPEC-05`.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

### 7.1. Validación de Frontera y Autorización por Rol / Modo
1. **Aislamiento Estricto entre Freelancers Competidores (Anti-Bid Sniping):**
   - Un Freelancer con sesión local solo puede consultar o enviar mensajes en una `NegotiationProposal` donde `proposal.freelancerId === req.userId`. Si intenta acceder al `proposalId` de otro Freelancer o al endpoint `/publications/:publicationId/proposals` reservado al Buyer titular, el backend rechaza con `403 PROPOSAL_ACCESS_FORBIDDEN` o `403 FORBIDDEN_PUBLICATION_INBOX`. `req.userId` es el `User.id` resuelto por `SessionAuthGuard`.
2. **Prohibición Absoluta de Auto-Contratación (*Anti Self-Dealing & Wash Trading*):**
   - En `POST /api/v1/negotiations/proposals` y `POST /api/v1/negotiations/gigs/:gigId/hire`, el servidor verifica que:
     - `buyerUserId !== sellerUserId` (un mismo usuario no puede contratarse a sí mismo cambiando de modo `BUYER` a `SELLER`).
     - `buyerWallet.id !== sellerWallet.id` y `buyerWallet.walletAddressUrl !== sellerWallet.walletAddressUrl`.
     - Ninguna de las billeteras de los participantes coincida con `ESCROW_WALLET_ADDRESS` ni con `PLATFORM_OWNER_WALLET_ADDRESS`.
   - Cualquier infracción aborta con `403 SELF_DEALING_FORBIDDEN` o `422 WALLET_COLLISION_DETECTED` y genera alerta en `AuditLog`.
3. **Verificación Bilateral de Billeteras Verificadas en el Instante del Acuerdo:**
   - Antes de emitir la `TaskOrder` en `PENDING_ESCROW_FUNDING`, la transacción vuelve a verificar que **tanto el Buyer como el Freelancer** mantengan su `UserWallet` con `isVerified = true AND isActive = true` en ese preciso instante.

### 7.2. Idempotencia, Bloqueos Transaccionales y Prevención de Race Conditions
1. **Bloqueo Pesimista (`SELECT ... FOR UPDATE`) contra Doble Aceptación:**
   - Al ejecutar `POST /api/v1/negotiations/proposals/:proposalId/accept` (Camino 1), el servicio abre una transacción interactiva Prisma y ejecuta en primer lugar:
     `SELECT id, status, initial_budget_usd_in_cents FROM client_task_publications WHERE id = $1 FOR UPDATE` y `SELECT id, status, proposed_budget_usd_in_cents, proposed_delivery_days FROM negotiation_proposals WHERE id = $2 FOR UPDATE`.
   - Si dos peticiones concurrentes intentan aceptar dos propuestas distintas de la misma publicación, la segunda espera el `FOR UPDATE`, encuentra `publication.status = 'AGREED_AND_LOCKED'` y aborta con `409 PUBLICATION_ALREADY_LOCKED`, impidiendo que nazcan dos `TaskOrder` para una misma publicación.
2. **Protección Anti-TOCTOU (*Bait-and-Switch* de Último Milisegundo):**
   - En una sala de negociación, un actor malicioso podría enviar un cambio de monto un milisegundo antes de que su contraparte pulse *"Aceptar Oferta"*.
   - Para cerrar esta brecha, `AcceptProposalPath1InputSchema` exige `expectedAmountUSDInCents` y `expectedDeliveryDays`. Dentro del bloqueo `FOR UPDATE`, el servidor comprueba `proposal.proposedBudgetUSDInCents === input.expectedAmountUSDInCents && proposal.proposedDeliveryDays === input.expectedDeliveryDays`. Si no coinciden exactamente, aborta con `409 OFFER_TERMS_CHANGED_CONFLICT`.
   - Además, se verifica que el acuerdo sea genuinamente bilateral: el Buyer acepta la última oferta vigente emitida por el Freelancer (o viceversa si la última contraoferta a la baja provino del Buyer).
3. **Una Única Propuesta Activa por Freelancer por Publicación:**
   - Antes de crear una `NegotiationProposal`, el backend verifica que no exista otra propuesta del mismo `freelancerId` sobre el mismo `publicationId` en estado `IN_NEGOTIATION` o `AGREED_PATH_1` (`409 ACTIVE_PROPOSAL_ALREADY_EXISTS`), evitando inundación (*Sybil/Spam flood*) de la bandeja del Buyer.

### 7.3. Sanitización y Congelamiento Inmutable de Criterios (`TaskAcceptanceCriterion`)
- Al crearse la `TaskOrder`, los criterios preliminares de la publicación (o los criterios por defecto del Gig) se copian como registros inmutables en `task_acceptance_criteria` y las restricciones técnicas en `task_technical_constraints` (`max_file_size_bytes = NULL`). Una vez nacida la `TaskOrder`, ni el Buyer ni el Freelancer pueden alterar retroactivamente los criterios que evaluará el Consejero de IA en `SPEC-08` o el Administrador en `SPEC-11`.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Postulación de múltiples Freelancers e intercambio de contraofertas exclusivamente iguales o a la baja
- **Descripción:** Sobre una publicación en `OPEN_FOR_PROPOSALS`, múltiples Freelancers con wallet verificada pueden abrir su propuesta competitiva y enviar mensajes con contraofertas que jamás superen `initialBudgetUSDInCents`.
- **Escenario 1 (Camino Feliz — Postulación y contraoferta a la baja válida):**
  - **Dado** que existe una `ClientTaskPublication` en estado `OPEN_FOR_PROPOSALS` con `initialBudgetUSDInCents = 20000` (`$200.00 USD`) creada por el Buyer `B1`,
  - **Cuando** el Freelancer `F1` (con wallet verificada y `F1.id !== B1.id`) envía `POST /api/v1/negotiations/proposals` con `proposedBudgetUSDInCents = 18000` (`$180.00 USD`) y `proposedDeliveryDays = 5`,
  - **Entonces** el sistema crea la `NegotiationProposal` en `IN_NEGOTIATION`, registra el primer `NegotiationMessage` con `offeredAmountUSDInCents = 18000` y retorna HTTP `201 Created`.
- **Escenario 2 (Error de Validación o Violación de Regla — Intento de ofertar por encima del presupuesto tope):**
  - **Dado** que la publicación tiene `initialBudgetUSDInCents = 20000`,
  - **Cuando** un Freelancer intenta crear una propuesta o enviar un mensaje en `NegotiationMessage` con `proposedBudgetUSDInCents = 20001` (`$200.01 USD`),
  - **Entonces** el sistema rechaza la petición con HTTP `400 OFFER_EXCEEDS_INITIAL_BUDGET` sin modificar el estado de la negociación.
- **Escenario 3 (Seguridad — Intento de auto-postulación / Self-Dealing o de espiar ofertas ajenas):**
  - **Dado** que el propio Buyer `B1` cambia su interfaz a `Seller Mode` e intenta postular a su propia publicación (o el Freelancer `F2` intenta leer `GET /api/v1/negotiations/proposals/:proposalId` perteneciente a `F1`),
  - **Cuando** el controlador evalúa la propiedad y la regla anti-Self-Dealing,
  - **Entonces** bloquea la solicitud con HTTP `403 SELF_DEALING_FORBIDDEN` (o `403 PROPOSAL_ACCESS_FORBIDDEN`).

### `RF-02` — Resolución por Camino 1 (`AGREED_PATH_1`): Aceptación mutua, bloqueo de publicación y creación atómica de `TaskOrder` + `EscrowLedger`
- **Descripción:** Cuando Buyer y Freelancer coinciden en una oferta `<= initialBudgetUSDInCents` y se ejecuta la aceptación en Camino 1, el sistema debe bloquear la publicación, cerrar las demás propuestas competidoras e instanciar atómicamente la `TaskOrder` (`PENDING_ESCROW_FUNDING`) y el `EscrowLedger` (`AWAITING_FUNDS`) con reparto `96 % / 4 %`.
- **Escenario 1 (Camino Feliz — Aceptación en Camino 1 con cierre en cascada de propuestas competidoras):**
  - **Dado** que una `ClientTaskPublication` en `OPEN_FOR_PROPOSALS` (`category = "GRAPHICS_AND_DESIGN"`, `expectedMediaType = "IMAGE_RASTER_VECTOR"`, tope `20000`) tiene dos propuestas en `IN_NEGOTIATION`: `P1` del Freelancer `F1` por `15000` centavos (`$150.00 USD`, 4 días) y `P2` del Freelancer `F2` por `17500` centavos,
  - **Cuando** el Buyer titular acepta `P1` enviando `POST /api/v1/negotiations/proposals/:P1/accept` con `expectedAmountUSDInCents = 15000`, `expectedDeliveryDays = 4` y `buyerAssumesDoubleFxConversion = true`,
  - **Entonces** en una única transacción ACID el sistema: (1) pasa la publicación a `AGREED_AND_LOCKED`, (2) pasa `P1` a `AGREED_PATH_1`, (3) pasa `P2` a `DISCREPANCY_CLOSED_PATH_2` con motivo `OTHER_PROPOSAL_ACCEPTED`, (4) crea la `TaskOrder` en `PENDING_ESCROW_FUNDING` con `totalAmountUSDInCents = 15000`, `platformFeeUSDInCents = 600` (`4 %`), `freelancerPayoutUSDInCents = 14400` (`96 %`), `aiAuditableModality = "IMAGE"` en la tarjeta y sin ningún `ScheduledTimerJob`, y (5) crea el `EscrowLedger` en `AWAITING_FUNDS`. Los montos (`totalAmountUSDInCents = 15000`, `platformFeeUSDInCents = 600`, `freelancerPayoutUSDInCents = 14400`) se persisten en el `EscrowLedger`.
- **Escenario 2 (Seguridad Financiera — Protección contra TOCTOU / Bait-and-Switch o Doble Aceptación Concurrente):**
  - **Dado** que el Buyer envía la aceptación de `P1` esperando `expectedAmountUSDInCents = 15000`, pero el monto vigente en base de datos cambió a `16500` (o la publicación ya fue bloqueada por una petición paralela),
  - **Cuando** la transacción evalúa las filas bajo `SELECT ... FOR UPDATE`,
  - **Entonces** hace rollback inmediato y responde HTTP `409 OFFER_TERMS_CHANGED_CONFLICT` (o `409 PUBLICATION_ALREADY_LOCKED`), garantizando que jamás se cree más de una `TaskOrder` por publicación ni con un monto no consentido.

### `RF-03` — Resolución por Camino 2 (`DISCREPANCY_CLOSED_PATH_2`): Cierre individual por discrepancia manteniendo abierta la publicación
- **Descripción:** Si el Buyer o el Freelancer deciden descartar una propuesta por falta de acuerdo, únicamente esa `NegotiationProposal` se cierra en `DISCREPANCY_CLOSED_PATH_2`, mientras la `ClientTaskPublication` permanece en `OPEN_FOR_PROPOSALS`.
- **Escenario 1 (Camino Feliz — Descarte de una propuesta sin afectar la publicación ni a otros postulantes):**
  - **Dado** que la publicación `PUB-1` está en `OPEN_FOR_PROPOSALS` y tiene las propuestas `P1` y `P2` en `IN_NEGOTIATION`,
  - **Cuando** el Buyer (o el Freelancer de `P1`) invoca `POST /api/v1/negotiations/proposals/:P1/close` con `closedReason = "No hay acuerdo en el alcance de entregables"`,
  - **Entonces** `P1` pasa a `DISCREPANCY_CLOSED_PATH_2` con `closedAt` poblado, `PUB-1` continúa en `OPEN_FOR_PROPOSALS` y `P2` sigue activa en `IN_NEGOTIATION`.
- **Escenario 2 (Error de Validación o Violación de Regla — Intento de enviar mensajes o aceptar una propuesta ya cerrada en Camino 2):**
  - **Dado** que la propuesta `P1` se encuentra en estado `DISCREPANCY_CLOSED_PATH_2`,
  - **Cuando** cualquiera de las partes intenta enviar un nuevo mensaje o aceptarla en Camino 1,
  - **Entonces** el sistema rechaza la operación con HTTP `409 PROPOSAL_NOT_IN_NEGOTIATION`.

### `RF-04` — Contratación de Gig a precio fijo sin negociación (`gigId`)
- **Descripción:** Un Buyer con wallet verificada puede contratar un `Gig` activo a su precio fijo publicado (`priceUSDInCents`), sin posibilidad de regateo, generando la `TaskOrder` en `PENDING_ESCROW_FUNDING` con `gigId` poblado y `proposalId = null`.
- **Escenario 1 (Camino Feliz — Generación de orden desde un Gig a precio fijo):**
  - **Dado** que existe un `Gig` activo en `PROGRAMMING_AND_TECH` (`expectedMediaType = "CODE_ARCHIVE"`) con `priceUSDInCents = 30000` (`$300.00 USD`) e `initialDeliveryDays = 7`,
  - **Cuando** un Buyer distinto del Seller invoca `POST /api/v1/negotiations/gigs/:gigId/hire` confirmando `expectedPriceUSDInCents = 30000` y `buyerAssumesDoubleFxConversion = true`,
  - **Entonces** el sistema crea la `TaskOrder` en `PENDING_ESCROW_FUNDING` con `gigId` vinculado, `proposalId = null`, `aiAuditableModality = null` en la tarjeta, y su `EscrowLedger` en `AWAITING_FUNDS` con `totalAmountUSDInCents = 30000`, `platformFeeUSDInCents = 1200` y `freelancerPayoutUSDInCents = 28800`.
- **Escenario 2 (Error de Validación o Violación de Regla — Intento de alterar el precio fijo del Gig o abrir regateo):**
  - **Dado** que un Buyer envía `expectedPriceUSDInCents = 25000` para un Gig cuyo `priceUSDInCents` en base de datos es `30000`,
  - **Cuando** el backend compara el precio enviado contra el precio oficial del Gig en base de datos,
  - **Entonces** rechaza la solicitud con HTTP `409 GIG_PRICE_CHANGED_OR_INACTIVE` (o `400 GIG_PRICE_NOT_NEGOTIABLE`).

### `RF-05` — Clasificación determinista de modalidad auditable por el Consejero de IA (`resolveMvpAiAuditableModality`)
- **Descripción:** Al crearse cualquier `TaskOrder` (tanto por Gig fijo como por Camino 1 de publicación), el clasificador de `AI-1` debe determinar de forma inmutable si la orden tendrá auditoría del Consejero de IA (`IMAGE` o `TEXT`) o validación determinista + revisión humana (`null`).
- **Escenario 1 (Camino Feliz — Asignación exacta en las 6 categorías del MVP):**
  - **Dado** el conjunto de los 6 `DeliverableMediaType` del MVP al instanciar órdenes en `OrderCreationService`,
  - **Cuando** se ejecuta `resolveMvpAiAuditableModality(expectedMediaType)`,
  - **Entonces** asigna `aiAuditableModality = "IMAGE"` para `IMAGE_RASTER_VECTOR`, `"TEXT"` para `DOCUMENT_TEXT`, y `null` para `CODE_ARCHIVE`, `DATA_CAMPAIGN`, `VIDEO_STREAM` y `AUDIO_TRACK`, como valor derivado de `expectedMediaType` (no se almacena en `task_orders`).
- **Escenario 2 (Error de Validación o Violación de Regla — Rechazo de manipulación manual de `aiAuditableModality`):**
  - **Dado** un payload o contrato donde se intente forzar `aiAuditableModality = "TEXT"` en una orden cuyo `expectedMediaType` es `VIDEO_STREAM`,
  - **Cuando** `TaskOrderCardSchema` evalúa la tarjeta, o se intenta insertar un `AiAdvisorReport` para una entrega de esa orden (`trg_ai_report_mvp_modality`),
  - **Entonces** la validación falla inmediatamente impidiendo persistir una configuración incoherente para el Consejero de IA.

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

### 9.1. Pruebas Unitarias (Vitest)
- **Archivo objetivo:** `packages/shared-schemas/src/__tests__/negotiations-schemas.spec.ts` y las pruebas de `resolveMvpAiAuditableModality` en `packages/shared-schemas`.
- **Casos mínimos requeridos:**
  - Verificación de `RF-01`: rechazo en `FreelancerNegotiationProposalSchema` y `SendNegotiationMessageInputSchema` cuando el monto propuesto supera `initialBudgetUSDInCents` o es `< 100` centavos.
  - Verificación de `RF-02` y `RF-04`: validación de `splitSingleBlockEscrow` (`Math.floor((total * 4) / 100)` y `total - fee`) para montos exactos e impares (ej. `101`, `9999`, `15000` centavos) y exclusión mutua `Boolean(gigId) !== Boolean(proposalId)` en `TaskOrderCardSchema`.
  - Verificación de `RF-05`: pruebas exhaustivas sobre los 6 `DeliverableMediaType` en `resolveMvpAiAuditableModality`.

### 9.2. Pruebas de Integración de API y Base de Datos (Supertest + Prisma)
- **Archivo objetivo:** `apps/api/test/negotiations.e2e-spec.ts`.
- **Casos mínimos requeridos:**
  - Verificación de `RF-01`: bloqueo `403 SELF_DEALING_FORBIDDEN` cuando Buyer y Freelancer son el mismo usuario o comparten `walletAddressUrl`; bloqueo `403 PROPOSAL_ACCESS_FORBIDDEN` cuando un Freelancer intenta leer la propuesta de otro competidor.
  - Verificación de `RF-02` (Concurrencia): disparo simultáneo con `Promise.all` de 2 peticiones `POST /api/v1/negotiations/proposals/:id/accept` sobre dos propuestas de la misma publicación; exactamente una responde `201 Created` (`AGREED_PATH_1`) y la otra responde `409 PUBLICATION_ALREADY_LOCKED`, creándose exactamente 1 `TaskOrder` y 1 `EscrowLedger`.
  - Verificación de `RF-02` (Anti-TOCTOU): si `expectedAmountUSDInCents` no coincide con el último `proposedBudgetUSDInCents` de la propuesta, retorna `409 OFFER_TERMS_CHANGED_CONFLICT`.
  - Verificación de `RF-03`: cierre en Camino 2 (`DISCREPANCY_CLOSED_PATH_2`) comprobando que `ClientTaskPublication.status` permanece en `OPEN_FOR_PROPOSALS`.
  - Verificación de `RF-04`: contratación de Gig fijo creando `TaskOrder` en `PENDING_ESCROW_FUNDING` sin filas en `scheduled_timer_jobs` para esa orden.

### 9.3. Pruebas de UI / E2E / Accesibilidad y Rendimiento (`FE-1`)
- **Archivo objetivo:** `apps/web/src/features/negotiations/__tests__/negotiation-room.spec.tsx`.
- **Casos mínimos requeridos:**
  - Verificación de `RF-01`, `RF-02` y `RF-03`: el formulario de contraoferta impide ingresar un valor superior al tope de la publicación, muestra el desglose `96 % / 4 %` antes de aceptar en Camino 1 y actualiza el estado visual al cerrar por Camino 2.

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Detección | Acción de Recuperación / Rollback | Código HTTP / Evento de Dominio |
| :--- | :--- | :--- | :--- |
| **El Freelancer cambia el monto ofertado milisegundos antes de que el Buyer pulse "Aceptar" (TOCTOU)** | Dentro del `SELECT ... FOR UPDATE`, `proposal.proposedBudgetUSDInCents !== input.expectedAmountUSDInCents`. | Rollback inmediato de la transacción; el frontend refresca el hilo mostrando el nuevo monto para que el Buyer decida con información actualizada. | `409 OFFER_TERMS_CHANGED_CONFLICT` |
| **El Freelancer o el Buyer desactiva su `UserWallet` mientras la negociación estaba abierta** | Al ejecutar `accept` (Camino 1) o `hire` (Gig fijo), la consulta de billeteras activas y verificadas devuelve `null` para alguna de las partes. | La transacción aborta antes de pasar la publicación a `AGREED_AND_LOCKED`, manteniendo la propuesta en `IN_NEGOTIATION` hasta que la parte afectada reactive su wallet verificada. | `422 COUNTERPARTY_WALLET_INACTIVE` |
| **Dos Freelancers o el mismo Buyer disparan acciones simultáneas sobre la misma publicación** | Contención de bloqueo de fila en PostgreSQL (`FOR UPDATE` sobre `client_task_publications`). | Serialización determinista en base de datos: la primera transacción confirma y la segunda recibe el estado ya mutado y responde con código de conflicto sin duplicar órdenes. | `409 PUBLICATION_ALREADY_LOCKED` |
| **Fallo al insertar `EscrowLedger` o `TaskAcceptanceCriterion` tras actualizar la propuesta** | Error de restricción SQL dentro de `prisma.$transaction(...)`. | Rollback atómico completo de `ClientTaskPublication`, `NegotiationProposal` y `TaskOrder`. Ninguna entidad queda en estado huérfano o inconsistente. | `500 TRANSACTION_ROLLBACK` + log estructurado |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

### 11.1. Decisiones Técnicas Cerradas en esta Especificación
1. **Protección Anti-TOCTOU mediante confirmación explícita de términos (`expectedAmountUSDInCents` y `expectedDeliveryDays`):** Ninguna aceptación en Camino 1 ni contratación de Gig fijo se procesa a ciegas; el cliente debe firmar en el payload el monto y plazo exactos que está aceptando.
2. **Aislamiento total entre propuestas competidoras:** Los Freelancers postulantes no conocen ni las identidades ni los montos ofertados por otros Freelancers en la misma publicación (subasta ciega a la baja controlada por el Buyer).
3. **Congelamiento inmutable de criterios y restricciones al nacer la `TaskOrder`:** Al pasar a `PENDING_ESCROW_FUNDING`, los criterios de aceptación se copian a `task_acceptance_criteria` y no pueden ser editados posteriormente.
4. **Sesión local, sin Clerk:** Ofertar, negociar, aceptar, cerrar y contratar un Gig exigen `SessionAuthGuard` de `SPEC-02`. La identidad es `req.userId` (`User.id`). Sin sesión la respuesta es `401 UNAUTHENTICATED`. No se acepta un JWT de Clerk ni un `clerk_id`.

### 11.2. Preguntas Abiertas (Si las hubiera)
- Las decisiones estratégicas pendientes sobre el **TTL máximo para que el Buyer fondee una orden en `PENDING_ESCROW_FUNDING`** (evitando bloqueo indefinido del Freelancer sin fondos en escrow) y la **confirmación explícita de disponibilidad del Seller en Gigs fijos** se plantean detalladamente en la sección final de `planning/taskboard.md`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Herramienta IA / Autor | Resumen del Cambio |
| :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Cursor` + Equipo Humano | Redacción inicial completa de `SPEC-05` (12 secciones, motor de negociación a la baja, bifurcación Camino 1 / Camino 2, contratación de Gig fijo, blindaje anti-Self-Dealing/anti-TOCTOU/FOR UPDATE, clasificador determinista `resolveMvpAiAuditableModality` y 5 RF con escenarios BDD). |
| `0.2.0` | `2026-10-16` | `Cursor` | Alineación con el modelo de datos v2: origen `gigId` XOR `proposalId` sin `publication_id` en la orden, montos y wallets en `EscrowLedger` (incluidas las `PlatformWallet`), ausencia de relojes en lugar de `initialDeadlineAt`, modalidad IA derivada, `scheduled_timer_jobs`, FK compuesta e índices parciales en propuestas, y nombres de `CHECK` y triggers reales de `domain_checks.sql`. |
| `0.3.0` | `2026-10-16` | `Cursor` | Se retira Clerk. Las rutas de negociación usan `SessionAuthGuard` y comparan propiedad con `req.userId`. El código de sesión ausente es `401 UNAUTHENTICATED`, igual que `SPEC-02`. |
| `0.3.1` | `2026-10-16` | `Cursor` | El clasificador de `AI-1` queda en `packages/shared-schemas`. No se crea un servicio en `apps/api`. `BE-1` llama a `resolveMvpAiAuditableModality` al crear la orden. |
| `0.4.0` | `2026-10-17` | `Cursor` | Backend `NegotiationsModule` (propuestas, mensajes, Camino 1/2, hire Gig fijo, TaskOrder+EscrowLedger en memoria/Prisma), contratos Zod, tests HTTP RF-01..RF-04, harness FE `/marketplace/negotiations`. |

# SPEC-06: Custodia única, desembolso 96/4 y reembolso 100

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-06` |
| **Archivo** | `specs/SPEC-06.md` |
| **Fase de Desarrollo** | `Fase 3 — Orquestación de pago único en escrow` |
| **Estado del Ciclo SDD** | `Implementada (IMPLEMENTED)` — backend Escrow (BE-2) + gateway simulado + harness FE mínimo; Open Payments real queda 🛡️ `T-F3-BE1-01` |
| **Roles Responsables** | `BE-1`, `BE-2`, `FE-1`, `FE-2`, `AI-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F3-BE1-01`, `T-F3-BE2-01`, `T-F3-FE1-01`, `T-F3-FE2-01`, `T-F3-AI1-01` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ BE-1 en open-payments.service.ts y escrow-payment.service.ts)` |
| **Dependencias SDD** | `SPEC-02`, `SPEC-05` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Esta spec cubre el único movimiento de dinero del MVP: el Buyer fondea el 100 % en `taskstream-escrow`, y más adelante esa custodia sale como 96 % al Freelancer más 4 % a la wallet del dueño, o como reembolso del 100 % al Buyer. La orden llega desde `SPEC-05` en `PENDING_ESCROW_FUNDING`. Aquí pasa a `ESCROW_LOCKED` solo cuando el incoming payment queda completado. Los relojes de `SPEC-09` no se encolan en esta redacción hasta que ese fondeo esté confirmado.

### 1.2. En Alcance del MVP

- Fondeo del 100 % con `receiveAmount` fijo en USD. El Buyer asume el FX de entrada.
- Dos `OutgoingPayment` al completar: `freelancerPayoutIdempotencyKey` (96 %) y `platformFeePayoutIdempotencyKey` (4 % a `platformOwnerWalletAddress`, distinta del escrow).
- Reembolso del 100 % con `debitAmount` fijo y `buyerRefundIdempotencyKey`. La actividad muere y el Freelancer queda desligado.
- Idempotencia en `OpenPaymentsTransaction` y receptor `POST /api/v1/webhooks/rafiki`.
- Checkout de `FE-1` y escena de bóveda de `FE-2`.
- Pruebas de `splitSingleBlockEscrow` y de las cuatro claves SHA-256, a cargo de `AI-1` en `packages/shared-schemas`.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No hay hitos ni pagos fraccionados.
- No se encolan `INITIAL_DELIVERY_7D`, `DELIVERY_REVIEW_32H` ni `FINAL_CLAIM_WINDOW_30M`. Eso es `SPEC-09`.
- No se decide una disputa. Eso es `SPEC-10`.
- No se redacta ni se llama a `AiAdvisorService`. Eso es `SPEC-08`.
- La IA no genera ni reescribe `apps/api/src/modules/open-payments/open-payments.service.ts` ni `apps/api/src/modules/open-payments/escrow-payment.service.ts`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§5.1, §5.4, §5.5), `planning/taskboard.md` (§3 reglas 1, 5 y 8) y `packages/shared-schemas/src/money.ts`.
- **Invariantes del Módulo:**
  1. `platformFeeUSDInCents = Math.floor((totalAmountUSDInCents * 4) / 100)` y `freelancerPayoutUSDInCents = total - platformFee`. El total es entero en `[100, 50_000_000]`.
  2. `100 = 96 + 4` en centavos enteros. El 4 % no permanece como saldo informal dentro del escrow.
  3. El reembolso debita el 100 % de los centavos USD custodiados. El Buyer asume el FX de vuelta.
  4. Las claves son las funciones ya exportadas: `escrowLockIdempotencyKey`, `freelancerPayoutIdempotencyKey`, `platformFeePayoutIdempotencyKey` y `buyerRefundIdempotencyKey`.
  5. Sin wallet verificada y activa de ambas partes no hay fondeo (`403 WALLET_NOT_VERIFIED`).

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Checkout del 100 % y estados del fondeo (`T-F3-FE1-01`). | MSW de `EscrowFundingViewSchema` | No |
| **`FE-2`** | Escena de bóveda ligada al estado, no a un pago real (`T-F3-FE2-01`). | Eventos `ESCROW_LOCKED` / `REFUNDED` / `COMPLETED` simulados | No |
| **`BE-1`** | `escrow-payment.service.ts`: grant, incoming, quote y dos outgoing (`T-F3-BE1-01`). | Sandbox Test Wallet. La IA no escribe este archivo | `🛡️ Sí` |
| **`BE-2`** | Fila única en `OpenPaymentsTransaction` y webhook Rafiki (`T-F3-BE2-01`). | Fixture JSON de `incoming_payment.completed` | No |
| **`AI-1`** | Pruebas de `splitSingleBlockEscrow` y de las claves, sin tocar `apps/api` (`T-F3-AI1-01`). | `contracts.test.ts` | No |

### 3.1. Contrato frente a implementación

El contrato que desbloquea a los tres frentes ya existe en `packages/shared-schemas`: `splitSingleBlockEscrow` y las cuatro funciones de idempotencia. `FE-1` pinta el desglose con el mock `mockTaskOrderCard`. `FE-2` anima con un enum de estado. `AI-1` prueba la aritmética sin Rafiki. `BE-1` es el único que habla con Open Payments, y esa implementación es manual. La dependencia de contrato no espera a esa implementación.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

No se crea un segundo cálculo de comisión. Se reutiliza `splitSingleBlockEscrow`. La vista que comparten checkout y bóveda es:

```typescript
export const EscrowFundingViewSchema = z.object({
  taskId: z.string().uuid(),
  lifecycleStatus: z.enum(['PENDING_ESCROW_FUNDING', 'ESCROW_LOCKED', 'COMPLETED', 'REFUNDED']),
  totalAmountUSDInCents: z.number().int().min(100).max(50_000_000),
  freelancerPayoutUSDInCents: z.number().int().nonnegative(),
  platformFeeUSDInCents: z.number().int().nonnegative(),
  interactRedirectUri: z.string().url().nullable(),
});
```

El mock de trabajo es `mockTaskOrderCard()`. Un fixture de webhook no mueve dinero: `{ eventType: 'incoming_payment.completed', taskId, idempotencyKey }`.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

`EscrowLedger` guarda montos y las cuatro wallets. `OpenPaymentsTransaction` guarda la clave única. `RafikiWebhookEvent` guarda el evento ya visto. El `CHECK` vigente es `chk_escrow_exact_96_4_split`. Esta spec no añade columnas de saldo a `User`.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

La sesión es la de `SPEC-02`: `SessionAuthGuard` y `req.userId`. No hay `ClerkAuthGuard`.

| Método y ruta | Guardas | Respuesta | Errores |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/orders/:taskId/escrow/fund` | `SessionAuthGuard`, `WalletVerifiedGuard`, solo el Buyer | `202` + `EscrowFundingViewSchema` con `interactRedirectUri` | `401 UNAUTHENTICATED`, `403 WALLET_NOT_VERIFIED`, `409 ESCROW_ALREADY_LOCKED` |
| `POST /api/v1/webhooks/rafiki` | Firma del emisor, sin sesión de usuario | `204` | `401 RAFIKI_WEBHOOK_INVALID` |
| `GET /api/v1/orders/:taskId/escrow` | `SessionAuthGuard`, Buyer o Seller de la orden | `EscrowFundingViewSchema` | `403 ESCROW_FORBIDDEN` |

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

Open Payments, solo dentro del servicio manual `🛡️`: incoming con `receiveAmount` igual al total; al liberar, dos outgoing con `debitAmount` de 96 % y de 4 %; al reembolsar, un outgoing con `debitAmount` del 100 %. `token.rotate` y `token.revoke` quedan en ese mismo archivo. No hay cola BullMQ en esta spec. No hay R2. No hay llamada al modelo de IA.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

`/orders/[taskId]/escrow` muestra el total, el 96 % y el 4 %, y el aviso de doble FX. Estados: esperando consentimiento, custodiado, completado, reembolsado, error de grant. El botón de fondeo no aparece si `GET /api/v1/auth/session` no tiene usuario.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

La bóveda vive en un Client Component cargado con `next/dynamic(..., { ssr: false })`. El estado de la orden entra como prop. La cámara se mueve con `useGSAP` sobre refs. Está prohibido guardar la posición de scroll en estado de React. No hay visor de entregables.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** sesión local de `SPEC-02`. El `userId` de la sesión debe ser el Buyer para fondear. Un tercero recibe `403 ESCROW_FORBIDDEN`.
- **Idempotencia e Integridad Criptográfica:** repetir el fondeo con la misma clave no crea un segundo incoming. Repetir el webhook con el mismo identificador de evento responde `204` y no vuelve a pasar la orden a `ESCROW_LOCKED`. La clave privada `Ed25519` no se commitea y no la escribe la IA.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Fondeo del 100 %
- **Origen:** `T-F3-BE1-01`, `T-F3-FE1-01` / `.agents/CONTEXT.md` §5.1
- **Rol(es):** `BE-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden en `PENDING_ESCROW_FUNDING` de 10000 centavos y un Buyer con sesión local y wallet verificada
  - **Cuando** el Buyer confirma el fondeo y Rafiki completa el incoming
  - **Entonces** `EscrowLedger` queda fondeado, la orden pasa a `ESCROW_LOCKED` y no se encola ningún reloj de `SPEC-09` dentro de esta spec

### `RF-02` — Desembolso 96/4
- **Origen:** `T-F3-BE1-01` / `.agents/CONTEXT.md` §5.1
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden de 15000 centavos cuyo cierre sin disputa ya fue ordenado por `SPEC-09` o `SPEC-10`
  - **Cuando** el servicio manual ejecuta los dos outgoing
  - **Entonces** salen 14400 centavos al Freelancer y 600 a la wallet del dueño, y la orden queda `COMPLETED`

### `RF-03` — Reembolso del 100 %
- **Origen:** `T-F3-BE1-01` / `.agents/CONTEXT.md` §5.1
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden custodiada cuyo motivo de reembolso ya decidió `SPEC-09` o `SPEC-10`
  - **Cuando** el servicio debita el total custodiado hacia el Buyer
  - **Entonces** la orden queda `REFUNDED`, no hay comisión del 4 % y el Freelancer queda desligado

### `RF-04` — Idempotencia y webhook
- **Origen:** `T-F3-BE2-01` / `.agents/CONTEXT.md` §5.4
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un `incoming_payment.completed` ya persistido en `RafikiWebhookEvent`
  - **Cuando** el mismo evento llega otra vez
  - **Entonces** la respuesta es `204` y sigue existiendo una sola fila de bloqueo para esa clave

### `RF-05` — Invariante matemática
- **Origen:** `T-F3-AI1-01` / `planning/taskboard.md` §3 regla 8
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** los totales 100, 101, 15000 y 50000000
  - **Cuando** se ejecuta `splitSingleBlockEscrow`
  - **Entonces** la suma de las dos partes es el total, el fee es `Math.floor((total * 4) / 100)` y un total de 99 lanza `INVALID_TOTAL_AMOUNT`

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-05` | `Unitaria` | `splitSingleBlockEscrow` y las cuatro claves SHA-256 en `packages/shared-schemas`, sin red. | `AI-1` |
| `TEST-02` | `RF-01`, `RF-04` | `Integración` | El webhook repetido no duplica `OpenPaymentsTransaction`. Lo ejecuta `BE-2` con fixture. | `BE-2` |
| `TEST-03` | `RF-02`, `RF-03` | `Integración` | Dos outgoing 96/4 y un reembolso 100 contra la Test Wallet. Autoría manual. | `BE-1` |
| `TEST-04` | `RF-01` | `Integración` | El checkout muestra 96/4 y no fondea sin sesión. | `FE-1` |
| `TEST-05` | `RF-01` | `Unitaria` | La bóveda cambia de pose con el enum y no lee el scroll desde estado de React. | `FE-2` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| El grant del Buyer expira antes de pagar | `ESCROW_GRANT_EXPIRED` | La orden sigue en `PENDING_ESCROW_FUNDING`. No hay reloj de entrega. |
| El outgoing del 4 % falla después del 96 % | `PLATFORM_FEE_PAYOUT_FAILED` | No se marca `COMPLETED`. La clave del 4 % permite reintento sin un segundo pago al Freelancer. |
| Webhook con firma inválida | `RAFIKI_WEBHOOK_INVALID` | `401` y cero escrituras. |
| Total fuera de rango | `INVALID_TOTAL_AMOUNT` | No se crea quote. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Estas decisiones ya están abiertas en `planning/taskboard.md` §4. Esta spec no las cierra:

1. `DEC-OPEN-01`: si el Gig fijo exige una confirmación extra del Freelancer antes del fondeo.
2. `DEC-OPEN-02`: TTL de `PENDING_ESCROW_FUNDING`. No se crea el job `ESCROW_FUNDING_TIMEOUT_24H` hasta que el líder lo cierre.
3. `DEC-OPEN-04`: el desembolso diferido usa la clave de la plataforma sobre el escrow, no el grant corto del Buyer. Queda como recomendación del tablero, no como cierre.
4. `DEC-OPEN-05`: el reembolso devuelve el 100 % de los centavos USD custodiados. El monto en la moneda del Buyer puede cambiar por el FX del día. La UI debe decirlo; la cifra USD no se recalcula.

La autenticación vigente es la sesión local de `SPEC-02`. Esta spec no define login con Clerk. El tablero tenía texto viejo de Clerk en `T-F1-FE1-01` y `T-F1-BE2-01`; se alineó al registro local sin cambiar el estado de esas tareas.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-06`: fondeo 100 %, 96/4, reembolso 100 %, idempotencia, frontera `🛡️` y pruebas matemáticas de `AI-1` fuera de `apps/api`. |
| `0.2.0` | `2026-10-17` | `Implementada (IMPLEMENTED)` | `Cursor` | Backend `EscrowModule`: fund `202`, webhook Rafiki idempotente `204`, vistas `EscrowFundingViewSchema`, simuladores release/refund (sin tocar `escrow-payment.service.ts`). Harness `/orders/escrow`. Tests HTTP + contratos `splitSingleBlockEscrow`/claves. |

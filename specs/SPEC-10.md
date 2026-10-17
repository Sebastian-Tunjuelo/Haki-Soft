# SPEC-10: Disputa administrativa binaria

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-10` |
| **Archivo** | `specs/SPEC-10.md` |
| **Fase de Desarrollo** | `Fase 5 — Disputas y arbitraje` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `BE-1`, `BE-2`, `FE-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F5-BE1-02`, `T-F5-BE2-02`, `T-F5-FE1-02` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ el movimiento de fondos lo hace escrow-payment.service.ts)` |
| **Dependencias SDD** | `SPEC-06`, `SPEC-08`, `SPEC-09` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Hay dos puertas hacia `DISPUTED`: el Buyer pide mediación tras la segunda re-entrega, o pide disputa dentro de los 30 minutos. En cuanto la disputa existe, el job `FINAL_CLAIM_WINDOW_30M` se cancela y nadie cobra ni recibe reembolso automático. Un administrador con `PlatformRole.ADMIN` decide, con justificación, el 100 % al Buyer o el 96/4 al Freelancer. El informe de IA, si hubo, es una prueba más. No decide.

### 1.2. En Alcance del MVP

- Apertura de `DisputeCase`, suspensión del job de 30 minutos y bloqueo de payouts automáticos (`T-F5-BE1-02`).
- Consola del administrador (`T-F5-FE1-02`).
- Aviso de apertura y de resultado, reutilizando el outbox de `T-F5-BE2-02` definido en `SPEC-09`.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No hay resolución en tres partes ni porcentaje intermedio.
- No hay apelación.
- `AI-1` no tiene entregable. No reentrena ni reescribe el informe durante la disputa.
- `FE-2` no tiene visor nuevo. La consola reutiliza el preview de `SPEC-07`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§5.3 etapa 3, §12 reglas 1 y 2).
- **Invariantes del Módulo:**
  1. Mientras `DisputeCase` está abierto, no hay outgoing automático.
  2. La decisión es `BUYER_FULL_REFUND` o `FREELANCER_SPLIT_96_4`.
  3. `justification` tiene entre 20 y 2000 caracteres. Sin ese texto no hay decisión.
  4. Reembolso a favor del Buyer: actividad muerta y Freelancer desligado.
  5. Una orden tiene como máximo un `DisputeCase`.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Consola de arbitraje (`T-F5-FE1-02`). | `DisputeCaseViewSchema` | No |
| **`FE-2`** | Sin trabajo. | No | No |
| **`BE-1`** | Apertura, congelamiento y decisión (`T-F5-BE1-02`). Ordena el dinero a `SPEC-06`. | Doble de escrow y job cancelable en memoria | `🛡️ Sí` en el servicio de pagos |
| **`BE-2`** | Encola el aviso de `T-F5-BE2-02` al abrir y al cerrar. | Outbox de `SPEC-09` | No |
| **`AI-1`** | Sin trabajo. El historial de informes se lee, no se regenera. | `mockAiAdvisorReport()` si el panel lo necesita | No |

### 3.1. Contrato frente a implementación

`FE-1` construye la consola con un caso fixture que incluye criterios, entregas y un informe o `null`. `BE-1` prueba la cancelación del job sin UI. `BE-2` prueba que el aviso sale con el mismo contrato de `SPEC-09`. La integración exige que, tras `201` de apertura, el job de 30 minutos quede cancelado y `GET` de la consola devuelva el mismo `disputeId`.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

```typescript
export const OpenDisputeSchema = z.object({
  taskId: z.string().uuid(),
  reason: z.string().trim().min(10).max(2000),
});

export const ResolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  decision: z.enum(['BUYER_FULL_REFUND', 'FREELANCER_SPLIT_96_4']),
  justification: z.string().trim().min(20).max(2000),
});

export const DisputeCaseViewSchema = z.object({
  disputeId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(['OPEN', 'RESOLVED']),
  decision: z.enum(['BUYER_FULL_REFUND', 'FREELANCER_SPLIT_96_4']).nullable(),
  justification: z.string().nullable(),
});
```

Fixture de consola: un `DisputeCaseViewSchema` abierto, dos criterios y `mockAiAdvisorReport()` opcional.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

`DisputeCase` ya existe, uno por orden. Al abrir, `TaskOrder.lifecycleStatus` pasa a `DISPUTED`. Al resolver, pasa a `REFUNDED` o a `COMPLETED` según la decisión. `ScheduledTimerJob` del tipo `FINAL_CLAIM_WINDOW_30M` queda cancelado en la misma transacción.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

Sesión local. El administrador no se identifica con Clerk.

| Método y ruta | Guardas | Efecto | Errores |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/orders/:taskId/disputes` | Buyer de la orden, tras la 2.ª re-entrega o dentro de los 30 minutos | `201` y `DISPUTED` | `409 DISPUTE_WINDOW_CLOSED`, `409 DISPUTE_ALREADY_OPEN` |
| `GET /api/v1/admin/disputes/:disputeId` | `PlatformRole.ADMIN` | `DisputeCaseViewSchema` más referencias a criterios, entregas e informe | `403 ADMIN_ONLY` |
| `POST /api/v1/admin/disputes/:disputeId/resolve` | `PlatformRole.ADMIN` | Aplica `ResolveDisputeSchema` y ordena el dinero | `409 DISPUTE_ALREADY_RESOLVED` |

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

Cancelar `FINAL_CLAIM_WINDOW_30M` es síncrono en la transacción de apertura. No se crea un job nuevo de disputa. El dinero sale por `SPEC-06`. No se regenera el informe de IA. No hay archivo nuevo en R2.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

`/admin/disputes/[disputeId]` muestra criterios congelados, entregas, el informe si no es `null`, y un campo obligatorio de justificación. Dos acciones: 100 % al Buyer, o 96/4 al Freelancer. El botón no se envía con la justificación vacía. El Buyer, en la orden, ve el botón de disputa solo en las dos puertas dichas. Estados: abierta, resuelta, no autorizada.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No aplica en esta especificación. La consola incrusta el visor ya especificado, sin canvas de scroll.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** un Seller no abre la disputa. Un Buyer no resuelve. Un usuario sin rol admin recibe `403 ADMIN_ONLY`.
- **Idempotencia e Integridad Criptográfica:** resolver dos veces no crea dos outgoing. La clave de reembolso o de payout es la de `SPEC-06`. El texto de la disputa se muestra como dato, no como instrucción del sistema.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Disputa en los 30 minutos
- **Origen:** `T-F5-BE1-02` / `.agents/CONTEXT.md` §5.3
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden en `FINAL_CLAIM_WINDOW_30M` con el job aún activo
  - **Cuando** el Buyer abre la disputa
  - **Entonces** el job queda cancelado, la orden pasa a `DISPUTED` y no se programa la liberación 96/4

### `RF-02` — Mediación tras la segunda corrección
- **Origen:** `T-F5-BE1-02` / `.agents/CONTEXT.md` §5.3 etapa 3
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** `revisionsUsed = 2` y la segunda re-entrega en revisión
  - **Cuando** el Buyer pide mediación en lugar de aceptar
  - **Entonces** nace un `DisputeCase` abierto y los fondos siguen custodiados

### `RF-03` — Decisión binaria
- **Origen:** `T-F5-BE1-02`, `T-F5-FE1-02`
- **Rol(es):** `BE-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un administrador y una justificación de al menos 20 caracteres
  - **Cuando** elige `BUYER_FULL_REFUND`
  - **Entonces** se ordena el reembolso del 100 %, la orden queda `REFUNDED` y el Freelancer queda desligado

### `RF-04` — Decisión a favor del Freelancer
- **Origen:** `T-F5-BE1-02`
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el mismo caso abierto
  - **Cuando** el administrador elige `FREELANCER_SPLIT_96_4`
  - **Entonces** se ordena la liberación 96/4 y la orden queda `COMPLETED`

### `RF-05` — Aviso de disputa
- **Origen:** `T-F5-BE2-02`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** una disputa recién abierta
  - **Cuando** la transacción confirma
  - **Entonces** el outbox tiene un aviso para Buyer y Freelancer, y un fallo de correo no reabre el job de 30 minutos

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-02` | `Integración` | Abrir disputa cancela el job y no deja un segundo caso. | `BE-1` |
| `TEST-02` | `RF-03`, `RF-04` | `Integración` | Cada decisión ordena un solo movimiento y rechaza la segunda llamada. | `BE-1` |
| `TEST-03` | `RF-03` | `Unitaria` | La consola no envía justificación corta y muestra las dos acciones. | `FE-1` |
| `TEST-04` | `RF-05` | `Unitaria` | El outbox registra apertura y resultado. | `BE-2` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| La disputa llega cuando el job de 30 minutos ya liberó el dinero | `DISPUTE_WINDOW_CLOSED` | No se abre el caso. No se revierte un `COMPLETED` ya confirmado por el proveedor. |
| La justificación va vacía | `DISPUTE_JUSTIFICATION_REQUIRED` | No hay decisión y el caso sigue `OPEN`. |
| El payout de la decisión falla | `DISPUTE_SETTLEMENT_PENDING` | El caso no pasa a `RESOLVED`. Se reintenta con la misma clave de `SPEC-06`. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes sobre el carácter binario de la decisión: eso ya está cerrado en `.agents/CONTEXT.md` §5.3. `DEC-OPEN-05` (el FX del reembolso) se muestra con el texto de `SPEC-06` y no se recalcula aquí.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-10`: apertura, congelamiento, decisión binaria y consola, sin regenerar el informe de IA. |

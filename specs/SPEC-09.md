# SPEC-09: Relojes, extensión única y dos correcciones

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-09` |
| **Archivo** | `specs/SPEC-09.md` |
| **Fase de Desarrollo** | `Fase 5 — Relojes, correcciones y ventana final` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `BE-2`, `BE-1`, `FE-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F5-BE2-01`, `T-F5-BE1-01`, `T-F5-BE2-02`, `T-F5-FE1-01` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ el reembolso lo ejecuta escrow-payment.service.ts)` |
| **Dependencias SDD** | `SPEC-06`, `SPEC-07` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Con el escrow ya fondeado, esta spec pone los cinco relojes y las reglas de extensión y de corrección. El Freelancer tiene 7 días. Solo al vencer, y una sola vez, puede pedir hasta 7 días más. El Buyer tiene 24 horas para responder. Cada entrega abre 32 horas de revisión, con máximo dos correcciones en toda la orden. La aceptación, expresa o por silencio, abre 30 minutos. Si nadie disputa, `SPEC-06` libera 96/4. Si el plazo muere sin entrega válida, `SPEC-06` reembolsa el 100 % y la actividad muere.

### 1.2. En Alcance del MVP

- Jobs `INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H` y `FINAL_CLAIM_WINDOW_30M` (`T-F5-BE2-01`).
- Una extensión, solo al vencer, y contador `revisionsUsed` de 0 a 2 (`T-F5-BE1-01`).
- UI de cuentas regresivas y del contador (`T-F5-FE1-01`).
- Avisos por correo de esos plazos (`T-F5-BE2-02`). El mismo servicio de aviso también lo usa `SPEC-10`; el contrato de notificación queda aquí.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se abre ni se resuelve una disputa. Eso es `SPEC-10`. Esta spec solo deja el job de 30 minutos cancelable.
- No se escribe la llamada a Rafiki. Se pide a `escrow-payment.service.ts` el reembolso o la liberación ya especificados en `SPEC-06`.
- No hay segunda extensión.
- `FE-2` y `AI-1` no tienen entregable. El informe de IA, si existe, ya lo muestra `SPEC-08`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§5.3, §12 reglas 1 a 3) y `planning/taskboard.md` (§3 reglas 1 y 2).
- **Invariantes del Módulo:**
  1. Sin entrega y sin solicitud de extensión al vencer los 7 días: `AUTO_REFUNDED_INITIAL_EXPIRED`.
  2. Extensión rechazada: `REFUNDED`. Silencio de 24 horas: `AUTO_REFUNDED_BY_TIMEOUT`. Extensión vencida sin entrega: `AUTO_REFUNDED_EXTENDED_EXPIRED`.
  3. Silencio de 32 horas: aceptación automática y paso a `FINAL_CLAIM_WINDOW_30M`.
  4. Silencio de 30 minutos: liberación 96/4 y `COMPLETED`.
  5. `revisionsUsed` no vuelve a 0 con una extensión ni con otra entrega.
  6. Todo reembolso desliga al Freelancer. No existe `REFUNDED_AND_REOPENED`.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Relojes visibles, extensión y contador 0/2 (`T-F5-FE1-01`). | `OrderClockViewSchema` por MSW | No |
| **`FE-2`** | Sin escena nueva. | No bloquea | No |
| **`BE-1`** | Reglas de una extensión y dos correcciones (`T-F5-BE1-01`). Pide el movimiento de dinero al servicio `🛡️`, no lo reimplementa. | Reloj en memoria y doble de escrow | `🛡️ Sí` en el archivo de pagos |
| **`BE-2`** | Cinco jobs y correos (`T-F5-BE2-01`, `T-F5-BE2-02`). | Reloj con `now` inyectado y outbox de correo | No |
| **`AI-1`** | Sin trabajo. No clasifica plazos. | No | No |

### 3.1. Contrato frente a implementación

`FE-1` pinta cualquier combinación de estado y `deadlineAt` del mock, sin Redis. `BE-2` prueba los jobs con un reloj falso, sin UI. `BE-1` prueba las transiciones con un escrow que solo registra la orden de reembolso o de liberación. El punto de integración es el nombre del job y el `lifecycleStatus` resultante.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

Se reutiliza `DeadlineExtensionRequestSchema` de `.agents/CONTEXT.md` §8.2. La vista de pantalla es:

```typescript
export const OrderClockViewSchema = z.object({
  taskId: z.string().uuid(),
  lifecycleStatus: TaskLifecycleStatusEnum,
  revisionsUsed: z.number().int().min(0).max(2),
  maxRevisions: z.literal(2),
  activeDeadlineAt: z.string().datetime().nullable(),
  extensionRequest: DeadlineExtensionRequestSchema.optional(),
});
```

`mockDeadlineExtensionRequest()` ya existe. Un fixture de job es `{ jobName: 'INITIAL_DELIVERY_7D', taskId, fireAt }`.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

`ScheduledTimerJob` guarda un job activo por orden y tipo. `DeadlineExtensionRequest` guarda la única solicitud. `TaskOrder.lifecycleStatus` es el estado visible. Cancelar un job de 30 minutos no borra la fila: la marca cancelada para que un duplicado no libere el dinero.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

Sesión local. No hay Clerk.

| Método y ruta | Guardas | Efecto | Errores |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/orders/:taskId/extension` | Seller, solo al vencer el plazo inicial | Crea `EXTENSION_REQUESTED` y el job de 24 h | `409 EXTENSION_NOT_YET_ALLOWED`, `409 EXTENSION_ALREADY_USED` |
| `POST /api/v1/orders/:taskId/extension/decision` | Buyer | Aprueba hasta 7 días o rechaza y pide reembolso | `409 EXTENSION_NOT_PENDING` |
| `POST /api/v1/orders/:taskId/deliverables/:id/accept` | Buyer, orden en `IN_REVIEW` | Pasa a `FINAL_CLAIM_WINDOW_30M` y encola 30 min | `409 NOT_IN_REVIEW` |
| `POST /api/v1/orders/:taskId/revisions` | Buyer, `revisionsUsed < 2` | `REVISION_REQUESTED` y suma 1 | `409 REVISION_LIMIT_REACHED` |
| `GET /api/v1/orders/:taskId/clock` | Buyer o Seller | `OrderClockViewSchema` | `403 ORDER_FORBIDDEN` |

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

| Job | Disparo | Resultado si nadie actúa |
| :--- | :--- | :--- |
| `INITIAL_DELIVERY_7D` | Entra en `ESCROW_LOCKED` | Reembolso 100 % si no hay entrega ni extensión |
| `EXTENSION_RESPONSE_24H` | Se pide la extensión | `AUTO_REFUNDED_BY_TIMEOUT` |
| `EXTENDED_DELIVERY_UP_TO_7D` | El Buyer aprueba | `AUTO_REFUNDED_EXTENDED_EXPIRED` |
| `DELIVERY_REVIEW_32H` | Hay entrega en revisión | Aceptación automática y job de 30 min |
| `FINAL_CLAIM_WINDOW_30M` | Aceptación expresa o automática | Liberación 96/4 si el job no fue cancelado |

El correo usa Resend con plantillas por evento: extensión pedida, reembolso, aceptación automática, ventana de 30 minutos. No hay R2 nuevo. No hay modelo.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

`/orders/[taskId]` muestra el plazo, el contador `0/2`, `1/2` o `2/2`, y la ventana de 30 minutos cuando aplica. El botón de extensión solo se habilita cuando el reloj inicial está vencido y no hay una extensión usada. Si `revisionsUsed` es 2, no hay botón de nueva corrección: aceptar o pedir mediación, y ese segundo camino es `SPEC-10`. Estados de carga y de `401` si no hay sesión.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No aplica en esta especificación. El visor ya está especificado en `SPEC-07`.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** el Seller no acepta su propia entrega. El Buyer no pide la extensión. Un job atrasado que llega después de un reembolso no vuelve a mover dinero.
- **Idempotencia e Integridad Criptográfica:** la clave de reembolso o de payout es la de `SPEC-06`. Disparar dos veces el mismo job no crea dos outgoing. No hay prompt de usuario en este módulo.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Siete días sin entrega
- **Origen:** `T-F5-BE2-01` / `.agents/CONTEXT.md` §5.3 etapa 4
- **Rol(es):** `BE-2`, `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden en `ESCROW_LOCKED` cuyo job `INITIAL_DELIVERY_7D` vence sin entrega y sin extensión
  - **Cuando** el worker corre
  - **Entonces** pide el reembolso del 100 % y la orden queda `AUTO_REFUNDED_INITIAL_EXPIRED`

### `RF-02` — Extensión única al vencer
- **Origen:** `T-F5-BE1-01` / `.agents/CONTEXT.md` §5.3
- **Rol(es):** `BE-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el plazo inicial aún no vence
  - **Cuando** el Seller pide extensión
  - **Entonces** la API responde `409 EXTENSION_NOT_YET_ALLOWED` y no crea la solicitud

### `RF-03` — Silencio de 24 horas
- **Origen:** `T-F5-BE2-01`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** `EXTENSION_REQUESTED` y el job de 24 horas vencido
  - **Cuando** nadie decidió
  - **Entonces** la orden queda `AUTO_REFUNDED_BY_TIMEOUT`

### `RF-04` — Revisión de 32 horas y dos correcciones
- **Origen:** `T-F5-BE1-01`, `T-F5-FE1-01`
- **Rol(es):** `BE-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** `revisionsUsed = 2`
  - **Cuando** el Buyer pide otra corrección
  - **Entonces** la API responde `409 REVISION_LIMIT_REACHED` y el contador sigue en 2

### `RF-05` — Ventana de 30 minutos
- **Origen:** `T-F5-BE2-01` / `.agents/CONTEXT.md` §5.3 etapa 2
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** una aceptación y 30 minutos sin cancelación del job
  - **Cuando** vence `FINAL_CLAIM_WINDOW_30M`
  - **Entonces** se pide la liberación 96/4 y la orden queda `COMPLETED`

### `RF-06` — Aviso
- **Origen:** `T-F5-BE2-02`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** una extensión pedida
  - **Cuando** se persiste `EXTENSION_REQUESTED`
  - **Entonces** queda un aviso pendiente para el Buyer con el plazo de 24 horas, sin bloquear la transacción si el correo falla

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-03`, `RF-05` | `Integración` | Reloj inyectado: 7 días, 24 horas y 30 minutos disparan el estado esperado una sola vez. | `BE-2` |
| `TEST-02` | `RF-02`, `RF-04` | `Integración` | Extensión anticipada y tercera corrección se rechazan. | `BE-1` |
| `TEST-03` | `RF-02`, `RF-04` | `Unitaria` | La UI oculta la extensión antes de vencer y muestra `2/2` sin nuevo botón de corrección. | `FE-1` |
| `TEST-04` | `RF-06` | `Unitaria` | El outbox registra el aviso aunque el adaptador de correo falle. | `BE-2` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| El job de 7 días y la petición de extensión llegan juntos | `EXTENSION_RACE` | Una transacción con bloqueo de la orden. Gana un solo resultado: o hay extensión pendiente o hay reembolso, nunca los dos. |
| El servicio de pagos rechaza el reembolso | `REFUND_NOT_CONFIRMED` | La orden no cambia a reembolsada. El job queda reintentable. |
| Correo caído | `NOTICE_DEFERRED` | La transición de estado se confirma. El aviso se reintenta. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

`DEC-OPEN-03` sigue abierto en `planning/taskboard.md`: en el instante exacto del día 7 el Freelancer podría no tener tiempo de pulsar la extensión si el job reembolsa en el mismo milisegundo. Esta spec no elige la pre-solicitud ni la ventana corta. Los escenarios de arriba cubren "aún no vence" y "venció y nadie pidió extensión". El caso del mismo milisegundo queda sin cerrar hasta decisión del líder.

`DEC-OPEN-02` (TTL del fondeo) tampoco se cierra aquí. Este módulo no arranca relojes antes de `ESCROW_LOCKED`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-09`: cinco relojes, extensión única, dos correcciones y avisos, con `DEC-OPEN-03` sin cerrar. |

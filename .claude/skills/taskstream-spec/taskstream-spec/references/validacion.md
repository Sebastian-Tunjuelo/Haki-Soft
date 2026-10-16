# Lista de Verificación Semántica y Auditoría de Especificaciones — TaskStream AI (`validacion.md`)

Esta guía complementa al script automatizado `.agents/skills/taskstream-spec/scripts/check-spec.mjs`. Antes de dar por terminada la redacción, revisión o actualización de cualquier especificación (`SPEC-00.md` a `SPEC-12.md`), recorre esta lista punto por punto contra `.agents/CONTEXT.md`, `planning/architecture-overview.md`, `planning/sdd-process.md`, `planning/pbp-development.md`, `planning/taskboard.md` y `AGENTS.md`.

---

## 1. Checklist de Invariantes de Negocio y Arquitectura (Bloqueantes si Fallan)

### 1.1. Reglas Financieras y de Open Payments (`CONTEXT.md` §1.2, §4, §5 y `architecture-overview.md` §2)
- [ ] **Pago Único en un Solo Bloque (`SINGLE_BLOCK_ESCROW`):** La spec respeta que el 100 % del presupuesto acordado se deposita en un único bloque al iniciar la orden en `https://ilp.interledger-test.dev/taskstream-escrow`. No introduce hitos parciales ni pagos divididos.
- [ ] **Distribución Exacta `96 % Freelancer / 4 % TaskStream`:** En toda liberación de pago (`COMPLETED`), el Freelancer recibe el **96 %** y TaskStream retiene el **4 %**, usando la fórmula entera en centavos (`platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`).
- [ ] **Reembolso del `100 %` al Buyer:** En todo escenario de reembolso (rechazo de extensión en $\le 24\text{h}$, falta de respuesta del Buyer en $24\text{h}$, no entrega dentro de la extensión aprobada o fallo administrativo a favor del Buyer en disputa), se devuelve el **100 %** del importe reembolsable desde `taskstream-escrow` (`debitAmount = 100% USD`).
- [ ] **Doble Conversión Cambiaria (FX Doble) Asumida por el Buyer:** Al depositar en el escrow se fija `receiveAmount = 100% USD` (el Buyer absorbe el FX de entrada desde su moneda local americana) y al reembolsar se fija `debitAmount = 100% USD` (el Buyer absorbe el FX de salida de regreso a su moneda local sin crear déficit en `taskstream-escrow`).
- [ ] **Verificación Criptográfica de Billetera (`Subject Grant` + Hash Verification):** Ninguna billetera con `isVerified: false` puede publicar tareas, negociar presupuestos, recibir desembolsos ni contratar encargos (`CONTEXT.md` §4).
- [ ] **Frontera de Autoría Manual (`🛡️ [MANUAL / IA MÍNIMA-NULA]`):** Si la spec involucra `open-payments.service.ts`, `escrow-payment.service.ts` o claves `Ed25519` / tokens de Rafiki, declara explícitamente que su implementación corresponde a autoría y control manual de `BE-1` (`AGENTS.md` §2.1.4 y `AI_USAGE.md` §4).

### 1.2. Negociación a la Baja y Bifurcación en 2 Caminos (`CONTEXT.md` §5.2)
- [ ] **Tope de Negociación Estricto:** Toda propuesta o contraoferta cumple `proposedBudgetUSDInCents <= initialBudgetUSDInCents` (validado en Zod `.refine(...)` y en el `CHECK` SQL `chk_negotiation_proposed_le_initial`).
- [ ] **Camino 1 (`AGREED_PATH_1`):** Cierra la publicación para nuevos postulantes (`AGREED_AND_LOCKED`), crea `TaskOrder` + `EscrowLedger` y pasa al depósito del 100 % en escrow.
- [ ] **Camino 2 (`DISCREPANCY_CLOSED_PATH_2`):** Cierra definitivamente el hilo con ese Freelancer, pero **mantiene la publicación del Buyer 100 % activa (`OPEN_FOR_PROPOSALS`)** para recibir propuestas de otros freelancers.

### 1.3. Los 5 Relojes Independientes, Extensión Única y Límite de 2 Correcciones (`CONTEXT.md` §5.3 y `architecture-overview.md` §2.1)
- [ ] **Entrega inicial (`INITIAL_DELIVERY_7D`):** Plazo inicial máximo de **7 días** desde `ESCROW_LOCKED`.
- [ ] **Solicitud de extensión única (`EXTENSION_REQUESTED`):** Solo se permite **1 extensión por orden** (garantizada por `UNIQUE(task_order_id)` en `DeadlineExtensionRequest`) de **hasta 7 días adicionales** (`1..7`, límite total de hasta **14 días** desde el inicio original).
- [ ] **Respuesta del Buyer a la extensión (`EXTENSION_RESPONSE_24H`):** El Buyer tiene **24 horas** para aprobar (`ESCROW_EXTENDED`) o rechazar y pedir reembolso (`REFUNDED` / `REFUNDED_AND_REOPENED`). Si el Buyer **no responde en 24 horas**, se ejecuta el **reembolso automático del 100 %** (`AUTO_REFUNDED_BY_TIMEOUT`) y se notifica a ambas partes.
- [ ] **Vencimiento de la extensión aprobada (`EXTENDED_DELIVERY_UP_TO_7D`):** Si el Freelancer tampoco entrega dentro del plazo extendido, se ejecuta el **reembolso automático del 100 %** (`AUTO_REFUNDED_EXTENDED_EXPIRED`) sin permitir segunda extensión.
- [ ] **Revisión por entrega (`DELIVERY_REVIEW_32H`) y Máximo 2 Correcciones Globales:** Cada entrega abre un reloj de **32 horas**. El Buyer puede pedir máximo **2 correcciones globales por orden** (`revisionsUsed: 0..2`), contador que **jamás se reinicia** con nuevas entregas ni con una extensión. Si pasan las **32 horas** sin respuesta del Buyer, se produce **aceptación automática** y comienza la ventana final de 30 minutos (no libera el dinero de inmediato).
- [ ] **Ventana final de reclamaciones (`FINAL_CLAIM_WINDOW_30M`):** Comienza tras la aceptación expresa o automática y dura **30 minutos**. Si transcurren sin reclamación, libera el **96 % al Freelancer y 4 % a TaskStream** (`COMPLETED`). Si se presenta una reclamación válida dentro de los 30 minutos, **se cancela/suspende de inmediato el job de liberación automática en BullMQ** y la orden pasa a `DISPUTED`.
- [ ] **Disputa Administrativa (`DISPUTED`):** Se abre al agotarse las 2 correcciones sin acuerdo o por reclamación válida en los 30 minutos finales. Mientras esté abierta, los fondos permanecen retenidos en el escrow sin automatismos. El Administrador resuelve de forma **binaria y con justificación obligatoria ($\ge 20$ caracteres)**: `BUYER_FULL_REFUND_100` (100 % al Buyer) o `SELLER_RELEASE_96_4` (96 % / 4 % al Freelancer).

### 1.4. Alcance Estricto del Consejero de IA y *Protected Preview* (`CONTEXT.md` §6, §7 y `architecture-overview.md` §3)
- [ ] **IA exclusiva para Imagen y Texto en el MVP:** `AiAdvisorService` solo audita y asesora tareas cuya modalidad sea `IMAGE` (`.png`, `.jpg`, `.webp`, `.svg`) o `TEXT` (`.txt`, `.md`, `.pdf`, `.docx`). El resto de formatos (video, audio, archivos de código, datasets) y la suscripción `Buyer AI Pro Subscription` quedan explícitamente fuera del MVP (planteados para Post-MVP).
- [ ] **Contrato Exacto de Entrada (`AiAdvisorInputContractSchema` en `SPEC-08.md`):** Está claramente especificado como requisito previo para generar `AiAdvisorReportSchema`, manteniendo el rol **estrictamente consultivo** (nunca aprueba ni bloquea pagos por sí mismo).
- [ ] **Almacenamiento Sin Límite en MVP y Resguardo de Originales:** Subida directa con Presigned URLs a Cloudflare R2 sin límite de peso en el MVP (`maxFileSizeBytes = null`); `/originals/{taskId}/{revision}/` permanece bloqueado durante las 32 horas de `IN_REVIEW` y solo se desbloquea al pasar a `FINAL_CLAIM_WINDOW_30M`.

### 1.5. Modelo de Datos 3NF, Stack Frontend 3D y Trazabilidad IA
- [ ] **Tercera Forma Normal (3NF) sin *God-Entities*:** Respeta la separación de las 20 entidades de `planning/architecture-overview.md` §5.3 y las 6 restricciones `CHECK` SQL de §5.4.
- [ ] **Stack Frontend y 3D (`Next.js 15.5 + React 19`):** Componentes 3D (`@react-three/fiber v9`, `@react-three/drei v10`, `Three.js r170+`) aislados en cliente (`"use client"` + `next/dynamic(..., { ssr: false })`), sincronizados con `Lenis` + `GSAP ScrollTrigger` mediante `useGSAP()` mutando `useRef` a 60–120 FPS y **prohibiendo guardar la posición de scroll en `useState`**.
- [ ] **Trazabilidad Obligatoria de IA (`AGENTS.md` §2):** Toda intervención sobre `specs/` se registra en el mismo turno en `AI_USAGE.md` (indicando solo la herramienta `Antigravity`, sin nombres de modelos ni niveles de esfuerzo), `promptsAI_USAGE.md` y `prompts/AI_USAGE.md` (con el texto literal completo del prompt).

---

## 2. Plantilla de Informe de Revisión de una Spec (Modo 3 — Revisar)

Cuando audites una especificación existente, estructura tu respuesta con el siguiente formato:

```markdown
# Informe de Auditoría SDD — `SPEC-NN` (`specs/SPEC-NN.md`)

- **Estado declarado en la spec:** `<Estado actual>`
- **Resultado de `check-spec.mjs`:** `<X errores, Y avisos>`
- **Veredicto:** `<APTA PARA AVANZAR / REQUIERE CORRECCIONES BLOQUEANTES>`

## 1. Hallazgos Bloqueantes (`[ERROR]`)
1. **[Sección / RF]:** <Descripción del problema>
   - **Fuente vulnerada:** `<CONTEXT.md §X / architecture-overview.md §Y / taskboard.md>`
   - **Corrección requerida:** <Propuesta exacta>

## 2. Mejoras y Advertencias (`[AVISO]`)
1. **[Sección / RF]:** <Observación y recomendación>

## 3. Cobertura de Tareas del `taskboard.md` y Roles (`2 FE / 2 BE / 1 IA`)
- **Tareas `T-F*` verificadas:** `<Lista de tareas cubiertas>`
- **Frontera Manual `🛡️` verificada:** `<Sí / No aplica>`
```

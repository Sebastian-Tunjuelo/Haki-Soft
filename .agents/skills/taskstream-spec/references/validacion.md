# Lista de Verificación Semántica y Auditoría de Especificaciones — TaskStream AI (`validacion.md`)

Esta guía complementa al script automatizado `.agents/skills/taskstream-spec/scripts/check-spec.mjs`. Antes de dar por terminada la redacción, revisión o actualización de cualquier especificación (`SPEC-00.md` a `SPEC-12.md`), recorre esta lista punto por punto contra `.agents/CONTEXT.md`, `planning/architecture-overview.md`, `planning/sdd-process.md`, `planning/pbp-development.md`, `planning/taskboard.md` y `AGENTS.md`.

---

## 1. Checklist de Invariantes de Negocio y Arquitectura (Bloqueantes si Fallan)

### 1.1. Reglas Financieras y de Open Payments (`CONTEXT.md` §1.2, §4, §5 y `architecture-overview.md` §2)
- [ ] **Pago Único en un Solo Bloque (`SINGLE_BLOCK_ESCROW`):** La spec respeta que el 100 % del presupuesto acordado se deposita en un único bloque al iniciar la orden en `https://ilp.interledger-test.dev/taskstream-escrow`. No introduce hitos parciales ni pagos divididos.
- [ ] **Distribución Exacta `96 % Freelancer / 4 % wallet del dueño`:** En `COMPLETED`, dos `OutgoingPayment`: **96 %** al Freelancer y **4 %** a `platformOwnerWalletAddress` (billetera distinta del escrow). Fórmula: `platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`.
- [ ] **Reembolso del `100 %` al Buyer (actividad muere):** Incluye: 7d sin pedir extensión (`AUTO_REFUNDED_INITIAL_EXPIRED`), rechazo/silencio 24h a extensión, fallo de extensión, o Admin a favor Buyer. El Freelancer queda desligado; **no** existe `REFUNDED_AND_REOPENED`.
- [ ] **Doble Conversión Cambiaria (FX Doble) Asumida por el Buyer:** Al depositar se fija `receiveAmount = 100% USD`; al reembolsar `debitAmount = 100% USD`.
- [ ] **Una sola wallet activa + Subject Grant:** Exactamente una wallet verificada activa por usuario (reemplazo al cambiar). Sin `isVerified`/`isActive` no publica, oferta, contrata ni cobra.
- [ ] **Frontera de Autoría Manual (`🛡️ [MANUAL / IA MÍNIMA-NULA]`):** Specs de `open-payments.service.ts` / `escrow-payment.service.ts` / `Ed25519` declaran autoría manual de `BE-1`.

### 1.2. Gig Fijo vs Publicación con Ofertas (`CONTEXT.md` §5.2)
- [ ] **Gig a precio fijo:** Contratación directa **no negociable** al precio publicado del Gig.
- [ ] **Publicación con tope:** Ofertas con `proposedBudgetUSDInCents <= initialBudgetUSDInCents`; Buyer ve bandeja (ofertas + perfiles) y **elige una**.
- [ ] **Arranque mutuo:** Escrow/relojes solo tras aceptación de ambas partes + fondeo; la publicación puede cancelarse antes de aceptar.
- [ ] **Oferta descartada / no elegida:** Otras propuestas quedan fuera al aceptar una; la publicación no elegida puede seguir `OPEN_FOR_PROPOSALS` si aún no hubo acuerdo.

### 1.3. Relojes, Extensión Solo al Vencer y 2 Correcciones (`CONTEXT.md` §5.3)
- [ ] **Entrega inicial (`INITIAL_DELIVERY_7D`):** 7 días desde `ESCROW_LOCKED`. Sin extensión al vencer → `AUTO_REFUNDED_INITIAL_EXPIRED`.
- [ ] **Extensión única solo al vencer:** **1** extensión (`UNIQUE(task_order_id)`), **hasta +7 días**, **prohibido pedirla antes** de que venzan los 7 días.
- [ ] **Respuesta Buyer 24h:** Aprueba → `ESCROW_EXTENDED`; rechaza → `REFUNDED`; silencio → `AUTO_REFUNDED_BY_TIMEOUT`.
- [ ] **Fallo de extensión:** Sin entrega en plazo extendido → `AUTO_REFUNDED_EXTENDED_EXPIRED`.
- [ ] **Revisión 32h / máx. 2 correcciones:** Tras la **2ª** re-entrega el Buyer **acepta** o **pide mediación** (`DISPUTED`). Timeout 32h = aceptación automática → ventana 30m.
- [ ] **Ventana 30m:** Sin petición de disputa → **96 % + 4 % wallet dueño**. Con petición → cancela job BullMQ → `DISPUTED`.
- [ ] **Disputa Admin:** Origen `BUYER_MEDIATION_AFTER_2ND_REVISION` o `FINAL_30M_CLAIM_WINDOW`. Decisión binaria justificada: `BUYER_FULL_REFUND_100` o `SELLER_RELEASE_96_4` (4 % a wallet dueño).

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

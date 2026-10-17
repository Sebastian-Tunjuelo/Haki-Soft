---
name: taskstream-spec
description: "Redacta, revisa o actualiza las especificaciones técnicas SPEC-00 a SPEC-12 de TaskStream AI en specs/ siguiendo la metodología SDD Evolutivo + BDD del proyecto (planning/sdd-process.md, planning/pbp-development.md, planning/taskboard.md, planning/architecture-overview.md y .agents/CONTEXT.md): plantilla estructurada de 12 secciones, ciclo de vida de 4 estados (Redactada/DRAFTED, Implementada/IMPLEMENTED, Testeada/TESTED, Aprobada/APPROVED), protocolo de ingeniería paralela sin bloqueos para los 5 desarrolladores (FE-1, FE-2, BE-1, BE-2, AI-1), criterios BDD Dado/Cuando/Entonces y validación estricta de invariantes financieras (96%/4%, reembolsos 100%, pago único sin hitos), plazos independientes (7d, 24h, +7d, 32h, 30m, máx. 2 correcciones), alcance de IA en MVP exclusivo para imagen y texto (AiAdvisorInputContractSchema -> AiAdvisorReportSchema) y trazabilidad obligatoria en AI_USAGE.md y promptsAI_USAGE.md. Úsala siempre que haya que crear la carpeta specs/ (SPEC-00), redactar, revisar o evolucionar cualquier spec de SPEC-00 a SPEC-12 (o con sufijo), o verificar si una tarea del taskboard cuenta con contrato SDD listo."
---

# taskstream-spec — Especificaciones SDD Evolutivo + BDD de TaskStream AI

Guía maestra para redactar, revisar, validar y evolucionar las especificaciones de `specs/` (`SPEC-00.md` a `SPEC-12.md`) en **TaskStream AI**, orquestando el trabajo conjunto con el resto de *skills* del repositorio. La skill **no sustituye** a los documentos rectores del proyecto: indica qué leer, en qué orden, cómo estructurar cada especificación sin contradicciones y cómo validar el resultado. Si esta skill y un documento superior discrepan, manda el documento superior (y conviene actualizar la skill).

## Reglas de oro

1. **Jerarquía de autoridad inmutable:** `AGENTS.md` (y `AI_USAGE.md` / `promptsAI_USAGE.md` / `prompts/AI_USAGE.md`) → `.agents/CONTEXT.md` (Única Fuente de Verdad — SSoT) → `planning/architecture-overview.md` → `planning/sdd-process.md` → `planning/pbp-development.md` → `planning/taskboard.md` → `specs/` → `packages/shared-schemas` → código (`apps/web`, `apps/api`). Una spec nunca contradice un documento superior ni una spec `Aprobada` de la que depende. Si para escribirla hiciera falta cambiar una regla de negocio o de arquitectura, detente: primero se propone y aprueba la decisión en `.agents/CONTEXT.md` y `planning/architecture-overview.md`, y la spec se redacta o actualiza después. Nunca modifiques en silencio un documento superior para forzar que encaje con una spec.
2. **Protocolo de Ingeniería Paralela Sin Bloqueos (5 Desarrolladores: `2 FE / 2 BE / 1 IA`):** En TaskStream AI, una spec en estado `Redactada (DRAFTED)` define el contrato ejecutable en `packages/shared-schemas` (Zod + generadores de *mocks*) para que **`FE-1`**, **`FE-2`**, **`BE-1`**, **`BE-2`** y **`AI-1`** trabajen al 100 % en paralelo durante la Etapa Beta (`Implementada / IMPLEMENTED`) sin que el Backend bloquee jamás a Frontend o IA (`planning/pbp-development.md` §1). Ninguna tarea de integración final (`[WAITING_SYNC]`) ni cierre de fase puede darse por completado hasta que la spec supere las pruebas (`Testeada / TESTED`) y alcance el estado `Aprobada (APPROVED)` (*Feature-Gated Progression*, `CONTEXT.md` §2.1).
3. **Frontera de Autoría Manual (`🛡️ [MANUAL / IA MÍNIMA-NULA]`):** Toda spec que toque pagos abiertos e Interledger (`SPEC-02`, `SPEC-06`, `SPEC-09`, `SPEC-10`) debe demarcar explícitamente que la implementación de `apps/api/src/modules/open-payments/open-payments.service.ts`, `apps/api/src/modules/open-payments/escrow-payment.service.ts` y la configuración criptográfica `Ed25519` / tokens de Rafiki corresponden a autoría y verificación manual prioritaria de `BE-1` (`AGENTS.md` §2.1.4 y `AI_USAGE.md` §4). La spec define los contratos, entradas/salidas, llaves de idempotencia e invariantes que rodean al servicio, pero prohíbe que la IA sobreescriba o genere sin control humano la lógica nuclear de Open Payments.
4. **El agente redacta, implementa y verifica; el líder del proyecto aprueba:** Puedes crear una spec en `Redactada (DRAFTED)`, evolucionarla a `Implementada (IMPLEMENTED)` conforme avanza el código o pasarla a `Testeada (TESTED)` cuando las suites de contrato/BDD pasen al 100 %. **Nunca marques una spec como `Aprobada (APPROVED)` ni rellenes "Aprobada por / fecha" sin confirmación explícita del líder del proyecto en la conversación.**
5. **Enlazar, no copiar:** La spec cita `.agents/CONTEXT.md §x`, `planning/architecture-overview.md §y` y las reglas de `planning/taskboard.md §3`, y añade únicamente la concreción técnica necesaria para implementar y probar el módulo: firmas exactas de Zod, rutas de endpoints, payloads, códigos de error, nombres de colas BullMQ y escenarios `Dado / Cuando / Entonces`. Copiar bloques extensos de `CONTEXT.md` crea dos fuentes que divergen.
6. **Concretar sí, inventar alcance no:** La spec debe fijar los detalles técnicos que la planeación general deja implícitos para que `FE-1`, `FE-2`, `BE-1`, `BE-2` y `AI-1` converjan sin fricción (códigos de error HTTP/dominio, nombres de eventos de estado 3D, estructura de respuestas paginadas, nombres de jobs). Lo que **no puede** es introducir alcance prohibido o Post-MVP en el MVP (como pagos divididos en hitos, auditoría de IA para video/audio/código o la suscripción `Buyer AI Pro Subscription`). Cualquier duda de alcance de producto va a la **Sección 11** como pregunta abierta con una recomendación clara.
7. **Idioma, terminología y trazabilidad IA:** La narrativa de la spec y los criterios BDD (`Dado / Cuando / Entonces`) se escriben en **español**; los identificadores técnicos, modelos Prisma, tablas SQL (`snake_case`), esquemas Zod (`PascalCase`), endpoints y códigos de error (`UPPER_SNAKE_CASE`) van en **inglés**. Cada creación o modificación de una spec en `specs/` debe registrarse **en el mismo turno** en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md` cumpliendo `AGENTS.md` §2.

---

## Fuentes que debes leer antes de actuar

Léelas siempre antes de redactar, revisar o actualizar una spec; no trabajes de memoria:

| Fuente | Para qué leerla |
|---|---|
| `AGENTS.md` y `AI_USAGE.md` | Reglas innegociables de gobernanza, registro obligatorio de uso de IA en el mismo turno y lista de componentes con intervención de IA mínima o nula (`🛡️`) |
| `.agents/CONTEXT.md` §1–§12 | **Única Fuente de Verdad (SSoT):** reglas financieras inmutables (`96% / 4%`, pago único sin hitos, doble FX asumido por el Buyer, negociación a la baja `<= initialBudgetUSDInCents`), plazos independientes (`7d`, `24h`, `+7d`, `32h`, `30m`, máx. 2 correcciones), alcance estricto de `AiAdvisorService` en el MVP (**solo imagen y texto**), contratos Zod (§8.2), escenarios BDD Gherkin (§9), fases (§10), stack (§11) y reglas cerradas (§12) |
| `planning/architecture-overview.md` §1–§5 | Flujo completo de contratación, escrow, entregas, revisiones, extensiones, reclamaciones y disputas (§2), máquina de estados (§2.3), contrato exacto `AiAdvisorInputContractSchema` (§3), estructura del monorepo Turborepo (§4) y modelo de datos relacional 3NF en Prisma 6 libre de *God-Entities* con restricciones `CHECK` SQL (§5) |
| `planning/sdd-process.md` §1–§4 | Impacto de SDD en el MVP/Demo (§1), funciones y pautas generales de una spec (§2), catálogo oficial de `SPEC-00` a `SPEC-12` (§3) y proceso evolutivo en 4 etapas (`DRAFTED -> IMPLEMENTED -> TESTED -> APPROVED`) (§4) |
| `planning/pbp-development.md` §1–§2 | Protocolo de Ingeniería Paralela Sin Bloqueos (Etapas Alfa, Beta y Gamma) para `FE-1`, `FE-2`, `BE-1`, `BE-2` y `AI-1` (§1) y entregables/criterios de salida de cada fase `Fase 0` a `Fase 5` (§2) |
| `planning/taskboard.md` §1–§3 | Prioridades (`P0`–`P3`), estados de tareas, filas `T-F*` asociadas a cada `SPEC-NN` (§2) y las 6 reglas operativas cerradas (§3) |
| `specs/README.md` y specs previas | Estado actual de las especificaciones en `specs/` y contratos ya definidos de los que depende la spec objetivo |

---

## Catálogo Oficial de Especificaciones (`SPEC-00` a `SPEC-12`)

| Spec | Archivo | Fase | Roles Principales | Alcance Nuclear según `sdd-process.md` y `taskboard.md` |
|---|---|---|---|---|
| **`SPEC-00`** | `specs/SPEC-00.md` | Fase 0 | `AI-1` | Creación de la carpeta `specs/`, su índice `specs/README.md`, la plantilla `specs/_template.md` y las reglas de trazabilidad SDD + `AI_USAGE.md` (`T-F0-04`). |
| **`SPEC-01`** | `specs/SPEC-01.md` | Fase 0 / 1 | `AI-1`, `FE-1`, `BE-2` | Contratos globales Zod en `packages/shared-schemas`, generadores de *mocks* y modelo relacional 3NF en Prisma 6 (`schema.prisma`) + restricciones `CHECK` SQL (`T-F0-05`, `T-F0-06`, `T-F1-BE2-01`, `T-F1-AI1-01`). |
| **`SPEC-02`** | `specs/SPEC-02.md` | Fase 1 | `FE-1`, `BE-1` `🛡️`, `BE-2` | Registro e inicio de sesión propios, selector `Buyer Mode / Seller Mode`, descubrimiento `UnauthenticatedClient` y verificación criptográfica de billetera multimoneda en América vía GNAP `Subject Grant` + hash `SHA-256` (`T-F1-FE1-01`, `T-F1-BE1-01`, `T-F1-BE2-01`). |
| **`SPEC-03`** | `specs/SPEC-03.md` | Fase 1 | `FE-2` | Arquitectura visual 3D vinculada al scroll: `Lenis` + `GSAP ScrollTrigger` + `@react-three/fiber v9` + `@react-three/drei v10` aislados en cliente a 60–120 FPS sin re-renders de React (`T-F1-FE2-01`, `T-F1-FE2-02`). |
| **`SPEC-04`** | `specs/SPEC-04.md` | Fase 2 | `FE-1`, `FE-2`, `BE-2` | Catálogo de las 6 categorías del MVP, *Gigs* de freelancers, etiqueta W3C Web Monetization (`<link rel="monetization">`), transiciones 3D de categorías y tablón de tareas publicadas por Buyers (`T-F2-FE1-01`, `T-F2-FE1-03`, `T-F2-FE2-01`, `T-F2-BE2-01`). |
| **`SPEC-05`** | `specs/SPEC-05.md` | Fase 2 | `FE-1`, `BE-1`, `AI-1` | Motor de negociación de presupuesto a la baja (`proposedBudgetUSDInCents <= initialBudgetUSDInCents`), **Camino 1** (acuerdo y creación de `TaskOrder` + `EscrowLedger`), **Camino 2** (cierre por discrepancia manteniendo `OPEN_FOR_PROPOSALS`) y clasificador de modalidad auditable `IMAGE | TEXT` (`T-F2-FE1-02`, `T-F2-BE1-01`, `T-F2-AI1-01`). |
| **`SPEC-06`** | `specs/SPEC-06.md` | Fase 3 | `BE-1` `🛡️`, `BE-2`, `FE-1`, `FE-2`, `AI-1` | Orquestación de pagos abiertos y custodia única en `taskstream-escrow`: depósito del 100 % (`receiveAmount` fijo, Buyer asume FX de entrada), desembolso `96 % Freelancer / 4 % TaskStream` (`debitAmount` fijo), reembolsos del `100 %` (`debitAmount` fijo, Buyer asume FX de retorno), idempotencia `SHA-256`, webhooks de Rafiki y escena 3D de bóveda (`T-F3-BE1-01`, `T-F3-BE2-01`, `T-F3-FE1-01`, `T-F3-FE2-01`, `T-F3-AI1-01`). |
| **`SPEC-07`** | `specs/SPEC-07.md` | Fase 4 | `BE-2`, `FE-2`, `BE-1` | Almacenamiento en Cloudflare R2 sin límite de peso en el MVP (`/originals/{taskId}/{revision}/`), bloqueo de originales durante `IN_REVIEW`, workers de marca de agua (`sharp` y `fluent-ffmpeg`) hacia `/previews/{taskId}/{revision}/` y 6 visores de *Protected Preview* (`T-F4-BE2-01`, `T-F4-BE2-02`, `T-F4-FE2-01`, `T-F4-BE1-01`). |
| **`SPEC-08`** | `specs/SPEC-08.md` | Fase 4 | `AI-1`, `FE-1` | Contrato exacto de entrada (`AiAdvisorInputContractSchema`) y salida (`AiAdvisorReportSchema`) para `AiAdvisorService`, acotado en el MVP **exclusivamente a auditar y asesorar tareas de IMAGEN y TEXTO**, con pre-check determinista, encapsulamiento `<untrusted_deliverable_artifact>` y panel consultivo para el Buyer (`T-F4-AI1-01`, `T-F4-AI1-02`, `T-F4-FE1-01`). |
| **`SPEC-09`** | `specs/SPEC-09.md` | Fase 5 | `BE-2`, `BE-1`, `FE-1` | Los 5 relojes deterministas en BullMQ (`INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`), extensión única de hasta +7 días (máx. 14d totales), auto-reembolso del 100 % ante silencio en 24h o expiración de extensión, límite global de 2 correcciones por orden y notificaciones (`T-F5-BE2-01`, `T-F5-BE1-01`, `T-F5-BE2-02`, `T-F5-FE1-01`). |
| **`SPEC-10`** | `specs/SPEC-10.md` | Fase 5 | `BE-1`, `BE-2`, `FE-1` | Suspensión atómica del job `FINAL_CLAIM_WINDOW_30M` ante reclamación válida en los 30 minutos finales, apertura de disputa administrativa (`DISPUTED`) al agotar las 2 correcciones sin acuerdo, congelamiento de automatismos financieros durante la disputa y resolución binaria con justificación obligatoria del Administrador (`100 % Buyer` o `96 % / 4 % Freelancer`) (`T-F5-BE1-02`, `T-F5-BE2-02`, `T-F5-FE1-02`). |
| **`SPEC-11`** | `specs/SPEC-11.md` | Fase 5 | Todos | Validación integral E2E de extremo a extremo uniendo Frontend, Backend, Open Payments, Cloudflare R2, BullMQ e IA sin simuladores (`T-F5-ALL-01`). |
| **`SPEC-12`** | `specs/SPEC-12.md` | Fase 5 | Todos | Despliegue y puesta en producción del MVP (`Deploy`), configuración de variables de entorno productivas, verificación de salud y cierre de auditoría en `AI_USAGE.md` y `promptsAI_USAGE.md` (`T-F5-ALL-02`). |

---

## Elige el modo de operación

| Situación | Modo |
|---|---|
| `specs/` no existe, o faltan `specs/README.md`, `specs/_template.md` o `specs/SPEC-00.md` | **Arranque (`SPEC-00`)** |
| Hay que crear una `SPEC-NN` (`SPEC-01` a `SPEC-12`, o con sufijo como `SPEC-05a`) que aún no existe | **Redactar** |
| Hay que auditar una spec existente contra `CONTEXT.md`, `architecture-overview.md`, `taskboard.md` y la plantilla | **Revisar** |
| Hay que evolucionar el contenido o cambiar el estado de una spec existente (`Redactada -> Implementada -> Testeada -> Aprobada`) | **Actualizar** |

Si el usuario pide "la spec de X" sin indicar el número, ubícala por capacidad en la tabla del Catálogo Oficial (`planning/sdd-process.md` §3 y `planning/taskboard.md` §2).

---

### Modo 1 — Arranque (`SPEC-00`)

1. Crea `specs/_template.md` siguiendo exactamente la estructura de 12 secciones definida en [references/guia-de-secciones.md](references/guia-de-secciones.md).
2. Crea `specs/SPEC-00.md` especificando la organización del directorio `specs/`, la convención de nombres (`SPEC-00.md` a `SPEC-12.md`), el ciclo de vida de 4 estados (`Redactada`, `Implementada`, `Testeada`, `Aprobada`), la plantilla obligatoria y la sincronización con `AI_USAGE.md` y `promptsAI_USAGE.md`.
3. Crea `specs/README.md` como **único índice maestro de especificaciones**: propósito del directorio, enlaces a `.agents/CONTEXT.md`, `planning/sdd-process.md`, `planning/pbp-development.md` y `planning/taskboard.md`, explicación de los 4 estados del ciclo de vida y la tabla maestra `| Spec | Archivo | Título | Fase | Roles | Tareas Asociadas | Estado |` con las especificaciones de `SPEC-00` a `SPEC-12` (enlazando aquellas cuyo archivo ya exista en `specs/` y marcando `Pendiente de redactar` las que aún no tengan archivo creado).
4. Ejecuta el script de validación sobre `specs/SPEC-00.md`:
   ```bash
   node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-00.md
   ```
5. Actualiza `planning/taskboard.md` (estado de `T-F0-04`) y registra todos los archivos creados/modificados en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.

---

### Modo 2 — Redactar una spec (`SPEC-01` a `SPEC-12`)

**Paso 1 — Ubicar la spec y verificar prerrequisitos.**

- Identifica el código (`SPEC-00` a `SPEC-12`), el nombre de archivo (`specs/SPEC-NN.md`, o `specs/SPEC-NNa.md` si se acordó subdividir), la Fase (`Fase 0` a `Fase 5`) y los roles responsables (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`).
- Si `specs/` o `specs/_template.md` no existen todavía, ejecuta primero el **Modo 1 — Arranque (`SPEC-00`)**.
- Si el archivo `specs/SPEC-NN.md` ya existe, pasa a **Revisar** o **Actualizar**.

**Paso 2 — Reunir los insumos en este orden estricto.**

1. **Tareas en `planning/taskboard.md` §2** cuya columna `Spec Asociada` contenga `SPEC-NN`: forman el campo `Tareas Asociadas` de la cabecera y cada tarea `T-F*` debe quedar cubierta por al menos un Requisito Funcional (`RF-NN`) en la Sección 8. Verifica si alguna tarea tiene el indicador `🛡️ [MANUAL / IA MÍNIMA-NULA]`.
2. **Fase correspondiente en `planning/pbp-development.md` §2:** entregables por rol (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`), protocolo de desacoplamiento con mocks/adaptadores (§1.2) y criterio de aprobación de fase.
3. **Secciones de `.agents/CONTEXT.md` y `planning/architecture-overview.md`** que rigen la capacidad:
   - Flujos de negocio, reglas financieras (`96% / 4%`, reembolsos `100%`, doble FX asumido por el Buyer) y plazos (`7d`, `24h`, `+7d`, `32h`, `30m`, máx. 2 correcciones).
   - Esquemas Zod en `.agents/CONTEXT.md` §8.2 y `planning/architecture-overview.md` §3.2 (`ClientTaskPublicationSchema`, `FreelancerNegotiationProposalSchema`, `TaskOrderCardSchema`, `DeadlineExtensionRequestSchema`, `AiAdvisorInputContractSchema`, `AiAdvisorReportSchema`).
   - Modelos de Prisma 6 en 3NF y restricciones `CHECK` SQL en `planning/architecture-overview.md` §5.3 y §5.4.
4. **Reglas operativas cerradas** en `.agents/CONTEXT.md` §12 y `planning/taskboard.md` §3 (incluyendo la fórmula de redondeo exacto en centavos: `platformFeeUSDInCents = Math.floor(totalAmountUSDInCents * 0.04)` y `freelancerPayoutUSDInCents = totalAmountUSDInCents - platformFeeUSDInCents`).
5. **Specs previas de las que depende** para mantener consistencia exacta en nombres de tipos, tablas, rutas y eventos.

**Paso 3 — Construir el mapa de trazabilidad y activar skills complementarias.**

- Relaciona cada origen (tarea `T-F*` del `taskboard.md`, regla de `CONTEXT.md`, criterio de fase de `pbp-development.md`, modelo Prisma o esquema Zod) con el `RF-NN` y el escenario BDD `Dado / Cuando / Entonces` que lo cubrirá.
- Todo origen debe tener al menos un `RF-NN` y todo `RF-NN` debe responder a un origen real del proyecto: un `RF-NN` sin origen es alcance inventado (elimínalo o llévalo a la Sección 11 como pregunta abierta).
- Si al preparar la spec detectas huecos de diseño, usa la skill `grill-with-docs` (o `grill-me` / `grilling`) para entrevistar al usuario antes de asumir comportamientos no especificados.
- Consulta las skills técnicas especializadas según la spec que estés redactando (ver sección **Trabajo conjunto con las demás skills del proyecto** al final de este documento).

**Paso 4 — Escribir la especificación siguiendo la plantilla de 12 secciones.**

- Parte de `specs/_template.md` y lee completa la guía detallada en [references/guia-de-secciones.md](references/guia-de-secciones.md).
- Las **12 secciones son obligatorias**, en su orden y con su numeración y título exacto. Si alguna sub-capacidad de una sección no aplica a esa spec (por ejemplo, escenas 3D en una spec puramente de infraestructura), escribe `"No aplica en esta especificación"` explicando brevemente el motivo, sin eliminar la sección.
- Al crear el archivo:
  - `Estado`: `Redactada (DRAFTED)`
  - `Aprobada por / fecha`: `—`
  - Primera fila en la tabla de la **Sección 12 (Registro de Cambios)**.

**Paso 5 — Validar (obligatorio antes de entregar).**

1. Ejecuta desde la raíz del repositorio el script validador:
   ```bash
   node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-NN.md
   ```
   El script verifica: metadatos de cabecera, presencia y orden de las 12 secciones obligatorias, ausencia de placeholders sin rellenar, formato de los Requisitos Funcionales (`RF-NN`) con criterios **Dado** / **Cuando** / **Entonces** en negrita, cobertura de pruebas en la Sección 9 para cada `RF-NN`, cobertura de todas las tareas `T-F*` asociadas en `planning/taskboard.md`, demarcación `🛡️` cuando interviene `BE-1` en Open Payments, sincronización en `specs/README.md` y detección de señales de alarma (términos fuera del MVP o residuos ajenos al proyecto).
   - Corrige todos los `[ERROR]`.
   - Revisa cada `[AVISO]` y justifica en el informe final los que deban mantenerse.
2. Recorre la lista de verificación semántica de [references/validacion.md](references/validacion.md) (invariantes financieras, plazos independientes, 3NF sin *God-Entities*, alcance de IA exclusivo para imagen y texto en el MVP, rendimiento 3D sin re-renders y trazabilidad de IA).

**Paso 6 — Sincronizar índices y gobernanza en el mismo turno.**

1. Actualiza la fila correspondiente en `specs/README.md` con el enlace al archivo y su estado (`Redactada (DRAFTED)`).
2. Actualiza `planning/taskboard.md` si el estado de una tarea asociada cambia (por ejemplo, `T-F0-04` o `T-F4-AI1-01`).
3. **Obligatorio (`AGENTS.md` §2):** Registra la creación/modificación en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md` en el mismo turno.

---

### Modo 3 — Revisar una spec existente

1. Lee la spec completa y sus fuentes primarias en el orden del **Paso 2**.
2. Ejecuta el script de validación:
   ```bash
   node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-NN.md
   ```
3. Recorre [references/validacion.md](references/validacion.md) y [references/guia-de-secciones.md](references/guia-de-secciones.md).
4. Entrega el informe de auditoría siguiendo el formato de `references/validacion.md`:
   - **Bloqueantes (`[ERROR]`):** Contradicciones con `CONTEXT.md` o `architecture-overview.md`, ausencia de reglas obligatorias (`96%/4%`, `7d/24h/+7d/32h/30m`, máx. 2 correcciones, IA fuera de imagen/texto en MVP), falta de demarcación manual `🛡️` en Open Payments, tareas `T-F*` huérfanas o `RF-NN` sin escenario `Dado / Cuando / Entonces` o sin prueba en Sección 9.
   - **Mejoras y advertencias (`[AVISO]`):** Concreciones recomendadas en contratos Zod, códigos de error o casos de borde.
   - **Veredicto del estado actual:** Indica si la spec cumple los requisitos para permanecer en su estado o avanzar al siguiente (`Redactada -> Implementada -> Testeada -> Aprobada`).

---

### Modo 4 — Actualizar o evolucionar el estado de una spec

El ciclo de vida evolutivo de TaskStream AI (`CONTEXT.md` §2.1 y `planning/sdd-process.md` §4) tiene 4 estados:

| Estado en Cabecera | Etapa en `pbp-development.md` | Condición para alcanzar este estado | Quién lo autoriza |
|---|---|---|---|
| **`Redactada (DRAFTED)`** | **Etapa Alfa** (Inicio de Fase) | Las 12 secciones están completas, `check-spec.mjs` da `0 errores` y los contratos en `packages/shared-schemas` están especificados para desbloquear a `FE-1`, `FE-2`, `BE-1`, `BE-2` y `AI-1`. | Agente / Equipo al redactar |
| **`Implementada (IMPLEMENTED)`** | **Etapa Beta** (Desarrollo Paralelo) | El código de la capacidad en Frontend, Backend e IA (respetando la autoría manual `🛡️` en Open Payments) ha sido construido y cualquier ajuste técnico emergente se ha reflejado en la spec. | Agente / Equipo al implementar |
| **`Testeada (TESTED)`** | **Etapa Gamma** (Integración y Pruebas) | Los mocks se han conectado con servicios reales (*Adapter Swap*) y todas las pruebas de la Sección 9 (contratos Zod + escenarios BDD `Dado / Cuando / Entonces` + casos borde) pasan al 100 %. | Agente / Equipo tras ejecutar tests |
| **`Aprobada (APPROVED)`** | **Cierre de Fase** (*Feature-Gated*) | Cero preguntas abiertas bloqueantes en Sección 11, pruebas al 100 %, trazabilidad al día en `AI_USAGE.md` / `promptsAI_USAGE.md` y **confirmación explícita del líder del proyecto**. | **Exclusivamente el líder del proyecto** |

- Cada vez que actualices el contenido o el estado de una spec:
  1. Añade una nueva fila en la tabla de la **Sección 12 (Registro de Cambios)** de la spec.
  2. Sincroniza el estado en `specs/README.md` y el estado de las tareas `T-F*` en `planning/taskboard.md`.
  3. Ejecuta `node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-NN.md`.
  4. Actualiza `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.

---

## Formato del informe final al usuario

Al terminar cualquier operación (Arranque, Redactar, Revisar o Actualizar), presenta siempre un resumen estructurado con:

1. **Archivos creados o modificados** (incluyendo los artefactos de trazabilidad `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`) y el **estado actual de la spec** (`Redactada (DRAFTED)`, `Implementada (IMPLEMENTED)`, `Testeada (TESTED)` o `Aprobada (APPROVED)`).
2. **Resultado del script `check-spec.mjs`:** número de errores (`0` obligatorio para entregar) y avisos, justificando cualquier aviso que permanezca.
3. **Desbloqueo por rol (`2 FE / 2 BE / 1 IA`):** qué contratos y mocks quedan listos para `FE-1`, `FE-2`, `BE-1` (destacando si aplica `🛡️ [MANUAL / IA MÍNIMA-NULA]`), `BE-2` y `AI-1`.
4. **Concreciones técnicas añadidas** que conviene que el líder revise (nuevos códigos de error, rutas de endpoints, detalles de esquemas Zod o reglas de UI).
5. **Preguntas abiertas en la Sección 11** (si las hay), cada una con su opción recomendada.

---

## Trabajo conjunto con las demás skills del proyecto

`taskstream-spec` actúa como el **orquestador documental** del repositorio y se complementa directamente con las demás *skills* instaladas en `.agents/skills/`, `.kiro/skills/` y `.claude/skills/`:

| Skill del Proyecto | Cómo trabaja en conjunto con `taskstream-spec` |
|---|---|
| **`grill-with-docs` / `grill-me` / `grilling`** | Úsala **antes de redactar** una spec cuando existan decisiones de diseño abiertas o ambigüedades funcionales, entrevistando al líder en rondas hasta vaciar la frontera de dudas. |
| **`domain-modeling`** | Úsala para modelar entidades en 3NF libres de *God-Entities*, precisar el vocabulario del dominio (`EscrowLedger`, `TaskOrder`, `DeadlineExtensionRequest`, `DisputeCase`) y documentar decisiones arquitectónicas en `CONTEXT.md` y `architecture-overview.md`. |
| **`codebase-design`** | Úsala al redactar las **Secciones 3, 4 y 5** de una spec para diseñar módulos profundos (*deep modules*) con interfaces simples (`packages/shared-schemas`, `IEscrowPaymentGateway`) que permitan el trabajo paralelo sin bloqueos entre `FE-1`, `FE-2`, `BE-1`, `BE-2` y `AI-1`. |
| **`tdd`** | Úsala al pasar de `Redactada (DRAFTED)` a `Implementada (IMPLEMENTED)` y `Testeada (TESTED)`: cada requisito `RF-NN` y escenario `Dado / Cuando / Entonces` de las **Secciones 8 y 9** se convierte en una prueba automatizada (`RF-NN: ...`) bajo el ciclo *Red-Green-Refactor*. |
| **`code-review`** | Úsala al auditar la implementación de una spec: su eje **Spec** contrasta el código real contra los `RF-NN` de `specs/SPEC-NN.md`, y su eje **Standards** verifica el cumplimiento de `AGENTS.md`, `CONTEXT.md` y la frontera manual `🛡️` de Open Payments. |
| **`prisma-orm-setup` y `prisma-client-api`** | Úsalas al redactar y verificar la **Sección 4** en `SPEC-01`, `SPEC-02` y `SPEC-04`..`SPEC-10` para asegurar esquemas Prisma 6 óptimos, índices compuestos, restricciones `CHECK` SQL y transacciones ACID con bloqueo pesimista/optimista en `EscrowLedger` y `OpenPaymentsTransaction`. |
| **`nestjs-best-practices`** | Úsala al redactar y verificar las **Secciones 5 y 7** en `SPEC-01`..`SPEC-10` para estructurar módulos de NestJS 10.4, inyección de dependencias limpia, Guards de autorización (bloqueo de `/originals` hasta `FINAL_CLAIM_WINDOW_30M`), workers de BullMQ y manejo estandarizado de excepciones. |
| **`clerk-nextjs-patterns` y `clerk-webhooks`** | Úsalas en **`SPEC-02`** para especificar el middleware de `@clerk/nextjs v6` en Next.js 15.5, Server Actions autenticadas, el cambio en tiempo real `Buyer Mode / Seller Mode` y la verificación criptográfica del webhook de sincronización de usuarios hacia PostgreSQL (`T-F1-BE2-01`). |
| **`vercel-react-best-practices`** | Úsala al redactar y verificar la **Sección 6** en `SPEC-01`..`SPEC-12` para asegurar patrones óptimos de Next.js 15.5 App Router y React 19 (Server Components vs. Client Components, Suspense, paralelismo de carga y rendimiento en dashboards y salas de negociación). |
| **`gsap-scrolltrigger`, `gsap-react`, `threejs-fundamentals` y `threejs-animation`** | Úsalas al redactar y verificar la **Sección 6** en **`SPEC-03`**, **`SPEC-04`**, **`SPEC-06`** y **`SPEC-09`** para garantizar el aislamiento `"use client"` con `next/dynamic(..., { ssr: false })`, la sincronización `Lenis` + `GSAP ScrollTrigger` mediante `useGSAP()`, y la mutación directa de `useRef<THREE.Group | THREE.Mesh>()` a 60–120 FPS con **cero `useState` durante el scroll**. |
| **`ai-sdk`** | Úsala al redactar y verificar **`SPEC-08`** para especificar la orquestación con Vercel AI SDK (`generateObject`), conectando el contrato exacto de entrada `AiAdvisorInputContractSchema` con el contrato de salida `AiAdvisorReportSchema` exclusivamente para entregas de **imagen y texto** en el MVP. |
| **`to-spec`** | Úsala para sintetizar de forma ágil discusiones, acuerdos técnicos y requerimientos en borradores de especificaciones estructuradas antes de formalizarlas con la plantilla canónica de 12 secciones de `taskstream-spec`. |
| **`zod-validation-utilities` y `zod-schema-validation`** | Úsalas al redactar y verificar la **Sección 3** en `SPEC-01`..`SPEC-10` para diseñar esquemas Zod reutilizables en `packages/shared-schemas`, inferencia de tipos estricta (`z.infer`), validación en capas API (DTOs de NestJS), coerción segura de fechas/números y validación de formularios con React Hook Form. |
| **`frontend-design`, `shadcn-ui` y `tailwind-css-patterns`** | Úsalas al redactar y verificar la **Sección 6** en `SPEC-01`..`SPEC-12` para asegurar dirección visual distintiva y profesional (evitando interfaces genéricas), componentes accesibles basados en Radix UI (`shadcn/ui`), estilos responsivos utility-first y consistencia visual en el dashboard y salas de negociación en Next.js 15.5 / React 19. |

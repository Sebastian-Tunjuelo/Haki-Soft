# Registro Íntegro de Prompts de IA — TaskStream AI (`promptsAI_USAGE.md`)

Este archivo contiene el **registro histórico, secuencial e íntegro (sin omisiones)** de todos y cada uno de los prompts enviados por el equipo de **TaskStream AI** a la herramienta de IA (**`Antigravity`**), en cumplimiento de la Política Inmutable de Uso de IA del proyecto y la [Política de Uso de IA del Hackathon de Interledger](https://interledger.org/es/hackathon/ai-policy/).

> **Regla de Gobernanza:** Cada nuevo prompt enviado a la IA debe añadirse obligatoriamente a este archivo (y a su réplica en [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md)) incluyendo: **(1)** el área del proyecto donde toma lugar, **(2)** un breve resumen de su funcionalidad, **(3)** los archivos creados o modificados, y **(4)** el **texto literal completo (verbatim) del prompt enviado**.

---

## Índice de Prompts Registrados

| # | Fecha | Herramienta de IA | Área(s) del Proyecto | Resumen Breve de Funcionalidad | Archivos Creados / Modificados |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Prompt #001** | `2026-10-16` | `Antigravity` | `Gobernanza`, `Planeación`, `Backend`, `Frontend`, `IA`, `Tests` | Implementación de la Política de Uso de IA (`AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`, `AGENTS.md`), resolución definitiva de las preguntas abiertas `Q1` a `Q6` en `.agents/CONTEXT.md` e investigación profunda de las herramientas de Open Payments API e Interledger. | [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md), [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #002** | `2026-10-16` | `Antigravity` | `Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests` | Generación de los 4 artefactos rectores de ingeniería (`architecture-overview.md` con modelo de datos 3NF libre de *God-Entities*, `taskboard.md` con tareas/prioridades/decisiones, `pbp-development.md` con desarrollo fase por fase sin bloqueos para los 5 developers y `sdd-process.md` integrando el flujo SDD + BDD y las *skills* del proyecto). | [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md), [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md), [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md), [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #003** | `2026-10-16` | `Antigravity` | `Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests` | Refinamiento de `sdd-process.md` (sin *skills* ni ejemplos de specs, impacto de SDD en el aplicativo final MVP/Demo, mención de archivos sin rutas y catálogo de `SPEC-00` a `SPEC-12` Deploy), actualización de `CONTEXT.md` (IA limitada en el MVP solo a tareas de imagen y texto y contrato exacto `AiAdvisorInputContractSchema` para `AiAdvisorService`) y adaptación de `architecture-overview.md`, `taskboard.md` y `pbp-development.md` al flujo completo de pagos y plazos (`7d` inicial, `24h` respuesta a extensión, `hasta +7d` extensión única, `32h` revisión por entrega, máx. 2 correcciones y `30m` ventana final). | [`planning/sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/sdd-process.md), [`planning/architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/architecture-overview.md), [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md), [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/taskboard.md), [`planning/pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/pbp-development.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #004** | `2026-10-16` | `Antigravity` | `Gobernanza`, `Planeación`, `Frontend`, `Backend`, `IA`, `Tests` | Investigación profunda mediante `find-skills` e instalación multi-agente (`.agents/skills`, `.kiro/skills` y `.claude/skills`) de las *skills* oficiales de valor real para el stack del proyecto, y creación/adaptación 100% a **TaskStream AI** de la skill `taskstream-spec` (`SKILL.md`, `references/guia-de-secciones.md`, `references/validacion.md` y `scripts/check-spec.mjs`) sin residuos externos. | [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md), [`.agents/skills/taskstream-spec/references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md), [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md), [`.agents/skills/taskstream-spec/scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs) *(más réplicas en `.kiro/skills/` y `.claude/skills/`)*, [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #005** | `2026-10-16` | `Antigravity` | `Gobernanza` | Creación del repositorio privado `Haki-Soft` en GitHub bajo la cuenta `Sebastian-Tunjuelo`, commit inicial con los 211 archivos del monorepo y adición de los 4 colaboradores del equipo con permiso `write`: `Samuel-Duque`, `GeorgeAMS`, `SaraMLopera` y `MaicolD0930`. | [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #006** | `2026-10-16` | `Cursor` | `Planeación` | Lectura/comprensión del contexto del proyecto; generación de preguntas de aclaración **sin modificar archivos**. | Ninguno (solo lectura) |
| **Prompt #007** | `2026-10-16` | `Cursor` | `Planeación` | Respuestas de negocio a preguntas 1–12 (extensión, disputas, wallets, Gig vs publicación, IA fuera de sesión). | Ninguno (solo diálogo) |
| **Prompt #008** | `2026-10-16` | `Cursor` | `Planeación` | Aclaraciones 3, 5–7, 10–11 (mediación post-2ª corrección, Gig fijo, bandeja de ofertas, arranque mutuo, una wallet). | Ninguno (solo diálogo) |
| **Prompt #009** | `2026-10-16` | `Cursor` | `Planeación` | Confirmación: tras reembolso la actividad muere y el Freelancer queda desligado (sin reapertura automática). | Ninguno (solo diálogo) |
| **Prompt #010** | `2026-10-16` | `Cursor` | `Planeación`, `Gobernanza`, `Backend` | Aplicar todas las aclaraciones en la documentación SSoT y planeación alineada. | [`.agents/CONTEXT.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/CONTEXT.md), [`planning/architecture-overview.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/architecture-overview.md), [`planning/taskboard.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/taskboard.md), [`planning/pbp-development.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/pbp-development.md), [`planning/sdd-process.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/sdd-process.md), [`validacion.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/skills/taskstream-spec/references/validacion.md) (+ réplicas), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #011** | `2026-10-16` | `Cursor` | `Planeación`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests` | Redactar e implementar SPEC-00 y SPEC-01; redactar SPEC-02 y SPEC-03 sin implementar integraciones externas. | `specs/_template.md`, `specs/README.md`, `specs/SPEC-00.md`, `specs/SPEC-01.md`, `specs/SPEC-02.md`, `specs/SPEC-03.md`, `packages/shared-schemas/`, `apps/web/`, `apps/api/`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md` |
| **Prompt #012** | `2026-10-16` | `Antigravity` | `Herramientas / DX`, `Backend`, `Gobernanza` | Aprovisionamiento e integración en el proyecto `Haki-Soft` del CLI interactivo oficial de Open Payments (`tools/open-payments-cli`) y del servidor MCP (`tools/open-payments-mcp`) con compilación TypeScript, configuración `.env.example`, desacoplamiento Git y manual operativo `tools/README.md`. | [`tools/README.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/README.md), [`tools/open-payments-cli/.env.example`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli/.env.example), [`tools/open-payments-cli/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli), [`tools/open-payments-mcp/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-mcp), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |

---

## Detalle de Prompts (Texto Completo Verbatim)

### Prompt #001 — Implementación de Política de Uso de IA, Resoluciones `Q1`–`Q6` y Catálogo de Herramientas Open Payments / Interledger

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Gobernanza`, `Planeación`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Instaura la política obligatoria de trazabilidad de IA en la raíz del proyecto ([`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) y [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md)) como fuente de verdad, especificando la herramienta utilizada (`Antigravity`), las áreas de uso, los archivos modificados por la IA y los archivos con uso de IA mínimo o nulo (como el servicio de pagos abiertos).
  2. Actualiza [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) con las respuestas definitivas a las preguntas abiertas `Q1` a `Q6`:
     * **`Q1` (Opción recomendada):** Separa el reloj de revisión de `72h` sobre el *Protected Preview* (Fase A: `IN_REVIEW`, hasta 2 revisiones) del reloj de apelación final de `30 minutos` que corre tras desbloquear el archivo original final (Fase B: `FINAL_APPEAL_WINDOW_30M`) antes del desembolso irreversible `96% / 4%`.
     * **`Q2` (Opción recomendada — Liquidación Limpia):** Al elegir *"Re-publicar tarea"* tras un incumplimiento, se reembolsa automáticamente el 100% del Escrow previo a la billetera del Buyer y se reabre la publicación en `OPEN_FOR_PROPOSALS`.
     * **`Q3` y `Q4` (Ventana de 24h en Prórroga con Reembolso Automático por Silencio):** Cuando el freelancer solicita una prórroga (`24–48h`), el Buyer tiene un plazo de `24h` para decidir si brinda el tiempo extra o solicita el reembolso; si no hay respuesta en `24h`, se genera automáticamente el reembolso del 100% (`AUTO_REFUNDED_BY_TIMEOUT`).
     * **`Q5` (Enfoque en Flujo Principal):** Se prioriza el flujo principal sin profundizar prematuramente en complejidades internas del modelo de IA, adaptándolo luego según las necesidades.
     * **`Q6` (Monetización a Futuro Post-MVP):** La suscripción paga del Buyer (`Buyer AI Pro`) se deja únicamente como mención de monetización futura y se retira de la implementación técnica del MVP.
  3. Documenta a profundidad las herramientas y capacidades oficiales de **Open Payments API e Interledger** (`UnauthenticatedClient`, `AuthenticatedClient` RFC 9421, `Subject Grant`, verificación de hash en callbacks GNAP, `IncomingPayment.complete`, `Quote` con `receiveAmount` vs. `debitAmount`, `GET /outgoing-payment-grant`, `token.rotate` / `token.revoke` / `grant.cancel`, Webhooks de Rafiki y estándar W3C Web Monetization).
* **Archivos creados / modificados:**
  * [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) *(Modificado)*
  * [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md) *(Creado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Creado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Creado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Creado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Dentro del proyecto implementa una política de uso de IA. Esta impone las siguientes premisas: Cada equipo debe añadir un archivo nombrado a la raíz de su repositorio de proyectos en GitHub. Este archivo debe indicar:AI_USAGE.md

¿Qué herramienta(s) de IA se utilizaron?
¿Para qué se usaban?
¿Dónde en el proyecto se usaron (archivos, características o componentes específicos)?, o mencionar el proyecto completo, si no se escribió ningún archivo sin IA
Especifica archivos específicos donde se haya usado IA mínima o nula, por ejemplo el archivo del servicio de pagos abiertos

Los equipos también deben enviar los prompts que usaron para instruir a las herramientas de IA para programar en su repositorio, en una carpeta llamada (o añadida si el registro es corto). Esto debería incluir el texto de prompt enviado a la IA, no solo un resumen. Todas las herramientas de IA utilizadas deberían poder proporcionar una lista de prompts para guardar en la carpeta o archivo./promptsAI_USAGE.md.

Toda esta política debe ser una fuente de verdad agregada al contexto, cada movimiento, cambio, modificación o decisión que tome un módelo de IA deberá registrarse como se plantea en las premisas. En el archivo AI_USAGE.md se ponen las herramientas de IA utilizadas, en qué parte se utilizaron (planeación, backend, frontend, IA, tests, etc). Especifica claramente los archivos modificados por la IA. (no debes ser tan especifico añadiendo modelos o esfuerzos, solo la IA que se utilizó). Todos y cada uno de los prompts sin excepción deben ser añadidos en el archivo promptsAI_USAGE.md, además de un breve resumen acerca de su funcionalidad y en qué área toma lugar (frontend, backend, tests, IA, etc). 

Además implementa las siguientes respuestas que se dieron a las preguntas abiertas en el CONTEXT.md. Tomando en cuenta desde ya la política del uso de IA e implementala:

Q1, Q2, Q4 se toma la opción recomendada
Q3: La idea es que cuando se solicite una prorroga, hay un plazo de 24h para que el que solicito el reembolso decida si brindar el tiempo extra o simplemente solicitar el reembolso, si no hay respuesta ahi si se genera automatico el reembolso.
Q5: No hay que profundizar en el modelo de la ia, de momento nos enfocaremos en el flujo principal, y luego iremos adaptando dicha pregunta según las necesidades.
Q6: Se plantea como una idea de monetizar a futuro, pero para el mvp no se realizara, simplemente se hara su mención.

Revisa a profundidad la documentación, acerca sobre herramientas que ofrezca la api de inter, para saber de que mas podemos dar uso, por ejemplo, o otras herramientas de la propias de ella para usar al máximo lo que nos brinda open payments y interledger.
```

---

### Prompt #002 — Generación de `architecture-overview.md`, `taskboard.md`, `pbp-development.md` y `sdd-process.md`

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Genera [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md) con la arquitectura integral del sistema, la estructura del monorepo y el **Modelo de Datos Relacional en PostgreSQL + Prisma 6 en Tercera Forma Normal (3NF)** libre de *God-Entities* e incongruencias (separando `User`, `SellerProfile`, `UserWallet`, `WalletVerificationChallenge`, `Gig`, `ClientTaskPublication`, `NegotiationProposal`, `NegotiationMessage`, `TaskOrder`, `TaskAcceptanceCriterion`, `TaskTechnicalConstraint`, `DeadlineExtensionRequest`, `EscrowLedger`, `OpenPaymentsTransaction`, `RafikiWebhookEvent`, `TaskDeliverable`, `AiAdvisorReport`, `AiCriterionEvaluation`, `DisputeCase` y `ScheduledTimerJob`), más restricciones `CHECK` SQL nativas.
  2. Genera [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) con todas las tareas del proyecto desglosadas por fases (`Fase 0` a `Fase 5`), prioridades (`P0` a `P3`), asignación a los 5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`), demarcación explícita de tareas con intervención de IA mínima/nula, decisiones cerradas (`Q1`–`Q6`) y frontera de decisiones técnicas operativas (`TD-01` a `TD-06`).
  3. Genera [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) detallando el protocolo de ingeniería paralela sin bloqueos (*Zero-Blocking Parallel Engineering*) para que ninguna función del Backend frene a Frontend o IA (mediante contratos ejecutables en `packages/shared-schemas`, MSW, adaptadores inyectables y *fixtures*), junto con las fases de desarrollo 0 a 5 y la redacción/aprobación de especificaciones.
  4. Genera [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) documentando el impacto del **SDD Evolutivo + BDD**, el uso activo de las *skills* del repositorio ([`grilling`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grilling/SKILL.md), [`grill-me`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grill-me/SKILL.md) y [`grill-with-docs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grill-with-docs/SKILL.md)), los 4 estados del ciclo de vida (`DRAFTED -> IMPLEMENTED -> TESTED -> APPROVED`), el catálogo `SPEC-000` a `SPEC-010` y la plantilla oficial para redactar especificaciones.
* **Archivos creados / modificados:**
  * [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md) *(Creado)*
  * [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) *(Creado)*
  * [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) *(Creado)*
  * [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) *(Creado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
A partir del contexto general del proyecto genera los siguientes archivos: architecture-overview.md, taskboard.md, pbp-development.md (desarrollo fase por fase) y sdd-process.md . Ten en cuenta las skills que están dentro del proyecto. Dentro de la arquitectura, pon todo referente a esta, la estructura del proyecto, el modelado de la base de datos (creala verificando que no hayan incongruencias, una God-Entity, o diferentes problemas dentro de este modelo de datos, debe salir lo más "limpia" posible), en el taskboard pon todas las tareas, prioridades, decisiones pendientes, etc. En el phase-by-phase realiza todas las fases de desarrollo, redaccion de specs, etc. Ten en cuenta que el proyecto se desarrollará por los 5 developers ya mencionados en los equipos predefinidos, entonces el desarrollo debe seguirse según los roles, es decir, que una función del backend no imposibilite o frene el desarrollo del equipo de frontend o IA. Dentro del sdd-process se encontrará como impacta la metodología de desarrollo SDD en el proyecto, cómo se redactaran las specs y en sí todo el proceso de desarrollo.
```

---

### Prompt #003 — Refinamiento de `sdd-process.md`, Acotación de IA a Imagen/Texto (`AiAdvisorInputContractSchema`) y Flujo Completo de Pagos y Plazos

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Modifica [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) eliminando la implementación de las *skills*, manteniendo las funciones generales de las especificaciones sin ejemplificaciones de plantillas, enfocando el impacto del SDD en el **aplicativo final (MVP / Demo)**, referenciando archivos únicamente por su nombre (sin ruta) y estableciendo el catálogo desde `SPEC-00` (creación de la carpeta `specs` y su `README.md`) hasta `SPEC-12` (`Deploy`).
  2. Actualiza [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) para establecer que en el MVP la auditoría y asesoría de IA (`AiAdvisorService`) **solo aplica a tareas de imagen y texto**, dejando el resto de formatos y la suscripción planteados para Post-MVP, y exigiendo en `SPEC-08.md` el contrato exacto de entrada (`AiAdvisorInputContractSchema`) que recibe `AiAdvisorService` para crear `AiAdvisorReportSchema`.
  3. Adapta [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md), [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) y [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) al flujo oficial completo de contratación, escrow, entregas, revisiones y pagos: **7 días** de entrega inicial, **extensión única de hasta 7 días adicionales** (máx. 14 días totales), **24 horas** para respuesta del Buyer (con reembolso automático del 100 % si no responde o si vence la extensión sin entrega), **32 horas** para revisar cada entrega (con aceptación automática al vencer), **máximo 2 correcciones globales por orden**, **30 minutos** de ventana final de reclamaciones tras aceptación expresa o automática (con suspensión de pago si se presenta reclamación válida) y disputa administrativa con decisión binaria justificada (**100 % al Buyer** o **96 % / 4 % al Freelancer**).
* **Archivos creados / modificados:**
  * [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) *(Modificado)*
  * [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md) *(Modificado)*
  * [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) *(Modificado)*
  * [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) *(Modificado)*
  * [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) *(Modificado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Modifica el sdd-process, elimina la implementación de las skills, eso es ajeno a ese documento. Además deja las cosas generales, no ejemplifiques como se usan las specs solo di sus funciones generales. El impacto del SDD cambialo, es el impacto que genera al proyecto, es decir, al aplicativo final (MVP/Demo), no al desarrollo de este. Al mencionar un archivo no hace falta que coloques su ruta exacta del documento, solo pon el nombre del archivo sin la ruta, corrijelo. Las specs van a ir desde la spec-00 la cual será la creación de la carpeta specs y su readme, hasta la spec-xx (última spec) que será la de deploy. En context.md modifica lo de la suscripción y la auditoria por parte de IA, esta solo auditará y asesorará a tareas que tengan que ver con imagen y texto, el resto se deja planteado pero no entrará dentro del MVP, modifica los archivos que veas convenientes para que este cambio quede implementado.
 Para crear AiAdvisorReportSchema se necesita con claridad concretar en una SPEC el contrato exacto que recibirá AiAdvisorService. Además adapta el documento de la arquitectura al siguiente texto en python que explica el flujo general de los pagos
import pypandoc

content = r"""# TaskStream AI — Flujo completo de contratación, escrow, entregas, revisiones y pagos

## 1. Objetivo y participantes

TaskStream AI es un marketplace de tareas que conecta a:

- **Buyer (contratante):** publica o contrata un trabajo y deposita los fondos.
- **Freelancer (trabajador independiente):** realiza y entrega el trabajo contratado.
- **TaskStream AI:** facilita la contratación, mantiene los fondos en escrow mientras corresponde y aplica las reglas de revisión, reembolso y liberación de pagos.
- **Administrador:** interviene cuando existe una disputa que no puede resolverse mediante el flujo normal.

El dinero de la orden se mantiene en el escrow de TaskStream hasta que se cumplan las condiciones necesarias para liberarlo o reembolsarlo.

## 2. Resumen de los plazos

| Situación | Plazo | Regla |
|---|---:|---|
| Entrega inicial | 7 días | Plazo inicial máximo para que el Freelancer entregue el trabajo. |
| Respuesta a una solicitud de extensión | 24 horas | El Buyer debe aprobar o rechazar la extensión. |
| Extensión de entrega | Hasta 7 días adicionales | Solo puede solicitarse y aprobarse una vez por orden. |
| Revisión de una entrega | 32 horas | El Buyer puede aceptar, solicitar correcciones o dejar vencer el plazo. |
| Ventana final de reclamaciones | 30 minutos | Comienza después de una aceptación expresa o automática. |
| Correcciones | Máximo 2 por orden | El límite se aplica a toda la orden y no se reinicia con una extensión. |

Los plazos son independientes: el periodo de 24 horas corresponde a responder una solicitud de extensión; las 32 horas corresponden a revisar una entrega; y los 30 minutos corresponden a la ventana final de reclamaciones.

## 3. Inicio de una orden

1. El Buyer contrata al Freelancer y deposita los fondos correspondientes en el escrow de TaskStream.
2. La orden pasa a estar activa y comienza el plazo inicial de entrega de 7 días.
3. El Freelancer debe entregar el trabajo conforme a los requisitos y el alcance acordados en la orden.

## 4. Si el Freelancer entrega dentro de los primeros 7 días

Cuando el Freelancer entrega a tiempo, se inicia el periodo de revisión del Buyer, que tiene un máximo de 32 horas para responder.

Durante ese periodo, el Buyer puede:

- **Aceptar la entrega:** el trabajo pasa a la ventana final de reclamaciones de 30 minutos.
- **Solicitar correcciones:** puede hacerlo hasta un máximo de 2 veces durante toda la orden.
- **No responder:** si pasan las 32 horas sin respuesta, la entrega se considera aceptada automáticamente y comienza la ventana final de reclamaciones de 30 minutos.

### 4.1. Si el Buyer acepta la entrega

La aceptación no libera el dinero de inmediato. Primero comienza una ventana de 30 minutos durante la cual puede presentarse una reclamación.

Si transcurren los 30 minutos sin que se presente una reclamación, se libera el dinero de la siguiente manera:

- **96 % para el Freelancer.**
- **4 % para TaskStream.**

### 4.2. Si el Buyer no responde en 32 horas

Si el Buyer no responde dentro del plazo de revisión:

1. La entrega se considera aceptada automáticamente.
2. Comienza la ventana de reclamaciones de 30 minutos.
3. Si no se presenta ninguna reclamación durante esa ventana, se libera el 96 % al Freelancer y el 4 % a TaskStream.

La falta de respuesta durante el periodo de revisión, por sí sola, no libera inmediatamente los fondos: primero debe transcurrir la ventana final de reclamaciones.

## 5. Solicitudes de corrección

El Buyer puede solicitar un máximo de **2 correcciones por orden**. Las correcciones sirven para pedir ajustes o reorganización del trabajo dentro del alcance acordado originalmente.

Cada vez que el Buyer solicita una corrección:

1. El Freelancer recibe la solicitud y realiza los ajustes correspondientes.
2. El Freelancer vuelve a entregar el trabajo.
3. Desde esa nueva entrega comienza otro periodo de revisión de 32 horas para el Buyer.
4. El Buyer puede aceptar la nueva entrega, solicitar otra corrección si todavía le queda alguna disponible o no responder dentro del plazo.

El contador de correcciones es global para la orden: no se reinicia cuando se realiza una nueva entrega ni cuando se concede una extensión del plazo de trabajo.

### 5.1. Acuerdo después de las correcciones

Si, después de las correcciones permitidas, las partes llegan a un acuerdo y el Buyer acepta la entrega, comienza la ventana final de reclamaciones de 30 minutos.

Si no se presenta una reclamación durante esa ventana, se libera el 96 % al Freelancer y el 4 % a TaskStream.

### 5.2. No hay acuerdo después de las 2 correcciones

Si se agotan las 2 correcciones y las partes no logran llegar a un acuerdo, se abre una **disputa administrativa**.

En ese momento:

- Los fondos permanecen retenidos en el escrow.
- No se realiza un reembolso automático.
- No se libera automáticamente el pago al Freelancer.
- El administrador revisa la orden y las evidencias antes de decidir.

El administrador debe considerar, entre otros elementos:

- Los requisitos y el alcance acordados originalmente.
- Las entregas realizadas.
- Las solicitudes de corrección y las respuestas.
- Los mensajes y demás evidencias relevantes de ambas partes.

La decisión debe estar acompañada de una justificación basada en las evidencias.

**Si la decisión favorece al Buyer:** cuando se determina que el Freelancer no cumplió los requisitos acordados, se reembolsa el 100 % del importe reembolsable de la orden.

**Si la decisión favorece al Freelancer:** cuando se determina que cumplió los requisitos y que el Buyer rechaza injustificadamente el trabajo o exige tareas fuera del alcance acordado, se libera el 96 % al Freelancer y el 4 % a TaskStream.

Mientras la disputa siga pendiente, los fondos no deben liberarse ni reembolsarse automáticamente.

## 6. Si el Freelancer no entrega dentro de los primeros 7 días

Si vence el plazo inicial sin que el Freelancer entregue el trabajo, puede solicitar **una única extensión de hasta 7 días adicionales**.

La extensión no es automática: debe enviarse una solicitud al Buyer y esperar su respuesta.

### 6.1. El Buyer recibe la solicitud de extensión

Cuando el Freelancer solicita la extensión:

1. TaskStream notifica al Buyer.
2. El Buyer dispone de un máximo de 24 horas para aprobar o rechazar la solicitud.
3. La solicitud solo puede generar una extensión; no se permite una segunda extensión para la misma orden.

### 6.2. El Buyer aprueba la extensión

Si el Buyer aprueba la solicitud:

- El Freelancer recibe hasta 7 días adicionales, contados a partir del vencimiento del plazo inicial.
- El límite total de entrega será de hasta 14 días desde el inicio original de la orden.
- No se puede solicitar una segunda extensión.
- Si el Freelancer entrega dentro del plazo extendido, se aplica el flujo normal de revisión de 32 horas, con un máximo de 2 correcciones por orden y la posibilidad de una disputa administrativa si no hay acuerdo.

La extensión cambia el plazo disponible para entregar, pero no reinicia el contador de correcciones.

### 6.3. El Buyer rechaza la extensión y solicita el reembolso

Si el Buyer rechaza la extensión y solicita el reembolso, TaskStream devuelve el 100 % del importe reembolsable de la orden.

### 6.4. El Buyer no responde en 24 horas

Si el Buyer no responde dentro de las 24 horas posteriores a la solicitud de extensión:

1. Se activa el reembolso automático al Buyer.
2. Se devuelve el 100 % del importe reembolsable de la orden.
3. Se notifica a las partes que venció el plazo inicial, que el Freelancer solicitó una extensión y que, al no recibir respuesta del Buyer dentro del plazo, se procesó el reembolso.

### 6.5. El Freelancer tampoco entrega dentro de la extensión

Si el Buyer aprobó la extensión, pero el Freelancer no entrega antes de que venza el plazo extendido:

- Se procesa un reembolso automático del 100 % del importe reembolsable de la orden.
- No se permite una segunda extensión.
- Se notifica tanto al Buyer como al Freelancer sobre el vencimiento y el reembolso.

## 7. Distribución de fondos

Cuando una orden finaliza correctamente y corresponde pagar al Freelancer, la distribución es:

| Destinatario | Porcentaje |
|---|---:|
| Freelancer | 96 % |
| TaskStream | 4 % |

Cuando corresponde reembolsar por vencimiento de entrega o por una disputa resuelta a favor del Buyer, se devuelve el 100 % del importe reembolsable de la orden.

Los pagos o reembolsos no deben ejecutarse mientras exista una disputa administrativa pendiente. Cualquier comisión externa o coste de red que pueda afectar el importe efectivamente recibido debe definirse en las condiciones operativas del producto.

## 8. Reglas globales que deben respetarse

1. **Máximo 2 correcciones por orden.** El contador es global y no se reinicia con nuevas entregas ni con una extensión.
2. **Una sola extensión.** El Freelancer puede solicitar una única extensión de hasta 7 días adicionales.
3. **24 horas para responder a la extensión.** Si el Buyer no responde dentro del plazo, se activa el reembolso automático previsto.
4. **32 horas para revisar cada entrega.** Una nueva entrega después de una corrección inicia un nuevo periodo de revisión.
5. **30 minutos de ventana final.** Después de la aceptación expresa o automática, debe transcurrir esta ventana sin reclamaciones antes de liberar el pago.
6. **Disputa administrativa cuando no hay acuerdo.** Si se agotan las 2 correcciones y persiste el desacuerdo, los fondos quedan retenidos hasta que el administrador decida.
7. **No resolver una disputa pendiente mediante automatismos.** Mientras la disputa esté abierta, no se libera el dinero ni se ejecuta un reembolso automático.
8. **Decisiones justificadas.** Las decisiones administrativas deben basarse en los requisitos originales, las entregas y las evidencias disponibles.
9. **Notificaciones claras.** Tanto el Buyer como el Freelancer deben recibir las notificaciones pertinentes sobre solicitudes de extensión, vencimientos, aceptación automática, disputas y resultados.

## 9. Punto que debe definirse antes de cerrar las reglas

Debe especificarse qué ocurre cuando alguien presenta una reclamación válida durante la ventana final de 30 minutos. La regla de negocio debe aclarar cómo se detiene o suspende la liberación de fondos, quién revisa la reclamación y qué condiciones permiten reanudar el pago o abrir una disputa.

Hasta que esta regla se defina, no debe asumirse que una reclamación presentada dentro de la ventana se ignora ni que el pago se libera automáticamente a pesar de ella.
"""

output_path = "/mnt/data/taskstream_ai_flujo_completo.md"
pypandoc.convert_text(content, "md", format="md", outputfile=output_path, extra_args=["--standalone"])
print(f"Archivo creado: {output_path}")
```


---

### Prompt #004 — Investigación e Instalación Multi-Agente de Skills (`find-skills`) y Adaptación 100% de la Skill `taskstream-spec`

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Gobernanza`, `Planeación`, `Frontend`, `Backend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Utiliza `find-skills` (`npx skills`) para investigar e instalar en `.agents/skills/` (general), `.kiro/skills/` (Kiro) y `.claude/skills/` (Claude Code) las *skills* oficiales con mayor reputación y valor real directo para el stack y metodología de **TaskStream AI**:
     * **Ingeniería SDD + BDD, Dominio, Diseño Modular, TDD y Code Review (`mattpocock/skills`):** `domain-modeling`, `codebase-design`, `tdd`, `code-review` (más sincronización en Claude de `grill-with-docs`, `grill-me`, `grilling` y `find-skills`).
     * **Frontend Next.js 15.5 + React 19, Animación 3D Scroll-Driven y WebGL:** `vercel-react-best-practices` (`vercel-labs/agent-skills`), `gsap-scrolltrigger` y `gsap-react` (`greensock/gsap-skills`), `threejs-fundamentals` y `threejs-animation` (`cloudai-x/threejs-skills`).
     * **Autenticación e Identidad (`SPEC-02`):** `clerk-nextjs-patterns` y `clerk-webhooks` (`clerk/skills`).
     * **Backend NestJS 10.4 y Base de Datos PostgreSQL + Prisma 6 en 3NF:** `nestjs-best-practices` (`kadajett/agent-nestjs-skills`), `prisma-orm-setup`, `prisma-client-api` y `prisma-database-setup` (`prisma/skills`).
     * **Orquestación de IA Consultiva (`SPEC-08`):** `ai-sdk` (`vercel/ai`).
  2. Crea y adapta al 100% la skill **`taskstream-spec`** (en `.agents/skills/taskstream-spec/`, `.kiro/skills/taskstream-spec/` y `.claude/skills/taskstream-spec/`) eliminando cualquier residuo del proyecto de origen y alineándola íntegramente con `.agents/CONTEXT.md`, `planning/architecture-overview.md`, `planning/sdd-process.md`, `planning/pbp-development.md`, `planning/taskboard.md` y `AGENTS.md`:
     * [`SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md): Reglas de oro de TaskStream AI, jerarquía de autoridad, protocolo de ingeniería paralela sin bloqueos para los 5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`), frontera manual `🛡️` en Open Payments, catálogo oficial de `SPEC-00` a `SPEC-12`, modos de operación (`Arranque`, `Redactar`, `Revisar`, `Actualizar` en los 4 estados `Redactada`, `Implementada`, `Testeada`, `Aprobada`) y articulación con todas las *skills* instaladas en el proyecto.
     * [`references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md): Plantilla canónica de 12 secciones (`specs/_template.md`) y guía sección por sección adaptada a los contratos Zod, modelo 3NF Prisma, los 5 relojes BullMQ, escenas 3D con `ScrollTrigger` y `AiAdvisorInputContractSchema`.
     * [`references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md): Lista de verificación semántica de invariantes financieras (`96%/4%`, reembolsos `100%`, doble FX), negociación a la baja, plazos (`7d`, `24h`, `+7d`, `32h`, `30m`, máx. 2 correcciones), alcance de IA exclusivo para imagen y texto en el MVP y formato de informe de revisión.
     * [`scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs): Script automatizado en Node.js que valida cabeceras, estados SDD, las 12 secciones obligatorias, requisitos `RF-NN` con criterios BDD (`**Dado**` / `**Cuando**` / `**Entonces**`), cobertura de pruebas en la Sección 9, cruce de tareas `T-F*` contra `planning/taskboard.md` y frontera manual `🛡️`.
* **Archivos creados / modificados:**
  * [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md) *(Creado y replicado en `.kiro/skills/taskstream-spec/` y `.claude/skills/taskstream-spec/`)*
  * [`.agents/skills/taskstream-spec/references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md) *(Creado y replicado)*
  * [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md) *(Creado y replicado)*
  * [`.agents/skills/taskstream-spec/scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs) *(Creado y replicado)*
  * Directorios de *skills* instaladas en `.agents/skills/`, `.kiro/skills/` y `.claude/skills/` *(Instalados vía `npx skills`)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
usando find-skills investiga a profundidad e instala las skills mas adecuadas para el proyecto solo si dan un valor real al proyecto que esten disponibles para kiro .agents general y claude. Además quiero que adaptes la siguiente skill al proyecto teniendo en cuenta la arquitectura, el contexto y el desarrollo general del proyecto. La spec tiene como objetivo general trabajar con las demás skills para redactar specs de manera óptima, completa y sin contra indicaciones. La skill final sea una estructura de las specs especificas del proyecto, no dejes residuos de referencias o ejemplos del proyecto de donde viene. Adecua la skill 100% al proyecto actual

---
name: englove-spec
description: "Redacta, revisa o actualiza las especificaciones SPEC-NN de Englove en specs/ siguiendo el proceso Spec-Driven Development del proyecto (planning/sdd-process.md): plantilla de 12 secciones, ciclo de vida, calendario de redacción, criterios Dado/Cuando/Entonces y validación contra las decisiones de CONTEXT §14, el fuera de alcance del piloto (§2.4) y los pendientes P-n de §15. Úsala siempre que haya que crear la carpeta specs/ (tarea SPEC-00), redactar o revisar cualquier spec de SPEC-01 a SPEC-10 (o con sufijo, como SPEC-05a), cambiar el estado de una spec, añadir o corregir requisitos RF, o comprobar si una tarea ENG puede empezar porque su spec está Aprobada, aunque el usuario no diga literalmente la palabra spec."
---

# englove-spec — Especificaciones SDD de Englove

Guía para redactar, revisar y mantener las specs de `specs/`. La skill **no sustituye** a los documentos del proyecto: indica qué leer, en qué orden y cómo comprobar el resultado. Si esta skill y un documento de planeación discrepan, manda el documento (y conviene corregir la skill).

## Reglas de oro

1. **Jerarquía de autoridad:** `.agents/CONTEXT.md` → `planning/architecture-overview.md` → `planning/sdd-process.md` → `planning/pbp-development.md` → `planning/taskboard.md` → `specs/` → código. Una spec nunca contradice un documento superior ni una spec Aprobada de la que depende. Si para escribirla haría falta contradecirlo, detente: primero se propone una decisión nueva en CONTEXT §14 (o en architecture §14) y la spec se escribe después. No retoques en silencio un documento superior para que encaje con la spec.
2. **Sin spec Aprobada no hay código de producción.** Si alguien pide implementar una tarea `ENG` cuya spec no está Aprobada, no empieces: dilo y ofrece redactar o completar la spec. La única excepción es un prototipo desechable, declarado como tal, para responder una pregunta abierta (sdd-process §6). En las Etapas 1 y 2 rigen además las compuertas de la decisión 65.
3. **El agente redacta; el líder del proyecto aprueba.** Puedes dejar una spec en `Borrador` o proponerla `En revisión`. Nunca la marques `Aprobada` ni rellenes "Aprobada por / fecha" sin una confirmación explícita del líder en la conversación. Tampoco des por cerrado un pendiente P-n: su propuesta vigente es **Propuesto** hasta que el líder la confirme.
4. **Enlazar, no copiar.** La spec cita `CONTEXT §x`, `architecture §y` y el número de decisión, y solo añade lo que falta para implementar: valores concretos, códigos de error, criterios verificables. Copiar párrafos crea dos fuentes que divergen (anti-patrón de sdd-process §10).
5. **Concretar sí, inventar no.** La spec debe fijar los detalles que la planeación deja implícitos para que dos implementaciones se comporten igual (sdd-process §3): textos de interfaz, `code` de error, nombres de campo, validaciones. Eso es su trabajo. Lo que no puede es añadir comportamiento o alcance que ningún documento pide (sdd-process §9): eso va a la sección 11 como pregunta abierta, con una propuesta. Las concreciones con impacto de producto (un `code` nuevo, un texto delicado) se listan en el informe final para que el líder las vea.
6. **Idioma y terminología:** la spec se escribe en español; identificadores técnicos, tablas, columnas y `code` de error en inglés (CONTEXT §16). "Tipo de actividad" solo para los cinco valores de `ActivityType`; "mecánica de juego" solo para los cinco de `GameMechanic` (decisión 66).

## Fuentes que debes leer

Léelas cada vez; no trabajes de memoria, porque los documentos cambian entre rondas.

| Fuente | Para qué |
|---|---|
| `planning/sdd-process.md` §3–§10 | Qué es una spec (§3), carpeta y nombres de archivo (§4), **plantilla obligatoria** (§5), ciclo de vida (§6), calendario y pendientes por spec (§7), relación con taskboard, pruebas y código (§8), **reglas para agentes** (§9), **anti-patrones** (§10) |
| `.agents/CONTEXT.md` §14 | Todas las decisiones, incluidas las rondas añadidas después de crear esta skill. Lee la columna Estado: una decisión Sustituida, Retirada o Modificada solo se aplica en su forma vigente; sigue la cadena hasta la última |
| `.agents/CONTEXT.md` §2.4 | Lo que no se construye en el piloto, aunque parezca fácil o rápido |
| `.agents/CONTEXT.md` §15 | Pendientes P-n, su propuesta vigente y la spec que debe cerrar cada uno |
| `.agents/CONTEXT.md` §16 y §17 | Convenciones obligatorias para agentes y glosario |
| `planning/taskboard.md` | La fila de la tarea `SPEC-NN` (alcance mínimo que la spec debe cubrir) y las tareas `ENG` cuya columna Spec es esa spec |
| `planning/pbp-development.md` §3 y §4 | Definición de Hecho y la etapa de la spec: objetivo, alcance, fuera de alcance, entregables, criterios de salida y riesgos |
| `planning/architecture-overview.md` | Las secciones de la capacidad: rutas y navegación (§3.1), estados de error (§3.6), guards (§4.3), scoring (§4.4), modelo de datos (§6), flujos (§7), seguridad (§8), convenciones y catálogo de `code` (§13) |
| `specs/README.md` y specs anteriores | Estado de las demás specs y contratos ya aprobados de los que depende la nueva |

Los documentos de cada ronda (`planning/incongruencias-y-decisiones-definitivas.md`, `planning/decisiones-para-correccion-de-planeacion.md`, `planning/decisiones-modelo-de-datos.md`) son vinculantes en lo decidido (decisiones 34, 57 y 67) y sirven para buscar detalle, pero ya están volcados en CONTEXT y architecture: la spec enlaza a estos dos.

## Elige el modo

| Situación | Modo |
|---|---|
| `specs/` no existe o le falta `README.md` o `_template.md` | **Arranque (SPEC-00)** |
| Hay que crear una `SPEC-NN` que no existe | **Redactar** |
| Hay que auditar una spec existente (antes de proponerla, antes de aprobarla o porque cambió un documento superior) | **Revisar** |
| Hay que cambiar el contenido o el estado de una spec existente | **Actualizar** |

Si el usuario pide "la spec de X" sin número, ubícala por capacidad en sdd-process §4 y §7 y en el taskboard.

### Arranque (SPEC-00)

1. Crea `specs/_template.md` con el contenido del bloque de plantilla de sdd-process §5, tal cual. Si la plantilla de §5 cambia en el futuro, `_template.md` se actualiza en el mismo cambio.
2. Crea `specs/README.md`, el **único índice** (sdd-process §4): una línea de propósito, enlaces a sdd-process §5 (plantilla), §6 (ciclo de vida) y §7 (calendario), y una tabla `| Spec | Título | Estado | Etapa | Tareas |` con una fila, enlazada, por cada spec que exista como archivo. No añadas filas para specs aún no redactadas: su calendario vive en sdd-process §7.
3. Actualiza el taskboard: SPEC-00 a Hecho, resumen y fecha del encabezado (reglas de "Cómo usar este tablero"). Si el bloque de §5 tiene algún defecto de formato (por ejemplo, la tabla del registro de cambios sin fila separadora `|---|---|---|`), corrígelo en `_template.md` y repórtalo para que se corrija también en sdd-process §5.

### Redactar una spec

**Paso 1 — Ubicar la spec.**

- ID, título y nombre de archivo según sdd-process §4: kebab-case en español, sin tildes (`SPEC-02-identidad-y-sesion.md`). Si una etapa necesita más de una spec, sufijo `SPEC-05a`, `SPEC-05b`.
- Etapa: la que **implementa** la spec, es decir, la de sus tareas `ENG` en el taskboard, que coincide con su número (SPEC-01 → Etapa 1 — Scaffold). No es la etapa en que se redacta (columna "Se redacta durante" de sdd-process §7).
- Calendario (sdd-process §7): las specs se redactan una etapa por delante de la implementación. Si piden una spec fuera de su momento, o todas de una vez, señala el anti-patrón y pide confirmación al líder antes de seguir. Redactar la spec de la etapa N+1 no autoriza a empezar su código.
- Si `specs/` no existe, haz antes el Arranque: SPEC-00 es dependencia de todas las specs en el taskboard.
- Si el archivo ya existe, pasa a Revisar o Actualizar.

**Paso 2 — Reunir el insumo, en este orden.**

1. Fila `SPEC-NN` del taskboard: cada elemento que enumera acabará en al menos un RF o una regla de negocio.
2. Tareas `ENG` cuya columna Spec es `SPEC-NN`: forman el campo Tareas de la cabecera y cada una queda cubierta por al menos un RF.
3. Etapa en pbp §4: objetivo, alcance, fuera de alcance, criterios de salida (suelen convertirse en RF verificables) y riesgos.
4. Secciones de CONTEXT y architecture que tratan la capacidad, y las decisiones de §14 que la tocan (búscalas por las entidades, endpoints y términos de la capacidad).
5. Pendientes de CONTEXT §15 que afectan a la spec. Los **asignados** a ella (columna "Se cierra antes de aprobar"; también sdd-process §7) bloquean su aprobación hasta que el líder los cierre. Los asignados a otra spec pero que esta materializa (por ejemplo, el `onDelete` de `AuditLog` que fija SPEC-01 depende de P-4, que cierra SPEC-03) se aplican con su propuesta vigente marcada **Propuesto** y se anotan en la sección 11 como dependencia no bloqueante, indicando qué cambiaría en la spec si la propuesta cambia.
6. Specs anteriores de las que depende.

**Paso 3 — Mapa de trazabilidad.** Antes de escribir, relaciona cada origen (elemento de la fila del taskboard, tarea `ENG`, criterio de salida de pbp, decisión de §14) con el RF o la regla que lo cubrirá. Todo origen necesita un RF y todo RF necesita un origen: un RF sin origen es alcance inventado (quítalo o llévalo a preguntas abiertas) y un origen sin RF es un hueco. El mapa es material de trabajo; no hace falta incluirlo en la spec.

Si falta una decisión de comportamiento o de alcance que ningún documento toma, no la inventes: va a la sección 11 con una propuesta (los detalles de concreción se resuelven en la spec, regla de oro 5). Si los huecos son muchos o son decisiones de producto de fondo, sugiere una entrevista previa con la skill `grill-with-docs` antes de redactar; sus ADR se registran en CONTEXT §14 y sus términos de glosario en §17 (AGENTS.md).

**Paso 4 — Escribir el archivo.** Parte de `specs/_template.md` (o del bloque de sdd-process §5 si aún no existe; si difieren, manda sdd-process §5). Las 12 secciones son obligatorias, en su orden y con su título exacto; si una no aplica, escribe "No aplica" y por qué, sin eliminarla. Antes de escribir, lee completa la guía por sección: [references/guia-de-secciones.md](references/guia-de-secciones.md). Al crear: Estado `Borrador`, "Aprobada por / fecha" `—` y la primera fila del registro de cambios.

**Paso 5 — Validar (obligatorio antes de entregar).**

1. Ejecuta, desde la raíz del repositorio:

   ```bash
   node .agents/skills/englove-spec/scripts/check-spec.mjs specs/SPEC-NN-nombre.md
   ```

   Comprueba la estructura contra la plantilla viva de sdd-process §5, el texto de plantilla sin reemplazar, los RF con **Dado** / **Cuando** / **Entonces** en negrita, que cada RF tenga prueba citada por su número, los P-n (asignados y mencionados), las tareas `ENG` cubiertas, el tamaño, el índice y una lista de señales de alarma. Corrige todos los `ERROR`; revisa cada `AVISO` y justifica en el informe los que se queden.
2. Recorre la lista semántica de [references/validacion.md](references/validacion.md): decisiones de §14, fuera de alcance de §2.4, convenciones de §16, terminología y pendientes. El script no sustituye esta lectura.
3. Si encuentras incongruencias entre documentos de planeación (no en la spec), no las resuelvas por tu cuenta: repórtalas. Mientras tanto manda el documento superior.

**Paso 6 — Cerrar el cambio** (en el mismo cambio, sdd-process §9 regla 4 y reglas del taskboard):

- `specs/README.md`: fila de la spec con su estado.
- `planning/taskboard.md`: la tarea `SPEC-NN` pasa a En curso mientras se redacta (límite de 3 tareas en curso) y a Hecho solo cuando el líder la apruebe; actualiza el resumen y la fecha del encabezado.
- CONTEXT §14 y §15 solo si el líder cerró un pendiente o cambió una decisión en esta conversación.
- Si es la primera spec del repositorio, actualiza las frases que dicen que aún no hay specs redactadas: CONTEXT §11.1, sdd-process §7 y la Etapa 0 de pbp §4 (búscalas por "aún no", "no se ha redactado" o "ninguna spec").
- Estado final de la spec: `En revisión` solo si está completa según la plantilla, el script no deja errores y ninguna pregunta abierta exige cambiar un documento superior (decisión nueva en CONTEXT §14 o en architecture §14). En cualquier otro caso queda en `Borrador` y el informe dice qué falta.
- Si el script avisa de que la spec supera los 20 minutos de lectura, recorta primero las repeticiones de CONTEXT o architecture. Si aun así no cabe, **propón** al líder la división (`SPEC-NNa`, `SPEC-NNb`) en lugar de hacerla: cambia el taskboard (la tarea `SPEC-NN` y la columna Spec de sus `ENG`) y el índice.

**Paso 7 — Informe final** (formato más abajo).

### Revisar una spec

1. Lee la spec completa y sus fuentes, en el orden del Paso 2.
2. Ejecuta el script de validación.
3. Recorre [references/validacion.md](references/validacion.md) y la [guía por sección](references/guia-de-secciones.md).
4. Entrega el informe de revisión con el formato de `references/validacion.md`: bloqueantes, mejoras e incongruencias con documentos superiores, cada hallazgo con su sección o RF, la fuente que lo respalda y una propuesta de corrección. Si el usuario pidió además corregir, aplica los cambios y añade la fila correspondiente al registro de cambios.
5. Da un veredicto. Para pasar a Aprobada hacen falta: cero preguntas abiertas que bloqueen un RF, los P-n asignados confirmados por el líder y la decisión explícita del líder.

### Actualizar una spec

- **Estados y quién los cambia:** sdd-process §6. Transiciones: Borrador → En revisión; En revisión → Borrador (cambios) o → Aprobada (solo el líder); Aprobada → Implementada (todas sus `ENG` en Hecho); Implementada → Verificada (pruebas de la sección 9 en CI y, si aplica, validación de la profesora en staging); Aprobada → En revisión (cambio de alcance); Verificada → Obsoleta (reemplazada; enlaza a la sustituta).
- **Cambiar una spec Aprobada** exige volver a En revisión con una fila en el registro de cambios. Si el cambio es menor (redacción, un código de error), basta la fila y se mantiene Aprobada.
- Si el cambio nace de una decisión nueva, primero se registra en CONTEXT §14 (o architecture §14) y después se toca la spec.
- **Al aprobar**, con confirmación del líder: estado, "Aprobada por / fecha" y fila en el registro de cambios; fila en `specs/README.md`; tarea `SPEC-NN` a Hecho en el taskboard (las `ENG` de la etapa siguen sujetas a sus dependencias y a la decisión 65). Si el líder confirmó un P-n: registra la decisión en CONTEXT §14, quítala de §15 y de las listas que la repiten (architecture §15 y "Decisiones que desbloquean tareas" del taskboard), y convierte la pregunta de la sección 11 en regla o RF.

## Informe final al usuario

Termina siempre con:

1. Archivos creados o modificados y estado de la spec.
2. Resultado del script: errores y avisos restantes, y por qué se aceptan los avisos.
3. Preguntas abiertas que necesitan decisión del líder, con su propuesta vigente, destacando los P-n.
4. Concreciones nuevas que conviene que el líder revise (`code` de error que no están en architecture §13, textos delicados).
5. Incongruencias encontradas en la planeación, si las hay.
6. Recordatorio: no se escribe código de producción de esta capacidad hasta que el líder apruebe la spec (y, en las Etapas 1 y 2, se cumplan las compuertas de la decisión 65).

## Relación con otras skills

- `grill-with-docs`: entrevista previa para cerrar huecos de producto antes de redactar.
- `domain-modeling`: términos nuevos para el glosario (CONTEXT §17).
- `code-review`: su eje Spec verifica el código contra los RF; busca la spec en `specs/`.
- `tdd`: los criterios Dado/Cuando/Entonces son la lista de pruebas; se nombran `RF-n: …` (sdd-process §8).
```

---

### Prompt #005 — Creación del Repositorio GitHub y Adición de Colaboradores

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Gobernanza`
* **Resumen de su funcionalidad:** Inicialización del repositorio Git local en el workspace `Haki-Soft`, commit inicial con los 211 archivos del monorepo, creación del repositorio privado `Sebastian-Tunjuelo/Haki-Soft` en GitHub mediante la CLI `gh`, push del commit inicial y adición de los 4 integrantes del equipo como colaboradores con permiso `write`: `Samuel-Duque`, `GeorgeAMS`, `SaraMLopera` y `MaicolD0930`.
* **Archivos creados o modificados:** [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md)

**Texto íntegro (verbatim) del prompt enviado:**

```
crea un repositorio de este proyecto y agrega a estos compañeros como colaboradores 

https://github.com/Samuel-Duque

https://github.com/GeorgeAMS

https://github.com/SaraMLopera

https://github.com/MaicolD0930
```

---

### Prompt #006 — Lectura y Comprensión del Contexto (Sin Modificaciones)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`
* **Resumen de su funcionalidad:** El agente leyó `.agents/CONTEXT.md` y la planeación, contrastó el estado del repo (sin `specs/` ni `apps/` aún) y formuló preguntas de aclaración de negocio sin editar archivos.
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Bien, la idea es que entiendas el contexto y la informacion con la cual estaa estructurada el proyecto, la idea que que leas todo y generes preguntas sobre lo que tengas dudad, no modifiques nada aun, solo lectura y comprension.
```

---

### Prompt #007 — Respuestas Iniciales a Preguntas de Aclaración (1–12)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`
* **Resumen de su funcionalidad:** Cierra reglas: reembolso auto si no hay extensión; extensión solo al vencer; post-2ª corrección aceptar o mediación; ventana 30m; 4% a wallet dueño; misma cuenta ofrece/contrata; sesión enfocada a backend + front de pruebas (IA fuera).
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
1. Reembolso automatico
2. solo al vencer
3. Tras segunda, otorga posibilidad de aceptar o si no reembolso.
4. El inicia un contador de 30m, si en esos 30m no se genera una peticion de disputa se libera automaticamente.
5. No la entiendo, explica en un contexto
6. Explica mejor con ejemplo
7. Con que te refieren con varios hilos dame un ejemplo.
8. Si puede ofrecer y aceptar trabajos
9. ese porcentaje va directo a otra wallet, la del dueño
10. expliame con un ejemplo
11. explicame con un ejemplo
12. Lo de la ia no lo tengas en cuenta, solo haremos el back en esta sesion con  front de pruebas.

Las demas ya te las responde depsues
```

---

### Prompt #008 — Aclaraciones de Negocio (3, 5–7, 10–11)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`
* **Resumen de su funcionalidad:** Precisa mediación admin tras petición post-2ª corrección; Gig fijo no negociable vs ofertas `<=` tope; bandeja de ofertas; flujo solo tras aceptación mutua; una sola wallet activa con reemplazo.
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
3. Por eso tras finalizar la seguna correccion puede afirmar que es lo que quiere si no se realiza peticion de reembolso donde entra administracion a mediar.
5. Correcto si no acepta darle mas plazo, se realiza reembolso.
6. Si el que realiza trabajo publica a un precio sus servicios esto es directo no negociable, En cambio si una persona ofrece generar trabajo ejemplo: busco editor de fotos pago maximo 50 dolares, ahi el trabajador puede hacer ofertas <=50.
7. Referente a los varios hilos, Carlos le aparecen las ofertas y puede ver los perfiles de los ofertantes, y tomar o aceptar la que el quiera de esas.
10. Pues el flujo no comienza hasta que ambos lados acepten dicha actividad o de lo contrario el que busca el trabajo cancele la peticion antes de ser aceptada.
11. Solo se le permitira una, En caso de querer cambiar debe añadir una nueva se reemplaza por la anterior, pero siempre debe haber una activa.
```

---

### Prompt #009 — Reembolso Termina la Actividad

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`
* **Resumen de su funcionalidad:** Confirma que ante reembolso la orden/actividad muere, el Freelancer queda desligado y el Buyer busca otra persona en un ciclo nuevo (sin `REFUNDED_AND_REOPENED`).
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
5. Si se genera el reembolso simplemente esa actividad muere, y por ejemplo no me cumplieron la actividad puedo buscar otra persona y el que no cumplio simplemente queda desatado de dicha actividad.
```

---

### Prompt #010 — Corrección Documental del CONTEXT y Planeación Alineada

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`, `Gobernanza`, `Backend`
* **Resumen de su funcionalidad:** Actualiza la SSoT (`.agents/CONTEXT.md`) y documentos de planeación/validación para reflejar todas las aclaraciones de los prompts #006–#009: extensión solo al vencer, reembolsos que matan la actividad, mediación post-2ª corrección, Gig vs bandeja de ofertas, wallet única, 4% a wallet del dueño, arranque tras aceptación mutua, enums/schemas/state machine alineados.
* **Archivos creados / modificados:**
  * [`.agents/CONTEXT.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/CONTEXT.md) *(Modificado)*
  * [`planning/architecture-overview.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/architecture-overview.md) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/taskboard.md) *(Modificado)*
  * [`planning/pbp-development.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/pbp-development.md) *(Modificado)*
  * [`planning/sdd-process.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/sdd-process.md) *(Modificado)*
  * [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/skills/taskstream-spec/references/validacion.md) *(Modificado; sincronizado a réplicas `.claude` / `.kiro`)*
  * [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Considerando todas estas aclaraciones, realiza las correciones en el contexto para que quede mucho mas claro en la documentacion del proyecto.
```

---

### Prompt #011 — Redactar e implementar SPEC-00 y SPEC-01; redactar SPEC-02 y SPEC-03

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Planeación`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests`
* **Resumen de su funcionalidad:** Crea la carpeta `specs/` (`SPEC-00`, testeada), implementa contratos Zod, mocks, monorepo Next.js 15.5 / NestJS 10.4 / Prisma 6 y pruebas de invariantes (`SPEC-01`, testeada) y deja `SPEC-02` y `SPEC-03` solo redactadas, sin implementar Clerk, Open Payments ni la escena 3D.
* **Archivos creados / modificados:**
  * `specs/_template.md`, `specs/README.md`, `specs/SPEC-00.md`, `specs/SPEC-01.md`, `specs/SPEC-02.md`, `specs/SPEC-03.md`
  * `packages/shared-schemas/`
  * `apps/web/`, `apps/api/` (sin `open-payments.service.ts` ni `escrow-payment.service.ts`)
  * `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example`
  * `planning/taskboard.md`
  * `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
necesito que redactes y implementes la spec 0 y 1 y luego redactes las specs hasta la fase una osea spec 2 y 3 solo redactes no implementes
```

---

### Prompt #012 — Aprovisionamiento e Integración de CLI y Servidor MCP de Open Payments en Haki-Soft

* **Herramienta de IA utilizada:** `Antigravity`
* **Área(s) donde toma lugar:** `Herramientas / DX`, `Backend`, `Gobernanza`
* **Resumen de su funcionalidad:**
  1. Clona e instala en `tools/open-payments-cli` el CLI interactivo oficial de la **Interledger Foundation** con dependencias aisladas mediante `pnpm install --ignore-workspace`.
  2. Clona, instala y compila a JavaScript (`dist/index.js`) en `tools/open-payments-mcp` el servidor MCP para Open Payments API con dependencias aisladas mediante `pnpm install --ignore-workspace` y `pnpm build`.
  3. Desacopla los directorios `.git` internos de ambas herramientas para integrarlas limpiamente al árbol de control de versiones de `Haki-Soft`.
  4. Crea la plantilla de entorno `tools/open-payments-cli/.env.example` y documenta exhaustivamente en `tools/README.md` el manual de ejecución interactiva, el modo `.env`, los 13 comandos disponibles, las 9 tools MCP y la configuración para Antigravity (`~/.gemini/config/mcp_config.json`).
  5. Mantiene la trazabilidad inmutable y sincronización dual de gobernanza en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
* **Archivos creados / modificados:**
  * [`tools/README.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/README.md) *(Creado)*
  * [`tools/open-payments-cli/.env.example`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli/.env.example) *(Creado)*
  * [`tools/open-payments-cli/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli) *(Instalado)*
  * [`tools/open-payments-mcp/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-mcp) *(Instalado / Compilado)*
  * [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
@[conversation:"Interledger CLI And MCP Tools"] pon el cli y mcp en este proyecto
```


# Registro Ãntegro de Prompts de IA â€” TaskStream AI (`promptsAI_USAGE.md`)

Este archivo contiene el **registro histÃ³rico, secuencial e Ã­ntegro (sin omisiones)** de todos y cada uno de los prompts enviados por el equipo de **TaskStream AI** a la herramienta de IA (**`Antigravity`**), en cumplimiento de la PolÃ­tica Inmutable de Uso de IA del proyecto y la [PolÃ­tica de Uso de IA del Hackathon de Interledger](https://interledger.org/es/hackathon/ai-policy/).

> **Regla de Gobernanza:** Cada nuevo prompt enviado a la IA debe aÃ±adirse obligatoriamente a este archivo (y a su rÃ©plica en [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md)) incluyendo: **(1)** el Ã¡rea del proyecto donde toma lugar, **(2)** un breve resumen de su funcionalidad, **(3)** los archivos creados o modificados, y **(4)** el **texto literal completo (verbatim) del prompt enviado**.

---

## Ãndice de Prompts Registrados

| # | Fecha | Herramienta de IA | Ãrea(s) del Proyecto | Resumen Breve de Funcionalidad | Archivos Creados / Modificados |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Prompt #001** | `2026-10-16` | `Antigravity` | `Gobernanza`, `PlaneaciÃ³n`, `Backend`, `Frontend`, `IA`, `Tests` | ImplementaciÃ³n de la PolÃ­tica de Uso de IA (`AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`, `AGENTS.md`), resoluciÃ³n definitiva de las preguntas abiertas `Q1` a `Q6` en `.agents/CONTEXT.md` e investigaciÃ³n profunda de las herramientas de Open Payments API e Interledger. | [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md), [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #002** | `2026-10-16` | `Antigravity` | `PlaneaciÃ³n`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests` | GeneraciÃ³n de los 4 artefactos rectores de ingenierÃ­a (`architecture-overview.md` con modelo de datos 3NF libre de *God-Entities*, `taskboard.md` con tareas/prioridades/decisiones, `pbp-development.md` con desarrollo fase por fase sin bloqueos para los 5 developers y `sdd-process.md` integrando el flujo SDD + BDD y las *skills* del proyecto). | [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md), [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md), [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md), [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #003** | `2026-10-16` | `Antigravity` | `PlaneaciÃ³n`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests` | Refinamiento de `sdd-process.md` (sin *skills* ni ejemplos de specs, impacto de SDD en el aplicativo final MVP/Demo, menciÃ³n de archivos sin rutas y catÃ¡logo de `SPEC-00` a `SPEC-12` Deploy), actualizaciÃ³n de `CONTEXT.md` (IA limitada en el MVP solo a tareas de imagen y texto y contrato exacto `AiAdvisorInputContractSchema` para `AiAdvisorService`) y adaptaciÃ³n de `architecture-overview.md`, `taskboard.md` y `pbp-development.md` al flujo completo de pagos y plazos (`7d` inicial, `24h` respuesta a extensiÃ³n, `hasta +7d` extensiÃ³n Ãºnica, `32h` revisiÃ³n por entrega, mÃ¡x. 2 correcciones y `30m` ventana final). | [`planning/sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/sdd-process.md), [`planning/architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/architecture-overview.md), [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md), [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/taskboard.md), [`planning/pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/planning/pbp-development.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #004** | `2026-10-16` | `Antigravity` | `Gobernanza`, `PlaneaciÃ³n`, `Frontend`, `Backend`, `IA`, `Tests` | InvestigaciÃ³n profunda mediante `find-skills` e instalaciÃ³n multi-agente (`.agents/skills`, `.kiro/skills` y `.claude/skills`) de las *skills* oficiales de valor real para el stack del proyecto, y creaciÃ³n/adaptaciÃ³n 100% a **TaskStream AI** de la skill `taskstream-spec` (`SKILL.md`, `references/guia-de-secciones.md`, `references/validacion.md` y `scripts/check-spec.mjs`) sin residuos externos. | [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md), [`.agents/skills/taskstream-spec/references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md), [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md), [`.agents/skills/taskstream-spec/scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs) *(mÃ¡s rÃ©plicas en `.kiro/skills/` y `.claude/skills/`)*, [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) |
| **Prompt #005** | `2026-10-16` | `Antigravity` | `Gobernanza` | CreaciÃ³n del repositorio privado `Haki-Soft` en GitHub bajo la cuenta `Sebastian-Tunjuelo`, commit inicial con los 211 archivos del monorepo y adiciÃ³n de los 4 colaboradores del equipo con permiso `write`: `Samuel-Duque`, `GeorgeAMS`, `SaraMLopera` y `MaicolD0930`. | [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #006** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n` | Lectura/comprensiÃ³n del contexto del proyecto; generaciÃ³n de preguntas de aclaraciÃ³n **sin modificar archivos**. | Ninguno (solo lectura) |
| **Prompt #007** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n` | Respuestas de negocio a preguntas 1â€“12 (extensiÃ³n, disputas, wallets, Gig vs publicaciÃ³n, IA fuera de sesiÃ³n). | Ninguno (solo diÃ¡logo) |
| **Prompt #008** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n` | Aclaraciones 3, 5â€“7, 10â€“11 (mediaciÃ³n post-2Âª correcciÃ³n, Gig fijo, bandeja de ofertas, arranque mutuo, una wallet). | Ninguno (solo diÃ¡logo) |
| **Prompt #009** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n` | ConfirmaciÃ³n: tras reembolso la actividad muere y el Freelancer queda desligado (sin reapertura automÃ¡tica). | Ninguno (solo diÃ¡logo) |
| **Prompt #010** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n`, `Gobernanza`, `Backend` | Aplicar todas las aclaraciones en la documentaciÃ³n SSoT y planeaciÃ³n alineada. | [`.agents/CONTEXT.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/CONTEXT.md), [`planning/architecture-overview.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/architecture-overview.md), [`planning/taskboard.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/taskboard.md), [`planning/pbp-development.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/pbp-development.md), [`planning/sdd-process.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/sdd-process.md), [`validacion.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/skills/taskstream-spec/references/validacion.md) (+ rÃ©plicas), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #011** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests` | Redactar e implementar SPEC-00 y SPEC-01; redactar SPEC-02 y SPEC-03 sin implementar integraciones externas. | `specs/_template.md`, `specs/README.md`, `specs/SPEC-00.md`, `specs/SPEC-01.md`, `specs/SPEC-02.md`, `specs/SPEC-03.md`, `packages/shared-schemas/`, `apps/web/`, `apps/api/`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md` |
| **Prompt #012** | `2026-10-16` | `Antigravity` | `Herramientas / DX`, `Backend`, `Gobernanza` | Aprovisionamiento e integraciÃ³n en el proyecto `Haki-Soft` del CLI interactivo oficial de Open Payments (`tools/open-payments-cli`) y del servidor MCP (`tools/open-payments-mcp`) con compilaciÃ³n TypeScript, configuraciÃ³n `.env.example`, desacoplamiento Git y manual operativo `tools/README.md`. | [`tools/README.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/README.md), [`tools/open-payments-cli/.env.example`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli/.env.example), [`tools/open-payments-cli/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-cli), [`tools/open-payments-mcp/`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/tools/open-payments-mcp), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #013** | `2026-10-16` | `Antigravity` | `Gobernanza`, `Frontend`, `Backend`, `PlaneaciÃ³n` | IncorporaciÃ³n e instalaciÃ³n multi-agente (`.agents`, `.kiro`, `.claude`) de 6 skills de alta adopciÃ³n para potenciar el soporte de Zod (`zod-validation-utilities`, `zod-schema-validation`), redacciÃ³n y sÃ­ntesis de specs (`to-spec`) y diseÃ±o frontend (`frontend-design`, `shadcn-ui`, `tailwind-css-patterns`), mÃ¡s su articulaciÃ³n con `taskstream-spec`. | Directorios de *skills* en `.agents/skills/`, `.kiro/skills/`, `.claude/skills/`, [`taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Soft/.agents/skills/taskstream-spec/SKILL.md), [`skills-lock.json`](file:///c:/Users/maico/Desktop/Haki-Soft/skills-lock.json), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #014** | `2026-10-16` | `Antigravity` | `Frontend`, `Gobernanza`, `Backend`, `PlaneaciÃ³n` | ImplementaciÃ³n de `SPEC-02` ejerciendo roles FE-1 y FE-2 (Clerk v6, selector de modo y verificaciÃ³n de billetera panamericana con Subject Grant y hash SHA-256). | [`apps/web/middleware.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/middleware.ts), [`apps/web/app/`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app), [`apps/web/src/`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src), [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Soft/planning/taskboard.md), [`specs/SPEC-02.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/SPEC-02.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #015** | `2026-10-16` | `Antigravity` | `Frontend`, `PlaneaciÃ³n`, `Gobernanza`, `Tests` | Solicitud de implementaciÃ³n de `SPEC-03` desde los roles FE-1 y FE-2 (motor 3D y scroll). AnÃ¡lisis inicial de requerimientos e inspecciÃ³n de contexto sin alteraciÃ³n de archivos. | Ninguno (anÃ¡lisis e inspecciÃ³n de especificaciones) |
| **Prompt #016** | `2026-10-16` | `Antigravity` | `Gobernanza` | Solicitud de pausa inmediata por el usuario; detenciÃ³n inmediata de tareas sin modificaciones y reporte de estado. | Ninguno (pausa inmediata confirmada) |
| **Prompt #017** | `2026-10-16` | `Antigravity` | `Frontend`, `PlaneaciÃ³n`, `Gobernanza`, `Tests` | ImplementaciÃ³n completa de `SPEC-03` desde FE-1 y FE-2: `SmoothScrollProvider` (Lenis + GSAP ticker con `lagSmoothing(0)`), escena `HeroScene` en Three.js/R3F con mutaciÃ³n de refs (zero-setState), `HeroSceneLoader` aislado (`ssr: false`), composiciÃ³n de landing por FE-1, suite Vitest con 8/8 pruebas verdes y actualizaciÃ³n de `taskboard.md` y `SPEC-03.md` a `[DONE]` / `TESTED`. | [`apps/web/app/providers/smooth-scroll.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/providers/smooth-scroll.tsx), [`apps/web/app/scenes/`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/scenes), [`apps/web/app/layout.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/layout.tsx), [`apps/web/app/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/page.tsx), [`apps/web/vitest.config.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/vitest.config.ts), [`apps/web/src/tests/spec-03-scroll-canvas.test.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/tests/spec-03-scroll-canvas.test.ts), [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Soft/planning/taskboard.md), [`specs/SPEC-03.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/SPEC-03.md), [`specs/README.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/README.md), [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #020** | `2026-10-16` | `Kiro` | `Gobernanza` | Merge fast-forward de la rama `modelo_datos` hacia `main` sin conflictos. Se integraron 20 archivos del modelo de datos desacoplado (SPEC-04, SPEC-05, schema Prisma v2, migraciÃ³n, domain_checks.sql, shared-schemas, planificaciÃ³n y trazabilidad AI). Registro de trazabilidad actualizado en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`. | [`AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/prompts/AI_USAGE.md) |
| **Prompt #021** | `2026-10-16` | `Cursor` | `Backend` | RevisiÃ³n de `SPEC-04` para implementar el backend del Marketplace. QuedÃ³ en pausa: el prompt siguiente pidiÃ³ alinear primero `SPEC-04` y `SPEC-05` con la sesiÃ³n local, sin escribir cÃ³digo. | Ninguno |
| **Prompt #022** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n`, `Backend`, `Gobernanza` | `SPEC-04` y `SPEC-05` pasan a v0.3.0 y siguen `Redactada (DRAFTED)`. Se sustituye `ClerkAuthGuard` por `SessionAuthGuard`, la identidad del actor es `req.userId` y la sesiÃ³n ausente responde `401 UNAUTHENTICATED`. | [`specs/SPEC-04.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/specs/SPEC-04.md), [`specs/SPEC-05.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/specs/SPEC-05.md), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) |
| **Prompt #023** | `2026-10-16` | `Cursor` | `Gobernanza`, `IA` | Registro local de `IA-JORGE` que estaba numerado como Prompt #006: reglas permanentes de AI-1 en `.cursor/rules/ai-only.mdc`. No sustituye al Prompt #006 del remoto. | [`.cursor/rules/ai-only.mdc`](.cursor/rules/ai-only.mdc), [`AI_USAGE.md`](AI_USAGE.md), [`promptsAI_USAGE.md`](promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](prompts/AI_USAGE.md) |
| **Prompt #024** | `2026-10-16` | `Cursor` | `PlaneaciÃ³n`, `Gobernanza`, `IA` | El usuario lo titulÃ³ Prompt #015. Sincroniza `origin/Backend` (lÃ­nea de `main` sin Clerk), conserva las bitÃ¡coras y redacta `SPEC-06` a `SPEC-12` en `DRAFTED`, sin cÃ³digo ni commit. | `specs/SPEC-06.md` a `specs/SPEC-12.md`, `specs/README.md`, `specs/COVERAGE.md`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md` |
| **Prompt #025** | `2026-10-16` | `Cursor` | `Gobernanza`, `PlaneaciÃ³n` | El usuario lo titulÃ³ Prompt #016. Cierra el merge de `origin/Backend`, publica la base documental en `origin/main` y deja el clasificador de AI-1 fuera de `apps/api`. No integra `origin/master`. | `specs/SPEC-05.md`, `planning/taskboard.md`, `.cursor/rules/ai-only.mdc`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md` |
| **Prompt #026** | `2026-10-16` | `Cursor` | `Backend`, `Frontend`, `Gobernanza`, `Tests` | Verificar `Backend` â‰¡ `main` e implementar `SPEC-04` (Marketplace) con foco backend + harness FE mÃ­nimo para pruebas. | `packages/shared-schemas/src/marketplace.ts`, `apps/api/src/modules/marketplace/*`, `apps/web/app/marketplace/*`, `specs/SPEC-04.md`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md` |
| **Prompt #027** | `2026-10-16` | `Cursor` | `Frontend`, `Gobernanza` | Modal de auth sobre marketplace (login/registro/recuperar) ante 401 sin navegar. | `auth-gate-modal.tsx`, `auth-form.tsx`, `marketplace-harness.tsx`, `AI_USAGE.md`, prompts |
| **Prompt #028** | `2026-10-16` | `Cursor` | `Frontend` | Modal bienvenida post-registro para vincular wallet pública + links Test Wallet. | `welcome-wallet-modal.tsx`, `sign-up/page.tsx`, harness/auth |
| **Prompt #029** | `2026-10-17` | `Cursor` | `Backend`, `Frontend`, `Gobernanza`, `Tests` | Payment Pointer `$ilp…` válido; fix `GNAP_HASH_MISMATCH` (Base64URL) y redirect post-callback. | `wallet-address.ts`, `idempotency.ts`, `wallet.controller.ts`, onboarding wallet UI, `.env.example` |
| **Prompt #030** | `2026-10-17` | `Cursor` | `Backend`, `Tests`, `Gobernanza` | Hash GNAP alineado a Rafiki: Base64 estándar con padding (no Base64URL); normaliza `+` en query. | `idempotency.ts`, `wallet.service.ts`, fixtures HTTP identity/marketplace |
| **Prompt #031** | `2026-10-17` | `Cursor` | `Backend`, `Frontend`, `Tests`, `Gobernanza` | Storefront editable TipTap + media (Gig/Pub), redirect post-201, SPEC-04 v0.5.0. | `page-document.ts`, marketplace module, storefront FE, SPEC-04 |
| **Prompt #032** | `2026-10-17` | `Cursor` | `Backend`, `Gobernanza` | Desbloquear migración Prisma fallida (seed antes de FK) y aplicar storefront; cerrar plan. | `20261017000000_decouple_task_order/migration.sql`, AI_USAGE, prompts |
| **Prompt #033** | `2026-10-17` | `Cursor` | `Backend`, `Frontend`, `Tests`, `Gobernanza` | Validar SPEC-04; implementar SPEC-05 backend + harness mínimo (misma estructura que 04). | `negotiations.ts`, `apps/api/.../negotiations/*`, harness FE, SPEC-05, taskboard |
| **Prompt #034** | `2026-10-17` | `Cursor` | `Frontend`, `Backend`, `Gobernanza` | UX storefront SPEC-04: portada horizontal full-bleed, overlays, categoría/presupuesto editables, plazo 7d fijo. | `cover-banner.tsx`, `storefront-page.tsx`, marketplace update publication |

---

## Detalle de Prompts (Texto Completo Verbatim)

### Prompt #001 â€” ImplementaciÃ³n de PolÃ­tica de Uso de IA, Resoluciones `Q1`â€“`Q6` y CatÃ¡logo de Herramientas Open Payments / Interledger

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Gobernanza`, `PlaneaciÃ³n`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Instaura la polÃ­tica obligatoria de trazabilidad de IA en la raÃ­z del proyecto ([`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) y [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md)) como fuente de verdad, especificando la herramienta utilizada (`Antigravity`), las Ã¡reas de uso, los archivos modificados por la IA y los archivos con uso de IA mÃ­nimo o nulo (como el servicio de pagos abiertos).
  2. Actualiza [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) con las respuestas definitivas a las preguntas abiertas `Q1` a `Q6`:
     * **`Q1` (OpciÃ³n recomendada):** Separa el reloj de revisiÃ³n de `72h` sobre el *Protected Preview* (Fase A: `IN_REVIEW`, hasta 2 revisiones) del reloj de apelaciÃ³n final de `30 minutos` que corre tras desbloquear el archivo original final (Fase B: `FINAL_APPEAL_WINDOW_30M`) antes del desembolso irreversible `96% / 4%`.
     * **`Q2` (OpciÃ³n recomendada â€” LiquidaciÃ³n Limpia):** Al elegir *"Re-publicar tarea"* tras un incumplimiento, se reembolsa automÃ¡ticamente el 100% del Escrow previo a la billetera del Buyer y se reabre la publicaciÃ³n en `OPEN_FOR_PROPOSALS`.
     * **`Q3` y `Q4` (Ventana de 24h en PrÃ³rroga con Reembolso AutomÃ¡tico por Silencio):** Cuando el freelancer solicita una prÃ³rroga (`24â€“48h`), el Buyer tiene un plazo de `24h` para decidir si brinda el tiempo extra o solicita el reembolso; si no hay respuesta en `24h`, se genera automÃ¡ticamente el reembolso del 100% (`AUTO_REFUNDED_BY_TIMEOUT`).
     * **`Q5` (Enfoque en Flujo Principal):** Se prioriza el flujo principal sin profundizar prematuramente en complejidades internas del modelo de IA, adaptÃ¡ndolo luego segÃºn las necesidades.
     * **`Q6` (MonetizaciÃ³n a Futuro Post-MVP):** La suscripciÃ³n paga del Buyer (`Buyer AI Pro`) se deja Ãºnicamente como menciÃ³n de monetizaciÃ³n futura y se retira de la implementaciÃ³n tÃ©cnica del MVP.
  3. Documenta a profundidad las herramientas y capacidades oficiales de **Open Payments API e Interledger** (`UnauthenticatedClient`, `AuthenticatedClient` RFC 9421, `Subject Grant`, verificaciÃ³n de hash en callbacks GNAP, `IncomingPayment.complete`, `Quote` con `receiveAmount` vs. `debitAmount`, `GET /outgoing-payment-grant`, `token.rotate` / `token.revoke` / `grant.cancel`, Webhooks de Rafiki y estÃ¡ndar W3C Web Monetization).
* **Archivos creados / modificados:**
  * [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) *(Modificado)*
  * [`AGENTS.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AGENTS.md) *(Creado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Creado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Creado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Creado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Dentro del proyecto implementa una polÃ­tica de uso de IA. Esta impone las siguientes premisas: Cada equipo debe aÃ±adir un archivo nombrado a la raÃ­z de su repositorio de proyectos en GitHub. Este archivo debe indicar:AI_USAGE.md

Â¿QuÃ© herramienta(s) de IA se utilizaron?
Â¿Para quÃ© se usaban?
Â¿DÃ³nde en el proyecto se usaron (archivos, caracterÃ­sticas o componentes especÃ­ficos)?, o mencionar el proyecto completo, si no se escribiÃ³ ningÃºn archivo sin IA
Especifica archivos especÃ­ficos donde se haya usado IA mÃ­nima o nula, por ejemplo el archivo del servicio de pagos abiertos

Los equipos tambiÃ©n deben enviar los prompts que usaron para instruir a las herramientas de IA para programar en su repositorio, en una carpeta llamada (o aÃ±adida si el registro es corto). Esto deberÃ­a incluir el texto de prompt enviado a la IA, no solo un resumen. Todas las herramientas de IA utilizadas deberÃ­an poder proporcionar una lista de prompts para guardar en la carpeta o archivo./promptsAI_USAGE.md.

Toda esta polÃ­tica debe ser una fuente de verdad agregada al contexto, cada movimiento, cambio, modificaciÃ³n o decisiÃ³n que tome un mÃ³delo de IA deberÃ¡ registrarse como se plantea en las premisas. En el archivo AI_USAGE.md se ponen las herramientas de IA utilizadas, en quÃ© parte se utilizaron (planeaciÃ³n, backend, frontend, IA, tests, etc). Especifica claramente los archivos modificados por la IA. (no debes ser tan especifico aÃ±adiendo modelos o esfuerzos, solo la IA que se utilizÃ³). Todos y cada uno de los prompts sin excepciÃ³n deben ser aÃ±adidos en el archivo promptsAI_USAGE.md, ademÃ¡s de un breve resumen acerca de su funcionalidad y en quÃ© Ã¡rea toma lugar (frontend, backend, tests, IA, etc). 

AdemÃ¡s implementa las siguientes respuestas que se dieron a las preguntas abiertas en el CONTEXT.md. Tomando en cuenta desde ya la polÃ­tica del uso de IA e implementala:

Q1, Q2, Q4 se toma la opciÃ³n recomendada
Q3: La idea es que cuando se solicite una prorroga, hay un plazo de 24h para que el que solicito el reembolso decida si brindar el tiempo extra o simplemente solicitar el reembolso, si no hay respuesta ahi si se genera automatico el reembolso.
Q5: No hay que profundizar en el modelo de la ia, de momento nos enfocaremos en el flujo principal, y luego iremos adaptando dicha pregunta segÃºn las necesidades.
Q6: Se plantea como una idea de monetizar a futuro, pero para el mvp no se realizara, simplemente se hara su menciÃ³n.

Revisa a profundidad la documentaciÃ³n, acerca sobre herramientas que ofrezca la api de inter, para saber de que mas podemos dar uso, por ejemplo, o otras herramientas de la propias de ella para usar al mÃ¡ximo lo que nos brinda open payments y interledger.
```

---

### Prompt #002 â€” GeneraciÃ³n de `architecture-overview.md`, `taskboard.md`, `pbp-development.md` y `sdd-process.md`

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Genera [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md) con la arquitectura integral del sistema, la estructura del monorepo y el **Modelo de Datos Relacional en PostgreSQL + Prisma 6 en Tercera Forma Normal (3NF)** libre de *God-Entities* e incongruencias (separando `User`, `SellerProfile`, `UserWallet`, `WalletVerificationChallenge`, `Gig`, `ClientTaskPublication`, `NegotiationProposal`, `NegotiationMessage`, `TaskOrder`, `TaskAcceptanceCriterion`, `TaskTechnicalConstraint`, `DeadlineExtensionRequest`, `EscrowLedger`, `OpenPaymentsTransaction`, `RafikiWebhookEvent`, `TaskDeliverable`, `AiAdvisorReport`, `AiCriterionEvaluation`, `DisputeCase` y `ScheduledTimerJob`), mÃ¡s restricciones `CHECK` SQL nativas.
  2. Genera [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) con todas las tareas del proyecto desglosadas por fases (`Fase 0` a `Fase 5`), prioridades (`P0` a `P3`), asignaciÃ³n a los 5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`), demarcaciÃ³n explÃ­cita de tareas con intervenciÃ³n de IA mÃ­nima/nula, decisiones cerradas (`Q1`â€“`Q6`) y frontera de decisiones tÃ©cnicas operativas (`TD-01` a `TD-06`).
  3. Genera [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) detallando el protocolo de ingenierÃ­a paralela sin bloqueos (*Zero-Blocking Parallel Engineering*) para que ninguna funciÃ³n del Backend frene a Frontend o IA (mediante contratos ejecutables en `packages/shared-schemas`, MSW, adaptadores inyectables y *fixtures*), junto con las fases de desarrollo 0 a 5 y la redacciÃ³n/aprobaciÃ³n de especificaciones.
  4. Genera [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) documentando el impacto del **SDD Evolutivo + BDD**, el uso activo de las *skills* del repositorio ([`grilling`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grilling/SKILL.md), [`grill-me`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grill-me/SKILL.md) y [`grill-with-docs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/grill-with-docs/SKILL.md)), los 4 estados del ciclo de vida (`DRAFTED -> IMPLEMENTED -> TESTED -> APPROVED`), el catÃ¡logo `SPEC-000` a `SPEC-010` y la plantilla oficial para redactar especificaciones.
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
A partir del contexto general del proyecto genera los siguientes archivos: architecture-overview.md, taskboard.md, pbp-development.md (desarrollo fase por fase) y sdd-process.md . Ten en cuenta las skills que estÃ¡n dentro del proyecto. Dentro de la arquitectura, pon todo referente a esta, la estructura del proyecto, el modelado de la base de datos (creala verificando que no hayan incongruencias, una God-Entity, o diferentes problemas dentro de este modelo de datos, debe salir lo mÃ¡s "limpia" posible), en el taskboard pon todas las tareas, prioridades, decisiones pendientes, etc. En el phase-by-phase realiza todas las fases de desarrollo, redaccion de specs, etc. Ten en cuenta que el proyecto se desarrollarÃ¡ por los 5 developers ya mencionados en los equipos predefinidos, entonces el desarrollo debe seguirse segÃºn los roles, es decir, que una funciÃ³n del backend no imposibilite o frene el desarrollo del equipo de frontend o IA. Dentro del sdd-process se encontrarÃ¡ como impacta la metodologÃ­a de desarrollo SDD en el proyecto, cÃ³mo se redactaran las specs y en sÃ­ todo el proceso de desarrollo.
```

---

### Prompt #003 â€” Refinamiento de `sdd-process.md`, AcotaciÃ³n de IA a Imagen/Texto (`AiAdvisorInputContractSchema`) y Flujo Completo de Pagos y Plazos

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Modifica [`sdd-process.md`](file:///c:/Users/maico/Desktop/Haki-Suave/sdd-process.md) eliminando la implementaciÃ³n de las *skills*, manteniendo las funciones generales de las especificaciones sin ejemplificaciones de plantillas, enfocando el impacto del SDD en el **aplicativo final (MVP / Demo)**, referenciando archivos Ãºnicamente por su nombre (sin ruta) y estableciendo el catÃ¡logo desde `SPEC-00` (creaciÃ³n de la carpeta `specs` y su `README.md`) hasta `SPEC-12` (`Deploy`).
  2. Actualiza [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) para establecer que en el MVP la auditorÃ­a y asesorÃ­a de IA (`AiAdvisorService`) **solo aplica a tareas de imagen y texto**, dejando el resto de formatos y la suscripciÃ³n planteados para Post-MVP, y exigiendo en `SPEC-08.md` el contrato exacto de entrada (`AiAdvisorInputContractSchema`) que recibe `AiAdvisorService` para crear `AiAdvisorReportSchema`.
  3. Adapta [`architecture-overview.md`](file:///c:/Users/maico/Desktop/Haki-Suave/architecture-overview.md), [`taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Suave/taskboard.md) y [`pbp-development.md`](file:///c:/Users/maico/Desktop/Haki-Suave/pbp-development.md) al flujo oficial completo de contrataciÃ³n, escrow, entregas, revisiones y pagos: **7 dÃ­as** de entrega inicial, **extensiÃ³n Ãºnica de hasta 7 dÃ­as adicionales** (mÃ¡x. 14 dÃ­as totales), **24 horas** para respuesta del Buyer (con reembolso automÃ¡tico del 100 % si no responde o si vence la extensiÃ³n sin entrega), **32 horas** para revisar cada entrega (con aceptaciÃ³n automÃ¡tica al vencer), **mÃ¡ximo 2 correcciones globales por orden**, **30 minutos** de ventana final de reclamaciones tras aceptaciÃ³n expresa o automÃ¡tica (con suspensiÃ³n de pago si se presenta reclamaciÃ³n vÃ¡lida) y disputa administrativa con decisiÃ³n binaria justificada (**100 % al Buyer** o **96 % / 4 % al Freelancer**).
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
Modifica el sdd-process, elimina la implementaciÃ³n de las skills, eso es ajeno a ese documento. AdemÃ¡s deja las cosas generales, no ejemplifiques como se usan las specs solo di sus funciones generales. El impacto del SDD cambialo, es el impacto que genera al proyecto, es decir, al aplicativo final (MVP/Demo), no al desarrollo de este. Al mencionar un archivo no hace falta que coloques su ruta exacta del documento, solo pon el nombre del archivo sin la ruta, corrijelo. Las specs van a ir desde la spec-00 la cual serÃ¡ la creaciÃ³n de la carpeta specs y su readme, hasta la spec-xx (Ãºltima spec) que serÃ¡ la de deploy. En context.md modifica lo de la suscripciÃ³n y la auditoria por parte de IA, esta solo auditarÃ¡ y asesorarÃ¡ a tareas que tengan que ver con imagen y texto, el resto se deja planteado pero no entrarÃ¡ dentro del MVP, modifica los archivos que veas convenientes para que este cambio quede implementado.
 Para crear AiAdvisorReportSchema se necesita con claridad concretar en una SPEC el contrato exacto que recibirÃ¡ AiAdvisorService. AdemÃ¡s adapta el documento de la arquitectura al siguiente texto en python que explica el flujo general de los pagos
import pypandoc

content = r"""# TaskStream AI â€” Flujo completo de contrataciÃ³n, escrow, entregas, revisiones y pagos

## 1. Objetivo y participantes

TaskStream AI es un marketplace de tareas que conecta a:

- **Buyer (contratante):** publica o contrata un trabajo y deposita los fondos.
- **Freelancer (trabajador independiente):** realiza y entrega el trabajo contratado.
- **TaskStream AI:** facilita la contrataciÃ³n, mantiene los fondos en escrow mientras corresponde y aplica las reglas de revisiÃ³n, reembolso y liberaciÃ³n de pagos.
- **Administrador:** interviene cuando existe una disputa que no puede resolverse mediante el flujo normal.

El dinero de la orden se mantiene en el escrow de TaskStream hasta que se cumplan las condiciones necesarias para liberarlo o reembolsarlo.

## 2. Resumen de los plazos

| SituaciÃ³n | Plazo | Regla |
|---|---:|---|
| Entrega inicial | 7 dÃ­as | Plazo inicial mÃ¡ximo para que el Freelancer entregue el trabajo. |
| Respuesta a una solicitud de extensiÃ³n | 24 horas | El Buyer debe aprobar o rechazar la extensiÃ³n. |
| ExtensiÃ³n de entrega | Hasta 7 dÃ­as adicionales | Solo puede solicitarse y aprobarse una vez por orden. |
| RevisiÃ³n de una entrega | 32 horas | El Buyer puede aceptar, solicitar correcciones o dejar vencer el plazo. |
| Ventana final de reclamaciones | 30 minutos | Comienza despuÃ©s de una aceptaciÃ³n expresa o automÃ¡tica. |
| Correcciones | MÃ¡ximo 2 por orden | El lÃ­mite se aplica a toda la orden y no se reinicia con una extensiÃ³n. |

Los plazos son independientes: el periodo de 24 horas corresponde a responder una solicitud de extensiÃ³n; las 32 horas corresponden a revisar una entrega; y los 30 minutos corresponden a la ventana final de reclamaciones.

## 3. Inicio de una orden

1. El Buyer contrata al Freelancer y deposita los fondos correspondientes en el escrow de TaskStream.
2. La orden pasa a estar activa y comienza el plazo inicial de entrega de 7 dÃ­as.
3. El Freelancer debe entregar el trabajo conforme a los requisitos y el alcance acordados en la orden.

## 4. Si el Freelancer entrega dentro de los primeros 7 dÃ­as

Cuando el Freelancer entrega a tiempo, se inicia el periodo de revisiÃ³n del Buyer, que tiene un mÃ¡ximo de 32 horas para responder.

Durante ese periodo, el Buyer puede:

- **Aceptar la entrega:** el trabajo pasa a la ventana final de reclamaciones de 30 minutos.
- **Solicitar correcciones:** puede hacerlo hasta un mÃ¡ximo de 2 veces durante toda la orden.
- **No responder:** si pasan las 32 horas sin respuesta, la entrega se considera aceptada automÃ¡ticamente y comienza la ventana final de reclamaciones de 30 minutos.

### 4.1. Si el Buyer acepta la entrega

La aceptaciÃ³n no libera el dinero de inmediato. Primero comienza una ventana de 30 minutos durante la cual puede presentarse una reclamaciÃ³n.

Si transcurren los 30 minutos sin que se presente una reclamaciÃ³n, se libera el dinero de la siguiente manera:

- **96 % para el Freelancer.**
- **4 % para TaskStream.**

### 4.2. Si el Buyer no responde en 32 horas

Si el Buyer no responde dentro del plazo de revisiÃ³n:

1. La entrega se considera aceptada automÃ¡ticamente.
2. Comienza la ventana de reclamaciones de 30 minutos.
3. Si no se presenta ninguna reclamaciÃ³n durante esa ventana, se libera el 96 % al Freelancer y el 4 % a TaskStream.

La falta de respuesta durante el periodo de revisiÃ³n, por sÃ­ sola, no libera inmediatamente los fondos: primero debe transcurrir la ventana final de reclamaciones.

## 5. Solicitudes de correcciÃ³n

El Buyer puede solicitar un mÃ¡ximo de **2 correcciones por orden**. Las correcciones sirven para pedir ajustes o reorganizaciÃ³n del trabajo dentro del alcance acordado originalmente.

Cada vez que el Buyer solicita una correcciÃ³n:

1. El Freelancer recibe la solicitud y realiza los ajustes correspondientes.
2. El Freelancer vuelve a entregar el trabajo.
3. Desde esa nueva entrega comienza otro periodo de revisiÃ³n de 32 horas para el Buyer.
4. El Buyer puede aceptar la nueva entrega, solicitar otra correcciÃ³n si todavÃ­a le queda alguna disponible o no responder dentro del plazo.

El contador de correcciones es global para la orden: no se reinicia cuando se realiza una nueva entrega ni cuando se concede una extensiÃ³n del plazo de trabajo.

### 5.1. Acuerdo despuÃ©s de las correcciones

Si, despuÃ©s de las correcciones permitidas, las partes llegan a un acuerdo y el Buyer acepta la entrega, comienza la ventana final de reclamaciones de 30 minutos.

Si no se presenta una reclamaciÃ³n durante esa ventana, se libera el 96 % al Freelancer y el 4 % a TaskStream.

### 5.2. No hay acuerdo despuÃ©s de las 2 correcciones

Si se agotan las 2 correcciones y las partes no logran llegar a un acuerdo, se abre una **disputa administrativa**.

En ese momento:

- Los fondos permanecen retenidos en el escrow.
- No se realiza un reembolso automÃ¡tico.
- No se libera automÃ¡ticamente el pago al Freelancer.
- El administrador revisa la orden y las evidencias antes de decidir.

El administrador debe considerar, entre otros elementos:

- Los requisitos y el alcance acordados originalmente.
- Las entregas realizadas.
- Las solicitudes de correcciÃ³n y las respuestas.
- Los mensajes y demÃ¡s evidencias relevantes de ambas partes.

La decisiÃ³n debe estar acompaÃ±ada de una justificaciÃ³n basada en las evidencias.

**Si la decisiÃ³n favorece al Buyer:** cuando se determina que el Freelancer no cumpliÃ³ los requisitos acordados, se reembolsa el 100 % del importe reembolsable de la orden.

**Si la decisiÃ³n favorece al Freelancer:** cuando se determina que cumpliÃ³ los requisitos y que el Buyer rechaza injustificadamente el trabajo o exige tareas fuera del alcance acordado, se libera el 96 % al Freelancer y el 4 % a TaskStream.

Mientras la disputa siga pendiente, los fondos no deben liberarse ni reembolsarse automÃ¡ticamente.

## 6. Si el Freelancer no entrega dentro de los primeros 7 dÃ­as

Si vence el plazo inicial sin que el Freelancer entregue el trabajo, puede solicitar **una Ãºnica extensiÃ³n de hasta 7 dÃ­as adicionales**.

La extensiÃ³n no es automÃ¡tica: debe enviarse una solicitud al Buyer y esperar su respuesta.

### 6.1. El Buyer recibe la solicitud de extensiÃ³n

Cuando el Freelancer solicita la extensiÃ³n:

1. TaskStream notifica al Buyer.
2. El Buyer dispone de un mÃ¡ximo de 24 horas para aprobar o rechazar la solicitud.
3. La solicitud solo puede generar una extensiÃ³n; no se permite una segunda extensiÃ³n para la misma orden.

### 6.2. El Buyer aprueba la extensiÃ³n

Si el Buyer aprueba la solicitud:

- El Freelancer recibe hasta 7 dÃ­as adicionales, contados a partir del vencimiento del plazo inicial.
- El lÃ­mite total de entrega serÃ¡ de hasta 14 dÃ­as desde el inicio original de la orden.
- No se puede solicitar una segunda extensiÃ³n.
- Si el Freelancer entrega dentro del plazo extendido, se aplica el flujo normal de revisiÃ³n de 32 horas, con un mÃ¡ximo de 2 correcciones por orden y la posibilidad de una disputa administrativa si no hay acuerdo.

La extensiÃ³n cambia el plazo disponible para entregar, pero no reinicia el contador de correcciones.

### 6.3. El Buyer rechaza la extensiÃ³n y solicita el reembolso

Si el Buyer rechaza la extensiÃ³n y solicita el reembolso, TaskStream devuelve el 100 % del importe reembolsable de la orden.

### 6.4. El Buyer no responde en 24 horas

Si el Buyer no responde dentro de las 24 horas posteriores a la solicitud de extensiÃ³n:

1. Se activa el reembolso automÃ¡tico al Buyer.
2. Se devuelve el 100 % del importe reembolsable de la orden.
3. Se notifica a las partes que venciÃ³ el plazo inicial, que el Freelancer solicitÃ³ una extensiÃ³n y que, al no recibir respuesta del Buyer dentro del plazo, se procesÃ³ el reembolso.

### 6.5. El Freelancer tampoco entrega dentro de la extensiÃ³n

Si el Buyer aprobÃ³ la extensiÃ³n, pero el Freelancer no entrega antes de que venza el plazo extendido:

- Se procesa un reembolso automÃ¡tico del 100 % del importe reembolsable de la orden.
- No se permite una segunda extensiÃ³n.
- Se notifica tanto al Buyer como al Freelancer sobre el vencimiento y el reembolso.

## 7. DistribuciÃ³n de fondos

Cuando una orden finaliza correctamente y corresponde pagar al Freelancer, la distribuciÃ³n es:

| Destinatario | Porcentaje |
|---|---:|
| Freelancer | 96 % |
| TaskStream | 4 % |

Cuando corresponde reembolsar por vencimiento de entrega o por una disputa resuelta a favor del Buyer, se devuelve el 100 % del importe reembolsable de la orden.

Los pagos o reembolsos no deben ejecutarse mientras exista una disputa administrativa pendiente. Cualquier comisiÃ³n externa o coste de red que pueda afectar el importe efectivamente recibido debe definirse en las condiciones operativas del producto.

## 8. Reglas globales que deben respetarse

1. **MÃ¡ximo 2 correcciones por orden.** El contador es global y no se reinicia con nuevas entregas ni con una extensiÃ³n.
2. **Una sola extensiÃ³n.** El Freelancer puede solicitar una Ãºnica extensiÃ³n de hasta 7 dÃ­as adicionales.
3. **24 horas para responder a la extensiÃ³n.** Si el Buyer no responde dentro del plazo, se activa el reembolso automÃ¡tico previsto.
4. **32 horas para revisar cada entrega.** Una nueva entrega despuÃ©s de una correcciÃ³n inicia un nuevo periodo de revisiÃ³n.
5. **30 minutos de ventana final.** DespuÃ©s de la aceptaciÃ³n expresa o automÃ¡tica, debe transcurrir esta ventana sin reclamaciones antes de liberar el pago.
6. **Disputa administrativa cuando no hay acuerdo.** Si se agotan las 2 correcciones y persiste el desacuerdo, los fondos quedan retenidos hasta que el administrador decida.
7. **No resolver una disputa pendiente mediante automatismos.** Mientras la disputa estÃ© abierta, no se libera el dinero ni se ejecuta un reembolso automÃ¡tico.
8. **Decisiones justificadas.** Las decisiones administrativas deben basarse en los requisitos originales, las entregas y las evidencias disponibles.
9. **Notificaciones claras.** Tanto el Buyer como el Freelancer deben recibir las notificaciones pertinentes sobre solicitudes de extensiÃ³n, vencimientos, aceptaciÃ³n automÃ¡tica, disputas y resultados.

## 9. Punto que debe definirse antes de cerrar las reglas

Debe especificarse quÃ© ocurre cuando alguien presenta una reclamaciÃ³n vÃ¡lida durante la ventana final de 30 minutos. La regla de negocio debe aclarar cÃ³mo se detiene o suspende la liberaciÃ³n de fondos, quiÃ©n revisa la reclamaciÃ³n y quÃ© condiciones permiten reanudar el pago o abrir una disputa.

Hasta que esta regla se defina, no debe asumirse que una reclamaciÃ³n presentada dentro de la ventana se ignora ni que el pago se libera automÃ¡ticamente a pesar de ella.
"""

output_path = "/mnt/data/taskstream_ai_flujo_completo.md"
pypandoc.convert_text(content, "md", format="md", outputfile=output_path, extra_args=["--standalone"])
print(f"Archivo creado: {output_path}")
```


---

### Prompt #004 â€” InvestigaciÃ³n e InstalaciÃ³n Multi-Agente de Skills (`find-skills`) y AdaptaciÃ³n 100% de la Skill `taskstream-spec`

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Gobernanza`, `PlaneaciÃ³n`, `Frontend`, `Backend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. Utiliza `find-skills` (`npx skills`) para investigar e instalar en `.agents/skills/` (general), `.kiro/skills/` (Kiro) y `.claude/skills/` (Claude Code) las *skills* oficiales con mayor reputaciÃ³n y valor real directo para el stack y metodologÃ­a de **TaskStream AI**:
     * **IngenierÃ­a SDD + BDD, Dominio, DiseÃ±o Modular, TDD y Code Review (`mattpocock/skills`):** `domain-modeling`, `codebase-design`, `tdd`, `code-review` (mÃ¡s sincronizaciÃ³n en Claude de `grill-with-docs`, `grill-me`, `grilling` y `find-skills`).
     * **Frontend Next.js 15.5 + React 19, AnimaciÃ³n 3D Scroll-Driven y WebGL:** `vercel-react-best-practices` (`vercel-labs/agent-skills`), `gsap-scrolltrigger` y `gsap-react` (`greensock/gsap-skills`), `threejs-fundamentals` y `threejs-animation` (`cloudai-x/threejs-skills`).
     * **AutenticaciÃ³n e Identidad (`SPEC-02`):** `clerk-nextjs-patterns` y `clerk-webhooks` (`clerk/skills`).
     * **Backend NestJS 10.4 y Base de Datos PostgreSQL + Prisma 6 en 3NF:** `nestjs-best-practices` (`kadajett/agent-nestjs-skills`), `prisma-orm-setup`, `prisma-client-api` y `prisma-database-setup` (`prisma/skills`).
     * **OrquestaciÃ³n de IA Consultiva (`SPEC-08`):** `ai-sdk` (`vercel/ai`).
  2. Crea y adapta al 100% la skill **`taskstream-spec`** (en `.agents/skills/taskstream-spec/`, `.kiro/skills/taskstream-spec/` y `.claude/skills/taskstream-spec/`) eliminando cualquier residuo del proyecto de origen y alineÃ¡ndola Ã­ntegramente con `.agents/CONTEXT.md`, `planning/architecture-overview.md`, `planning/sdd-process.md`, `planning/pbp-development.md`, `planning/taskboard.md` y `AGENTS.md`:
     * [`SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md): Reglas de oro de TaskStream AI, jerarquÃ­a de autoridad, protocolo de ingenierÃ­a paralela sin bloqueos para los 5 desarrolladores (`FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1`), frontera manual `ðŸ›¡ï¸` en Open Payments, catÃ¡logo oficial de `SPEC-00` a `SPEC-12`, modos de operaciÃ³n (`Arranque`, `Redactar`, `Revisar`, `Actualizar` en los 4 estados `Redactada`, `Implementada`, `Testeada`, `Aprobada`) y articulaciÃ³n con todas las *skills* instaladas en el proyecto.
     * [`references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md): Plantilla canÃ³nica de 12 secciones (`specs/_template.md`) y guÃ­a secciÃ³n por secciÃ³n adaptada a los contratos Zod, modelo 3NF Prisma, los 5 relojes BullMQ, escenas 3D con `ScrollTrigger` y `AiAdvisorInputContractSchema`.
     * [`references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md): Lista de verificaciÃ³n semÃ¡ntica de invariantes financieras (`96%/4%`, reembolsos `100%`, doble FX), negociaciÃ³n a la baja, plazos (`7d`, `24h`, `+7d`, `32h`, `30m`, mÃ¡x. 2 correcciones), alcance de IA exclusivo para imagen y texto en el MVP y formato de informe de revisiÃ³n.
     * [`scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs): Script automatizado en Node.js que valida cabeceras, estados SDD, las 12 secciones obligatorias, requisitos `RF-NN` con criterios BDD (`**Dado**` / `**Cuando**` / `**Entonces**`), cobertura de pruebas en la SecciÃ³n 9, cruce de tareas `T-F*` contra `planning/taskboard.md` y frontera manual `ðŸ›¡ï¸`.
* **Archivos creados / modificados:**
  * [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/SKILL.md) *(Creado y replicado en `.kiro/skills/taskstream-spec/` y `.claude/skills/taskstream-spec/`)*
  * [`.agents/skills/taskstream-spec/references/guia-de-secciones.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/guia-de-secciones.md) *(Creado y replicado)*
  * [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/references/validacion.md) *(Creado y replicado)*
  * [`.agents/skills/taskstream-spec/scripts/check-spec.mjs`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/skills/taskstream-spec/scripts/check-spec.mjs) *(Creado y replicado)*
  * Directorios de *skills* instaladas en `.agents/skills/`, `.kiro/skills/` y `.claude/skills/` *(Instalados vÃ­a `npx skills`)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
usando find-skills investiga a profundidad e instala las skills mas adecuadas para el proyecto solo si dan un valor real al proyecto que esten disponibles para kiro .agents general y claude. AdemÃ¡s quiero que adaptes la siguiente skill al proyecto teniendo en cuenta la arquitectura, el contexto y el desarrollo general del proyecto. La spec tiene como objetivo general trabajar con las demÃ¡s skills para redactar specs de manera Ã³ptima, completa y sin contra indicaciones. La skill final sea una estructura de las specs especificas del proyecto, no dejes residuos de referencias o ejemplos del proyecto de donde viene. Adecua la skill 100% al proyecto actual

---
name: englove-spec
description: "Redacta, revisa o actualiza las especificaciones SPEC-NN de Englove en specs/ siguiendo el proceso Spec-Driven Development del proyecto (planning/sdd-process.md): plantilla de 12 secciones, ciclo de vida, calendario de redacciÃ³n, criterios Dado/Cuando/Entonces y validaciÃ³n contra las decisiones de CONTEXT Â§14, el fuera de alcance del piloto (Â§2.4) y los pendientes P-n de Â§15. Ãšsala siempre que haya que crear la carpeta specs/ (tarea SPEC-00), redactar o revisar cualquier spec de SPEC-01 a SPEC-10 (o con sufijo, como SPEC-05a), cambiar el estado de una spec, aÃ±adir o corregir requisitos RF, o comprobar si una tarea ENG puede empezar porque su spec estÃ¡ Aprobada, aunque el usuario no diga literalmente la palabra spec."
---

# englove-spec â€” Especificaciones SDD de Englove

GuÃ­a para redactar, revisar y mantener las specs de `specs/`. La skill **no sustituye** a los documentos del proyecto: indica quÃ© leer, en quÃ© orden y cÃ³mo comprobar el resultado. Si esta skill y un documento de planeaciÃ³n discrepan, manda el documento (y conviene corregir la skill).

## Reglas de oro

1. **JerarquÃ­a de autoridad:** `.agents/CONTEXT.md` â†’ `planning/architecture-overview.md` â†’ `planning/sdd-process.md` â†’ `planning/pbp-development.md` â†’ `planning/taskboard.md` â†’ `specs/` â†’ cÃ³digo. Una spec nunca contradice un documento superior ni una spec Aprobada de la que depende. Si para escribirla harÃ­a falta contradecirlo, detente: primero se propone una decisiÃ³n nueva en CONTEXT Â§14 (o en architecture Â§14) y la spec se escribe despuÃ©s. No retoques en silencio un documento superior para que encaje con la spec.
2. **Sin spec Aprobada no hay cÃ³digo de producciÃ³n.** Si alguien pide implementar una tarea `ENG` cuya spec no estÃ¡ Aprobada, no empieces: dilo y ofrece redactar o completar la spec. La Ãºnica excepciÃ³n es un prototipo desechable, declarado como tal, para responder una pregunta abierta (sdd-process Â§6). En las Etapas 1 y 2 rigen ademÃ¡s las compuertas de la decisiÃ³n 65.
3. **El agente redacta; el lÃ­der del proyecto aprueba.** Puedes dejar una spec en `Borrador` o proponerla `En revisiÃ³n`. Nunca la marques `Aprobada` ni rellenes "Aprobada por / fecha" sin una confirmaciÃ³n explÃ­cita del lÃ­der en la conversaciÃ³n. Tampoco des por cerrado un pendiente P-n: su propuesta vigente es **Propuesto** hasta que el lÃ­der la confirme.
4. **Enlazar, no copiar.** La spec cita `CONTEXT Â§x`, `architecture Â§y` y el nÃºmero de decisiÃ³n, y solo aÃ±ade lo que falta para implementar: valores concretos, cÃ³digos de error, criterios verificables. Copiar pÃ¡rrafos crea dos fuentes que divergen (anti-patrÃ³n de sdd-process Â§10).
5. **Concretar sÃ­, inventar no.** La spec debe fijar los detalles que la planeaciÃ³n deja implÃ­citos para que dos implementaciones se comporten igual (sdd-process Â§3): textos de interfaz, `code` de error, nombres de campo, validaciones. Eso es su trabajo. Lo que no puede es aÃ±adir comportamiento o alcance que ningÃºn documento pide (sdd-process Â§9): eso va a la secciÃ³n 11 como pregunta abierta, con una propuesta. Las concreciones con impacto de producto (un `code` nuevo, un texto delicado) se listan en el informe final para que el lÃ­der las vea.
6. **Idioma y terminologÃ­a:** la spec se escribe en espaÃ±ol; identificadores tÃ©cnicos, tablas, columnas y `code` de error en inglÃ©s (CONTEXT Â§16). "Tipo de actividad" solo para los cinco valores de `ActivityType`; "mecÃ¡nica de juego" solo para los cinco de `GameMechanic` (decisiÃ³n 66).

## Fuentes que debes leer

LÃ©elas cada vez; no trabajes de memoria, porque los documentos cambian entre rondas.

| Fuente | Para quÃ© |
|---|---|
| `planning/sdd-process.md` Â§3â€“Â§10 | QuÃ© es una spec (Â§3), carpeta y nombres de archivo (Â§4), **plantilla obligatoria** (Â§5), ciclo de vida (Â§6), calendario y pendientes por spec (Â§7), relaciÃ³n con taskboard, pruebas y cÃ³digo (Â§8), **reglas para agentes** (Â§9), **anti-patrones** (Â§10) |
| `.agents/CONTEXT.md` Â§14 | Todas las decisiones, incluidas las rondas aÃ±adidas despuÃ©s de crear esta skill. Lee la columna Estado: una decisiÃ³n Sustituida, Retirada o Modificada solo se aplica en su forma vigente; sigue la cadena hasta la Ãºltima |
| `.agents/CONTEXT.md` Â§2.4 | Lo que no se construye en el piloto, aunque parezca fÃ¡cil o rÃ¡pido |
| `.agents/CONTEXT.md` Â§15 | Pendientes P-n, su propuesta vigente y la spec que debe cerrar cada uno |
| `.agents/CONTEXT.md` Â§16 y Â§17 | Convenciones obligatorias para agentes y glosario |
| `planning/taskboard.md` | La fila de la tarea `SPEC-NN` (alcance mÃ­nimo que la spec debe cubrir) y las tareas `ENG` cuya columna Spec es esa spec |
| `planning/pbp-development.md` Â§3 y Â§4 | DefiniciÃ³n de Hecho y la etapa de la spec: objetivo, alcance, fuera de alcance, entregables, criterios de salida y riesgos |
| `planning/architecture-overview.md` | Las secciones de la capacidad: rutas y navegaciÃ³n (Â§3.1), estados de error (Â§3.6), guards (Â§4.3), scoring (Â§4.4), modelo de datos (Â§6), flujos (Â§7), seguridad (Â§8), convenciones y catÃ¡logo de `code` (Â§13) |
| `specs/README.md` y specs anteriores | Estado de las demÃ¡s specs y contratos ya aprobados de los que depende la nueva |

Los documentos de cada ronda (`planning/incongruencias-y-decisiones-definitivas.md`, `planning/decisiones-para-correccion-de-planeacion.md`, `planning/decisiones-modelo-de-datos.md`) son vinculantes en lo decidido (decisiones 34, 57 y 67) y sirven para buscar detalle, pero ya estÃ¡n volcados en CONTEXT y architecture: la spec enlaza a estos dos.

## Elige el modo

| SituaciÃ³n | Modo |
|---|---|
| `specs/` no existe o le falta `README.md` o `_template.md` | **Arranque (SPEC-00)** |
| Hay que crear una `SPEC-NN` que no existe | **Redactar** |
| Hay que auditar una spec existente (antes de proponerla, antes de aprobarla o porque cambiÃ³ un documento superior) | **Revisar** |
| Hay que cambiar el contenido o el estado de una spec existente | **Actualizar** |

Si el usuario pide "la spec de X" sin nÃºmero, ubÃ­cala por capacidad en sdd-process Â§4 y Â§7 y en el taskboard.

### Arranque (SPEC-00)

1. Crea `specs/_template.md` con el contenido del bloque de plantilla de sdd-process Â§5, tal cual. Si la plantilla de Â§5 cambia en el futuro, `_template.md` se actualiza en el mismo cambio.
2. Crea `specs/README.md`, el **Ãºnico Ã­ndice** (sdd-process Â§4): una lÃ­nea de propÃ³sito, enlaces a sdd-process Â§5 (plantilla), Â§6 (ciclo de vida) y Â§7 (calendario), y una tabla `| Spec | TÃ­tulo | Estado | Etapa | Tareas |` con una fila, enlazada, por cada spec que exista como archivo. No aÃ±adas filas para specs aÃºn no redactadas: su calendario vive en sdd-process Â§7.
3. Actualiza el taskboard: SPEC-00 a Hecho, resumen y fecha del encabezado (reglas de "CÃ³mo usar este tablero"). Si el bloque de Â§5 tiene algÃºn defecto de formato (por ejemplo, la tabla del registro de cambios sin fila separadora `|---|---|---|`), corrÃ­gelo en `_template.md` y repÃ³rtalo para que se corrija tambiÃ©n en sdd-process Â§5.

### Redactar una spec

**Paso 1 â€” Ubicar la spec.**

- ID, tÃ­tulo y nombre de archivo segÃºn sdd-process Â§4: kebab-case en espaÃ±ol, sin tildes (`SPEC-02-identidad-y-sesion.md`). Si una etapa necesita mÃ¡s de una spec, sufijo `SPEC-05a`, `SPEC-05b`.
- Etapa: la que **implementa** la spec, es decir, la de sus tareas `ENG` en el taskboard, que coincide con su nÃºmero (SPEC-01 â†’ Etapa 1 â€” Scaffold). No es la etapa en que se redacta (columna "Se redacta durante" de sdd-process Â§7).
- Calendario (sdd-process Â§7): las specs se redactan una etapa por delante de la implementaciÃ³n. Si piden una spec fuera de su momento, o todas de una vez, seÃ±ala el anti-patrÃ³n y pide confirmaciÃ³n al lÃ­der antes de seguir. Redactar la spec de la etapa N+1 no autoriza a empezar su cÃ³digo.
- Si `specs/` no existe, haz antes el Arranque: SPEC-00 es dependencia de todas las specs en el taskboard.
- Si el archivo ya existe, pasa a Revisar o Actualizar.

**Paso 2 â€” Reunir el insumo, en este orden.**

1. Fila `SPEC-NN` del taskboard: cada elemento que enumera acabarÃ¡ en al menos un RF o una regla de negocio.
2. Tareas `ENG` cuya columna Spec es `SPEC-NN`: forman el campo Tareas de la cabecera y cada una queda cubierta por al menos un RF.
3. Etapa en pbp Â§4: objetivo, alcance, fuera de alcance, criterios de salida (suelen convertirse en RF verificables) y riesgos.
4. Secciones de CONTEXT y architecture que tratan la capacidad, y las decisiones de Â§14 que la tocan (bÃºscalas por las entidades, endpoints y tÃ©rminos de la capacidad).
5. Pendientes de CONTEXT Â§15 que afectan a la spec. Los **asignados** a ella (columna "Se cierra antes de aprobar"; tambiÃ©n sdd-process Â§7) bloquean su aprobaciÃ³n hasta que el lÃ­der los cierre. Los asignados a otra spec pero que esta materializa (por ejemplo, el `onDelete` de `AuditLog` que fija SPEC-01 depende de P-4, que cierra SPEC-03) se aplican con su propuesta vigente marcada **Propuesto** y se anotan en la secciÃ³n 11 como dependencia no bloqueante, indicando quÃ© cambiarÃ­a en la spec si la propuesta cambia.
6. Specs anteriores de las que depende.

**Paso 3 â€” Mapa de trazabilidad.** Antes de escribir, relaciona cada origen (elemento de la fila del taskboard, tarea `ENG`, criterio de salida de pbp, decisiÃ³n de Â§14) con el RF o la regla que lo cubrirÃ¡. Todo origen necesita un RF y todo RF necesita un origen: un RF sin origen es alcance inventado (quÃ­talo o llÃ©valo a preguntas abiertas) y un origen sin RF es un hueco. El mapa es material de trabajo; no hace falta incluirlo en la spec.

Si falta una decisiÃ³n de comportamiento o de alcance que ningÃºn documento toma, no la inventes: va a la secciÃ³n 11 con una propuesta (los detalles de concreciÃ³n se resuelven en la spec, regla de oro 5). Si los huecos son muchos o son decisiones de producto de fondo, sugiere una entrevista previa con la skill `grill-with-docs` antes de redactar; sus ADR se registran en CONTEXT Â§14 y sus tÃ©rminos de glosario en Â§17 (AGENTS.md).

**Paso 4 â€” Escribir el archivo.** Parte de `specs/_template.md` (o del bloque de sdd-process Â§5 si aÃºn no existe; si difieren, manda sdd-process Â§5). Las 12 secciones son obligatorias, en su orden y con su tÃ­tulo exacto; si una no aplica, escribe "No aplica" y por quÃ©, sin eliminarla. Antes de escribir, lee completa la guÃ­a por secciÃ³n: [references/guia-de-secciones.md](references/guia-de-secciones.md). Al crear: Estado `Borrador`, "Aprobada por / fecha" `â€”` y la primera fila del registro de cambios.

**Paso 5 â€” Validar (obligatorio antes de entregar).**

1. Ejecuta, desde la raÃ­z del repositorio:

   ```bash
   node .agents/skills/englove-spec/scripts/check-spec.mjs specs/SPEC-NN-nombre.md
   ```

   Comprueba la estructura contra la plantilla viva de sdd-process Â§5, el texto de plantilla sin reemplazar, los RF con **Dado** / **Cuando** / **Entonces** en negrita, que cada RF tenga prueba citada por su nÃºmero, los P-n (asignados y mencionados), las tareas `ENG` cubiertas, el tamaÃ±o, el Ã­ndice y una lista de seÃ±ales de alarma. Corrige todos los `ERROR`; revisa cada `AVISO` y justifica en el informe los que se queden.
2. Recorre la lista semÃ¡ntica de [references/validacion.md](references/validacion.md): decisiones de Â§14, fuera de alcance de Â§2.4, convenciones de Â§16, terminologÃ­a y pendientes. El script no sustituye esta lectura.
3. Si encuentras incongruencias entre documentos de planeaciÃ³n (no en la spec), no las resuelvas por tu cuenta: repÃ³rtalas. Mientras tanto manda el documento superior.

**Paso 6 â€” Cerrar el cambio** (en el mismo cambio, sdd-process Â§9 regla 4 y reglas del taskboard):

- `specs/README.md`: fila de la spec con su estado.
- `planning/taskboard.md`: la tarea `SPEC-NN` pasa a En curso mientras se redacta (lÃ­mite de 3 tareas en curso) y a Hecho solo cuando el lÃ­der la apruebe; actualiza el resumen y la fecha del encabezado.
- CONTEXT Â§14 y Â§15 solo si el lÃ­der cerrÃ³ un pendiente o cambiÃ³ una decisiÃ³n en esta conversaciÃ³n.
- Si es la primera spec del repositorio, actualiza las frases que dicen que aÃºn no hay specs redactadas: CONTEXT Â§11.1, sdd-process Â§7 y la Etapa 0 de pbp Â§4 (bÃºscalas por "aÃºn no", "no se ha redactado" o "ninguna spec").
- Estado final de la spec: `En revisiÃ³n` solo si estÃ¡ completa segÃºn la plantilla, el script no deja errores y ninguna pregunta abierta exige cambiar un documento superior (decisiÃ³n nueva en CONTEXT Â§14 o en architecture Â§14). En cualquier otro caso queda en `Borrador` y el informe dice quÃ© falta.
- Si el script avisa de que la spec supera los 20 minutos de lectura, recorta primero las repeticiones de CONTEXT o architecture. Si aun asÃ­ no cabe, **propÃ³n** al lÃ­der la divisiÃ³n (`SPEC-NNa`, `SPEC-NNb`) en lugar de hacerla: cambia el taskboard (la tarea `SPEC-NN` y la columna Spec de sus `ENG`) y el Ã­ndice.

**Paso 7 â€” Informe final** (formato mÃ¡s abajo).

### Revisar una spec

1. Lee la spec completa y sus fuentes, en el orden del Paso 2.
2. Ejecuta el script de validaciÃ³n.
3. Recorre [references/validacion.md](references/validacion.md) y la [guÃ­a por secciÃ³n](references/guia-de-secciones.md).
4. Entrega el informe de revisiÃ³n con el formato de `references/validacion.md`: bloqueantes, mejoras e incongruencias con documentos superiores, cada hallazgo con su secciÃ³n o RF, la fuente que lo respalda y una propuesta de correcciÃ³n. Si el usuario pidiÃ³ ademÃ¡s corregir, aplica los cambios y aÃ±ade la fila correspondiente al registro de cambios.
5. Da un veredicto. Para pasar a Aprobada hacen falta: cero preguntas abiertas que bloqueen un RF, los P-n asignados confirmados por el lÃ­der y la decisiÃ³n explÃ­cita del lÃ­der.

### Actualizar una spec

- **Estados y quiÃ©n los cambia:** sdd-process Â§6. Transiciones: Borrador â†’ En revisiÃ³n; En revisiÃ³n â†’ Borrador (cambios) o â†’ Aprobada (solo el lÃ­der); Aprobada â†’ Implementada (todas sus `ENG` en Hecho); Implementada â†’ Verificada (pruebas de la secciÃ³n 9 en CI y, si aplica, validaciÃ³n de la profesora en staging); Aprobada â†’ En revisiÃ³n (cambio de alcance); Verificada â†’ Obsoleta (reemplazada; enlaza a la sustituta).
- **Cambiar una spec Aprobada** exige volver a En revisiÃ³n con una fila en el registro de cambios. Si el cambio es menor (redacciÃ³n, un cÃ³digo de error), basta la fila y se mantiene Aprobada.
- Si el cambio nace de una decisiÃ³n nueva, primero se registra en CONTEXT Â§14 (o architecture Â§14) y despuÃ©s se toca la spec.
- **Al aprobar**, con confirmaciÃ³n del lÃ­der: estado, "Aprobada por / fecha" y fila en el registro de cambios; fila en `specs/README.md`; tarea `SPEC-NN` a Hecho en el taskboard (las `ENG` de la etapa siguen sujetas a sus dependencias y a la decisiÃ³n 65). Si el lÃ­der confirmÃ³ un P-n: registra la decisiÃ³n en CONTEXT Â§14, quÃ­tala de Â§15 y de las listas que la repiten (architecture Â§15 y "Decisiones que desbloquean tareas" del taskboard), y convierte la pregunta de la secciÃ³n 11 en regla o RF.

## Informe final al usuario

Termina siempre con:

1. Archivos creados o modificados y estado de la spec.
2. Resultado del script: errores y avisos restantes, y por quÃ© se aceptan los avisos.
3. Preguntas abiertas que necesitan decisiÃ³n del lÃ­der, con su propuesta vigente, destacando los P-n.
4. Concreciones nuevas que conviene que el lÃ­der revise (`code` de error que no estÃ¡n en architecture Â§13, textos delicados).
5. Incongruencias encontradas en la planeaciÃ³n, si las hay.
6. Recordatorio: no se escribe cÃ³digo de producciÃ³n de esta capacidad hasta que el lÃ­der apruebe la spec (y, en las Etapas 1 y 2, se cumplan las compuertas de la decisiÃ³n 65).

## RelaciÃ³n con otras skills

- `grill-with-docs`: entrevista previa para cerrar huecos de producto antes de redactar.
- `domain-modeling`: tÃ©rminos nuevos para el glosario (CONTEXT Â§17).
- `code-review`: su eje Spec verifica el cÃ³digo contra los RF; busca la spec en `specs/`.
- `tdd`: los criterios Dado/Cuando/Entonces son la lista de pruebas; se nombran `RF-n: â€¦` (sdd-process Â§8).
```

---

### Prompt #005 â€” CreaciÃ³n del Repositorio GitHub y AdiciÃ³n de Colaboradores

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Gobernanza`
* **Resumen de su funcionalidad:** InicializaciÃ³n del repositorio Git local en el workspace `Haki-Soft`, commit inicial con los 211 archivos del monorepo, creaciÃ³n del repositorio privado `Sebastian-Tunjuelo/Haki-Soft` en GitHub mediante la CLI `gh`, push del commit inicial y adiciÃ³n de los 4 integrantes del equipo como colaboradores con permiso `write`: `Samuel-Duque`, `GeorgeAMS`, `SaraMLopera` y `MaicolD0930`.
* **Archivos creados o modificados:** [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md)

**Texto Ã­ntegro (verbatim) del prompt enviado:**

```
crea un repositorio de este proyecto y agrega a estos compaÃ±eros como colaboradores 

https://github.com/Samuel-Duque

https://github.com/GeorgeAMS

https://github.com/SaraMLopera

https://github.com/MaicolD0930
```

---

### Prompt #006 â€” Lectura y ComprensiÃ³n del Contexto (Sin Modificaciones)

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`
* **Resumen de su funcionalidad:** El agente leyÃ³ `.agents/CONTEXT.md` y la planeaciÃ³n, contrastÃ³ el estado del repo (sin `specs/` ni `apps/` aÃºn) y formulÃ³ preguntas de aclaraciÃ³n de negocio sin editar archivos.
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Bien, la idea es que entiendas el contexto y la informacion con la cual estaa estructurada el proyecto, la idea que que leas todo y generes preguntas sobre lo que tengas dudad, no modifiques nada aun, solo lectura y comprension.
```

---

### Prompt #007 â€” Respuestas Iniciales a Preguntas de AclaraciÃ³n (1â€“12)

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`
* **Resumen de su funcionalidad:** Cierra reglas: reembolso auto si no hay extensiÃ³n; extensiÃ³n solo al vencer; post-2Âª correcciÃ³n aceptar o mediaciÃ³n; ventana 30m; 4% a wallet dueÃ±o; misma cuenta ofrece/contrata; sesiÃ³n enfocada a backend + front de pruebas (IA fuera).
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
9. ese porcentaje va directo a otra wallet, la del dueÃ±o
10. expliame con un ejemplo
11. explicame con un ejemplo
12. Lo de la ia no lo tengas en cuenta, solo haremos el back en esta sesion con  front de pruebas.

Las demas ya te las responde depsues
```

---

### Prompt #008 â€” Aclaraciones de Negocio (3, 5â€“7, 10â€“11)

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`
* **Resumen de su funcionalidad:** Precisa mediaciÃ³n admin tras peticiÃ³n post-2Âª correcciÃ³n; Gig fijo no negociable vs ofertas `<=` tope; bandeja de ofertas; flujo solo tras aceptaciÃ³n mutua; una sola wallet activa con reemplazo.
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
3. Por eso tras finalizar la seguna correccion puede afirmar que es lo que quiere si no se realiza peticion de reembolso donde entra administracion a mediar.
5. Correcto si no acepta darle mas plazo, se realiza reembolso.
6. Si el que realiza trabajo publica a un precio sus servicios esto es directo no negociable, En cambio si una persona ofrece generar trabajo ejemplo: busco editor de fotos pago maximo 50 dolares, ahi el trabajador puede hacer ofertas <=50.
7. Referente a los varios hilos, Carlos le aparecen las ofertas y puede ver los perfiles de los ofertantes, y tomar o aceptar la que el quiera de esas.
10. Pues el flujo no comienza hasta que ambos lados acepten dicha actividad o de lo contrario el que busca el trabajo cancele la peticion antes de ser aceptada.
11. Solo se le permitira una, En caso de querer cambiar debe aÃ±adir una nueva se reemplaza por la anterior, pero siempre debe haber una activa.
```

---

### Prompt #009 â€” Reembolso Termina la Actividad

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`
* **Resumen de su funcionalidad:** Confirma que ante reembolso la orden/actividad muere, el Freelancer queda desligado y el Buyer busca otra persona en un ciclo nuevo (sin `REFUNDED_AND_REOPENED`).
* **Archivos creados / modificados:** Ninguno
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
5. Si se genera el reembolso simplemente esa actividad muere, y por ejemplo no me cumplieron la actividad puedo buscar otra persona y el que no cumplio simplemente queda desatado de dicha actividad.
```

---

### Prompt #010 â€” CorrecciÃ³n Documental del CONTEXT y PlaneaciÃ³n Alineada

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Gobernanza`, `Backend`
* **Resumen de su funcionalidad:** Actualiza la SSoT (`.agents/CONTEXT.md`) y documentos de planeaciÃ³n/validaciÃ³n para reflejar todas las aclaraciones de los prompts #006â€“#009: extensiÃ³n solo al vencer, reembolsos que matan la actividad, mediaciÃ³n post-2Âª correcciÃ³n, Gig vs bandeja de ofertas, wallet Ãºnica, 4% a wallet del dueÃ±o, arranque tras aceptaciÃ³n mutua, enums/schemas/state machine alineados.
* **Archivos creados / modificados:**
  * [`.agents/CONTEXT.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/CONTEXT.md) *(Modificado)*
  * [`planning/architecture-overview.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/architecture-overview.md) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/taskboard.md) *(Modificado)*
  * [`planning/pbp-development.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/pbp-development.md) *(Modificado)*
  * [`planning/sdd-process.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/planning/sdd-process.md) *(Modificado)*
  * [`.agents/skills/taskstream-spec/references/validacion.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/.agents/skills/taskstream-spec/references/validacion.md) *(Modificado; sincronizado a rÃ©plicas `.claude` / `.kiro`)*
  * [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Considerando todas estas aclaraciones, realiza las correciones en el contexto para que quede mucho mas claro en la documentacion del proyecto.
```

---

### Prompt #011 â€” Redactar e implementar SPEC-00 y SPEC-01; redactar SPEC-02 y SPEC-03

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests`
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

### Prompt #012 â€” Aprovisionamiento e IntegraciÃ³n de CLI y Servidor MCP de Open Payments en Haki-Soft

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Herramientas / DX`, `Backend`, `Gobernanza`
* **Resumen de su funcionalidad:**
  1. Clona e instala en `tools/open-payments-cli` el CLI interactivo oficial de la **Interledger Foundation** con dependencias aisladas mediante `pnpm install --ignore-workspace`.
  2. Clona, instala y compila a JavaScript (`dist/index.js`) en `tools/open-payments-mcp` el servidor MCP para Open Payments API con dependencias aisladas mediante `pnpm install --ignore-workspace` y `pnpm build`.
  3. Desacopla los directorios `.git` internos de ambas herramientas para integrarlas limpiamente al Ã¡rbol de control de versiones de `Haki-Soft`.
  4. Crea la plantilla de entorno `tools/open-payments-cli/.env.example` y documenta exhaustivamente en `tools/README.md` el manual de ejecuciÃ³n interactiva, el modo `.env`, los 13 comandos disponibles, las 9 tools MCP y la configuraciÃ³n para Antigravity (`~/.gemini/config/mcp_config.json`).
  5. Mantiene la trazabilidad inmutable y sincronizaciÃ³n dual de gobernanza en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
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

---

### Prompt #013 â€” InstalaciÃ³n Multi-Agente de Skills Adicionales para Zod, RedacciÃ³n de Specs y Frontend Design

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Gobernanza`, `Frontend`, `Backend`, `PlaneaciÃ³n`
* **Resumen de su funcionalidad:**
  1. Realiza bÃºsqueda e instala vÃ­a `npx skills add` con soporte multi-agente (`.agents/skills`, `.kiro/skills` y `.claude/skills`) de 6 skills de alta adopciÃ³n comunitaria:
     * **Soporte de Zod:** `zod-validation-utilities` (`giuseppe-trisciuoglio/developer-kit`) y `zod-schema-validation` (`mindrally/skills`) para estructuraciÃ³n de contratos Zod, inferencia de tipos estricta (`z.infer`), validaciÃ³n en capas API (DTOs de NestJS), transformaciones seguras y validaciÃ³n de formularios con React Hook Form.
     * **RedacciÃ³n de Specs:** `to-spec` (`mattpocock/skills`) para sintetizar Ã¡gilmente discusiones tÃ©cnicas hacia borradores de especificaciones estructuradas, trabajando en sinergia con la skill rectora `taskstream-spec` (`SPEC-00` a `SPEC-12`).
     * **Frontend Design:** `frontend-design` (`anthropics/skills`), `shadcn-ui` y `tailwind-css-patterns` (`giuseppe-trisciuoglio/developer-kit`) para direcciÃ³n visual distintiva e intencional, componentes accesibles basados en Radix UI (`shadcn/ui`), sistemas utility-first de espaciado, layout y temas oscuros coordinados con Next.js 15.5, React 19 y las escenas 3D de Canvas.
  2. Actualiza la tabla de interoperabilidad y orquestaciÃ³n documental en `taskstream-spec/SKILL.md` (y rÃ©plicas en `.kiro` y `.claude`) integrando formalmente las nuevas skills especializadas.
  3. Mantiene la trazabilidad inmutable y sincronizaciÃ³n dual de gobernanza en `skills-lock.json`, `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
* **Archivos creados / modificados:**
  * `.agents/skills/frontend-design/` *(Instalado)*
  * `.agents/skills/shadcn-ui/` *(Instalado)*
  * `.agents/skills/tailwind-css-patterns/` *(Instalado)*
  * `.agents/skills/to-spec/` *(Instalado)*
  * `.agents/skills/zod-schema-validation/` *(Instalado)*
  * `.agents/skills/zod-validation-utilities/` *(Instalado)*
  * `.kiro/skills/` y `.claude/skills/` *(RÃ©plicas sincronizadas)*
  * [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/maico/Desktop/Haki-Soft/.agents/skills/taskstream-spec/SKILL.md) *(Modificado y sincronizado)*
  * [`skills-lock.json`](file:///c:/Users/maico/Desktop/Haki-Soft/skills-lock.json) *(Modificado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
AÃ±ade skills adicionales para apoyar a zod, redactar specs y frontend design
```

---

### Prompt #014 â€” ImplementaciÃ³n de SPEC-02 ejerciendo los roles FE-1 y FE-2 (Clerk v6, Selector de Modo y VerificaciÃ³n de Billetera Multimoneda)

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Frontend`, `Gobernanza`, `Backend`, `PlaneaciÃ³n`
* **Resumen de su funcionalidad:**
  1. Ejerce los dos roles de frontend (`FE-1` y `FE-2`) para implementar las vistas y contratos de `SPEC-02`:
     - **FE-1 (Arquitectura y Funcionalidad Core):** ConfiguraciÃ³n de Clerk v6 con middleware mÃ­nimo `clerkMiddleware()` en Next.js 15.5 (`apps/web/middleware.ts`), protecciÃ³n de rutas con verificaciÃ³n en servidor `await auth()`, vistas de autenticaciÃ³n `/sign-in` y `/sign-up`, endpoints REST para `activeMode` y descubrimiento/retos GNAP, y adaptadores MSW en `apps/web/src/mocks/handlers.ts`.
     - **FE-2 (DiseÃ±o Interactivo y Experiencia de Usuario):** DiseÃ±o de tokens visuales slate obsidian en `apps/web/app/globals.css` (conforme a `frontend-design`), componente tÃ¡ctil interactivo `ModeSwitcher` (`/settings/mode`) para alternar entre `Buyer Mode` y `Seller Mode` con feedback visual de invariantes, y flujo interactivo completo de verificaciÃ³n de billetera `WalletVerification` (`/onboarding/wallet`) con mÃ¡quina de 6 estados (`EMPTY`, `DISCOVERING`, `PENDING_REDIRECT`, `VERIFIED`, `FAILED_HASH`, `EXPIRED`), presets de billeteras panamericanas (USD, COP, CAD, BRL, MXN), inspector criptogrÃ¡fico de hash SHA-256 (`gnapInteractHash`) e historial atÃ³mico de reemplazo de billetera anterior.
  2. Resuelve la compatibilidad universal del mÃ³dulo `idempotency.ts` (`packages/shared-schemas`) para bundlers de cliente y servidor, aÃ±ade alias `@/*` en TypeScript y configura fallbacks webpack en `apps/web/next.config.ts`.
  3. Actualiza el tablero operativo `planning/taskboard.md` marcando `T-F1-FE1-01` como `[DONE]`, aÃ±ade la versiÃ³n `1.1.0` en el historial de `specs/SPEC-02.md`, y mantiene la trazabilidad estricta y sincronizada en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
* **Archivos creados / modificados:**
  * [`apps/web/middleware.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/middleware.ts) *(Creado)*
  * [`apps/web/app/globals.css`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/globals.css) *(Creado)*
  * [`apps/web/app/layout.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/layout.tsx) *(Modificado)*
  * [`apps/web/app/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/page.tsx) *(Modificado)*
  * [`apps/web/app/sign-in/[[...sign-in]]/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/sign-in/[[...sign-in]]/page.tsx) *(Creado)*
  * [`apps/web/app/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/sign-up/[[...sign-up]]/page.tsx) *(Creado)*
  * [`apps/web/app/settings/mode/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/settings/mode/page.tsx) *(Creado)*
  * [`apps/web/app/onboarding/wallet/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/onboarding/wallet/page.tsx) *(Creado)*
  * [`apps/web/app/api/v1/me/mode/route.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/api/v1/me/mode/route.ts) *(Creado)*
  * [`apps/web/app/api/v1/me/wallet/discovery/route.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/api/v1/me/wallet/discovery/route.ts) *(Creado)*
  * [`apps/web/app/api/v1/me/wallet/challenges/route.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/api/v1/me/wallet/challenges/route.ts) *(Creado)*
  * [`apps/web/app/api/v1/me/wallet/route.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/api/v1/me/wallet/route.ts) *(Creado)*
  * [`apps/web/src/lib/wallet-mock-store.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/lib/wallet-mock-store.ts) *(Creado)*
  * [`apps/web/src/components/navbar.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/components/navbar.tsx) *(Creado)*
  * [`apps/web/src/components/mode-switcher.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/components/mode-switcher.tsx) *(Creado)*
  * [`apps/web/src/components/wallet-verification.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/components/wallet-verification.tsx) *(Creado)*
  * [`apps/web/src/mocks/handlers.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/mocks/handlers.ts) *(Modificado)*
  * [`apps/web/next.config.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/next.config.ts) *(Modificado)*
  * [`apps/web/tsconfig.json`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/tsconfig.json) *(Modificado)*
  * [`apps/web/package.json`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/package.json) *(Modificado)*
  * [`packages/shared-schemas/src/idempotency.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/packages/shared-schemas/src/idempotency.ts) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Soft/planning/taskboard.md) *(Modificado)*
  * [`specs/SPEC-02.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/SPEC-02.md) *(Modificado)*
  * [`.env.example`](file:///c:/Users/maico/Desktop/Haki-Soft/.env.example) *(Modificado)*
  * [`apps/web/.env.local`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/.env.local) *(Creado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Implementa la spec 02 ejerciendo los dos roles de frontend. Guiate a travÃ©s de los diferentes documentos de planeaciÃ³n y apoyandote de las skills de diseÃ±o. Recuerda delimitarte a unicamente la spec, no implementar caracteristicas extra. MantÃ©n lo que es seguridad, buenas prÃ¡cticas de programaciÃ³n y en general realiza una implementaciÃ³n Ã³ptima y eficaz de las vistas, recuerda hacerlo interactivo, en caso de requerir animaciÃ³n 3D o utilizaciÃ³n de la tecnologÃ­a scroll trigger, aÃ±adelo al proyecto sin errores de compilaciÃ³n ni de ningun tipo
```

---

### Prompt #015 â€” Solicitud de ImplementaciÃ³n de SPEC-03 desde los Dos Roles de Frontend (FE-1 y FE-2)

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Frontend`, `PlaneaciÃ³n`, `Gobernanza`, `Tests`
* **Resumen de su funcionalidad:**
  1. Solicitud de implementaciÃ³n de `SPEC-03` ejerciendo ambos roles frontend (`FE-1` y `FE-2`) bajo la metodologÃ­a SDD Evolutivo + BDD, sincronizaciÃ³n del motor 3D y actualizaciÃ³n de planeaciÃ³n.
  2. AnÃ¡lisis preliminar de requerimientos, dependencias y contratos visuales previo a la ejecuciÃ³n.
* **Archivos creados / modificados:**
  * Ninguno durante este turno (fase de anÃ¡lisis e inspecciÃ³n de especificaciones).
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Implementa la spec 3 desde los dos roles de frontend, siguiendo el mismo flujo de desarrollo. Recuerda utilizar las skills necesarias para el desarrollo de esta spec y modifica los archivos necesarios para que la spec se vea implementada en la planeaciÃ³n 
```

---

### Prompt #016 â€” Pausa MomentÃ¡nea de EjecuciÃ³n Solicitada por el Usuario

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Gobernanza`
* **Resumen de su funcionalidad:**
  1. El usuario envÃ­a el comando de pausa.
  2. La IA detiene la ejecuciÃ³n inmediatamente sin realizar modificaciones de archivos y confirma el estado en espera de instrucciones.
* **Archivos creados / modificados:**
  * Ninguno (pausa confirmada de inmediato).
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
pausa
```

---

### Prompt #017 â€” ContinuaciÃ³n y CulminaciÃ³n de la ImplementaciÃ³n de SPEC-03 (FE-1 / FE-2)

* **Herramienta de IA utilizada:** `Antigravity`
* **Ãrea(s) donde toma lugar:** `Frontend`, `PlaneaciÃ³n`, `Gobernanza`, `Tests`
* **Resumen de su funcionalidad:**
  1. **Rol FE-2 (Motor 3D, Lenis y GSAP ScrollTrigger):**
     - InstalaciÃ³n y configuraciÃ³n de dependencias de renderizado 3D y fÃ­sica de scroll en `apps/web`: `gsap` (3.12.5+), `@gsap/react` (2.1.1), `lenis` (1.1.18+), `three` (0.170.0), `@react-three/fiber` (9.0.0+), `@react-three/drei` (10.0.0+) y `@types/three`.
     - CreaciÃ³n de `apps/web/app/providers/smooth-scroll.tsx`: sincronizaciÃ³n estricta de Lenis con el ticker de GSAP (`lagSmoothing(0)`), actualizaciÃ³n de eventos `lenis.on('scroll', ScrollTrigger.update)`, soporte de accesibilidad `prefers-reduced-motion` y reversiÃ³n/destrucciÃ³n completa de triggers y ticker al desmontar ruta.
     - CreaciÃ³n de `apps/web/app/scenes/hero-scene.tsx`: escena 3D WebGL con nÃºcleo de custodia Escrow y canales orbitales Interledger, mutaciÃ³n directa sobre `useRef` con ScrollTrigger scrub (invariante crÃ­tica de CERO llamadas a `setState` en scroll), funciÃ³n pura `isWebGLAvailable()` y fallback HTML determinista ante `WEBGL_UNAVAILABLE`.
     - CreaciÃ³n de `apps/web/app/scenes/hero-scene-loader.tsx`: dynamic import aislado con `ssr: false` y placeholder de 480px para prevenir Cumulative Layout Shift (CLS).
  2. **Rol FE-1 (Layout, Landing Page, Accesibilidad y SemÃ¡ntica):**
     - IntegraciÃ³n del `SmoothScrollProvider` en `apps/web/app/layout.tsx`.
     - MaquetaciÃ³n y composiciÃ³n rica de la landing en `apps/web/app/page.tsx` con integraciÃ³n armÃ³nica de la escena 3D, timeline cronolÃ³gico de escrow con plazos inmutables (7d, 24h, 32h, 30m) y desglose matemÃ¡tico exacto de la invariante 96% / 4% con `splitSingleBlockEscrow`.
  3. **Pruebas y Calidad (FE-2 / Tests):**
     - ConfiguraciÃ³n de Vitest (`apps/web/vitest.config.ts`) y script de pruebas en `package.json`.
     - CreaciÃ³n de suite BDD de pruebas unitarias y de integraciÃ³n (`apps/web/src/tests/spec-03-scroll-canvas.test.ts`) cubriendo `TEST-01` a `TEST-04` y `RF-01` a `RF-06` (8/8 pruebas verdes).
  4. **PlaneaciÃ³n y Gobernanza:**
     - ActualizaciÃ³n de `planning/taskboard.md` marcando tareas `T-F1-FE2-01` y `T-F1-FE2-02` como `[DONE]`.
     - TransiciÃ³n de estado en `specs/SPEC-03.md` y `specs/README.md` a `Testeada (TESTED)` y registro de versiÃ³n 1.1.0 en Â§12.
     - ActualizaciÃ³n y sincronizaciÃ³n estricta de trazabilidad en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
* **Archivos creados / modificados:**
  * [`apps/web/app/providers/smooth-scroll.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/providers/smooth-scroll.tsx) *(Creado)*
  * [`apps/web/app/scenes/hero-scene.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/scenes/hero-scene.tsx) *(Creado)*
  * [`apps/web/app/scenes/hero-scene-loader.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/scenes/hero-scene-loader.tsx) *(Creado)*
  * [`apps/web/vitest.config.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/vitest.config.ts) *(Creado)*
  * [`apps/web/src/tests/spec-03-scroll-canvas.test.ts`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/src/tests/spec-03-scroll-canvas.test.ts) *(Creado)*
  * [`apps/web/app/layout.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/layout.tsx) *(Modificado)*
  * [`apps/web/app/page.tsx`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/app/page.tsx) *(Modificado)*
  * [`apps/web/package.json`](file:///c:/Users/maico/Desktop/Haki-Soft/apps/web/package.json) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/maico/Desktop/Haki-Soft/planning/taskboard.md) *(Modificado)*
  * [`specs/SPEC-03.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/SPEC-03.md) *(Modificado)*
  * [`specs/README.md`](file:///c:/Users/maico/Desktop/Haki-Soft/specs/README.md) *(Modificado)*
  * [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Soft/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Continua implementando
```

---

### Prompt #018 â€” RedacciÃ³n de `SPEC-04` y `SPEC-05` con Seguridad Fintech, Escenarios BDD y Planteamiento de Brechas/Decisiones Abiertas en `taskboard.md`

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`
* **Resumen de su funcionalidad:**
  1. **RedacciÃ³n de `specs/SPEC-04.md` (`Redactada (DRAFTED)`):**
     - EspecificaciÃ³n completa en 12 secciones del catÃ¡logo de 6 categorÃ­as del MVP (`CATEGORY_MEDIA_CONSTRAINTS_MAP`), Gigs a precio fijo no negociables, publicaciones de Buyer con presupuesto tope (`ClientTaskPublication`) y cancelaciÃ³n atÃ³mica previa al acuerdo, inyecciÃ³n segura Server-Side de W3C Web Monetization (`<link rel="monetization">`) y escena 3D de categorÃ­as + `ScrollTrigger.batch()` a 60â€“120 FPS.
     - Cierre de brechas de seguridad en el flujo de Marketplace: prevenciÃ³n de IDOR tomando `buyerId`/`sellerId` exclusivamente del token Clerk en servidor, `WalletVerifiedGuard` obligatorio, rango financiero seguro `[100 .. 50_000_000]` centavos para impedir *Fee Truncation* (`platformFee = 0` en Rafiki) e *Integer Overflow* en `INT4` de PostgreSQL, exclusiÃ³n de `.svg` ejecutables y sanitizaciÃ³n temprana anti-*Prompt Injection*.
  2. **RedacciÃ³n de `specs/SPEC-05.md` (`Redactada (DRAFTED)`):**
     - EspecificaciÃ³n completa en 12 secciones del motor de contrataciÃ³n de Gig fijo y bandeja de ofertas competitivas a la baja (`proposedBudgetUSDInCents <= initialBudgetUSDInCents`), bifurcaciÃ³n entre Camino 1 (`AGREED_PATH_1` con bloqueo pesimista `SELECT ... FOR UPDATE`, cierre en cascada de propuestas competidoras e instanciaciÃ³n atÃ³mica de `TaskOrder` en `PENDING_ESCROW_FUNDING` + `EscrowLedger` en `AWAITING_FUNDS`) y Camino 2 (`DISCREPANCY_CLOSED_PATH_2` manteniendo la publicaciÃ³n en `OPEN_FOR_PROPOSALS`), junto con el clasificador determinista `resolveMvpAiAuditableModality`.
     - Cierre de brechas de seguridad en negociaciÃ³n: prohibiciÃ³n estricta de *Self-Dealing* (`buyerId !== sellerId` y wallets distintas), aislamiento entre freelancers competidores (*Anti-Bid Sniping*), confirmaciÃ³n explÃ­cita de tÃ©rminos (`expectedAmountUSDInCents` y `expectedDeliveryDays`) contra ataques *TOCTOU / Bait-and-Switch*, y congelamiento inmutable de `TaskAcceptanceCriterion`.
  3. **ValidaciÃ³n SDD y ActualizaciÃ³n Documental (Sin implementar cÃ³digo):**
     - EjecuciÃ³n del validador `.agents/skills/taskstream-spec/scripts/check-spec.mjs` sobre `specs/SPEC-04.md` y `specs/SPEC-05.md` con **0 errores bloqueantes**.
     - ActualizaciÃ³n de `specs/README.md` registrando `SPEC-04` y `SPEC-05` como `Redactada (DRAFTED)`.
     - AdiciÃ³n de la **SecciÃ³n 4** al final de `planning/taskboard.md` planteando brechas de seguridad fintech (`SEC-GAP-01` a `SEC-GAP-07`), decisiones abiertas crÃ­ticas (`DEC-OPEN-01` a `DEC-OPEN-05`) y pendientes tÃ©cnicos urgentes (`URG-SYNC-01` a `URG-SYNC-03`).
* **Archivos creados / modificados:**
  * [`specs/SPEC-04.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/SPEC-04.md) *(Creado)*
  * [`specs/SPEC-05.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/SPEC-05.md) *(Creado)*
  * [`specs/README.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/README.md) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/taskboard.md) *(Modificado)*
  * [`AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

```text
Redacta la spec 4 y 5 teniendo en cuenta los documentos de planeaciÃ³n, no rompiendo la jerarquÃ­a que propone el proyecto de fuentes de verdad. Sigue al pie de la letra las reglas de negocio planteada, recuerda que es una fintech por lo cual la seguridad es muy importante, cierra todas las brechas posibles de seguridad en el flujo. Plantea cosas pendientes urgentes o decisiones abiertas que son muy necesarias, brechas de seguridad, etc. ponlo como una secciÃ³n en la parte final del documento taskboard, solo plantea, no implementes nada. Sigue el BDD en la redacciÃ³n de las specs y plantealas de la mejor manera posible para que al momento de implementarlas salga de buena calidad. Recuerda usar las skills necesarias y modificar al final los documentos para que estas specs queden redactadas, no implementes nada
```

---

### Prompt #019 â€” AuditorÃ­a y RediseÃ±o del Modelo de Datos v2: Desacople de `TaskOrder` y EstandarizaciÃ³n en los 3 Pasos (Conceptual, LÃ³gico y FÃ­sico)

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `Backend`, `PlaneaciÃ³n`, `Gobernanza`, `Tests`
* **Resumen de su funcionalidad:**
  1. **Desacople de `TaskOrder` (de 31 a 14 columnas) en `apps/api/prisma/schema.prisma`:** la orden guarda solo partes, origen (`gigId` XOR `proposalId`), tÃ©rminos congelados y estado. Montos 96/4 y las cuatro wallets pasan a `EscrowLedger`; los plazos viven solo en `ScheduledTimerJob` (`startedAt` / `expiresAt` inmutables); las correcciones usadas se derivan de `TaskDeliverable.reviewDecision`. Se eliminan las FK redundantes `AiAdvisorReport.taskOrderId` y `OpenPaymentsTransaction.taskOrderId`. Se crean `PlatformWallet` (custodia y fee del dueÃ±o) y la tabla de referencia `TaskCategoryMediaType`. Todas las relaciones de contratos y dinero pasan a `ON DELETE RESTRICT`.
  2. **Capa fÃ­sica canÃ³nica en `apps/api/prisma/sql/domain_checks.sql` y nueva migraciÃ³n `20261017000000_decouple_task_order`:** `CHECK` de rango `[100, 50_000_000]`, fÃ³rmula entera `floor(total*4/100)` con `::bigint`, anti self-dealing, coherencia de timestamps y duraciÃ³n fija por tipo de reloj; Ã­ndices Ãºnicos parciales (wallet activa, acuerdo Ãºnico por publicaciÃ³n â€” SEC-GAP-01 â€”, una pierna de pago completada y una en curso â€” SEC-GAP-06 â€”, revisiÃ³n pendiente y reloj activo Ãºnicos); triggers de origen e inmutabilidad de la orden, wallets del ledger, relojes, secuencia de revisiones y alcance de IA; vistas `v_task_order_revision_usage`, `v_task_order_active_deadline`, `v_escrow_ledger_settlement` y `v_seller_profile_stats`.
  3. **DocumentaciÃ³n en los 3 pasos:** reescritura de `planning/architecture-overview.md` Â§5 (conceptual con contextos delimitados y reglas R-01..R-12; lÃ³gico con esquema relacional, dependencias funcionales, 1FNâ€“FNBC, desnormalizaciones justificadas, tabla de resoluciÃ³n de los 10 hallazgos de la auditorÃ­a y 14 hallazgos propios; fÃ­sico con convenciones, fÃ³rmula canÃ³nica, catÃ¡logo de `CHECK`, Ã­ndices parciales, triggers, vistas, polÃ­tica de borrado y operaciÃ³n de migraciones).
  4. **Desviaciones justificadas respecto a la auditorÃ­a:** se mantuvo `floor` (no *round half up*) porque `taskboard.md` Â§3 regla 8 es la fuente superior; el vencimiento de la revisiÃ³n vive solo en el reloj (no en `TaskDeliverable`) para tener una Ãºnica fuente de verdad; la orden referencia a su origen (y no al revÃ©s) porque el Marketplace estÃ¡ aguas arriba de la ContrataciÃ³n.
  5. **Contratos y sincronizaciÃ³n:** `money.ts` (constantes de rango y fÃ³rmula entera), `schemas.ts` (`proposalId` en `TaskOrderCardSchema`, `proposedDeliveryDays`, rango de montos, anti self-dealing), mocks y pruebas; `.agents/CONTEXT.md` Â§8.2, `planning/taskboard.md` (regla 8 y SEC-GAP-01..04/06), `planning/pbp-development.md`, `specs/SPEC-01.md` (1.3.0), `specs/SPEC-04.md` (0.2.0), `specs/SPEC-05.md` (0.2.0) y la skill `taskstream-spec`.
  6. **VerificaciÃ³n:** `prisma validate` OK; las 3 migraciones aplicadas en orden sobre PostgreSQL embebido (PGlite) con 45/45 escenarios positivos y negativos; `domain_checks.sql` aplicado sobre el DDL fresco; Vitest de `shared-schemas` 13/13 y `tsc` limpio; `check-spec.mjs` con 0 errores en SPEC-01, SPEC-04 y SPEC-05. No se tocaron `open-payments.service.ts`, `escrow-payment.service.ts` ni claves `Ed25519`.
* **Archivos creados / modificados:**
  * [`apps/api/prisma/schema.prisma`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/apps/api/prisma/schema.prisma) *(Modificado)*
  * [`apps/api/prisma/sql/domain_checks.sql`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/apps/api/prisma/sql/domain_checks.sql) *(Modificado)*
  * [`apps/api/prisma/migrations/20261017000000_decouple_task_order/migration.sql`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/apps/api/prisma/migrations/20261017000000_decouple_task_order/migration.sql) *(Creado)*
  * [`packages/shared-schemas/src/money.ts`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/packages/shared-schemas/src/money.ts) *(Modificado)*
  * [`packages/shared-schemas/src/schemas.ts`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/packages/shared-schemas/src/schemas.ts) *(Modificado)*
  * [`packages/shared-schemas/src/mocks.ts`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/packages/shared-schemas/src/mocks.ts) *(Modificado)*
  * [`packages/shared-schemas/src/index.ts`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/packages/shared-schemas/src/index.ts) *(Modificado)*
  * [`packages/shared-schemas/src/contracts.test.ts`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/packages/shared-schemas/src/contracts.test.ts) *(Modificado)*
  * [`planning/architecture-overview.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/architecture-overview.md) *(Modificado)*
  * [`.agents/CONTEXT.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/.agents/CONTEXT.md) *(Modificado)*
  * [`planning/taskboard.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/taskboard.md) *(Modificado)*
  * [`planning/pbp-development.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/pbp-development.md) *(Modificado)*
  * [`specs/SPEC-01.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/SPEC-01.md) *(Modificado)*
  * [`specs/SPEC-04.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/SPEC-04.md) *(Modificado)*
  * [`specs/SPEC-05.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/specs/SPEC-05.md) *(Modificado)*
  * [`.agents/skills/taskstream-spec/SKILL.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/.agents/skills/taskstream-spec/SKILL.md) *(Modificado)*
  * [`AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/AI_USAGE.md) *(Modificado)*
  * [`promptsAI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/promptsAI_USAGE.md) *(Modificado)*
  * [`prompts/AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/prompts/AI_USAGE.md) *(Modificado)*
* **Texto de Prompt Enviado a la IA (Verbatim):**

````text
A continuaciÃ³n se presenta la auditorÃ­a tÃ©cnica del modelado de datos presente en [`architecture-overview.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/architecture-overview.md#L224-L968), respondiendo puntualmente a cada uno de los aspectos consultados:

---

### 1. Â¿EstÃ¡ bien estandarizado en sus 3 pasos clÃ¡sicos?
**Dictamen: Parcialmente / Incompleto.**

En ingenierÃ­a de bases de datos, el modelado formal requiere 3 pasos secuenciales diferenciados:
1. **Modelo Conceptual:** Entidades puras de negocio, lÃ­mites de contexto y cardinalidades de alto nivel, independientes de la tecnologÃ­a.
2. **Modelo LÃ³gico:** NormalizaciÃ³n rigurosa (1NF, 2NF, 3NF), resoluciÃ³n de dependencias funcionales, claves candidatas y eliminaciÃ³n de dependencias transitivas.
3. **Modelo FÃ­sico:** Tipado concreto del RDBMS (PostgreSQL), DDL, Ã­ndices (`@@index`), constraints de integridad (`CHECK`), estrategias de borrado referencial (`Cascade`, `Restrict`) y mapeos de tablas.

**Hallazgo en el archivo:**
* El documento **comprime y mezcla los pasos 1 y 2**: salta directamente de un diagrama Mermaid (`erDiagram`) a la definiciÃ³n fÃ­sica en [Prisma 6](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/planning/architecture-overview.md#L274-L920) y a los scripts SQL de PostgreSQL.
* Afirma estar en **3NF**, pero no documenta el modelo conceptual ni desglosa la transiciÃ³n lÃ³gica formal. El diagrama de Mermaid es un hÃ­brido entre lÃ³gico y fÃ­sico (ya incluye relaciones dirigidas por claves forÃ¡neas tÃ©cnicas en lugar de relaciones de dominio).

---

### 2. Â¿Existe una *God Entity*?
**Dictamen: SÃ­, latente y en gestaciÃ³n (`TaskOrder` y en menor medida `User`).**

Aunque la secciÃ³n 5.1 sostiene que el modelo estÃ¡ *"libre de God-Entities"*, en la prÃ¡ctica:
* **`TaskOrder` acumula 31 atributos propios y 14 relaciones forÃ¡neas directas**.
  * Absorbe responsabilidades de **cuatro dominios distintos**:
    1. *NegociaciÃ³n y ContrataciÃ³n:* `publicationId`, `proposalId`, `gigId`.
    2. *Finanzas y Escrow:* montos 96/4, monedas origen/destino, referencias a wallets.
    3. *OperaciÃ³n y Plazos:* contadores de revisiones y 9 columnas de marcas de tiempo (`*DeadlineAt`, `*ExpiresAt`, `*StartedAt`).
    4. *InspecciÃ³n e IA:* `aiAuditableModality`, relaciones con `AiAdvisorReport` y `TaskDeliverable`.
* Si bien no llega al extremo de una tabla monolÃ­tica que guarde los mensajes o transacciones dentro de sÃ­ (hubo acierto en extraer `EscrowLedger` y `TaskDeliverable`), **`TaskOrder` actÃºa como un embudo centralizado sobrecargado**, violando el principio de responsabilidad Ãºnica (*Single Responsibility Principle* en agregados DDD).

---

### 3. Â¿Es completamente necesario que `TaskOrder` estÃ© tan acoplada a las demÃ¡s entidades?
**Dictamen: No. Gran parte del acoplamiento es innecesario, redundante o circular.**

1. **Acoplamiento polimÃ³rfico de origen (`publicationId`, `proposalId`, `gigId`):**
   * Si una orden proviene de una oferta (`proposalId`), esa `NegotiationProposal` ya apunta a `publicationId`. Mantener ambas FKs en `TaskOrder` crea una **dependencia redundante y desnormalizada**.
2. **Doble relaciÃ³n con el subsistema de IA (`AiAdvisorReport`):**
   * `AiAdvisorReport` tiene relaciÃ³n 1:1 con `TaskDeliverable`, pero a la vez guarda una clave forÃ¡nea `taskOrderId` directa hacia `TaskOrder`. Es un acoplamiento redundante: la IA audita una *entrega*, no la orden abstracta.
3. **Acoplamiento circular con Transacciones Open Payments:**
   * `OpenPaymentsTransaction` tiene tanto `taskOrderId` como `escrowLedgerId`. Dado que `EscrowLedger` es 1:1 con `TaskOrder`, esta doble vinculaciÃ³n crea un triÃ¡ngulo referencial evitable.
4. **Acoplamiento de Wallets en `TaskOrder` y en `EscrowLedger`:**
   * `TaskOrder` retiene `buyerWalletId` y `sellerWalletId`, mientras que `EscrowLedger` custodia los movimientos financieros y retiene `platformOwnerWalletAddress`. Las wallets transaccionales deberÃ­an pertenecer exclusivamente al agregado financiero (`EscrowLedger`).

---

### 4. Posibles fallos y riesgos detectados en el modelado

1. **Riesgo de *Split-Brain* en tiempos y plazos (MÃºltiples fuentes de verdad):**
   * La expiraciÃ³n de la revisiÃ³n de 32 horas estÃ¡ modelada en 3 sitios distintos:
     - `TaskOrder.currentReviewExpiresAt`
     - `TaskDeliverable.reviewExpiresAt`
     - `ScheduledTimerJob.scheduledFor`
   * Si una actualizaciÃ³n asÃ­ncrona o job de BullMQ falla o reintenta, es muy factible que los 3 valores diverjan, provocando estados inconsistentes en la base de datos.
2. **Regla de 96/4 y colisiÃ³n con centavos indivisibles:**
   * El constraint SQL `chk_task_order_exact_96_4_split` exige que:
     `freelancer_payout_usd_in_cents + platform_fee_usd_in_cents = total_amount_usd_in_cents`.
   * Para montos impares (ej. 1555 centavos: 4% = 62.2, 96% = 1492.8), el modelo de base de datos no especifica una polÃ­tica de redondeo determinista. Si el backend trunca ambos hacia abajo ($62 + 1492 = 1554$), el `CHECK` constraint de PostgreSQL **rechazarÃ¡ la inserciÃ³n y tumbarÃ¡ la transacciÃ³n**.
3. **Inexistencia de constraint fÃ­sico para la regla de *"mÃ¡ximo 1 wallet activa"*:**
   * El comentario en `UserWallet` estipula que solo puede haber una wallet activa por usuario. Sin embargo, Prisma no soporta Ã­ndices condicionales nativos y en la secciÃ³n 5.4 **se omitiÃ³ el DDL de PostgreSQL** para crear el Ã­ndice Ãºnico parcial:
     `CREATE UNIQUE INDEX uq_user_wallets_single_active ON user_wallets (user_id) WHERE is_active = true;`
   * Esto deja la integridad del sistema dependiendo Ãºnicamente del cÃ³digo de aplicaciÃ³n, vulnerable a condiciones de carrera concurrentes.
4. **MÃºltiples rutas de borrado en cascada (*Cascade Cycles*):**
   * `TaskDeliverable` tiene `onDelete: Cascade` hacia `TaskOrder`.
   * `AiAdvisorReport` tiene `onDelete: Cascade` hacia `TaskOrder` **y ademÃ¡s** hacia `TaskDeliverable`.
   * Esto puede generar conflictos o advertencias en motores relacionales al existir mÃºltiples caminos de cascada sobre la misma jerarquÃ­a.

---

### 5. Recomendaciones de mejora

1. **Desacoplar `TaskOrder` aplicando LÃ­mites de Contexto (Bounded Contexts):**
   * **ContrataciÃ³n:** Reemplazar `publicationId`, `proposalId` y `gigId` por un identificador de origen Ãºnico o permitir que `NegotiationProposal` y `Gig` sean los que conozcan el `orderId` resultante, no al revÃ©s.
   * **AuditorÃ­a de IA:** Desvincular `AiAdvisorReport` de `TaskOrder`. La relaciÃ³n natural es estrictamente `TaskDeliverable 1:1 AiAdvisorReport`.
   * **Finanzas:** Mover las referencias a las billeteras de pago (`buyerWalletId`, `sellerWalletId`) al modelo `EscrowLedger`.
2. **Unificar la Fuente de Verdad de los Plazos:**
   * Eliminar las columnas temporales redundantes en `TaskOrder` (`currentReviewExpiresAt`, `currentReviewStartedAt`). Las fechas de inicio y vencimiento de una revisiÃ³n deben residir exclusivamente en la entrega evaluada (`TaskDeliverable`), y el temporizador en `ScheduledTimerJob` debe sincronizarse referenciando a dicha entrega.
3. **Completar las restricciones SQL faltantes:**
   * Incluir formalmente el Ã­ndice parcial de wallet Ãºnica activa en las migraciones SQL.
   * Documentar la fÃ³rmula canÃ³nica de redondeo (ej. *Round half up* en la comisiÃ³n de la plataforma y el remanente exacto al freelancer: `freelancerPayout = total - platformFee`).

Teniendo en cuenta esta auditoria y posibles hallazgos propios que hagas a mejorar, modifica el modelado de datos encontrado en el documento architecture e implementa las mejoras del modelado de datos ya planteada, lo principal es desacoplar la entidad TaskOrder y realizar mejores practicas en el MER. Resuelve incongruencias y posibles fallos con el modelado de datos. Estandariza por completo la base de datos en sus 3 pasos. Ayudate de skills si asÃ­ lo crees conveniente. Y modifica el resto de archivos que se vean relacionados con el modelado de datos
````


---

### Prompt #020 â€” Merge fast-forward de `modelo_datos` â†’ `main`

* **Herramienta de IA utilizada:** `Kiro`
* **Ãrea(s) donde toma lugar:** `Gobernanza`
* **Resumen de su funcionalidad:**
  EjecuciÃ³n del merge de la rama `modelo_datos` hacia `main` sin conflictos (fast-forward). Se integraron 20 archivos del modelo de datos desacoplado: schema Prisma v2, migraciÃ³n SQL `20261017000000_decouple_task_order`, `domain_checks.sql`, paquete `shared-schemas` (money, schemas, mocks, index, contracts.test), `SPEC-04.md`, `SPEC-05.md`, `planning/architecture-overview.md`, `.agents/CONTEXT.md`, `taskboard.md`, `pbp-development.md`, `specs/README.md`, `specs/SPEC-01.md`, `.agents/skills/taskstream-spec/SKILL.md` y archivos de trazabilidad AI. Registro de gobernanza actualizado conforme a `AGENTS.md`.
* **Archivos creados o modificados:** [`AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/saram/OneDrive/Escritorio/HakiSoft-Project(1)/prompts/AI_USAGE.md)
* **Texto literal del prompt enviado:**

```
realiza un merge de la rama modelo_datos hacia la rama main y resuleve cualquier conflicto que haya durante este proceso
```

---

### Prompt #021 â€” Revisar SPEC-04 e implementar el backend

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `Backend`
* **Resumen de su funcionalidad:** Pedido de revisar `SPEC-04` e implementar el backend del Marketplace (`T-F2-BE2-01`). No se escribiÃ³ cÃ³digo: el prompt siguiente pidiÃ³ alinear primero `SPEC-04` y `SPEC-05` con la sesiÃ³n local y retirar Clerk.
* **Archivos creados o modificados:** Ninguno.
* **Texto literal del prompt enviado:**

```
Bien, revisa ahora el Spec 004 y realiza lo correspondiente al Backend
```

---

### Prompt #022 â€” Alinear SPEC-04 y SPEC-05 con la sesiÃ³n local, sin Clerk

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `PlaneaciÃ³n`, `Backend`, `Gobernanza`
* **Resumen de su funcionalidad:** `SPEC-04` y `SPEC-05` pasan a v0.3.0 y siguen en `Redactada (DRAFTED)`. Las rutas autenticadas usan `SessionAuthGuard` de `SPEC-02` (sesiÃ³n HMAC, cookie httpOnly `taskstream_session`, `req.userId` = `User.id`). Se elimina `ClerkAuthGuard`. La sesiÃ³n ausente responde `401 UNAUTHENTICATED`.
* **Archivos creados o modificados:** [`specs/SPEC-04.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/specs/SPEC-04.md), [`specs/SPEC-05.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/specs/SPEC-05.md), [`AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/AI_USAGE.md), [`promptsAI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/promptsAI_USAGE.md), [`prompts/AI_USAGE.md`](file:///c:/Users/sebas/OneDrive/Desktop/Haki-Soft/prompts/AI_USAGE.md)
* **Texto literal del prompt enviado:**

```
Antes de realizar algun spec, revisa el spec 004 y 005 y actualiza segun la nueva condicion y que no se usara clerk
```
### Prompt #023 â€” Reglas permanentes de trabajo de AI-1 (registro local de IA-JORGE; el remoto ya usa el #013 para las skills de Zod y frontend)

Este registro conserva el texto que en la copia local de `IA-JORGE` estaba numerado como Prompt #006. No sustituye al Prompt #006 del remoto, que sigue siendo la lectura del contexto sin modificar archivos.

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `Gobernanza`, `IA`
* **Resumen de su funcionalidad:** Crea la regla permanente `.cursor/rules/ai-only.mdc` para que `AI-1` trabaje solo en los componentes de IA, lea backend y frontend sin modificarlos, use commits cortos en espaÃ±ol (uno por archivo, sin coautor de Cursor), respete `.agents/CONTEXT.md` y limite la implementaciÃ³n a la SPEC autorizada. No descarga ni implementa ninguna SPEC. Graphify no estÃ¡ configurado en el repositorio, asÃ­ que el grafo no se actualizÃ³.
* **Archivos creados o modificados:** [`.cursor/rules/ai-only.mdc`](.cursor/rules/ai-only.mdc) *(Creado)*, [`AI_USAGE.md`](AI_USAGE.md) *(Modificado)*, [`promptsAI_USAGE.md`](promptsAI_USAGE.md) *(Modificado)*, [`prompts/AI_USAGE.md`](prompts/AI_USAGE.md) *(Modificado)*

**Texto Ã­ntegro (verbatim) del prompt enviado:**

```text
# Prompt inicial â€” Reglas de trabajo AI-1

Configura las reglas permanentes de Cursor para este repositorio.

**Repositorio:** `D:\jorge\Projects\Hackaton\Haki-Soft`  
**Rama:** `master`  
**Rol:** AI-1 â€” Desarrollo de inteligencia artificial de TaskStream AI.

## 1. Primera tarea

1. Inspecciona la estructura existente y las reglas actuales de Cursor, si las hay.
2. Crea o actualiza `.cursor/rules/ai-only.mdc` para establecer las reglas descritas a continuaciÃ³n.
3. No descargues ninguna SPEC de GitHub todavÃ­a.
4. No implementes funcionalidades de negocio en esta primera tarea.
5. No modifiques archivos fuera de los estrictamente necesarios para configurar estas reglas.

## 2. Alcance exclusivo de IA

- Trabaja Ãºnicamente en los componentes de inteligencia artificial asignados a AI-1.
- Las carpetas de backend y frontend se pueden leer para comprender contratos, modelos, servicios e integraciones.
- No modifiques archivos de backend ni frontend, aunque detectes oportunidades de mejora.
- Si una integraciÃ³n requiere cambios en esas Ã¡reas, documenta la necesidad y solicita autorizaciÃ³n.
- No implementes funcionalidades que no estÃ©n incluidas en la SPEC autorizada.
- Respeta el `CONTEXT.md` y las decisiones vigentes del proyecto. Si existe una contradicciÃ³n, detente y seÃ±ala el conflicto antes de decidir por cuenta propia.
- No adelantes trabajo de otras SPEC ni incorpores funcionalidades futuras al MVP.

## 3. Reglas de Git

- Los mensajes de commit deben estar escritos en espaÃ±ol.
- Los commits deben ser cortos y describir concretamente el cambio.
- Realiza un commit independiente por cada archivo modificado.
- No incluyas el coautor de Cursor ni lÃ­neas como `Co-authored-by: Cursor`.
- No incluyas cambios ajenos a tu tarea en los commits.
- Antes de modificar archivos, revisa `git status` para preservar el trabajo existente.
- No hagas `push`, no cambies de rama ni reescribas el historial sin autorizaciÃ³n explÃ­cita.
- No crees commits vacÃ­os ni afirmes que un commit fue creado si Git no lo confirmÃ³.

## 4. Graphify y contexto

- Inspecciona cÃ³mo estÃ¡ configurado Graphify en el repositorio y utiliza su flujo existente.
- DespuÃ©s de cada cambio relevante, actualiza el grafo de conocimiento mediante Graphify, siguiendo las instrucciones del proyecto.
- Guarda o actualiza el contexto del proyecto utilizando el mecanismo existente; no inventes comandos ni archivos de contexto nuevos si ya existe un procedimiento establecido.
- MantÃ©n el contexto sincronizado con las decisiones y los cambios reales.
- Si Graphify o el mecanismo de contexto no estÃ¡n disponibles, informa del bloqueo. No simules haberlos actualizado.

## 5. Forma de trabajar

- Antes de implementar una SPEC, identifica su alcance, criterios de aceptaciÃ³n, contratos y archivos afectados.
- Prioriza cambios pequeÃ±os, verificables y compatibles con la arquitectura existente.
- Ejecuta las pruebas pertinentes para los archivos modificados y reporta los resultados reales.
- No ocultes errores, pruebas fallidas ni limitaciones.
- Si falta informaciÃ³n que pueda cambiar la arquitectura o el contrato de IA, formula una pregunta concreta antes de asumir una decisiÃ³n.
- No refactorices ni limpies cÃ³digo fuera del alcance solicitado.

## 6. Primera ejecuciÃ³n

En esta primera ejecuciÃ³n, limita el trabajo a crear o actualizar la regla de Cursor. DespuÃ©s:

1. Muestra el archivo de reglas creado.
2. Resume los cambios realizados.
3. Indica el resultado de Graphify y la actualizaciÃ³n del contexto.
4. Presenta el estado de Git y los commits realizados, si corresponde.
5. No descargues ni implementes ninguna SPEC hasta recibir autorizaciÃ³n explÃ­cita.

**Principio rector:** AI-1 trabaja exclusivamente en IA, respeta los lÃ­mites entre componentes y ejecuta Ãºnicamente el trabajo autorizado.
```

### Prompt #024 â€” Sincronizar el proyecto y completar las SPEC (el usuario lo titulÃ³ Prompt #015)

El nÃºmero `#015` ya identifica, en la bitÃ¡cora remota, la solicitud de implementaciÃ³n de `SPEC-03`. Esta entrada conserva ese registro y numera el mensaje nuevo como `#024`.

* **Resumen de funcionalidad:** Integrar `origin/Backend` en `IA-JORGE` sin Clerk, sin `push` y sin commit; conservar ambas bitÃ¡coras; redactar `SPEC-06` a `SPEC-12` en `Redactada (DRAFTED)` con contratos y frentes BE, FE y AI.
* **Ãrea:** `PlaneaciÃ³n`, `Gobernanza`, `IA`.
* **Archivos:** `specs/SPEC-06.md` a `specs/SPEC-12.md`, `specs/COVERAGE.md`, `specs/README.md`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`.
* **Texto literal del prompt enviado:**

```
# Prompt #015 â€” Sincronizar el proyecto y completar las SPEC de TaskStream AI

## Objetivo

Preparar las especificaciones restantes necesarias para completar el MVP de TaskStream AI, partiendo de las decisiones y el trabajo existentes desde SPEC-00 hasta SPEC-05.

**Orden obligatorio: primero sincronizar el repositorio y resolver conflictos; despuÃ©s analizar el estado actualizado y crear las SPEC faltantes.**

El objetivo es maximizar el tiempo del hackathon y permitir que backend, frontend e IA trabajen en paralelo, de forma asÃ­ncrona, sin bloquearse mutuamente por falta de contratos.

Fases 1 a 9 del mismo mensaje: sincronizaciÃ³n segura sin comandos destructivos ni push; reconstrucciÃ³n del estado real; no reintroducir Clerk si la autenticaciÃ³n vigente es local; matriz de cobertura; SPEC restantes con plantilla oficial y estado de redacciÃ³n; frentes BE, FE y AI con contratos, mocks, criterios independientes y bloqueos reales; sin implementar cÃ³digo, migraciones ni dependencias; Graphify fuera del repositorio; informe final. Criterio de Ã©xito: todas las funcionalidades necesarias para completar el MVP cubiertas por especificaciones coherentes, con contratos definidos y trabajo distribuido. No implementar cÃ³digo ni hacer push.
```

### Prompt #025 â€” Publicar la base comÃºn del hackathon en main (el usuario lo titulÃ³ Prompt #016)

El nÃºmero `#016` ya identifica la pausa pedida en la bitÃ¡cora remota. Esta entrada conserva ese registro y numera el mensaje nuevo como `#025`.

* **Resumen de funcionalidad:** Cerrar el merge de `origin/Backend` en `IA-JORGE` y publicar esa base en `origin/main`, sin integrar `origin/master` y sin implementar negocio.
* **Ãrea:** `Gobernanza`, `PlaneaciÃ³n`.
* **Archivos:** `specs/SPEC-05.md`, `planning/taskboard.md`, `.cursor/rules/ai-only.mdc`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`.
* **Texto literal del prompt enviado:**

```
# Prompt #016 â€” Publicar la base comÃºn del hackathon en main

## Objetivo

Dejar origin/main con la documentaciÃ³n, las SPEC y las decisiones vigentes de TaskStream AI, para que backend, frontend e IA puedan comenzar a trabajar independientemente.

Repositorio: D:\jorge\Projects\Hackaton\Haki-Soft
Rama de trabajo: IA-JORGE
Destino: origin/main

Esta tarea autoriza preparar, validar, integrar y publicar los cambios documentales existentes en main. No autoriza implementar funcionalidades de negocio.

Secciones 1 a 8 del mismo mensaje: inspeccionar el merge pendiente; cerrarlo solo si las bitÃ¡coras conservan el historial local y remoto y SPEC-04/SPEC-05 no reintroducen Clerk; validar SPEC-00 a SPEC-12 en DRAFTED con DEC-OPEN-01 a DEC-OPEN-05 abiertas; publicar en origin/main sin force y solo si main no avanzÃ³; incluir .cursor/rules/ai-only.mdc; excluir backups, cachÃ©s y graphify-out; no integrar origin/master; Graphify solo en la carpeta externa; verificar el hash remoto. Criterio de Ã©xito: origin/main contiene la base documental, las SPEC, la separaciÃ³n BE/FE/AI y las reglas de trabajo, sin perder historial ni introducir artefactos locales.
```


### Prompt #026 â€” Implementar SPEC-04 backend (Marketplace) con harness FE mÃ­nimo

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`, `Tests`
* **Resumen de su funcionalidad:** Verificar que la rama `Backend` coincide con `origin/main` e implementar `SPEC-04` Spec por Spec enfocado en backend: contratos Zod de Marketplace, `MarketplaceModule` NestJS (`/api/v1/marketplace/*`), tests HTTP RF-01..RF-04, y UI mÃ­nima en `/marketplace` para validar el flujo. Idempotencia en memoria (Redis pendiente). Graphify no estÃ¡ en el repositorio.
* **Archivos creados o modificados:** `packages/shared-schemas/src/marketplace.ts`, `packages/shared-schemas/src/marketplace-schemas.test.ts`, `packages/shared-schemas/src/index.ts`, `apps/api/src/modules/marketplace/*`, `apps/api/src/app.module.ts`, `apps/web/app/marketplace/*`, `apps/web/app/api/v1/marketplace/[...path]/route.ts`, `apps/web/src/components/marketplace-harness.tsx`, `apps/web/src/features/web-monetization/web-monetization-head-tag.tsx`, `apps/web/src/components/navbar.tsx`, `specs/SPEC-04.md`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Bien,  primero que todo verifica que la version actual de la rama backend que estamos parados sea la misma que la del main, y tras esto actualmente el proyecto se encuentra realizado hasta el Spec 003, La idea es implementar Spec por Spec pero enfocado en el backend, Cosas a tener en cuenta si el Spec considera o para probarse es necesario de front, genera un front minimo para realizar las pruebas correspondiente a dicho spec y poder validar el flujo de este.

Entonces se realizara de la siguiente manera:

-Inicia un Spec a la vez, solo realiza las tareas de Backed y si para realizar pruebas es necesario un back minimo o minimalista realizalo, para poder probar que cada spec cumpla con lo planeado.
```

### Prompt #027 â€” Modal de auth sobre marketplace sin cambiar de pÃ¡gina

* **Herramienta de IA utilizada:** `Cursor`
* **Ãrea(s) donde toma lugar:** `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Si crear Gig o publicaciÃ³n ocurre sin sesiÃ³n, abrir un overlay compacto (iniciar sesiÃ³n / crear cuenta / recuperar) sobre el contenido actual, sin navegar a otra pestaÃ±a/ruta; reintentar la acciÃ³n tras autenticarse.
* **Archivos creados o modificados:** `apps/web/src/components/auth-gate-modal.tsx`, `apps/web/src/components/auth-form.tsx`, `apps/web/src/components/marketplace-harness.tsx`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
De hecho, el fujo correcto, es que si se realiza alguna de estas dos acciones sin login activo, deberia lanza a pantalla el formulario de iniciar sesion, pero no cargar otra pestaÃ±a directa, si no cargar una pestaÃ±a sobre el contenido actual el cual sera de tamaÃ±o menor con la opcion de iniciar sesion, crear cuenta, recuperar cuenta.
```

### Prompt #028 — Modal post-registro para vincular wallet pública

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Opción 1: tras crear cuenta, overlay de bienvenida que pide la wallet address pública, con enlaces a Interledger Test Wallet / docs y advertencia de no compartir la llave privada. También se abre ante `403 WALLET_NOT_VERIFIED` al crear Gig/publicación.
* **Archivos creados o modificados:** `welcome-wallet-modal.tsx`, `auth-form.tsx`, `auth-gate-modal.tsx`, `marketplace-harness.tsx`, `sign-up/page.tsx`, `AI_USAGE.md`, prompts
* **Texto literal del prompt enviado:**

```
Planteo dos situaciones:

Cuando se cree una cuenta al instante te pida añadir tu wallet y te da el link directo de donde obtener esto para que sea mucho mas facil.

Opcion 2: Que dentro del formulario de registro este lo de añadir la wallet.

Considero que la opcion numero uno es la mas optima, tras usuario crear su cuenta, le salga un cuadro emergente tipo:

"Bienvenido a X plataforma, estamos muy felices de tenerte aqui, ahora estas a un solo paso poder usar nuestra aplicacion( o usa aqui una frase mas amena), solo debes añadir tu wallet publica (Importante no copies ni compartas nunca tu llave privada)."

Su respectivo campo para introducir y de hecho podriamos darle una opcion para que el acceda directo a donde obtener dicha infromacion o intnetar ahorrarle tiempo para el obtener esto.
```

### Prompt #029 — Payment Pointer válido y fix GNAP_HASH_MISMATCH

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`, `Tests`
* **Resumen de su funcionalidad:** Aceptar el Payment Pointer a la izquierda de Edit (`$ilp.interledger-test.dev/…`) sin exigir Register POS; normalizar `$` → `https://`; corregir hash GNAP a Base64URL; redirigir el callback al frontend en lugar de JSON crudo.
* **Archivos creados o modificados:** `packages/shared-schemas/src/wallet-address.ts`, `wallet-address.test.ts`, `idempotency.ts`, `schemas.ts`, `apps/api/src/modules/identity/wallet.controller.ts`, `apps/web/app/onboarding/wallet/page.tsx`, `welcome-wallet-modal.tsx`, `wallet-verification.tsx`, `.env.example`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
2 cosas, Primero la wallet adress solo me la recibe la direccion si le doy a register pos solo de esta manera la plataforma lo considera valido.

Yo pensaba, no se sie es asi pero considere que era la que se encuentra a la izquierda del boton editar esta: $ilp.interledger-test.dev/dolarsito

Otra cosa tras ingresarla, aceptarla y dale a validar en la pagina me redirige a esta interfaz:

{
"code": "GNAP_HASH_MISMATCH"
}

y se queda ahi
```

### Prompt #030 — Fix hash GNAP alineado a Rafiki (Base64 con padding)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Tests`, `Gobernanza`
* **Resumen de su funcionalidad:** El redirect a Open ya funcionaba, pero la verificación fallaba siempre. Causa: Rafiki calcula `digest('base64')` (Base64 estándar con `=`/`+`/`/`), no Base64URL. Se alineó `gnapInteractHash` y se normaliza `+` si el query lo convierte en espacio.
* **Archivos creados o modificados:** `packages/shared-schemas/src/idempotency.ts`, `wallet-address.test.ts`, `apps/api/src/modules/identity/wallet.service.ts`, `identity.http.spec.ts`, `marketplace.http.spec.ts`, `apps/web/app/onboarding/wallet/page.tsx`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Actualmente tenemos un problem, si recibe el nuevo formato de la direccion, pero por ninguna de las 2 opciones logra validar la verificacion, este realiza el salto a la interfaz  de open, tras unos segundos retorna a la aplicacion sin solicitar o interactuar de ninguna manera, y simplemente indica:

"No se pudo completar la verificación
El hash GNAP no coincidió (suele pasar si el challenge expiró o se reutilizó). Inicia de nuevo la verificación.. Puedes reintentar el descubrimiento desde el formulario de abajo."
```

### Prompt #031 — Storefront editable + media (Gig y Publication)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Tests`, `Gobernanza`
* **Resumen de su funcionalidad:** Tras crear Gig/Publicación, redirect a página editable TipTap (Editar/Vista previa), galería máx. 6 imágenes subidas al API local, carrusel autoplay 3s, enlaces label→URL; displayName fijo. SPEC-04 v0.5.0.
* **Archivos creados o modificados:** `page-document.ts`, marketplace module/repos/tests, Prisma migración storefront, `storefront-*.tsx`, rutas gigs/publications detail, BFF multipart, SPEC-04, AI_USAGE, prompts
* **Texto literal del prompt enviado:**

```
Storefront editable + media (Gig y Publication)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.
```

### Prompt #032 — Fix migración Prisma + cerrar storefront

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Gobernanza`
* **Resumen de su funcionalidad:** Corrige `20261017000000_decouple_task_order` (INSERT de `task_category_media_types` antes de FKs), resolve rolled-back, deploy + storefront migration aplicada. Plan storefront cerrado.
* **Archivos creados o modificados:** `apps/api/prisma/migrations/20261017000000_decouple_task_order/migration.sql`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Hazlo, soluciona par que esto funcione admeas termina de implementar lo faltante del plan
```

### Prompt #033 — Validar storefront + iniciar SPEC-05 (backend + harness)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Tests`, `Gobernanza`
* **Resumen de su funcionalidad:** Validó SPEC-04 (tests/smoke). Implementó SPEC-05: contratos Zod negociación, NegotiationsModule (postular, mensajes, Camino 1/2, hire Gig, TaskOrder+EscrowLedger), tests HTTP RF-01..04, harness FE, SPEC-05 → IMPLEMENTED.
* **Archivos creados o modificados:** `packages/shared-schemas/src/negotiations.ts`, `money.ts`, `apps/api/src/modules/negotiations/*`, BFF negotiations, `negotiations-harness.tsx`, `specs/SPEC-05.md`, `planning/taskboard.md`, AI_USAGE, prompts
* **Texto literal del prompt enviado:**

```
Cuando acabes de realizar dicha implementacion y este todo correcto ,valida que todo funcione correctamente, de lo contrario si se genera falla prueba intentar a solucionarlo de nuevo, Eh inicia a realizar el Spec 005, con la misma estructura que aplicamos para el 004, es decir:

-Inicia el spec pero solo uno a la vez, solo realiza las tareas de Backed y si para realizar pruebas es necesario un front minimo o minimalista realizalo, para poder probar que cada spec cumpla con lo planeado, ademas indicame el flujo implementado de ser el caso para realizar dicho flujo y validar que funcione.
```

### Prompt #034 — UX storefront SPEC-04 (portada + categoría + presupuesto)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Frontend`, `Backend`, `Gobernanza`
* **Resumen de su funcionalidad:** Portada horizontal full-bleed bajo navbar (sin carrusel); botones Marketplace / Editar / Vista previa sobre la imagen; tipo de servicio = select de 6 categorías; presupuesto editable en la misma fila; plazo fijo máx. 7 días. PATCH publication + category en update Gig.
* **Archivos creados o modificados:** `cover-banner.tsx`, `storefront-page.tsx`, `marketplace.ts` (UpdatePublication), marketplace service/repos/controller, AI_USAGE, prompts
* **Texto literal del prompt enviado:**

```
Cosas a tener en cuenta referente al Spec 004:

Donde esta actualmente el carrusel, esta parte dejalo pero en vez de ser un carrusel sea la tipica foto esta que es horizontal y ocupa todo el ancho, referente al boton Editar y Vistar previa al ser solo visible por quien crea la poblicacion Ponlos arriba a la derecha sobre la imagen esta, ademas la propia imagen subela que tome desde debajo del Navar, y el link de "<- Marketplace" ponlo arriba a la izquierda pero sobre la imagen y que sea un boton no un texto.

Ademas "Tipo de Servicio" deberia ser una categoria sola y esta no deberia tener nada por defecto, deberia brindarle al usuario la opcion de selecionar una de las 6 vigentes dentro de la Bd.

Ademas en esa misma line de tiipo de servicio, pero mas a la derecha añade el "Presupuesto" y esto lo mismo el usuario debe ser quien establezca los precios de sus servicios.

Referente al tiempo este sera estatico de maximo 7 dias, si el decide completarlo antes va por su parte.
```

### Prompt #035 — Correcciones storefront: select, carrusel, reseñas

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Frontend`, `Backend`, `Tests`, `Gobernanza`
* **Resumen de su funcionalidad:** Corrige contraste del select “Tipo servicio”; elimina el texto críptico “Cobertura IA: IMAGE”; coloca carrusel alto al ~60% del ancho bajo “Más sobre mí” (máx. 6 imgs, autoplay 3s, prev/next); añade sección de reseñas bajo redes con promedio y cards (foto, nombre, estrellas, texto), elegibles solo tras servicio cerrado (entrega o reembolso), una reseña por persona.
* **Archivos creados o modificados:** `storefront-page.tsx`, `gallery-carousel.tsx`, `reviews-section.tsx`, `globals.css`, `marketplace.ts` (schemas reviews), Prisma `MarketplaceReview` + migración, marketplace service/repos/controller/tests, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Correciones:

El dropbox del "Tipo servicio" su texto es inleible es blanco sobre un fondo blanco del propio dropbox

el "Cobertura IA: IMAGE" no se a que se refiere ese texto.

Más sobre mí / cuerpo libre, debajo de este ira el carrusel, en mi mente es un carruse el cual cubrira un 60 % del horizontal y debe ser bastante alto, con la misma logia, maximo de 6 imagenes la cuales se iran cambiando entre ellas cada 3 segundos y la persona tambien puede avanzar o retroceder de manera manual.


Ademas debajo de redes:

Debe ir la seccion de reseñas con:

Calificacion de 1 a 5 estrellas, calificciones promedio, el calificador con su respectivo puntaje. Bajo la politica que una persona solo puede realizar una reseña si se acordo un servicio, sea que el servicio se entrego bien o se realizo un reembolso.

La estructura de esto son, un recuadro donde esta:
Foto de la persona, nombre, calificacion, texto descriptivo.
```

### Prompt #036 — Abanico de imágenes (ref. PruebaAdd)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Sustituye el carrusel lineal del storefront por el abanico de cartas de `PruebaAdd/abanico-cartas.html`, usando las imágenes subidas por el usuario: hover/apertura de vecinas, lightbox con animación desde el slot, tilt 3D al arrastrar. Sin fondo ni estética de naipes de la demo.
* **Archivos creados o modificados:** `gallery-carousel.tsx`, `gallery-carousel.module.css`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Quiero que tomes de referencia el codigo dentro de PruebaAdd y uses ese codigo el cual es un plantamiento de tipo de carrusel pero en vez de cartas, sera las imagenes que el usuario añade, Solo quiero las cartas, animaciones, y funcionabilidades de estos, no el fondo ni esto.

Todo esto para cambiar nuestro carrusel actual.
```

### Prompt #037 — Seed usuario con wallet testnet de compañero

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `DX`, `Gobernanza`
* **Resumen de su funcionalidad:** Script local que fuerza un usuario con billetera `$ilp.interledger-test.dev/sarisml` (HTTPS) en `isVerified` + `isActive` sin GNAP, para probar el flujo SPEC-05 con la testnet del compañero. Si la wallet ya existía (`sara@gmail.com`), se resetea contraseña y se reafirma verificación.
* **Archivos creados o modificados:** `apps/api/scripts/seed-sarisml-user.mjs`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Podrias forzar la creacion de un usuario con la billetera: $ilp.interledger-test.dev/sarisml

La cual es de la test net, no mia pero si de mi compañero para probar dicho flujo
```

### Prompt #038 — SPEC-06 Escrow (backend + harness)

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Tests`, `Gobernanza`, `IA`
* **Resumen de su funcionalidad:** Implementación SPEC-06 solo backend (BE-2): fondeo simulado 100 %, webhook Rafiki idempotente → `ESCROW_LOCKED`, simulate release 96/4 y refund 100 %. Sin reescribir `open-payments.service.ts` / `escrow-payment.service.ts`. Harness mínimo en `/orders/escrow` + BFF. Contratos `EscrowFundingViewSchema`. Tests HTTP en verde.
* **Archivos creados o modificados:** `packages/shared-schemas/src/escrow.ts`, `apps/api/src/modules/escrow/*`, `apps/web/src/components/escrow-harness.tsx`, `apps/web/app/orders/escrow/page.tsx`, BFF `api/v1/orders` y `webhooks/rafiki`, `specs/SPEC-06.md`, `planning/taskboard.md`, `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
Iniciemos ahora con el Spec 06, con la misma estructura de los anteriores:

-Inicia el spec pero solo uno a la vez, solo realiza las tareas de Backed y si para realizar pruebas es necesario un front minimo realizalo, para poder probar que cada spec cumpla con lo planeado, ademas indicame el flujo implementado de ser el caso para realizar dicho flujo y validar que funcione.
```

### Prompt #039 — UI MVP sin JSON/POST en fronts de specs

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Sustituye harnesses con volcado JSON por UI de producto: checkout escrow (`/orders/[taskId]/escrow`), workspace contratar/negociar, CTA Contratar en storefront Gig, avisos humanos en marketplace. Sin mostrar estructura POST ni claves técnicas.
* **Archivos creados o modificados:** `escrow-checkout.tsx`, `negotiations-workspace.tsx`, `api-client.ts`, `storefront-page.tsx`, `marketplace-harness.tsx`, páginas orders/negotiations; eliminados `escrow-harness.tsx` y `negotiations-harness.tsx`; `AI_USAGE.md`, `promptsAI_USAGE.md`, `prompts/AI_USAGE.md`
* **Texto literal del prompt enviado:**

```
referente al front de este spec hazlo para poder vailidar el flujo y que no sea validaciones ni prubas por post, La idea es que tanto este como los anteriores ninguna dato dentro del front se vea en estructura pos, ya que queda mal para el MVP
```

### Prompt #040 — Anti doble-clic, reseñas y confirmación mutua

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Bloqueo single-flight en Crear Gig/publicación; elimina texto de reseñas; añade `sellerConfirmedAt`, bandeja `/activity` para que el freelancer confirme, y checkout que solo permite depositar tras esa confirmación (timers SPEC-09 aún no encolados).
* **Archivos creados o modificados:** `marketplace-harness.tsx`, `reviews-section.tsx`, migración `seller_confirmed_at`, módulo escrow (confirm/activity), `activity-inbox.tsx`, `escrow-checkout.tsx`, contratos `EscrowFundingView`, AI_USAGE/prompts
* **Texto literal del prompt enviado:**

```
Correcciones: 

-Referente crear Gig: Este tarda un poco en tardar, pero el problema no reside en esto, reside en que si yo presiono en ese tiempo de carga el boton 100 veces, se crean 100 ofertas. Deberia solo permitir una peticion a la vez.

-El siguiente mensaje sobra:
"Solo puedes dejar una reseña si ya hubo un servicio acordado con esta persona (entrega o reembolso)."

-Referente al flujo de Checkout de pago:
Le doy a "1. depositar en custodia" que prosigue? por que por ejemplo por la parte del trabajador no hay nada, como una zona de nofiticaciones donde el confirme el trabajo y tras las 2 confirmaciones este se almacene en el Scrow y comiencen los timers.
```

### Prompt #041 — Popup solicitud trabajo + 24h contratador

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Tras contratar Gig, el Buyer ve “solicitud enviada · 24h”; el Freelancer recibe popup forzado (Ver / Más tarde) al cargar o en vivo vía SSE (+ poll). Hub de notificaciones al crear la orden.
* **Archivos creados o modificados:** `work-request-alert.tsx`, layout, navbar, escrow checkout, `seller-notification.hub.ts`, SSE stream API/BFF, shared-schemas deadline 24h, negotiations notify, AI_USAGE/prompts
* **Texto literal del prompt enviado:**

```
Un ejemplo de flujo para el emprendedor, Si algun contratador genera la solicitud, digammos que su flujo llega hasta ahi y le indica, Tu solicitud fue enviada tienes 24h para que acepten tu solicitud, En la interfaz del emprendedor deberiamos forzar una ventana emergente tipo notificacion en plan "Tienes una solicitud nueva de trabajo, Preiciona el boton de ver para saber mas" y su respectivo boton, de hecho al meomento que le contratador genera la petcion el servidor manda insta, por si el emprendedor esta en la plataforma de una se entere, y si esta fuera de ella cuando acceda a la plataforma nada mas cargar le salga, Asi aseguramos que los emprendedores no pierdan sus ofertas y puedan reacionar a tiempo.
```

### Prompt #042 — Flujo contratar: escrow solo al aceptar

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Modal “¿Seguro contratar a X?”; tras confirmar la solicitud queda pendiente sin mover dinero. Cancel buyer / reject seller / 24h → sin envío. Aceptación seller → lock escrow simulado + vínculo de partes. UX checkout/actividad alineada.
* **Archivos creados o modificados:** `hire-confirm-modal.tsx`, `escrow-checkout.tsx`, `activity-inbox.tsx`, `work-request-alert.tsx`, storefront hire, `negotiations-workspace.tsx`, escrow cancel/reject/confirm→lock BE, schemas `CANCELLED`, AI_USAGE/prompts
* **Texto literal del prompt enviado:**

```
Referente al flujo lo considero asi mejor:

Contratador: selecciona emprendedor, le da a pagar, sale pop de "Estas seguro que quieires contrarta a X persona para tu solicitud" el puede confirmar o denegar. Si confirma el envio del dinero al Scrow se congela hasta uno de estos 4 sucesos:

1. el se arrepiente y el dinero nunca se envia.
2. el tiempo de las 24h pasa y el emprendedor nunca responde, el dinero nunca se manda.
3. el emprendedor rechaza, el dinero nunca se manda.
4. el emprendedor acepta y al instante dicho dinero por parte del contratador es enviado al scrow y se genera la logica de times, y se establece entre quienes esta vinculado dicho dinero.
```

### Prompt #043 — Popup amigable, 24h real, workspace chat

* **Herramienta de IA utilizada:** `Cursor`
* **Área(s) donde toma lugar:** `Backend`, `Frontend`, `Gobernanza`
* **Resumen de su funcionalidad:** Popup con buyer + gig + brief; contador 24h en vivo; job auto-cancel; fix reject (migración CANCELLED); workspace post-aceptar con chat, anexos, plazo 7d y contexto.
* **Archivos creados o modificados:** `work-request-alert.tsx`, `order-workspace.tsx`, workspace page, escrow timeout job, OrderWorkspaceService, chat migration, activity/schemas/CONTEXT, AI_USAGE/prompts
* **Texto literal del prompt enviado:**

```
Correciones:

Referente al emergente del emprendedor:

El siguiente texto: "Prueba4 para la vuelta ya tu sabe · $10.00. Si aceptas, el pago entra a escrow al instante. Si rechazas, el dinero nunca se manda. Presiona Ver para decidir." Este mensajo no va, La idea es algo mas amigable tipo: "El usuario X(El que solocita el trabajo) esta interesado en tu publicacion de X(Nombre del gig), Y desea realizar X(Esta es la descripcion que se añade antes de que el contratador acepte el pago)".

referente a la logica de las 24, Esta planteado a añadirse? si es es el caso esperamos, Si no esta planteado añadelo directamente, y en la parte de : "Quedan aprox. 24 h para responder (ventana de 24 h)." cambialo por "Tienes aproximadamente (Un contador real de las 24h) para aceptar el servicio, de lo contrario se le avisara al usuario que no estas interesado."

Por ejemplo probe el boton de rechazar: "Algo salió mal. Inténtalo de nuevo."

Aceptar: "Aceptaste el encargo. El pago del contratador quedó en custodia y quedan vinculadas las partes. Aquí arrancarían los plazos de entrega."

IDEA 3: La idea al aceptar se genera una pestaña en la cual se tendra un chat en vivo entre el emprendedor y el contratador, con un campo de anexar, para añadir las entregas, tambien el contador de 7 dias, para que el siempre tenga presente cuando tiempo tiene, tambien un apartado con el contexto de la solicitud.

Refererente a la idea 3 implementa para tener este flujo listo, si en algun spec futuro se menciona simplemente se adelanto dicho trabajo.
```



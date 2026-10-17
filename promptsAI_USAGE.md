# Registro de Prompts de Construcción ? MERIDIA / TaskStream AI

Bitácora **curada** de prompts usados para construir el producto (planeación, arquitectura, specs, backend, frontend, IA y diseño MERIDIA).

> **Criterio de inclusión:** solo intervenciones con impacto en la construcción del aplicativo o en decisiones de negocio/arquitectura vigentes.  
> **Criterio de exclusión:** ruido operativo (pull/restart, regenerar tokens, pausas, merges sin cambio de producto, seeds locales, órdenes meta sobre esta bitácora).  
> **Forma del texto:** el bloque «Prompt (parafraseado)» resume la instrucción original sin volcar logs, rutas absolutas de máquinas ajenas ni órdenes irrelevantes. Los artefactos resultantes siguen listados.

Herramientas citadas: `Antigravity`, `Cursor`, `Kiro` (según el momento).

---

## Índice

| # | Área | Qué aportó a la construcción |
| -: | --- | --- |
| 1 | Gobernanza / Planeación | Política de IA, resoluciones Q1?Q6, catálogo Open Payments |
| 2 | Planeación | `architecture-overview`, `taskboard`, `pbp-development`, `sdd-process` |
| 3 | Planeación / IA | SDD refinado; IA MVP solo imagen/texto; plazos 7d / 24h / +7d / 32h / 30m |
| 4 | Gobernanza | Skill `taskstream-spec` + skills base del monorepo |
| 5 | Gobernanza | Repo GitHub `Haki-Soft` y colaboradores |
| 6 | Planeación | Reglas de negocio (extensión, Gig fijo, bandeja, wallet única, mediación) |
| 7 | Planeación | Reembolso = muerte de la actividad (sin reapertura) |
| 8 | Planeación | Alinear CONTEXT y planning a esas reglas |
| 9 | Specs / Monorepo | SPEC-00/01 implementados; SPEC-02/03 redactados; scaffold apps/packages |
| 10 | DX / Backend | CLI y MCP Open Payments en `tools/` |
| 11 | Gobernanza | Skills Zod, to-spec y frontend-design |
| 12 | Frontend | Identidad / wallet (SPEC-02; Clerk luego sustituido por sesión local) |
| 13 | Frontend | Motor Lenis + ScrollTrigger + Hero 3D (SPEC-03) |
| 14 | Specs | SPEC-04/05 con BDD y brechas de seguridad |
| 15 | Backend | Modelo de datos v2: desacople de `TaskOrder` |
| 16 | Specs | SPEC-04/05 sin Clerk ? sesión local |
| 17 | Gobernanza / IA | Reglas permanentes AI-1 (`.cursor/rules/ai-only.mdc`) |
| 18 | Specs | SPEC-06 ? SPEC-12 en `DRAFTED` |
| 19 | Backend / Frontend | Marketplace SPEC-04 + harness |
| 20 | Frontend | Auth gate modal sobre marketplace |
| 21 | Frontend | Bienvenida post-registro ? vincular wallet |
| 22 | Backend | Payment Pointer `$ilp?` y hash GNAP (Rafiki / Base64) |
| 23 | Frontend / Backend | Storefront TipTap + media; UX portada/reseñas/abanico |
| 24 | Backend / Frontend | SPEC-05 negociaciones |
| 25 | Backend / Frontend | SPEC-06 escrow, UI humana, flujo 24h y workspace |
| 26 | Frontend | Landing + identidad visual **MERIDIA** (plan, logo, pages) |
| 27 | Frontend | Unificar resto de pantallas al sistema MERIDIA |
| 28 | Frontend | Estabilizar residuals del merge (navbar, alert, escrow checkout) |
| 29 | Gobernanza | README de producto MERIDIA |

---

## Detalle (parafraseado)

### 1 ? Política de IA y marco Open Payments
- **Herramienta:** Antigravity · **Áreas:** Gobernanza, Planeación, Backend, Frontend, IA, Tests  
- **Resultado:** `AGENTS.md`, `AI_USAGE.md`, bitácoras de prompts; CONTEXT con Q1?Q6; catálogo OP/ILP.  
- **Prompt (parafraseado):** Instalar la política de uso de IA del hackathon (herramienta, áreas, archivos tocados, zonas de IA mínima/nula como el servicio de pagos). Registrar prompts. Cerrar Q1?Q6 y documentar herramientas Open Payments / Interledger.

### 2 ? Artefactos rectores de ingeniería
- **Herramienta:** Antigravity · **Áreas:** Planeación, Gobernanza  
- **Resultado:** `planning/architecture-overview.md`, `taskboard.md`, `pbp-development.md`, `sdd-process.md` (modelo 3NF, tareas por rol 2FE/2BE/1IA).  
- **Prompt (parafraseado):** Generar arquitectura (incl. modelo de datos limpio), taskboard, desarrollo fase a fase sin bloquear células, y proceso SDD/BDD alineado a las skills del repo.

### 3 ? Plazos, IA imagen/texto y SDD limpio
- **Herramienta:** Antigravity · **Áreas:** Planeación, IA  
- **Resultado:** SDD sin ruido de skills; CONTEXT/architecture con contrato `AiAdvisorInputContractSchema` y relojes de negocio.  
- **Prompt (parafraseado):** Refinar SDD (impacto MVP, catálogo SPEC-00?12). Acotar IA del MVP a imagen y texto. Alinear arquitectura y tablero al flujo de pagos y plazos.

### 4 ? Skill `taskstream-spec`
- **Herramienta:** Antigravity · **Áreas:** Gobernanza, Planeación  
- **Resultado:** Skill y réplicas multi-agente; validador de specs.  
- **Prompt (parafraseado):** Investigar e instalar skills útiles; adaptar `taskstream-spec` 100 % a TaskStream/MERIDIA.

### 5 ? Repositorio y equipo
- **Herramienta:** Antigravity · **Áreas:** Gobernanza  
- **Resultado:** Repo privado `Sebastian-Tunjuelo/Haki-Soft` + colaboradores write.  
- **Prompt (parafraseado):** Crear el repo del monorepo y añadir al equipo (Samuel-Duque, GeorgeAMS, SaraMLopera, MaicolD0930).

### 6 ? Aclaraciones de negocio (extensión, Gig, wallets)
- **Herramienta:** Cursor · **Áreas:** Planeación  
- **Resultado:** Decisiones cerradas (luego materializadas en CONTEXT).  
- **Prompt (parafraseado):** Responder el cuestionario de producto: extensión solo al vencer; mediación tras 2.ª corrección; Gig a precio fijo vs publicación con bandeja; arranque tras aceptación mutua; una wallet activa; cuenta unificada Cliente/Freelancer.

### 7 ? Reembolso mata la actividad
- **Herramienta:** Cursor · **Áreas:** Planeación  
- **Resultado:** Retiro de reapertura automática (`REFUNDED_AND_REOPENED`).  
- **Prompt (parafraseado):** Confirmar que tras reembolso 100 % la orden muere y el Freelancer queda desligado.

### 8 ? Persistir reglas en SSoT
- **Herramienta:** Cursor · **Áreas:** Planeación, Gobernanza, Backend  
- **Resultado:** CONTEXT, architecture, taskboard, pbp, sdd, validación de specs.  
- **Prompt (parafraseado):** Aplicar todas las aclaraciones a la documentación fuente de verdad y planeación.

### 9 ? Arranque SPEC-00?03 y monorepo
- **Herramienta:** Cursor · **Áreas:** Specs, Frontend, Backend, IA, Tests  
- **Resultado:** `specs/`, `packages/shared-schemas`, `apps/web`, `apps/api`, workspace pnpm/turbo.  
- **Prompt (parafraseado):** Redactar e implementar SPEC-00/01; redactar SPEC-02/03 sin acoplar aún integraciones externas críticas.

### 10 ? Tools Open Payments
- **Herramienta:** Antigravity · **Áreas:** DX, Backend  
- **Resultado:** `tools/open-payments-cli`, `tools/open-payments-mcp`, `tools/README.md`.  
- **Prompt (parafraseado):** Integrar CLI y MCP oficiales de Open Payments para pruebas y DX.

### 11 ? Skills Zod / diseño
- **Herramienta:** Antigravity · **Áreas:** Gobernanza, Frontend, Backend  
- **Resultado:** Skills zod-*, to-spec, frontend-design, shadcn, tailwind; `skills-lock.json`.  
- **Prompt (parafraseado):** Instalar skills de validación Zod, síntesis de specs y diseño UI, articuladas con `taskstream-spec`.

### 12 ? Identidad y billetera (SPEC-02)
- **Herramienta:** Antigravity · **Áreas:** Frontend  
- **Resultado:** Flujos de auth/wallet en `apps/web` (evolución posterior: sesión local en lugar de Clerk).  
- **Prompt (parafraseado):** Implementar SPEC-02 (identidad, modo, verificación de wallet panamericana con Subject Grant).

### 13 ? Scroll y escena 3D (SPEC-03)
- **Herramienta:** Antigravity · **Áreas:** Frontend, Tests  
- **Resultado:** SmoothScrollProvider, HeroScene R3F, tests Vitest, SPEC-03 testeada.  
- **Prompt (parafraseado):** Completar SPEC-03: Lenis + GSAP ticker, canvas aislado `ssr:false`, landing y pruebas en verde.

### 14 ? SPEC-04 y SPEC-05 (borrador BDD)
- **Herramienta:** Antigravity / Cursor · **Áreas:** Specs, Planeación  
- **Resultado:** Specs marketplace/negociación con escenarios y brechas fintech.  
- **Prompt (parafraseado):** Redactar SPEC-04/05 con seguridad, BDD y decisiones abiertas en el taskboard.

### 15 ? Modelo de datos v2
- **Herramienta:** Antigravity / Kiro · **Áreas:** Backend, Planeación  
- **Resultado:** Prisma desacoplado, migraciones, domain checks, schemas compartidos.  
- **Prompt (parafraseado):** Auditar y rediseñar el modelo: evitar God-Entity en `TaskOrder`; formalizar conceptual/lógico/físico.

### 16 ? Specs sin Clerk
- **Herramienta:** Cursor · **Áreas:** Specs, Backend  
- **Resultado:** SPEC-04/05 v0.3+ con `SessionAuthGuard` / `req.userId`.  
- **Prompt (parafraseado):** Alinear marketplace y negociaciones a sesión local (sin Clerk).

### 17 ? Frontera AI-1
- **Herramienta:** Cursor · **Áreas:** Gobernanza, IA  
- **Resultado:** `.cursor/rules/ai-only.mdc`.  
- **Prompt (parafraseado):** Fijar reglas permanentes del rol AI-1 (solo paquete IA; BE/FE con autorización; commits/trazabilidad).

### 18 ? Cerrar catálogo SPEC-06?12
- **Herramienta:** Cursor · **Áreas:** Specs, Planeación  
- **Resultado:** Specs de escrow, entregables, IA, relojes, disputas, deploy en `DRAFTED`.  
- **Prompt (parafraseado):** Tras sincronizar Backend, completar el catálogo de specs restantes sin implementar código aún.

### 19 ? Marketplace implementado (SPEC-04)
- **Herramienta:** Cursor · **Áreas:** Backend, Frontend, Tests  
- **Resultado:** Módulo Nest marketplace, schemas Zod, harness web.  
- **Prompt (parafraseado):** Implementar SPEC-04 backend y harness FE mínimo para validar el contrato.

### 20 ? Auth gate en marketplace
- **Herramienta:** Cursor · **Áreas:** Frontend  
- **Resultado:** Modal login/registro ante 401 sin abandonar la página.  
- **Prompt (parafraseado):** Si no hay sesión al usar marketplace, mostrar auth encima sin navegar fuera.

### 21 ? Onboarding de wallet post-registro
- **Herramienta:** Cursor · **Áreas:** Frontend  
- **Resultado:** Modal de bienvenida + enlaces Test Wallet.  
- **Prompt (parafraseado):** Tras registrarse, guiar a vincular wallet pública Open Payments.

### 22 ? Payment Pointer y GNAP hash
- **Herramienta:** Cursor · **Áreas:** Backend, Frontend, Tests  
- **Resultado:** Normalización `$ilp?`, hash Base64 con padding compatible Rafiki.  
- **Prompt (parafraseado):** Aceptar Payment Pointers y corregir `GNAP_HASH_MISMATCH` alineado a la Test Wallet.

### 23 ? Storefront editable y UX
- **Herramienta:** Cursor · **Áreas:** Frontend, Backend  
- **Resultado:** TipTap/media, portada full-bleed, categoría/presupuesto, carrusel/abanico, reseñas.  
- **Prompt (parafraseado):** Storefront Gig/Publication editable; pulir UX visual y reseñas post-acuerdo.

### 24 ? Negociaciones (SPEC-05)
- **Herramienta:** Cursor · **Áreas:** Backend, Frontend, Tests  
- **Resultado:** Módulo negociaciones + harness.  
- **Prompt (parafraseado):** Validar storefront e implementar SPEC-05 (backend + harness al estilo SPEC-04).

### 25 ? Escrow, 24h y workspace (SPEC-06+)
- **Herramienta:** Cursor · **Áreas:** Backend, Frontend, Tests  
- **Resultado:** EscrowModule, harness, UI sin JSON crudo, popup 24h, aceptar?custodia, chat/workspace.  
- **Prompt (parafraseado):** Implementar custodia: dinero solo al aceptar Freelancer; UI amigable; contador 24h; espacio de trabajo; invariantes 96/4.

### 26 ? Sistema de diseño MERIDIA
- **Herramienta:** Antigravity · **Áreas:** Frontend, Planeación  
- **Resultado:** Plan UI, `<MeridiaPrismLogo />`, tokens claro/oscuro, tipografías, Inicio/Marketplace/Billetera, eliminación de página Modo.  
- **Prompt (parafraseado):** Definir y aplicar la identidad MERIDIA (bocetos, plan maestro, implementación en `apps/web`, usuario unificado Cliente+Freelancer).

### 27 ? MERIDIA en el resto de pantallas
- **Herramienta:** Antigravity · **Áreas:** Frontend  
- **Resultado:** Activity, negociaciones, escrow, workspace, storefronts y modales alineados al design system.  
- **Prompt (parafraseado):** Extender el diseño MERIDIA a todas las páginas que aún conservaban estilos previos.

### 28 ? Estabilización post-merge frontend
- **Herramienta:** Cursor · **Áreas:** Frontend  
- **Resultado:** Fixes en `navbar`, `work-request-alert`, `escrow-checkout` (refs rotas del merge).  
- **Prompt (parafraseado):** Corregir crashes al navegar, al mostrar solicitud de trabajo y al abrir checkout de custodia.

### 29 ? README de producto
- **Herramienta:** Cursor · **Áreas:** Gobernanza, Planeación  
- **Resultado:** `README.md` orientado a MERIDIA (equipo, arquitectura, arranque, OP).  
- **Prompt (parafraseado):** Generar README del proyecto bajo el nombre Meridia, con integrantes, arquitectura y contexto necesario.

---

## Nota de curación

Esta bitácora sustituye el volcado íntegro previo (prompts operativos, duplicados de merge, regeneración de tokens, pausas y meta-órdenes). La construcción del producto queda cubierta por los ítems 1?29. Réplica obligatoria del hackathon: [`prompts/AI_USAGE.md`](./prompts/AI_USAGE.md) (mismo contenido).

# Índice maestro de especificaciones — TaskStream AI

Este directorio es el contrato vivo del MVP. Cada archivo `SPEC-NN.md` delimita alcance, invariantes y criterios BDD antes de que `FE-1`, `FE-2`, `BE-1`, `BE-2` y `AI-1` escriban código en paralelo.

## Documentos rectores

- Única fuente de verdad: [`.agents/CONTEXT.md`](../.agents/CONTEXT.md)
- Arquitectura y modelo 3NF: [`planning/architecture-overview.md`](../planning/architecture-overview.md)
- Proceso SDD: [`planning/sdd-process.md`](../planning/sdd-process.md)
- Fases y trabajo paralelo: [`planning/pbp-development.md`](../planning/pbp-development.md)
- Tareas: [`planning/taskboard.md`](../planning/taskboard.md)
- Plantilla obligatoria: [`_template.md`](./_template.md)

## Ciclo de vida (4 estados)

1. **Redactada (`DRAFTED`)** — contrato escrito; los cinco roles pueden avanzar con mocks.
2. **Implementada (`IMPLEMENTED`)** — el código de la capacidad existe y la spec refleja los ajustes técnicos.
3. **Testeada (`TESTED`)** — las pruebas de la Sección 9 pasan al 100 %.
4. **Aprobada (`APPROVED`)** — solo con confirmación explícita del líder del proyecto. Un agente no puede auto-aprobar.

Ninguna fase se cierra hasta que sus specs lleguen a `Aprobada`. La lógica nuclear de Open Payments (`open-payments.service.ts`, `escrow-payment.service.ts` y claves `Ed25519`) queda marcada `🛡️` y no la genera la IA.

## Tabla maestra

| Spec | Archivo | Título | Fase | Roles | Tareas Asociadas | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SPEC-00` | [`SPEC-00.md`](./SPEC-00.md) | Estructura `specs/` y trazabilidad SDD | Fase 0 | `AI-1` | `T-F0-04` | `Testeada (TESTED)` |
| `SPEC-01` | [`SPEC-01.md`](./SPEC-01.md) | Contratos Zod, mocks y modelo Prisma 6 | Fase 0 | `AI-1`, `FE-1`, `BE-2` | `T-F0-05`, `T-F0-06`, `T-F1-BE2-01`, `T-F1-AI1-01` | `Testeada (TESTED)` |
| `SPEC-02` | [`SPEC-02.md`](./SPEC-02.md) | Identidad local y verificación de billetera | Fase 1 | `FE-1`, `BE-1`, `BE-2` | `T-F1-FE1-01`, `T-F1-BE1-01`, `T-F1-BE2-01` | `Implementada (IMPLEMENTED)` |
| `SPEC-03` | [`SPEC-03.md`](./SPEC-03.md) | Motor visual 3D ligado al scroll | Fase 1 | `FE-1`, `FE-2` | `T-F1-FE2-01`, `T-F1-FE2-02` | `Testeada (TESTED)` |
| `SPEC-04` | [`SPEC-04.md`](./SPEC-04.md) | Catálogo de 6 categorías del MVP, Gigs a precio fijo, Web Monetization y tablón de tareas | Fase 2 | `FE-1`, `FE-2`, `BE-2` | `T-F2-FE1-01`, `T-F2-FE1-03`, `T-F2-FE2-01`, `T-F2-BE2-01` | `Redactada (DRAFTED)` |
| `SPEC-05` | [`SPEC-05.md`](./SPEC-05.md) | Contratación de Gig fijo, bandeja de ofertas a la baja, aceptación mutua y clasificador de modalidad IA | Fase 2 | `FE-1`, `BE-1`, `AI-1` | `T-F2-FE1-02`, `T-F2-BE1-01`, `T-F2-AI1-01` | `Redactada (DRAFTED)` |
| `SPEC-06` | Pendiente de redactar | Escrow 96 % / 4 % y reembolsos 100 % | Fase 3 | `BE-1`, `BE-2`, `FE-1`, `FE-2`, `AI-1` | `T-F3-BE1-01` | Pendiente de redactar |
| `SPEC-07` | Pendiente de redactar | R2 y Protected Preview | Fase 4 | `BE-2`, `FE-2`, `BE-1` | `T-F4-BE2-01`, `T-F4-FE2-01` | Pendiente de redactar |
| `SPEC-08` | Pendiente de redactar | Consejero de IA para imagen y texto | Fase 4 | `AI-1`, `FE-1` | `T-F4-AI1-01` | Pendiente de redactar |
| `SPEC-09` | Pendiente de redactar | Relojes, extensión y correcciones | Fase 5 | `BE-2`, `BE-1`, `FE-1` | `T-F5-BE2-01`, `T-F5-BE1-01` | Pendiente de redactar |
| `SPEC-10` | Pendiente de redactar | Disputas y arbitraje binario | Fase 5 | `BE-1`, `BE-2`, `FE-1` | `T-F5-BE1-02` | Pendiente de redactar |
| `SPEC-11` | Pendiente de redactar | Validación E2E | Fase 5 | Todos | `T-F5-ALL-01` | Pendiente de redactar |
| `SPEC-12` | Pendiente de redactar | Despliegue del MVP | Fase 5 | Todos | `T-F5-ALL-02` | Pendiente de redactar |

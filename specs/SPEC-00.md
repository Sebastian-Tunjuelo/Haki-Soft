# SPEC-00: Estructura del directorio `specs/` y trazabilidad SDD

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-00` |
| **Archivo** | `specs/SPEC-00.md` |
| **Fase de Desarrollo** | `Fase 0 — Gobernanza, estructura specs/ y contratos globales` |
| **Estado del Ciclo SDD** | `Testeada (TESTED)` |
| **Roles Responsables** | `AI-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F0-04` |
| **Intervención Manual / IA Mínima-Nula** | `No aplica` |
| **Dependencias SDD** | `Ninguna` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

`SPEC-00` crea el sistema documental que hace verificable el MVP: cada regla de custodia (96 % / 4 % y reembolsos del 100 %), cada reloj (`7d`, `24h`, `+7d`, `32h`, `30m`) y el límite de la IA a imagen y texto viven en una spec con criterios `Dado / Cuando / Entonces` antes de tocar producto. Sin este índice, Frontend, Backend e IA divergen y la demo no puede demostrar que la pantalla, el dinero y el informe consultivo dicen lo mismo.

### 1.2. En Alcance del MVP

- Carpeta `specs/`, índice `specs/README.md` y plantilla `specs/_template.md`.
- Convención de nombres `SPEC-00.md` a `SPEC-12.md` y ciclo de cuatro estados.
- Obligación de registrar cada cambio de spec en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.
- Validador `node .agents/skills/taskstream-spec/scripts/check-spec.mjs`.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No implementa pagos, el registro, escenas 3D ni `AiAdvisorService`. Esos módulos empiezan en `SPEC-01` en adelante.
- No autoriza pagos por hitos, auditoría de IA sobre video, audio o código, ni la suscripción `Buyer AI Pro Subscription`.
- Un agente no puede marcar `Aprobada (APPROVED)` sin el líder del proyecto.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§0, §2.1, §10), `planning/sdd-process.md` (§3, §4), `planning/pbp-development.md` (§2 Fase 0) y `planning/taskboard.md` (§2, tarea `T-F0-04`).
- **Invariantes del Módulo:**
  1. Toda spec usa las 12 secciones de `specs/_template.md`, en ese orden y con el título exacto.
  2. El estado es exactamente uno de: `Redactada (DRAFTED)`, `Implementada (IMPLEMENTED)`, `Testeada (TESTED)`, `Aprobada (APPROVED)`.
  3. `Aprobada por / fecha` vale `—` hasta la aprobación humana.
  4. `specs/README.md` es el único índice: enlace si el archivo existe, `Pendiente de redactar` si no.
  5. Una spec no contradice `.agents/CONTEXT.md`. Si hiciera falta cambiar una regla, se propone primero en el contexto.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Sin entregable directo en esta spec; consume el índice para saber qué contrato UI llegará en fases posteriores. | Lee `specs/README.md` | No |
| **`FE-2`** | Sin entregable directo en esta spec; consume contratos de `shared-schemas` cuando existan. | Lee `specs/README.md` | No |
| **`BE-1`** | Sin entregable directo en esta spec. La frontera manual de Open Payments se declara en las specs que tocan pagos. | No escribe `open-payments.service.ts` aquí | No |
| **`BE-2`** | Sin entregable directo en esta spec; el modelo Prisma llega en `SPEC-01`. | Lee el índice | No |
| **`AI-1`** | Crea `specs/`, la plantilla, `SPEC-00.md` y el índice `SPEC-00` a `SPEC-12` (`T-F0-04`). | El propio directorio `specs/` es el entregable | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

No aplica en esta especificación. Los esquemas Zod se contratan en `SPEC-01`. Esta spec solo fija que ninguna spec posterior inventa nombres distintos de los de `.agents/CONTEXT.md` §8.2.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

No aplica en esta especificación. El modelo relacional se materializa en `SPEC-01` a partir de `planning/architecture-overview.md` §5.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

No aplica en esta especificación. No hay endpoints de producto. La única verificación automática es el script de estructura de specs.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

No aplica en esta especificación. Los cinco relojes (`INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`) se nombran en specs posteriores y no se programan aquí.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

No aplica en esta especificación. No hay pantallas. El índice documental es la superficie que consulta el equipo.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No aplica en esta especificación. `SPEC-03` fijará `"use client"`, `next/dynamic(..., { ssr: false })` y la prohibición de guardar el scroll en `useState`.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** No hay sesión en esta spec. La gobernanza exige que las specs de pagos (`SPEC-02`, `SPEC-06`, `SPEC-09`, `SPEC-10`) marquen `🛡️` sobre `apps/api/src/modules/open-payments/open-payments.service.ts` y `escrow-payment.service.ts`.
- **Idempotencia e Integridad Criptográfica:** No se calculan claves financieras aquí. La trazabilidad de IA es la integridad de esta fase: prompt íntegro en `promptsAI_USAGE.md` y en `prompts/AI_USAGE.md`, y fila de archivos en `AI_USAGE.md` en el mismo turno.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Directorio de especificaciones y nomenclatura
- **Origen:** `T-F0-04` / `planning/sdd-process.md` §3 / `.agents/CONTEXT.md` §2.1
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un repositorio TaskStream AI sin carpeta `specs/`
  - **Cuando** se ejecuta el arranque de `SPEC-00`
  - **Entonces** existen `specs/README.md`, `specs/_template.md` y `specs/SPEC-00.md`, y el índice reserva los nombres `SPEC-00.md` a `SPEC-12.md`

### `RF-02` — Plantilla de 12 secciones
- **Origen:** `T-F0-04` / `planning/sdd-process.md` §2
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** la plantilla `specs/_template.md`
  - **Cuando** se redacta cualquier `SPEC-NN`
  - **Entonces** el archivo contiene las 12 secciones en el orden de la plantilla, con cabecera de estado y `Aprobada por / fecha` en `—` mientras no esté aprobada

### `RF-03` — Ciclo de cuatro estados sin auto-aprobación
- **Origen:** `.agents/CONTEXT.md` §2.1 / `planning/sdd-process.md` §4
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una spec en `Redactada (DRAFTED)`, `Implementada (IMPLEMENTED)` o `Testeada (TESTED)`
  - **Cuando** un agente cierra una tarea sin confirmación del líder
  - **Entonces** el estado no pasa a `Aprobada (APPROVED)` y la celda de aprobación permanece en `—`

### `RF-04` — Índice maestro sincronizado
- **Origen:** `T-F0-04` / `planning/pbp-development.md` Fase 0
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el índice `specs/README.md`
  - **Cuando** se crea o cambia el estado de una spec
  - **Entonces** la fila correspondiente enlaza el archivo y muestra el estado vigente, o dice `Pendiente de redactar` si el archivo aún no existe

### `RF-05` — Trazabilidad de IA en el mismo turno
- **Origen:** `.agents/CONTEXT.md` §0 / `AGENTS.md` §2
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una creación o edición de archivos en `specs/` hecha por una herramienta de IA
  - **Cuando** termina ese turno
  - **Entonces** `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md` registran la herramienta, el área, los archivos y el texto íntegro del prompt

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-02`, `RF-04` | `Integración` | `node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-00.md` termina con 0 errores y `specs/README.md` enlaza `SPEC-00`. | `AI-1` |
| `TEST-02` | `RF-03` | `Unitaria` | La cabecera no está en `Aprobada (APPROVED)` y `Aprobada por / fecha` es `—`. | `AI-1` |
| `TEST-03` | `RF-05` | `Integración` | Los tres artefactos de gobernanza mencionan los archivos de `specs/` creados en el turno. | `AI-1` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| Falta una de las 12 secciones o está fuera de orden | `SPEC_TEMPLATE_MISMATCH` | `check-spec.mjs` sale con código 1 y la spec no avanza de estado. |
| Se intenta aprobar sin líder | `SPEC_APPROVAL_FORBIDDEN` | Se conserva el estado anterior y la celda de aprobación sigue en `—`. |
| El índice no menciona una spec que ya tiene archivo | `SPEC_INDEX_OUT_OF_SYNC` | El aviso del validador bloquea el cierre del turno hasta actualizar `specs/README.md`. |
| Una spec copia una regla que contradice `CONTEXT.md` | `SSOT_CONFLICT` | Se detiene la redacción y la corrección se propone en `.agents/CONTEXT.md` antes de reescribir la spec. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes.

Decisiones operativas:

1. La herramienta de IA de este turno se registra como `Cursor`, junto a la ya declarada `Antigravity` en `AI_USAGE.md`.
2. `SPEC-04` a `SPEC-12` ya tienen archivo. El estado de cada una vive en su cabecera y en `specs/README.md`.
3. El validador oficial es `.agents/skills/taskstream-spec/scripts/check-spec.mjs`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` + `AI-1` | Redacción inicial de `SPEC-00`: carpeta `specs/`, plantilla de 12 secciones, índice `SPEC-00` a `SPEC-12` y trazabilidad de IA. |
| `1.1.0` | `2026-10-16` | `Testeada (TESTED)` | `Cursor` + `AI-1` | `check-spec.mjs` sobre `SPEC-00` terminó con 0 errores. El índice y la plantilla existen. Sigue sin aprobación del líder. |
| `1.2.0` | `2026-10-17` | `Testeada (TESTED)` | `Cursor` | Revisión hasta `SPEC-07`. La decisión que las dejaba pendientes de redactar queda cerrada: cada spec lleva su propio estado. |

# SPEC-NN: <Título Descriptivo de la Especificación>

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-NN` |
| **Archivo** | `specs/SPEC-NN.md` |
| **Fase de Desarrollo** | `Fase X — <Nombre de la Fase según pbp-development.md>` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `<FE-1, FE-2, BE-1, BE-2, AI-1>` |
| **Tareas Asociadas (`taskboard.md`)** | `<T-FX-XX, ...>` |
| **Intervención Manual / IA Mínima-Nula** | `<Sí (🛡️ BE-1 en Open Payments) / No aplica>` |
| **Dependencias SDD** | `<SPEC-XX / Ninguna>` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)
<Describe en 1-2 párrafos qué problema resuelve esta especificación en el aplicativo final y cómo impacta la experiencia de Buyer, Freelancer o Administrador.>

### 1.2. En Alcance del MVP
- <Elemento concreto 1>
- <Elemento concreto 2>

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)
- <Explicitar qué NO se construye aquí (ej. sin pagos fraccionados por hitos, sin auditoría de IA para video/audio/código en el MVP, sin suscripción Buyer AI Pro Subscription en el MVP).>

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§<secciones>), `planning/architecture-overview.md` (§<secciones>) y `planning/taskboard.md` (§3).
- **Invariantes del Módulo:**
  1. <Invariante 1 con valores exactos: ej. 96% Freelancer / 4% TaskStream, o plazos 7d / 24h / +7d / 32h / 30m, o máximo 2 correcciones globales.>

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | <Alcance Core UI / Negociación / Plazos / Disputas> | <MSW + `packages/shared-schemas`> | No |
| **`FE-2`** | <Alcance 3D `GSAP ScrollTrigger` + `Lenis` / Visores `Protected Preview`> | <Eventos simulados / Blobs locales> | No |
| **`BE-1`** | <Alcance Pagos Open Payments / Negociación / Arbitraje / Guards> | <Sandbox Test Wallet / Interfaces> | <`🛡️ Sí` si toca Open Payments o claves `Ed25519`, o `No`> |
| **`BE-2`** | <Alcance Prisma 3NF / Storage R2 / Marcas de agua / Relojes BullMQ> | <`IEscrowPaymentGateway` / Relojes simulados> | No |
| **`AI-1`** | <Alcance `shared-schemas` / `AiAdvisorService` Imagen y Texto / Tests> | <Fixtures deterministas locales> | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)
<Definición de los esquemas Zod de entrada/salida que desbloquean a los equipos y sus invariantes `.refine(...)`.>

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL
<Tablas de `architecture-overview.md` §5 involucradas, claves foráneas, índices y restricciones `CHECK` SQL aplicables.>

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)
<Tabla o detalle de rutas `/api/v1/...`, método HTTP, rol requerido, schema de request/response y códigos de error en inglés (`UPPER_SNAKE_CASE`).>

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`
<Detalle de colas/relojes (`INITIAL_DELIVERY_7D`, `EXTENSION_RESPONSE_24H`, `EXTENDED_DELIVERY_UP_TO_7D`, `DELIVERY_REVIEW_32H`, `FINAL_CLAIM_WINDOW_30M`), prefijos R2 (`/originals`, `/previews`), operaciones `@interledger/open-payments` o llamadas a `AiAdvisorService`.>

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)
<Páginas de Next.js 15.5 App Router, estados de carga/error/vacío y acciones disponibles para Buyer, Seller o Admin.>

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)
<Reglas de aislamiento `"use client"` + `next/dynamic(..., { ssr: false })`, sincronización `Lenis` + `GSAP ScrollTrigger` vía `useGSAP()` mutando `useRef` a 60–120 FPS con cero `useState` durante el scroll, o comportamiento de los visores protegidos.>

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** <Validación Clerk v6, `UserWallet.isVerified === true`, `PlatformRole.ADMIN` o bloqueo de `/originals` durante las 32h de `IN_REVIEW`.>
- **Idempotencia e Integridad Criptográfica:** <Claves `SHA-256` en `OpenPaymentsTransaction`, verificación de hash GNAP o encapsulamiento `<untrusted_deliverable_artifact>` y pre-check determinista.>

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — <Título conciso del requisito>
- **Origen:** `<Tarea T-FX-XX / CONTEXT.md §X / architecture-overview.md §Y>`
- **Rol(es):** `<FE-1 / FE-2 / BE-1 / BE-2 / AI-1>`
- **Criterios de Aceptación (BDD):**
  - **Dado** <precondición verificable del sistema o estado de la orden>
  - **Cuando** <acción ejecutada por el usuario, worker BullMQ o servicio externo>
  - **Entonces** <resultado observable, transición de estado, persistencia o código de error>

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01` | <Nivel> | <Qué comprueba exactamente la prueba> | <Rol> |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| <Caso límite 1> | `<ERROR_CODE_EN_INGLES>` | <Comportamiento exacto: rollback transaccional, suspensión de job BullMQ, etc.> |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

<Si no existen preguntas abiertas bloqueantes, escribir explícitamente: "Sin preguntas abiertas bloqueantes." Si existen decisiones técnicas operativas concretadas en esta spec, listarlas aquí para revisión del líder.>

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `YYYY-MM-DD` | `Redactada (DRAFTED)` | `Antigravity` + Equipo | Redacción inicial de `SPEC-NN` alineada con `CONTEXT.md`, `architecture-overview.md` y `taskboard.md`. |

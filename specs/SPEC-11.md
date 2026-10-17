# SPEC-11: Validación E2E del MVP

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-11` |
| **Archivo** | `specs/SPEC-11.md` |
| **Fase de Desarrollo** | `Fase 5 — Validación integral` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F5-ALL-01` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ el tramo de Open Payments lo ejecuta y lo revisa BE-1)` |
| **Dependencias SDD** | `SPEC-02`, `SPEC-04`, `SPEC-05`, `SPEC-06`, `SPEC-07`, `SPEC-08`, `SPEC-09`, `SPEC-10` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Esta spec no añade una capacidad nueva. Comprueba, de punta a punta y sin mocks de negocio, que una persona con sesión local puede publicar o contratar, fondear, entregar, revisar, corregir, extender, disputar y cerrar en 96/4 o en reembolso del 100 %. El guion es el de `.agents/CONTEXT.md` §9. Cada equipo llega con sus pruebas de spec ya verdes; aquí se cruzan.

### 1.2. En Alcance del MVP

- Cinco recorridos: Gig fijo, oferta a la baja, entrega con ventana de 30 minutos, segunda corrección con mediación, extensión al vencer y disputa dentro de los 30 minutos (`T-F5-ALL-01`).
- Un recorrido de imagen o texto que exige informe consultivo, y uno de video que exige ausencia de informe.
- Evidencia escrita de cada recorrido: estado final, centavos y si hubo o no llamada al modelo.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se redefinen contratos. Si un recorrido falla por un contrato incompatible, se corrige la spec dueña, no se parcha aquí.
- No se da por verde un recorrido que sustituya Rafiki, R2 o el reloj por un mock.
- No se aprueba el MVP. La aprobación sigue siendo del líder, en cada spec y al final en `SPEC-12`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` §9 y las specs `SPEC-02` a `SPEC-10`.
- **Invariantes del Módulo:**
  1. La sesión del recorrido es la local de `SPEC-02`. No se introduce otro login.
  2. El dinero observado coincide con `splitSingleBlockEscrow`.
  3. Un reembolso deja la actividad muerta.
  4. Un medio que no es imagen ni texto no produce `AiAdvisorReport`.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Recorre checkout, revisión, relojes y consola con la API real. | Hasta el ensayo usa los mocks de su spec; el ensayo final no | No |
| **`FE-2`** | Comprueba visores y bóveda contra URLs reales de preview. | Blobs solo en su suite previa | No |
| **`BE-1`** | Ejecuta el tramo Test Wallet y firma el resultado de dinero. | Sandbox, no mocks de payout | `🛡️ Sí` |
| **`BE-2`** | Relojes con espera real acotada o reloj de prueba solo si el líder acepta comprimir el tiempo en un entorno aparte del de demo | Redis y R2 de ensayo | No |
| **`AI-1`** | Aporta el informe de una entrega de texto y la prueba de que video no llama al proveedor. No modifica `apps/web` ni `apps/api` durante el ensayo. | Proveedor real o el configurado en el entorno de ensayo | No |

### 3.1. Contrato frente a implementación

Esta spec depende de implementación, no solo de contrato. Por eso `T-F5-ALL-01` está en `[WAITING_SYNC]`. Antes de ese punto cada rol sigue con las pruebas de su propia spec. No hay un contrato nuevo que desbloquear aquí.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

No se añaden esquemas. El ensayo usa los ya publicados: `mockTaskOrderCard` solo como referencia de cifras, no como respuesta de la API durante el E2E.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

Se observa `TaskOrder`, `EscrowLedger`, `OpenPaymentsTransaction`, `TaskDeliverable`, `AiAdvisorReport`, `ScheduledTimerJob` y `DisputeCase`. No se cambia el modelo.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

No hay rutas nuevas. El recorrido usa las de `SPEC-02` a `SPEC-10`. La sesión se crea con el registro local.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

El ensayo usa la Test Wallet, un bucket R2 de ensayo y los cinco jobs. `advise` solo corre en el recorrido de imagen o texto. Comprimir 7 días, 32 horas o 30 minutos en el entorno de demo es una decisión de operación del líder; no está cerrada y no se inventa un factor aquí.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

El recorrido humano pasa por alta, wallet, catálogo, contratación, escrow, revisión y, si aplica, disputa. Cada pantalla debe mostrar el mismo `lifecycleStatus` que `GET` de la orden.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

Se comprueba que la bóveda refleja `ESCROW_LOCKED` y que el visor no ofrece el original durante `IN_REVIEW`. Sin animación nueva.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** el ensayo incluye un intento de leer la orden de otro usuario y espera `403`.
- **Idempotencia e Integridad Criptográfica:** repetir el webhook de fondeo no duplica el incoming. El recorrido de texto incluye un artefacto que pide aprobar el pago y espera `promptInjectionDetected = true` sin mover dinero.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Gig y oferta
- **Origen:** `T-F5-ALL-01` / `.agents/CONTEXT.md` §9 escenarios 1a y 1b
- **Rol(es):** `FE-1`, `BE-1`, `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un Gig a 8000 centavos y una publicación con tope de 10000
  - **Cuando** se contrata el Gig y, en otra orden, se acepta una oferta de 8500
  - **Entonces** ambas quedan en `ESCROW_LOCKED` solo después del fondeo, por 8000 y 8500

### `RF-02` — Entrega y 96/4
- **Origen:** `T-F5-ALL-01` / `.agents/CONTEXT.md` §9 escenario 2
- **Rol(es):** `FE-1`, `FE-2`, `BE-2`, `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una entrega de texto dentro del plazo y una revisión aceptada
  - **Cuando** pasan los 30 minutos sin disputa
  - **Entonces** la orden queda `COMPLETED`, el split coincide con la fórmula entera y existe un informe consultivo

### `RF-03` — Segunda corrección
- **Origen:** `T-F5-ALL-01` / `.agents/CONTEXT.md` §9 escenario 3
- **Rol(es):** `FE-1`, `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** dos correcciones ya usadas y la segunda re-entrega
  - **Cuando** el Buyer pide mediación
  - **Entonces** la orden queda `DISPUTED` y el dinero sigue custodiado hasta la decisión del admin

### `RF-04` — Extensión y reembolso
- **Origen:** `T-F5-ALL-01` / `.agents/CONTEXT.md` §9 escenario 4
- **Rol(es):** `BE-1`, `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** siete días sin entrega y sin solicitud de extensión
  - **Cuando** vence `INITIAL_DELIVERY_7D`
  - **Entonces** la orden queda `AUTO_REFUNDED_INITIAL_EXPIRED` y el Freelancer no sigue asignado

### `RF-05` — Disputa en la ventana
- **Origen:** `T-F5-ALL-01` / `.agents/CONTEXT.md` §9 escenario 5
- **Rol(es):** `FE-1`, `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** `FINAL_CLAIM_WINDOW_30M`
  - **Cuando** el Buyer disputa antes de que venza
  - **Entonces** no hay liberación automática y la orden queda `DISPUTED`

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01` | `BDD-E2E` | Dos órdenes reales fondeadas, sin mock de escrow. | `FE-1`, `BE-1` |
| `TEST-02` | `RF-02` | `BDD-E2E` | Texto aceptado, informe presente, 96/4 en el ledger. | `AI-1`, `BE-2`, `FE-2` |
| `TEST-03` | `RF-03` | `BDD-E2E` | Mediación tras la segunda re-entrega. | `FE-1`, `BE-1` |
| `TEST-04` | `RF-04` | `BDD-E2E` | Vencimiento sin extensión y reembolso del 100 %. | `BE-2`, `BE-1` |
| `TEST-05` | `RF-05` | `BDD-E2E` | Disputa dentro de los 30 minutos cancela la liberación. | `FE-1`, `BE-1` |

Estas pruebas no se ejecutan en el turno de redacción. `T-F5-ALL-01` sigue en espera de las implementaciones.

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| La Test Wallet no está disponible | `E2E_WALLET_UNAVAILABLE` | El recorrido se marca bloqueado. No se simula el incoming. |
| Un recorrido deja la orden a medias | `E2E_ABORTED` | Se anota el último estado. No se reutiliza esa orden para otro escenario. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sigue abierto cómo comprimir 7 días, 32 horas y 30 minutos en la demo. Hasta que el líder lo diga, el ensayo no acorta esos plazos por su cuenta. `DEC-OPEN-01`, `DEC-OPEN-02` y `DEC-OPEN-03` pueden impedir cerrar `RF-01` y `RF-04` si cambian el arranque o el instante de la extensión. No se cierran aquí.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-11`: cinco recorridos E2E alineados con `CONTEXT.md` §9, sin contratos nuevos. |

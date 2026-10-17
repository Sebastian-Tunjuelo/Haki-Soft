# SPEC-07: Originales en R2 y Protected Preview

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-07` |
| **Archivo** | `specs/SPEC-07.md` |
| **Fase de Desarrollo** | `Fase 4 — Storage R2 y Protected Preview` |
| **Estado del Ciclo SDD** | `Implementada (IMPLEMENTED)` |
| **Notas de implementación** | Upload local, preview con marca y guard del original. R2, `sharp` y los seis visores de `T-F4-FE2-01` siguen diferidos. No pasa a `Testeada`. |
| **Roles Responsables** | `BE-2`, `FE-2`, `BE-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F4-BE2-01`, `T-F4-BE2-02`, `T-F4-FE2-01`, `T-F4-BE1-01` |
| **Intervención Manual / IA Mínima-Nula** | `No aplica` |
| **Dependencias SDD** | `SPEC-05`, `SPEC-06` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

El Freelancer sube el original directo a R2. Durante las 32 horas de `IN_REVIEW` el Buyer solo ve el derivado con marca de agua. El original se desbloquea cuando la orden entra en `FINAL_CLAIM_WINDOW_30M`, por aceptación expresa o por silencio de las 32 horas. Esa regla de desbloqueo es de `BE-1`. La generación del derivado es de `BE-2`. Los seis visores son de `FE-2`.

### 1.2. En Alcance del MVP

- Presigned URL de subida a `/originals/{taskId}/{revision}/`. Sin límite de peso en el MVP.
- Worker `sharp` / `fluent-ffmpeg` que escribe `/previews/{taskId}/{revision}/`.
- Seis visores: imagen, texto truncado al 30 %, árbol de código al 20 %, tabla truncada, video 360p y audio 64 kbps.
- Guard que niega el original mientras `lifecycleStatus` es `IN_REVIEW` o `REVISION_REQUESTED`.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se llama al modelo de IA. El informe consultivo es `SPEC-08`.
- No se acepta ni se rechaza la entrega. Los botones de revisión son `SPEC-09`.
- No se decide el pago. Eso sigue en `SPEC-06` cuando lo dispare `SPEC-09` o `SPEC-10`.
- `FE-1` no tiene entregable en esta spec. El panel que muestra el informe es `SPEC-08`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§7) y `planning/taskboard.md` (§3 regla 1).
- **Invariantes del Módulo:**
  1. El original no es público durante `IN_REVIEW`.
  2. `revision` es un entero `0..2`, alineado con el máximo de dos correcciones.
  3. Un objeto de 0 bytes no genera preview (`EMPTY_DELIVERABLE`).
  4. La extensión debe pertenecer a `expectedMediaType` de la orden. Si no, no hay URL de subida.
  5. Un original `.svg` de `IMAGE_RASTER_VECTOR` se acepta. El preview es un raster con marca de agua. No se sirve el SVG crudo como HTML.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Sin pantalla propia. Consume la URL de preview que publique `SPEC-08`. | No bloquea | No |
| **`FE-2`** | Seis visores (`T-F4-FE2-01`). | Blobs locales y `DeliverablePreviewViewSchema` | No |
| **`BE-1`** | Guard del original (`T-F4-BE1-01`). | Doble de almacenamiento en memoria | No |
| **`BE-2`** | Presign y worker de marca de agua (`T-F4-BE2-01`, `T-F4-BE2-02`). | MinIO o R2 de prueba, sustituible por un store en memoria en la suite | No |
| **`AI-1`** | Sin modelo y sin archivo en `apps/api`. El pre-check de bytes y extensión que `SPEC-08` necesita se nombra aquí para no duplicarlo: `assertDeliverablePrecheck` en `packages/shared-schemas`. | Fixture de 0 bytes | No |

### 3.1. Contrato frente a implementación

`FE-2` desarrolla los visores con un blob y un `mimeType` del mock. No espera a que R2 esté desplegado. `BE-2` puede generar el derivado sin la UI. `BE-1` prueba el guard con un estado de orden fixture. La unión es `GET /api/v1/orders/:taskId/deliverables/:deliverableId/preview`.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

```typescript
export const CreateDeliverableUploadSchema = z.object({
  taskId: z.string().uuid(),
  revisionNumber: z.number().int().min(0).max(2),
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1),
  fileExtension: z.string().min(1).max(12),
});

export const DeliverablePreviewViewSchema = z.object({
  deliverableId: z.string().uuid(),
  revisionNumber: z.number().int().min(0).max(2),
  previewUrl: z.string().url(),
  originalAvailable: z.boolean(),
  mediaType: DeliverableMediaTypeEnum,
});
```

`assertDeliverablePrecheck({ fileSizeBytes, extensionAllowed })` devuelve `{ nonEmptyFile, extensionAllowed, failureReasons }`. Un mock de visor no necesita R2: `{ previewUrl: 'https://example.test/preview.png', originalAvailable: false }`.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

`TaskDeliverable` guarda la clave del objeto, el checksum, `revisionNumber` y el estado del preview. No guarda el binario. `maxFileSizeBytes` sigue en `null`, como ya fija `SPEC-01`.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

Sesión local (`SessionAuthGuard`). No hay login con Clerk.

| Método y ruta | Guardas | Respuesta | Errores |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/orders/:taskId/deliverables/uploads` | Seller de la orden, wallet verificada | `201` `{ uploadUrl, deliverableId }` | `403 NOT_ORDER_SELLER`, `400 EXTENSION_NOT_ALLOWED` |
| `POST /api/v1/orders/:taskId/deliverables/:deliverableId/complete` | Seller | `202` preview en curso | `400 EMPTY_DELIVERABLE` |
| `GET /api/v1/orders/:taskId/deliverables/:deliverableId/preview` | Buyer o Seller | `DeliverablePreviewViewSchema` | `404 DELIVERABLE_NOT_FOUND` |
| `GET /api/v1/orders/:taskId/deliverables/:deliverableId/original` | Buyer o Seller, y orden en `FINAL_CLAIM_WINDOW_30M` o posterior no reembolsada | URL corta del original | `403 ORIGINAL_LOCKED` |

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

Cola `DELIVERABLE_PREVIEW`. El worker lee el original privado y escribe el derivado. Imagen: máximo 720 px y texto de marca "TaskStream AI". Video: fragmento 360p. Audio: 64 kbps. Texto y datos: recorte. Código: árbol más 20 % del primer archivo de texto. No hay Open Payments. No hay `AiAdvisorService`.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

No aplica en esta especificación. `FE-1` monta estos visores dentro del panel de `SPEC-08` y de la revisión de `SPEC-09`, consumiendo el mismo `DeliverablePreviewViewSchema`.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No hay escena de scroll en el visor. Cada visor es un Client Component. Estados de UI: vacío, generando, listo, original bloqueado, original disponible. El visor de video y el de audio no ofrecen descarga del original mientras `originalAvailable` es falso.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** la URL prefirmada de subida expira y solo vale para esa clave. La URL del original no se emite si el estado no es la ventana final o un estado posterior distinto de reembolso.
- **Idempotencia e Integridad Criptográfica:** completar dos veces el mismo `deliverableId` no encola dos workers. El checksum SHA-256 del objeto se guarda en `TaskDeliverable`. El contenido del archivo no entra en un prompt en esta spec.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Subida directa del original
- **Origen:** `T-F4-BE2-01` / `.agents/CONTEXT.md` §7.1
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden en `ESCROW_LOCKED` y el Seller con sesión
  - **Cuando** pide la URL de subida de un `.png` permitido
  - **Entonces** recibe una URL prefirmada hacia `/originals/{taskId}/0/` y el objeto no queda público

### `RF-02` — Preview con marca
- **Origen:** `T-F4-BE2-02` / `.agents/CONTEXT.md` §7.2
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un original de imagen con tamaño mayor que 0
  - **Cuando** termina el worker
  - **Entonces** existe un derivado en `/previews/{taskId}/{revision}/` con marca de agua y lado largo de como máximo 720 px

### `RF-03` — Original bloqueado en revisión
- **Origen:** `T-F4-BE1-01` / `.agents/CONTEXT.md` §7.1
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una orden en `IN_REVIEW`
  - **Cuando** el Buyer pide el original
  - **Entonces** la API responde `403 ORIGINAL_LOCKED` y la preview sigue disponible

### `RF-04` — Seis visores
- **Origen:** `T-F4-FE2-01` / `.agents/CONTEXT.md` §7.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un `DeliverablePreviewViewSchema` con `originalAvailable = false`
  - **Cuando** se renderiza cada uno de los seis tipos
  - **Entonces** el visor muestra el derivado y no ofrece la descarga del original

### `RF-05` — Pre-check determinista compartido
- **Origen:** `.agents/CONTEXT.md` §6.3 / frontera con `SPEC-08`
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un archivo de 0 bytes o una extensión fuera de la orden
  - **Cuando** se ejecuta `assertDeliverablePrecheck`
  - **Entonces** `nonEmptyFile` o `extensionAllowed` es falso y `failureReasons` no está vacío

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-05` | `Unitaria` | `assertDeliverablePrecheck` en `packages/shared-schemas`, sin R2. | `AI-1` |
| `TEST-02` | `RF-01`, `RF-02` | `Integración` | Presign y un derivado de imagen con store de prueba. | `BE-2` |
| `TEST-03` | `RF-03` | `Integración` | `IN_REVIEW` niega el original; `FINAL_CLAIM_WINDOW_30M` lo permite. | `BE-1` |
| `TEST-04` | `RF-04` | `Unitaria` | Los seis visores con blobs locales y `originalAvailable = false`. | `FE-2` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| El worker falla a mitad del derivado | `PREVIEW_GENERATION_FAILED` | El original sigue privado. Se puede reencolar el mismo `deliverableId`. |
| Revisión 3 cuando ya hay 2 | `REVISION_LIMIT_REACHED` | No hay URL de subida. El límite lo confirma `SPEC-09`. |
| Objeto borrado en R2 antes del preview | `ORIGINAL_OBJECT_MISSING` | No se marca la entrega como lista para revisión. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes para construir presign, preview y visores. El desbloqueo del original usa el estado `FINAL_CLAIM_WINDOW_30M` ya cerrado en `.agents/CONTEXT.md` §7.1. Quien dispara ese estado es `SPEC-09`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-07`: R2, seis previews, guard del original y pre-check puro para `AI-1`. |
| `0.2.0` | `2026-10-17` | `Implementada (IMPLEMENTED)` | `Cursor` | Backend `DeliverablesModule`: upload local (multipart), complete → preview SVG con marca + `IN_REVIEW`, guard `ORIGINAL_LOCKED`, simular `FINAL_CLAIM_WINDOW_30M`. Contratos Zod + `assertDeliverablePrecheck`. Harness `/orders/[taskId]/deliverables`. Tests HTTP RF-01..RF-03. Sin R2/sharp reales ni seis visores FE-2. |
| `0.2.1` | `2026-10-17` | `Implementada (IMPLEMENTED)` | `Cursor` | Celda de estado exacta. El original `.svg` de imagen se acepta y el preview se rasteriza. R2, `sharp` y `T-F4-FE2-01` siguen diferidos. |

# SPEC-04: Catálogo de 6 categorías del MVP, Gigs a precio fijo, Web Monetization y tablón de tareas

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-04` |
| **Título del Módulo** | Catálogo de 6 categorías del MVP, Gigs a precio fijo, Web Monetization y tablón de tareas |
| **Fase del Roadmap** | Fase 2 — Marketplace de 6 Categorías, Gigs Fijos y Negociación a la Baja |
| **Roles Propietarios** | `FE-1`, `FE-2`, `BE-2` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F2-FE1-01`, `T-F2-FE1-03`, `T-F2-FE2-01`, `T-F2-BE2-01` |
| **Dependencias Previas** | `SPEC-00`, `SPEC-01`, `SPEC-02`, `SPEC-03` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Última Actualización** | `2026-10-16` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo Ejecutivo
Especificar la arquitectura técnica, los contratos de validación Zod, las invariantes de seguridad financiera y los escenarios BDD del **Marketplace de 6 Categorías del MVP (`MarketplaceModule`)**, abarcando:
1. El catálogo estructurado de **Gigs a precio fijo** publicados por Freelancers (`Seller Mode`) con criterios de aceptación por defecto y plazos de 1 a 7 días.
2. El **Tablón de Publicaciones de Tareas (`ClientTaskPublication`)** creadas por Clientes (`Buyer Mode`) con presupuesto tope (`initialBudgetUSDInCents`), plazo inicial (`1..7` días), criterios preliminares y cancelación controlada previa a la aceptación mutua.
3. La inyección segura del estándar **W3C Web Monetization (`<link rel="monetization">`)** en los perfiles públicos y páginas de detalle de Gigs de los Freelancers verificados.
4. La experiencia visual inmersiva de exploración de categorías mediante **GSAP `ScrollTrigger.batch()` y `@react-three/fiber`** a 60–120 FPS sin bloqueo del hilo principal.

### 1.2. Límites del Módulo (In-Scope vs. Out-of-Scope)
- **Dentro del alcance (In-Scope):**
  - Endpoints REST, casos de uso y persistencia 3NF en `apps/api/src/modules/marketplace/` (`BE-2`) para listar las 6 categorías oficiales con su mapeo determinista de medio e indicador de cobertura del Consejero de IA, CRUD de `Gig` (con precio fijo no negociable) y ciclo de vida de `ClientTaskPublication` (`OPEN_FOR_PROPOSALS` y transición segura a `CANCELLED`).
  - Vistas de catálogo de 6 categorías, tarjetas de Gigs con distintivo de modalidad auditable por IA (`IMAGE` / `TEXT` vs. revisión humana + determinista), formularios de creación/edición de Gigs y formulario de publicación de tareas con tope (`FE-1`).
  - Renderizado seguro en Server Components de la etiqueta `<link rel="monetization" href="...">` vinculada exclusivamente a la `UserWallet` activa y verificada del Freelancer cuando `SellerProfile.webMonetizationEnabled === true` (`FE-1`).
  - Transiciones espaciales 3D entre las 6 categorías en el explorador del Marketplace e integración con `ScrollTrigger.batch()` para la grilla de tarjetas (`FE-2`).
- **Fuera del alcance (Out-of-Scope):**
  - La bandeja de propuestas competitivas (`NegotiationProposal`), el hilo de mensajes de negociación (`NegotiationMessage`), la aceptación mutua (`AGREED_PATH_1`), el cierre por discrepancia (`DISCREPANCY_CLOSED_PATH_2`) y la instanciación de `TaskOrder` + `EscrowLedger`, los cuales pertenecen a `SPEC-05`.
  - La cotización FX y bloqueo de fondos en Open Payments / Rafiki, que corresponden a `SPEC-06`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

| ID Regla | Origen SSoT | Descripción de la Invariante | Impacto en `SPEC-04` |
| :--- | :--- | :--- | :--- |
| **`INV-04-01`** | `CONTEXT.md` §4.1, §7.2 | **Catálogo Cerrado de 6 Categorías y Correspondencia 1:1 con `DeliverableMediaType`:** Las únicas categorías válidas son `DIGITAL_MARKETING` (`DATA_CAMPAIGN`), `GRAPHICS_AND_DESIGN` (`IMAGE_RASTER_VECTOR`), `PROGRAMMING_AND_TECH` (`CODE_ARCHIVE`), `TECHNICAL_WRITING_TRANS` (`DOCUMENT_TEXT`), `VIDEO_AND_ANIMATION` (`VIDEO_STREAM`) y `MUSIC_AND_AUDIO` (`AUDIO_TRACK`). | El servidor rechaza con `422 CATEGORY_MEDIA_TYPE_MISMATCH` cualquier `Gig` o `ClientTaskPublication` cuyo `expectedMediaType` o `allowedExtensions` no corresponda a la matriz canónica de su `category`. |
| **`INV-04-02`** | `CONTEXT.md` §5.1.A, `taskboard.md` §3 Regla 3 | **Gigs a Precio Fijo e Innegociable:** Todo `Gig` publicado por un Freelancer define un `priceUSDInCents` entero positivo (`>= 100` y `<= 50_000_000`, es decir, entre `$1.00 USD` y `$500,000.00 USD`) y un `initialDeliveryDays` entre `1` y `7` días. Su precio jamás admite regateo. | `Gig` expone precio cerrado en centavos; los formularios y endpoints de `Gig` no incluyen campos de contraoferta ni rangos de presupuesto. |
| **`INV-04-03`** | `CONTEXT.md` §5.1.B, `taskboard.md` §3 Regla 4 | **Publicaciones de Buyer con Presupuesto Tope y Cancelación Condicional:** Una `ClientTaskPublication` nace en `OPEN_FOR_PROPOSALS` con `initialBudgetUSDInCents` (`>= 100` y `<= 50_000_000`) e `initialDeliveryDays` (`1..7`). El Buyer puede cancelarla (`CANCELLED`) **únicamente** mientras siga en `OPEN_FOR_PROPOSALS` (antes de formalizar la aceptación mutua). | La transición `OPEN_FOR_PROPOSALS -> CANCELLED` se ejecuta mediante actualización condicional atómica en base de datos; si la publicación ya está en `AGREED_AND_LOCKED`, retorna `409 PUBLICATION_ALREADY_LOCKED`. |
| **`INV-04-04`** | `CONTEXT.md` §2.3, `SPEC-02` | **Billetera Open Payments Verificada Obligatoria (`WalletVerifiedGuard`):** Ningún usuario puede publicar o activar un `Gig` ni crear una `ClientTaskPublication` sin poseer una `UserWallet` con `isVerified = true` e `isActive = true`. | Todos los endpoints de mutación en `MarketplaceController` aplican `ClerkAuthGuard` + `WalletVerifiedGuard` y extraen la identidad del actor desde `req.user.id`. |
| **`INV-04-05`** | `CONTEXT.md` §1.1, §8.1 | **Seguridad de W3C Web Monetization (`<link rel="monetization">`):** La etiqueta de micropagos directos solo se emite si `SellerProfile.webMonetizationEnabled === true` y su atributo `href` se resuelve en servidor desde la única `UserWallet` activa y verificada (`https://`) del Freelancer. | Prohibido permitir que el usuario ingrese una URL libre para Web Monetization distinta de su `UserWallet` verificada contra Rafiki (prevención de desvío de micropagos y XSS). |
| **`INV-04-06`** | `CONTEXT.md` §4.1, §6.1 | **Transparencia de Cobertura del Consejero de IA en el Catálogo:** Solo `GRAPHICS_AND_DESIGN` (`IMAGE_RASTER_VECTOR` → `IMAGE`) y `TECHNICAL_WRITING_TRANS` (`DOCUMENT_TEXT` → `TEXT`) cuentan con auditoría semántica/visual del Consejero de IA en el MVP; las 4 restantes operan con validación determinista + revisión humana. | Cada tarjeta de categoría, Gig y publicación muestra explícitamente la insignia de cobertura (`AI Advisor: Imagen/Texto` vs. `Validación Determinista + Revisión Humana`). |

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

### 3.1. Asignación de Responsabilidades y Fronteras de Directorio

| Rol | Tareas Asignadas (`taskboard.md`) | Directorios y Archivos de su Propiedad Exclusiva | Responsabilidad en esta Spec | Entregable Verificable |
| :--- | :--- | :--- | :--- | :--- |
| **`FE-1`** | `T-F2-FE1-01`, `T-F2-FE1-03` | `apps/web/src/app/(marketplace)/`, `apps/web/src/features/marketplace/components/`, `apps/web/src/features/marketplace/hooks/`, `apps/web/src/features/web-monetization/` | UI del catálogo de 6 categorías, tarjetas y detalle de Gigs a precio fijo, formulario de creación/edición de Gig (`Seller Mode`), formulario y tablón de `ClientTaskPublication` (`Buyer Mode`), y componente SSR `<WebMonetizationLink />` (`<link rel="monetization">`). | Vistas responsivas tipadas con `@taskstream/shared-schemas` y tests de componentes en Vitest. |
| **`FE-2`** | `T-F2-FE2-01` | `apps/web/src/canvas/scenes/CategoryShowcaseScene.tsx`, `apps/web/src/animations/marketplaceBatch.ts` | Escena 3D de transición espacial por categoría seleccionada (`@react-three/fiber` + `@react-three/drei`) y animación escalonada de tarjetas del catálogo con `ScrollTrigger.batch()` + `useGSAP()`. | Escena 3D aislada con `next/dynamic(..., { ssr: false })` a 60–120 FPS y cleanup determinista. |
| **`BE-1`** | *(Sin tarea directa; consumidor en `SPEC-05`)* | `apps/api/src/modules/negotiations/` (solo lectura de interfaces exportadas por `MarketplaceModule`) | Consumir en `SPEC-05` los servicios de consulta/bloqueo de `Gig` y `ClientTaskPublication` exportados por `BE-2`. | Sin modificación de archivos en `SPEC-04`. |
| **`BE-2`** | `T-F2-BE2-01` | `apps/api/src/modules/marketplace/`, `packages/shared-schemas/src/` (extensión aditiva de DTOs de Marketplace) | Implementación de `MarketplaceModule`, `GigsService`, `PublicationsService`, validación canónica de las 6 categorías/extensiones, paginación por cursor, guardas de propiedad (`Ownership`) y transacción de cancelación previa al acuerdo. | Endpoints `/api/v1/marketplace/*` documentados y suite de integración Supertest + Vitest. |
| **`AI-1`** | *(Sin tarea directa; provee helper en `shared-schemas`)* | `packages/shared-schemas/src/modality.ts` | Proveer la función pura `resolveMvpAiAuditableModality(expectedMediaType)` para que `BE-2` y `FE-1` expongan la insignia de cobertura de IA en catálogo sin acoplarse al módulo `ai-advisor`. | Helper puro 100 % determinista cubierto por tests unitarios. |

### 3.2. Orden de Congelación de Contratos y Mocks
1. **Día 1 (Congelación de Contratos):** `BE-2` y `FE-1` acuerdan los esquemas Zod aditivos en `packages/shared-schemas` (`GigSchema`, `CreateGigInputSchema`, `UpdateGigInputSchema`, `CreatePublicationInputSchema`, `MarketplaceCategoryCatalogItemSchema` y `CATEGORY_MEDIA_CONSTRAINTS_MAP`) y sus fixtures en `packages/shared-schemas/src/mocks.ts`.
2. **Trabajo Simultáneo sin Bloqueo:**
   - `FE-1` construye las páginas y formularios de Marketplace e inyección de `<link rel="monetization">` consumiendo los mocks tipados de `@taskstream/shared-schemas`.
   - `FE-2` desarrolla `CategoryShowcaseScene.tsx` y `marketplaceBatch.ts` recibiendo únicamente el `activeCategory: TaskCategory` y los refs de contenedor DOM mediante props tipadas.
   - `BE-2` implementa los controladores, servicios y repositorios Prisma en `apps/api/src/modules/marketplace/` contra PostgreSQL.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod en `packages/shared-schemas`

Se mantienen intactos `TaskCategoryEnum`, `DeliverableMediaTypeEnum`, `PublicationStatusEnum`, `AcceptanceCriterionSchema` y `ClientTaskPublicationSchema`, y se añaden de forma retrocompatible los siguientes contratos y constantes canónicas:

```typescript
import { z } from 'zod';
import {
  TaskCategoryEnum,
  DeliverableMediaTypeEnum,
  MvpAiAuditableModalityEnum,
  PublicationStatusEnum,
  AcceptanceCriterionSchema,
} from './schemas';

/**
 * Límites financieros seguros en centavos de USD para prevenir:
 * 1) Comisiones de 0 centavos por truncamiento (floor(100 * 0.04) = 4 >= 1).
 * 2) Integer overflow en PostgreSQL INT4 durante el CHECK (total * 4) / 100.
 */
export const MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS = 100; // $1.00 USD
export const MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS = 50_000_000; // $500,000.00 USD

/**
 * Matriz canónica inmutable que vincula cada una de las 6 categorías del MVP
 * con su único DeliverableMediaType permitido, sus extensiones válidas y su modalidad IA.
 */
export const CATEGORY_MEDIA_CONSTRAINTS_MAP = {
  DIGITAL_MARKETING: {
    expectedMediaType: 'DATA_CAMPAIGN',
    allowedExtensions: ['.pdf', '.csv', '.xlsx', '.json', '.zip'],
    aiAuditableModality: null,
  },
  GRAPHICS_AND_DESIGN: {
    expectedMediaType: 'IMAGE_RASTER_VECTOR',
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.pdf'],
    aiAuditableModality: 'IMAGE',
  },
  PROGRAMMING_AND_TECH: {
    expectedMediaType: 'CODE_ARCHIVE',
    allowedExtensions: ['.zip', '.tar.gz', '.tgz', '.json', '.sql'],
    aiAuditableModality: null,
  },
  TECHNICAL_WRITING_TRANS: {
    expectedMediaType: 'DOCUMENT_TEXT',
    allowedExtensions: ['.md', '.txt', '.docx', '.pdf'],
    aiAuditableModality: 'TEXT',
  },
  VIDEO_AND_ANIMATION: {
    expectedMediaType: 'VIDEO_STREAM',
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    aiAuditableModality: null,
  },
  MUSIC_AND_AUDIO: {
    expectedMediaType: 'AUDIO_TRACK',
    allowedExtensions: ['.mp3', '.wav', '.flac', '.ogg'],
    aiAuditableModality: null,
  },
} as const;

export const CreateGigInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120),
    description: z.string().trim().min(20).max(3000),
    category: TaskCategoryEnum,
    expectedMediaType: DeliverableMediaTypeEnum,
    priceUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
    initialDeliveryDays: z.number().int().min(1).max(7).default(7),
    defaultCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
    allowedExtensions: z.array(z.string().regex(/^\.[a-z0-9.]+$/)).min(1).max(10),
  })
  .superRefine((data, ctx) => {
    const canonical = CATEGORY_MEDIA_CONSTRAINTS_MAP[data.category];
    if (data.expectedMediaType !== canonical.expectedMediaType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expectedMediaType'],
        message: `La categoría ${data.category} exige el tipo de medio ${canonical.expectedMediaType}.`,
      });
    }
    const invalidExts = data.allowedExtensions.filter(
      (ext) => !(canonical.allowedExtensions as readonly string[]).includes(ext),
    );
    if (invalidExts.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedExtensions'],
        message: `Extensiones no permitidas para ${data.category}: ${invalidExts.join(', ')}.`,
      });
    }
  });

export const GigCardSchema = z.object({
  gigId: z.string().uuid(),
  seller: z.object({
    userId: z.string().uuid(),
    displayName: z.string(),
    headline: z.string().nullable(),
    webMonetizationEnabled: z.boolean(),
    verifiedWalletAddressUrl: z.string().url().startsWith('https://').nullable(),
    targetCurrency: z.string().length(3),
  }),
  title: z.string().min(10).max(120),
  description: z.string().min(20).max(3000),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  aiAuditableModality: MvpAiAuditableModalityEnum.nullable(),
  priceUSDInCents: z.number().int().positive(),
  initialDeliveryDays: z.number().int().min(1).max(7),
  defaultCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export const CreatePublicationInputSchema = z
  .object({
    title: z.string().trim().min(10).max(120),
    description: z.string().trim().min(20).max(3000),
    category: TaskCategoryEnum,
    expectedMediaType: DeliverableMediaTypeEnum,
    initialBudgetUSDInCents: z
      .number()
      .int()
      .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
      .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
    initialDeliveryDays: z.number().int().min(1).max(7).default(7),
    preliminaryCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
    allowedExtensions: z.array(z.string().regex(/^\.[a-z0-9.]+$/)).min(1).max(10),
    minWordCount: z.number().int().min(50).max(100_000).optional(),
    minWidthPx: z.number().int().min(64).max(16_384).optional(),
    minHeightPx: z.number().int().min(64).max(16_384).optional(),
  })
  .superRefine((data, ctx) => {
    const canonical = CATEGORY_MEDIA_CONSTRAINTS_MAP[data.category];
    if (data.expectedMediaType !== canonical.expectedMediaType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expectedMediaType'],
        message: `La categoría ${data.category} exige el tipo de medio ${canonical.expectedMediaType}.`,
      });
    }
    const invalidExts = data.allowedExtensions.filter(
      (ext) => !(canonical.allowedExtensions as readonly string[]).includes(ext),
    );
    if (invalidExts.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedExtensions'],
        message: `Extensiones no permitidas para ${data.category}: ${invalidExts.join(', ')}.`,
      });
    }
  });
```

### 4.2. Tablas, Relaciones e Índices en `apps/api/prisma/schema.prisma`

`SPEC-04` opera directamente sobre las tablas `gigs` (`Gig`), `client_task_publications` (`ClientTaskPublication`), `seller_profiles` (`SellerProfile`) y `user_wallets` (`UserWallet`) ya declaradas en `apps/api/prisma/schema.prisma` y `apps/api/prisma/sql/domain_checks.sql`:

1. **`Gig` (`gigs`):**
   - Clave foránea `sellerId` → `User.id` (`ON DELETE RESTRICT`).
   - Restricción SQL activa `chk_gig_price_and_days`: `price_usd_in_cents > 0 AND initial_delivery_days BETWEEN 1 AND 7`.
   - `defaultCriteriaJson` almacena la estructura validada de criterios y metadatos técnicos por defecto (`defaultCriteria` + `allowedExtensions`) sin duplicar tablas transaccionales hasta que nazca una `TaskOrder`.
   - Índice compuesto `@@index([category, isActive])` para filtrado O(log n) en el catálogo público.
2. **`ClientTaskPublication` (`client_task_publications`):**
   - Clave foránea `buyerId` → `User.id` (`ON DELETE RESTRICT`).
   - Restricción SQL activa `chk_publication_budget_and_days`: `initial_budget_usd_in_cents > 0 AND initial_delivery_days BETWEEN 1 AND 7`.
   - Estado gobernado por `PublicationStatus` (`OPEN_FOR_PROPOSALS`, `AGREED_AND_LOCKED`, `CANCELLED`).
   - Índice compuesto `@@index([category, status])` para el tablón de tareas abiertas.
3. **Verificación de 3NF:**
   - Los datos de billetera (`walletAddressUrl`, `currencyCode`, `isVerified`, `isActive`) jamás se duplican dentro de `gigs` ni de `client_task_publications`; se resuelven mediante `JOIN` con `user_wallets` (`WHERE is_active = true AND is_verified = true`) y `seller_profiles` (`web_monetization_enabled`).

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST (`apps/api`)

| Método y Ruta | Guardas de Seguridad | Request (Params / Query / Body) | Response `200/201` | Códigos de Error Esperados |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/marketplace/categories` | Público (con rate limit IP) | Sin parámetros | Lista estática enriquecida de las 6 categorías con `expectedMediaType`, `allowedExtensions`, `aiAuditableModality` y conteos de Gigs activos / publicaciones abiertas. | `429 TOO_MANY_REQUESTS` |
| `GET /api/v1/marketplace/gigs` | Público (con rate limit IP) | Query: `category?: TaskCategory`, `maxPriceCents?: number`, `maxDays?: number`, `cursor?: string`, `limit?: 1..24` | `{ items: GigCard[], nextCursor: string \| null }` (solo `isActive = true` y donde el Seller mantiene una `UserWallet` verificada activa). | `400 VALIDATION_ERROR` |
| `GET /api/v1/marketplace/gigs/:gigId` | Público | Param: `gigId` (UUID) | `GigCard` completo incluyendo metadatos de Web Monetization resueltos en servidor. | `404 GIG_NOT_FOUND` |
| `POST /api/v1/marketplace/gigs` | `ClerkAuthGuard`, `WalletVerifiedGuard` | Body: `CreateGigInputSchema` + Header `Idempotency-Key` | `201 Created` → `GigCard` (crea automáticamente `SellerProfile` por defecto si el usuario verificado aún no lo tenía). | `401 UNAUTHORIZED`, `403 WALLET_NOT_VERIFIED`, `422 CATEGORY_MEDIA_TYPE_MISMATCH` |
| `PATCH /api/v1/marketplace/gigs/:gigId` | `ClerkAuthGuard`, `WalletVerifiedGuard` | Param: `gigId`, Body: `UpdateGigInputSchema` (`isActive`, `title`, `description`, `priceUSDInCents`, `initialDeliveryDays`, `defaultCriteria`) | `200 OK` → `GigCard` actualizado (el cambio de precio solo aplica a contrataciones futuras, nunca a `TaskOrder` ya creadas). | `403 FORBIDDEN_GIG_OWNERSHIP`, `404 GIG_NOT_FOUND`, `422 CATEGORY_MEDIA_TYPE_MISMATCH` |
| `GET /api/v1/marketplace/publications` | Público / Autenticado | Query: `category?: TaskCategory`, `status?: PublicationStatus` (default `OPEN_FOR_PROPOSALS`), `cursor?: string`, `limit?: 1..24` | `{ items: ClientTaskPublicationSummary[], nextCursor: string \| null }` | `400 VALIDATION_ERROR` |
| `GET /api/v1/marketplace/publications/:publicationId` | Público / Autenticado | Param: `publicationId` (UUID) | Detalle de la `ClientTaskPublication` con criterios preliminares, restricciones técnicas y conteo de propuestas activas (sin exponer los montos ni identidades de otros freelancers competidores). | `404 PUBLICATION_NOT_FOUND` |
| `POST /api/v1/marketplace/publications` | `ClerkAuthGuard`, `WalletVerifiedGuard` | Body: `CreatePublicationInputSchema` + Header `Idempotency-Key` | `201 Created` → `ClientTaskPublication` en estado `OPEN_FOR_PROPOSALS`. | `401 UNAUTHORIZED`, `403 WALLET_NOT_VERIFIED`, `422 CATEGORY_MEDIA_TYPE_MISMATCH` |
| `POST /api/v1/marketplace/publications/:publicationId/cancel` | `ClerkAuthGuard` | Param: `publicationId`, Body: `{ cancelReason?: string }` | `200 OK` → `ClientTaskPublication` en estado `CANCELLED` (y cierre en cascada de propuestas `IN_NEGOTIATION` a `DISCREPANCY_CLOSED_PATH_2`). | `403 FORBIDDEN_PUBLICATION_OWNERSHIP`, `404 PUBLICATION_NOT_FOUND`, `409 PUBLICATION_ALREADY_LOCKED` |

### 5.2. Jobs y Colas en BullMQ (`apps/api/src/modules/timers`)
- `SPEC-04` **no** encola temporizadores contractuales en BullMQ (`INITIAL_DELIVERY_7D`, `DELIVERY_REVIEW_32H`, etc.), dado que la publicación de un `Gig` o de una `ClientTaskPublication` es un acto precontractual y aún no existe depósito en escrow.

### 5.3. Flujos de Almacenamiento en Cloudflare R2 o Integraciones Externas
- **Estándar W3C Web Monetization (`<link rel="monetization">`):**
  - En las rutas `apps/web/src/app/(marketplace)/gigs/[gigId]/page.tsx` y `apps/web/src/app/(marketplace)/freelancers/[sellerId]/page.tsx`, Next.js genera en el `<head>` (vía `generateMetadata` o componente de servidor) la etiqueta `<link rel="monetization" href="https://ilp.interledger-test.dev/..." />` **únicamente** cuando el endpoint de backend confirma que `seller.webMonetizationEnabled === true` y devuelve `seller.verifiedWalletAddressUrl` no nulo.
- No se realizan escrituras en Cloudflare R2 ni llamadas salientes a Rafiki durante la simple navegación o publicación del catálogo, pues la verificación criptográfica de la wallet (`UserWallet.isVerified = true`) ya fue acreditada en `SPEC-02`.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas y Componentes Next.js 15 (`FE-1`)
- `apps/web/src/app/(marketplace)/marketplace/page.tsx`: Vista principal del Marketplace con selector interactivo de las **6 categorías del MVP**, pestaña dual (`Catálogo de Gigs a Precio Fijo` vs. `Tablón de Tareas de Clientes con Tope`) y filtros por presupuesto/plazo (`1..7` días).
- `apps/web/src/app/(marketplace)/marketplace/gigs/[gigId]/page.tsx`: Página de detalle de un Gig fijo. Muestra el precio cerrado en USD (`priceUSDInCents`), la divisa de destino del Freelancer (`seller.targetCurrency`), el desglose informativo del modelo de escrow (`96 % Freelancer / 4 % Comisión de Plataforma`, doble conversión FX asumida por el Buyer), la lista de criterios de aceptación por defecto y el distintivo de cobertura del Consejero de IA (`IMAGE` / `TEXT` vs. `Validación Determinista + Revisión Humana`).
- `apps/web/src/app/(marketplace)/marketplace/gigs/new/page.tsx` (restringido a `Seller Mode` con wallet verificada): Formulario con React Hook Form + Zod (`CreateGigInputSchema`) que autocompleta `expectedMediaType` y restringe `allowedExtensions` según la categoría seleccionada.
- `apps/web/src/app/(marketplace)/marketplace/publications/new/page.tsx` (restringido a `Buyer Mode` con wallet verificada): Formulario de creación de `ClientTaskPublication` con presupuesto tope (`initialBudgetUSDInCents`), plazo de 1 a 7 días y constructor dinámico de 1 a 10 criterios de aceptación preliminares (`AcceptanceCriterionSchema`).
- `apps/web/src/features/web-monetization/components/WebMonetizationHeadTag.tsx`: Componente Server-First que inyecta `<link rel="monetization" href={verifiedWalletAddressUrl} />` y muestra en la UI del perfil/Gig el sello interactivo *"Web Monetization Activo — Envía propinas en streaming vía Interledger"*.

### 6.2. Escena 3D y Animaciones GSAP (`FE-2`)
- **Componente 3D (`CategoryShowcaseScene.tsx`):**
  - Cargado mediante `next/dynamic(() => import('@/canvas/scenes/CategoryShowcaseScene'), { ssr: false })` con un `<CategoryShowcaseSkeleton />` que reserva dimensiones exactas (`min-h-[280px]`) para garantizar `CLS = 0`.
  - Renderiza un emblema tridimensional reactivo para cada una de las 6 categorías (`DIGITAL_MARKETING`, `GRAPHICS_AND_DESIGN`, `PROGRAMMING_AND_TECH`, `TECHNICAL_WRITING_TRANS`, `VIDEO_AND_ANIMATION`, `MUSIC_AND_AUDIO`), interpolando posición, rotación de cámara y materiales PBR mediante `useGSAP()` al cambiar de categoría.
- **Animación de Grilla con `ScrollTrigger.batch()` (`marketplaceBatch.ts`):**
  - Aplica `ScrollTrigger.batch('[data-marketplace-card]', { onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.06, overwrite: true }) })` dentro de un contexto `useGSAP({ scope: gridContainerRef, dependencies: [activeCategory, activeTab] })`.
  - **Regla estricta de rendimiento 60–120 FPS:** Queda terminantemente prohibido almacenar el progreso de desplazamiento en estado reactivo de React; toda interpolación opera sobre `useRef` y matrices de Three.js, respetando `prefers-reduced-motion: reduce` mediante `gsap.matchMedia()`.

### 6.3. Controles Anti-Fuga en Visor Protegido (si aplica)
- No aplica visor de entregables en `SPEC-04` (los entregables se suben y auditan en `SPEC-07` y `SPEC-09`).

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

### 7.1. Validación de Frontera y Autorización por Rol / Modo
1. **Prevención de IDOR y Suplantación de Identidad:**
   - Ni `CreateGigInputSchema` ni `CreatePublicationInputSchema` aceptan `sellerId` o `buyerId` desde el payload del cliente. El backend asigna `sellerId = req.user.id` o `buyerId = req.user.id` extraído del JWT verificado de Clerk (`ClerkAuthGuard`).
   - En `PATCH /api/v1/marketplace/gigs/:gigId` y `POST /api/v1/marketplace/publications/:publicationId/cancel`, el servicio verifica en la misma sentencia SQL (`WHERE id = :id AND seller_id = :userId` / `WHERE id = :id AND buyer_id = :userId`) que el actor sea el propietario legítimo; de lo contrario, retorna `403 FORBIDDEN_GIG_OWNERSHIP` o `403 FORBIDDEN_PUBLICATION_OWNERSHIP` y registra el intento en `AuditLog`.
2. **Enforce de `WalletVerifiedGuard` y Visibilidad Condicional en Catálogo:**
   - Ningún usuario sin `UserWallet` con `isVerified = true AND isActive = true` puede crear Gigs ni publicaciones (`403 WALLET_NOT_VERIFIED`).
   - En las consultas públicas (`GET /api/v1/marketplace/gigs`), el backend filtra obligatoriamente aquellos Gigs cuyo vendedor conserve una `UserWallet` activa y verificada, impidiendo que un Gig huérfano de billetera llegue al paso de contratación en `SPEC-05`.
3. **Blindaje de W3C Web Monetization contra Wallet Spoofing y XSS:**
   - El valor `href` de `<link rel="monetization">` se construye en servidor leyendo únicamente `UserWallet.walletAddressUrl` (`WHERE user_id = seller.id AND is_verified = true AND is_active = true`).
   - Se valida que la URL comience estrictamente por `https://`, sea un URL válido sin caracteres de escape HTML (`"`, `'`, `<`, `>`) y que `SellerProfile.webMonetizationEnabled === true`.

### 7.2. Idempotencia, Bloqueos Transaccionales y Límites Monetarios
1. **Límites Anti-Overflow y Anti-Truncamiento de Comisión (`100 .. 50_000_000` centavos):**
   - Todo precio de Gig (`priceUSDInCents`) y presupuesto tope (`initialBudgetUSDInCents`) debe ser un entero entre `100` (`$1.00 USD`) y `50_000_000` (`$500,000.00 USD`).
   - El límite inferior (`100` centavos) garantiza que el `4 %` de comisión de plataforma (`Math.floor(total * 0.04)`) sea siempre `>= 4` centavos, cerrando la brecha de *Fee Truncation Attack* (donde tareas de `< 25` centavos producirían `platformFeeUSDInCents = 0` y harían fallar el Outgoing Payment en Rafiki).
   - El límite superior (`50_000_000` centavos) evita el desbordamiento aritmético (`integer out of range`) en PostgreSQL `INT4` al evaluar `("total_amount_usd_in_cents" * 4) / 100` en `chk_task_order_exact_96_4_split`.
2. **Idempotencia en Creación y Bloqueo Atómico en Cancelación:**
   - Los endpoints `POST /api/v1/marketplace/gigs` y `POST /api/v1/marketplace/publications` exigen el encabezado `Idempotency-Key` (UUID v4) con deduplicación en Redis durante 24 horas para evitar publicaciones duplicadas por doble clic o reintentos de red.
   - La cancelación `POST /api/v1/marketplace/publications/:publicationId/cancel` ejecuta una transacción interactiva con `SELECT id, status, buyer_id FROM client_task_publications WHERE id = $1 FOR UPDATE`:
     - Si `status === 'AGREED_AND_LOCKED'`, aborta con `409 PUBLICATION_ALREADY_LOCKED`.
     - Si `status === 'CANCELLED'`, retorna el estado actual de forma idempotente (`200 OK`).
     - Si `status === 'OPEN_FOR_PROPOSALS'`, actualiza la publicación a `CANCELLED`, pasa todas las propuestas `IN_NEGOTIATION` asociadas a `DISCREPANCY_CLOSED_PATH_2` con `closedReason = 'PUBLICATION_CANCELLED_BY_BUYER'` y registra el evento en `AuditLog`.

### 7.3. Sanitización y Defensa Temprana Anti-Prompt Injection
- Dado que `title`, `description` y los criterios de aceptación (`defaultCriteria` / `preliminaryCriteria`) se inyectarán posteriormente en el contexto de evaluación del Consejero de IA (`SPEC-08`), el backend normaliza el texto (NFC), elimina caracteres de control invisibles (`\u0000-\u001F`, *zero-width spaces* y *bidirectional overrides* `\u202A-\u202E`), escapa etiquetas HTML peligrosas (`<script>`, `<iframe>`, `javascript:`) y rechaza delimitadores reservados del sistema de prompts (`<|system|>`, `<deliverable_untrusted_content>`, `</deliverable_untrusted_content>`) con `422 UNSAFE_CONTENT_DETECTED`.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Consulta del catálogo de las 6 categorías del MVP con matriz de medios y cobertura del Consejero de IA
- **Descripción:** El sistema debe exponer las 6 categorías oficiales del MVP junto con su `DeliverableMediaType` exclusivo, extensiones permitidas y si cuentan con auditoría semántica/visual del Consejero de IA (`IMAGE` o `TEXT`) o solo validación determinista + revisión humana.
- **Escenario 1 (Camino Feliz — Listado de las 6 categorías con su cobertura IA):**
  - **Dado** que un usuario visita el explorador del Marketplace o consulta `GET /api/v1/marketplace/categories`,
  - **Cuando** el backend responde con el catálogo de categorías del MVP,
  - **Entonces** devuelve exactamente las 6 categorías (`DIGITAL_MARKETING`, `GRAPHICS_AND_DESIGN`, `PROGRAMMING_AND_TECH`, `TECHNICAL_WRITING_TRANS`, `VIDEO_AND_ANIMATION`, `MUSIC_AND_AUDIO`), marcando `aiAuditableModality = "IMAGE"` únicamente en `GRAPHICS_AND_DESIGN`, `aiAuditableModality = "TEXT"` únicamente en `TECHNICAL_WRITING_TRANS` y `aiAuditableModality = null` en las 4 restantes.
- **Escenario 2 (Error de Validación o Violación de Regla — Intento de filtrar por categoría inexistente):**
  - **Dado** que un cliente envía una petición `GET /api/v1/marketplace/gigs?category=VOICE_OVER_AI`,
  - **Cuando** el pipe de validación Zod evalúa `TaskCategoryEnum`,
  - **Entonces** rechaza la petición con HTTP `400 VALIDATION_ERROR` indicando que la categoría no pertenece a las 6 categorías oficiales del MVP.

### `RF-02` — Publicación y edición de Gigs a precio fijo por Freelancers con wallet verificada
- **Descripción:** Un Freelancer con billetera Open Payments activa y verificada puede publicar y actualizar Gigs a precio fijo no negociable en centavos de USD, plazo de 1 a 7 días y entre 1 y 10 criterios de aceptación por defecto coherentes con la categoría elegida.
- **Escenario 1 (Camino Feliz — Creación de Gig a precio fijo válido):**
  - **Dado** que un usuario autenticado posee una `UserWallet` con `isVerified = true` e `isActive = true` y envía `POST /api/v1/marketplace/gigs` con `category = "GRAPHICS_AND_DESIGN"`, `expectedMediaType = "IMAGE_RASTER_VECTOR"`, `priceUSDInCents = 15000` (`$150.00 USD`), `initialDeliveryDays = 5`, `allowedExtensions = [".png", ".webp"]` y 3 criterios de aceptación válidos,
  - **Cuando** `MarketplaceService` valida el contrato `CreateGigInputSchema` y persiste la entidad,
  - **Entonces** crea el registro en `gigs` con `isActive = true`, asegura la existencia de `SellerProfile` y retorna HTTP `201 Created` con el `GigCard` y `aiAuditableModality = "IMAGE"`.
- **Escenario 2 (Error de Validación o Violación de Regla — Incoherencia entre categoría y tipo de medio o extensión peligrosa):**
  - **Dado** que un Freelancer verificado intenta crear un Gig en `GRAPHICS_AND_DESIGN` enviando `expectedMediaType = "CODE_ARCHIVE"` o `allowedExtensions = [".exe", ".svg"]`,
  - **Cuando** el backend ejecuta la validación cruzada contra `CATEGORY_MEDIA_CONSTRAINTS_MAP`,
  - **Entonces** rechaza la solicitud con HTTP `422 CATEGORY_MEDIA_TYPE_MISMATCH` sin insertar registros en `gigs`.
- **Escenario 3 (Seguridad — Intento de publicar Gig sin wallet verificada o con monto fuera de rango seguro):**
  - **Dado** que un usuario sin `UserWallet` verificada (o que envía `priceUSDInCents = 15` centavos, menor al mínimo de `100` centavos) invoca `POST /api/v1/marketplace/gigs`,
  - **Cuando** se ejecutan `WalletVerifiedGuard` y la validación de frontera,
  - **Entonces** el sistema bloquea la operación con `403 WALLET_NOT_VERIFIED` (o `400 VALIDATION_ERROR` por monto inferior a `$1.00 USD`) evitando Gigs no liquidables en Rafiki.

### `RF-03` — Creación y cancelación controlada de publicaciones de tareas (`ClientTaskPublication`) con presupuesto tope
- **Descripción:** Un Buyer con billetera verificada puede publicar una necesidad en el tablón (`OPEN_FOR_PROPOSALS`) definiendo un presupuesto máximo (`initialBudgetUSDInCents`) y plazo de 1 a 7 días, y puede cancelarla únicamente mientras no se haya formalizado un acuerdo mutuo (`AGREED_AND_LOCKED`).
- **Escenario 1 (Camino Feliz — Publicación y posterior cancelación antes de aceptar ofertas):**
  - **Dado** que un Buyer con wallet verificada crea una `ClientTaskPublication` en `TECHNICAL_WRITING_TRANS` con `initialBudgetUSDInCents = 25000` e `initialDeliveryDays = 7` (quedando en `OPEN_FOR_PROPOSALS`),
  - **Cuando** el mismo Buyer solicita `POST /api/v1/marketplace/publications/:publicationId/cancel` antes de haber aceptado ninguna oferta,
  - **Entonces** el sistema bloquea la fila con `FOR UPDATE`, cambia `status` a `CANCELLED`, pasa cualquier propuesta `IN_NEGOTIATION` a `DISCREPANCY_CLOSED_PATH_2` con motivo `PUBLICATION_CANCELLED_BY_BUYER`, registra el `AuditLog` y responde HTTP `200 OK`.
- **Escenario 2 (Error de Validación o Violación de Regla — Intento de cancelar una publicación ya acordada o de otro Buyer):**
  - **Dado** que una `ClientTaskPublication` ya se encuentra en estado `AGREED_AND_LOCKED` tras aceptación mutua (o el solicitante no es su `buyerId` titular),
  - **Cuando** se invoca `POST /api/v1/marketplace/publications/:publicationId/cancel`,
  - **Entonces** el sistema rechaza la operación con HTTP `409 PUBLICATION_ALREADY_LOCKED` (o `403 FORBIDDEN_PUBLICATION_OWNERSHIP`), manteniendo intacta la publicación y la orden asociada.

### `RF-04` — Inyección segura de W3C Web Monetization (`<link rel="monetization">`) en perfiles y Gigs de Freelancers
- **Descripción:** Las páginas de perfil y detalle de Gig de un Freelancer deben inyectar `<link rel="monetization" href="...">` en el documento HTML únicamente si el Freelancer tiene `webMonetizationEnabled = true` y posee una `UserWallet` activa y verificada.
- **Escenario 1 (Camino Feliz — Renderizado de `<link rel="monetization">` con wallet verificada):**
  - **Dado** que el Freelancer titular de un Gig tiene `SellerProfile.webMonetizationEnabled = true` y su única `UserWallet` activa y verificada es `https://ilp.interledger-test.dev/freelancer-ana`,
  - **Cuando** un visitante o navegador compatible carga la página del Gig o del perfil del Freelancer,
  - **Entonces** el Server Component incluye en el `<head>` exactamente `<link rel="monetization" href="https://ilp.interledger-test.dev/freelancer-ana" />` sin exponer claves privadas ni permitir edición libre de la URL.
- **Escenario 2 (Error de Validación o Violación de Regla — Freelancer con Web Monetization deshabilitado o sin wallet activa):**
  - **Dado** que un Freelancer tiene `SellerProfile.webMonetizationEnabled = false` o su billetera fue desactivada,
  - **Cuando** se solicita el detalle del perfil o Gig,
  - **Entonces** el backend devuelve `verifiedWalletAddressUrl = null` para propósitos de Web Monetization y el frontend omite por completo la etiqueta `<link rel="monetization">`.

### `RF-05` — Transiciones espaciales 3D por categoría y animación de grilla con `ScrollTrigger.batch()` a 60–120 FPS
- **Descripción:** El explorador del Marketplace debe sincronizar la escena 3D de categorías y el revelado por lotes de tarjetas de Gigs/publicaciones usando `useGSAP()` y `ScrollTrigger.batch()` sin causar *layout shift* ni almacenar la posición de scroll en estado de React.
- **Escenario 1 (Camino Feliz — Cambio de categoría y revelado por lotes sin re-renders por frame):**
  - **Dado** que el usuario navega por `/marketplace` en un dispositivo con aceleración gráfica normal (`prefers-reduced-motion: no-preference`),
  - **Cuando** selecciona la categoría `VIDEO_AND_ANIMATION` y desplaza el listado de tarjetas,
  - **Entonces** `CategoryShowcaseScene` interpola la cámara 3D mediante `useRef` y `ScrollTrigger.batch()` revela las tarjetas visibles en lotes sin disparar re-renders del árbol React durante el scroll, y limpia todas las instancias al desmontar la vista.
- **Escenario 2 (Error de Validación o Violación de Regla — Respeto a `prefers-reduced-motion: reduce`):**
  - **Dado** que el sistema operativo del usuario tiene activada la preferencia de accesibilidad `prefers-reduced-motion: reduce`,
  - **Cuando** se monta la vista del Marketplace,
  - **Entonces** `gsap.matchMedia()` desactiva los desplazamientos bruscos de cámara y muestra las tarjetas inmediatamente con opacidad completa (`autoAlpha: 1`).

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

### 9.1. Pruebas Unitarias (Vitest)
- **Archivo objetivo:** `packages/shared-schemas/src/__tests__/marketplace-schemas.spec.ts` y `apps/api/src/modules/marketplace/__tests__/marketplace.service.spec.ts`.
- **Casos mínimos requeridos:**
  - Verificación de `RF-01` y `RF-02`: validación de `CATEGORY_MEDIA_CONSTRAINTS_MAP`, rechazo de combinaciones inválidas (`category` vs. `expectedMediaType` y `allowedExtensions`), rechazo de montos `< 100` o `> 50_000_000` centavos, y rechazo de `initialDeliveryDays` fuera de `1..7`.
  - Verificación de `RF-03`: prueba unitaria de sanitización anti-Prompt Injection / anti-XSS en títulos, descripciones y criterios (`<|system|>`, `<deliverable_untrusted_content>`, `<script>`).
  - Verificación de `RF-04`: resolución determinista de `verifiedWalletAddressUrl` únicamente cuando `webMonetizationEnabled === true` y `UserWallet.isVerified && UserWallet.isActive`.

### 9.2. Pruebas de Integración de API y Base de Datos (Supertest + Prisma)
- **Archivo objetivo:** `apps/api/test/marketplace.e2e-spec.ts`.
- **Casos mínimos requeridos:**
  - `POST /api/v1/marketplace/gigs` (`RF-02`): retorna `403 WALLET_NOT_VERIFIED` para usuario sin wallet verificada; retorna `201 Created` para usuario verificado y respeta idempotencia ante repetición de `Idempotency-Key`.
  - `PATCH /api/v1/marketplace/gigs/:gigId` (`RF-02`): retorna `403 FORBIDDEN_GIG_OWNERSHIP` cuando un Seller intenta modificar el Gig de otro Seller (anti-IDOR).
  - `POST /api/v1/marketplace/publications/:publicationId/cancel` (`RF-03`): cancela atómicamente una publicación en `OPEN_FOR_PROPOSALS`, cierra propuestas `IN_NEGOTIATION` asociadas y retorna `409 PUBLICATION_ALREADY_LOCKED` si la publicación ya estaba en `AGREED_AND_LOCKED`.
  - `GET /api/v1/marketplace/categories` y `GET /api/v1/marketplace/gigs/:gigId` (`RF-01`, `RF-04`): verifica el retorno exacto de las 6 categorías y la presencia/ausencia de la URL de Web Monetization según el flag del `SellerProfile`.

### 9.3. Pruebas de UI / E2E / Accesibilidad y Rendimiento (`FE-1` / `FE-2`)
- **Archivo objetivo:** `apps/web/src/features/marketplace/__tests__/marketplace-page.spec.tsx`.
- **Casos mínimos requeridos:**
  - Verificación de `RF-04`: el componente `<WebMonetizationHeadTag />` renderiza `<link rel="monetization" href="https://...">` cuando recibe una wallet verificada y devuelve `null` cuando `webMonetizationEnabled` es `false` o la URL no es `https://`.
  - Verificación de `RF-05`: montaje y desmontaje de `CategoryShowcaseScene` y `marketplaceBatch` comprobando que `ScrollTrigger.getAll()` queda limpio tras `unmount()` y que se respeta `prefers-reduced-motion`.

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Detección | Acción de Recuperación / Rollback | Código HTTP / Evento de Dominio |
| :--- | :--- | :--- | :--- |
| **Cambio de billetera o pérdida de estado verificado de un Seller con Gigs activos** | La `UserWallet` del Seller deja de estar activa/verificada. | Las consultas públicas del catálogo excluyen automáticamente Gigs sin wallet activa verificada y omiten `<link rel="monetization">` hasta que el Seller vincule una wallet verificada. | `200 OK` (filtrado automático en catálogo) |
| **Edición del precio fijo de un Gig (`priceUSDInCents`) mientras existen órdenes en curso** | Un Seller actualiza `priceUSDInCents` en `PATCH /api/v1/marketplace/gigs/:gigId`. | La actualización modifica `gigs.price_usd_in_cents` solo para contrataciones futuras; las `TaskOrder` ya creadas conservan su `totalAmountUSDInCents` inmutable copiado al nacer. | `200 OK` + registro en `AuditLog` |
| **Intento concurrente de cancelar una `ClientTaskPublication` en el mismo milisegundo en que se acepta una oferta (`SPEC-05`)** | Colisión de transacciones sobre la fila `client_task_publications`. | Ambas operaciones adquieren `SELECT ... FOR UPDATE` sobre `client_task_publications.id`. La segunda en llegar observa el nuevo `status` (`AGREED_AND_LOCKED` o `CANCELLED`) y aborta limpiamente sin corromper el estado. | `409 PUBLICATION_ALREADY_LOCKED` o `409 PUBLICATION_CANCELLED` |
| **Inyección de delimitadores de Prompt Injection o payloads XSS en criterios de aceptación** | Validador de seguridad detecta `<deliverable_untrusted_content>` o etiquetas `<script>` en `defaultCriteria` / `preliminaryCriteria`. | Se rechaza la transacción antes de tocar PostgreSQL y se informa el campo exacto infractor. | `422 UNSAFE_CONTENT_DETECTED` |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

### 11.1. Decisiones Técnicas Cerradas en esta Especificación
1. **Límites monetarios seguros (`100` a `50_000_000` centavos USD):** Se fija un piso de `$1.00 USD` (`100` centavos) para que el 4 % de comisión de plataforma sea siempre `>= 4` centavos en Rafiki, y un techo de `$500,000.00 USD` (`50_000_000` centavos) para impedir desbordamientos de `INT4` en PostgreSQL.
2. **Exclusión de `.svg` en `GRAPHICS_AND_DESIGN` por seguridad:** Conforme a `CONTEXT.md` §7.2, las imágenes raster/vectoriales aceptadas en entregables de diseño son `.png`, `.jpg`, `.jpeg`, `.webp` y `.pdf`, evitando archivos `.svg` que puedan contener `<script>` embebidos o vectores XXE.
3. **Resolución Server-Side de `<link rel="monetization">`:** El atributo `href` se obtiene exclusivamente de la `UserWallet` activa y verificada en base de datos, nunca de un input de texto separado.

### 11.2. Preguntas Abiertas (Si las hubiera)
- Ninguna pregunta bloqueante para `SPEC-04`. Las consideraciones transversales de seguridad y producto sobre expiración de publicaciones inactivas y límites de rate-limiting por cuenta se documentan en la sección final de `planning/taskboard.md`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Herramienta IA / Autor | Resumen del Cambio |
| :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Cursor` + Equipo Humano | Redacción inicial completa de `SPEC-04` (12 secciones, contratos Zod con matriz canónica de las 6 categorías, blindaje de Web Monetization, protección anti-IDOR/anti-overflow y 5 RF con escenarios BDD). |

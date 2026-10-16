# SPEC-02: Identidad Clerk y verificación de billetera multimoneda

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-02` |
| **Archivo** | `specs/SPEC-02.md` |
| **Fase de Desarrollo** | `Fase 1 — Identidad multimoneda en América y motor 3D` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `FE-1`, `BE-1`, `BE-2` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F1-FE1-01`, `T-F1-BE1-01`, `T-F1-BE2-01` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ BE-1 en Open Payments)` |
| **Dependencias SDD** | `SPEC-01` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Sin una billetera verificada no hay encargo, oferta ni cobro. Esta spec une la cuenta Clerk (Google o GitHub) con una sola wallet activa del continente americano. El mismo usuario alterna `Buyer Mode` y `Seller Mode`. La prueba de posesión es un `Subject Grant` de Open Payments, sin mover dinero, y el callback solo se acepta si el hash SHA-256 coincide. Así la demo puede mostrar un contratista en COP y un freelancer en USD antes de fondear el escrow.

### 1.2. En Alcance del MVP

- Login Clerk v6 en `apps/web` y protección de rutas de cuenta (`T-F1-FE1-01`).
- Selector `Buyer Mode / Seller Mode` que persiste `User.activeMode`.
- Formulario de `walletAddress` HTTPS contra un adaptador mock mientras `BE-1` cierra el endpoint real.
- Descubrimiento `UnauthenticatedClient.walletAddress.get` y verificación `Subject Grant` + hash en `open-payments.service.ts` (`T-F1-BE1-01`, autoría manual `🛡️`).
- Webhook de Clerk que crea o actualiza `User` en PostgreSQL (`T-F1-BE2-01`).
- Reemplazo de la wallet activa: la nueva verificada apaga la anterior en la misma transacción.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se fondea escrow, no hay `IncomingPayment` de la orden y no se escribe `escrow-payment.service.ts` (eso es `SPEC-06`).
- No hay segunda wallet activa simultánea ni wallets sin `https`.
- No se implementa en este documento: esta spec queda en `Redactada (DRAFTED)`.
- La IA no genera ni reescribe la lógica de firmas `Ed25519`, `grant.request` ni `grant.continue`.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§4, §5.5 filas 1–4), `planning/architecture-overview.md` (§5.3 `User`, `UserWallet`, `WalletVerificationChallenge`) y `planning/taskboard.md` (§3 regla 6).
- **Invariantes del Módulo:**
  1. Una cuenta Clerk, un `User`, exactamente una wallet con `isVerified = true` e `isActive = true`.
  2. Verificar una wallet nueva desactiva la anterior. No puede quedar el usuario sin el intento en curso ni con dos activas.
  3. `isVerified = false` bloquea publicar, ofertar, contratar y cobrar (`WALLET_NOT_VERIFIED`).
  4. El hash del callback es `SHA-256(clientNonce + "\n" + finishNonce + "\n" + interact_ref + "\n" + authServerUrl)`, calculado con `gnapInteractHash` de `SPEC-01` y comparado por `BE-1`.
  5. El descubrimiento no usa la clave privada. El cliente autenticado de la plataforma, cuando haga falta en fases posteriores, firma con `Ed25519` custodiada fuera del repositorio.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Pantallas de login, selector de modo y formulario de wallet (`T-F1-FE1-01`). | MSW responde el descubrimiento y el estado `PENDING_REDIRECT` / `VERIFIED` | No |
| **`FE-2`** | Sin entregable directo en esta spec; consume `UserActiveMode` si una escena futura distingue modos. | No bloquea a `FE-1` | No |
| **`BE-1`** | `🛡️` Implementa a mano `apps/api/src/modules/open-payments/open-payments.service.ts`: `walletAddress.get`, `grant.request` con `subject.sub_ids` y `grant.continue` tras el hash (`T-F1-BE1-01`). | Sandbox Test Wallet / Rafiki. La IA no escribe este archivo | `🛡️ Sí` |
| **`BE-2`** | Webhook Clerk → `User` y transacción de reemplazo de wallet activa (`T-F1-BE2-01`). | Persiste retos `WalletVerificationChallenge` que `BE-1` rellena | No |
| **`AI-1`** | Sin entregable de producto. Aporta `WalletLinkRequestSchema`, `ActiveModeSwitchSchema` y `gnapInteractHash` ya definidos en `SPEC-01`. | Fixtures de wallets de prueba | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

Se reutilizan, sin duplicar, los contratos de `SPEC-01`:

- `WalletLinkRequestSchema`: `{ walletAddress }` URL que empieza por `https://`.
- `ActiveModeSwitchSchema`: `{ activeMode: "BUYER" | "SELLER" }`.
- `gnapInteractHash({ clientNonce, finishNonce, interactRef, authServerUrl })`.

Contrato de descubrimiento (respuesta que el mock y el servicio real comparten):

```text
WalletDiscovery = {
  walletAddress: url https,
  authServer: url,
  resourceServer: url,
  assetCode: string (USD, CAD, MXN, COP, BRL, ARS, CLP, PEN, UYU, CRC, DOP, GTQ, EUR, …),
  assetScale: int >= 0
}
```

Contrato de reto, alineado con `WalletVerificationChallenge`:

```text
WalletChallenge = {
  challengeId: uuid,
  interactRedirectUri: url,
  status: PENDING_REDIRECT | VERIFIED | FAILED | EXPIRED
}
```

El mock de `FE-1` devuelve `PENDING_REDIRECT` y una URL de retorno local. No simula un pago.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

Tablas ya creadas en `SPEC-01`: `User` (`clerkId` único, `activeMode`, `platformRole`), `UserWallet`, `WalletVerificationChallenge`.

El índice parcial `user_wallets_one_active_per_user` es la barrera de base. `BE-2` actualiza la fila previa a `isActive = false` antes de insertar la nueva activa, en una transacción.

No se añaden columnas de saldo a `User`. El dinero vive en `EscrowLedger` desde `SPEC-06`.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

| Método | Ruta | Rol | Cuerpo / respuesta | Errores |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/webhooks/clerk` | Público con firma Svix | Eventos `user.created` y `user.updated`. Upsert de `User` por `clerkId`. | `401 CLERK_WEBHOOK_INVALID_SIGNATURE` |
| `POST` | `/api/v1/me/mode` | Sesión Clerk | `ActiveModeSwitchSchema` → `{ activeMode }` | `401 UNAUTHENTICATED` |
| `POST` | `/api/v1/me/wallet/discovery` | Sesión Clerk | `WalletLinkRequestSchema` → `WalletDiscovery` | `400 WALLET_ADDRESS_INVALID`, `404 WALLET_ADDRESS_NOT_FOUND` |
| `POST` | `/api/v1/me/wallet/challenges` | Sesión Clerk | Inicia `Subject Grant` y devuelve `WalletChallenge` | `409 ACTIVE_WALLET_CHALLENGE_PENDING` |
| `GET` | `/api/v1/auth/wallet/callback` | Público (retorno del IdP) | Query `interact_ref`, `hash`. Verifica hash y llama `grant.continue`. | `400 GNAP_HASH_MISMATCH`, `410 WALLET_CHALLENGE_EXPIRED` |
| `GET` | `/api/v1/me/wallet` | Sesión Clerk | Wallet activa o `null` | `401 UNAUTHENTICATED` |

El webhook no pasa por `auth.protect()`. La única comprobación es `verifyWebhook` con `CLERK_WEBHOOK_SIGNING_SECRET`. La ruta de Next que reciba el mismo evento, si se usa, sigue la misma regla.

`continueAccessToken` y `clientNonce` no se devuelven al navegador.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

No hay colas en esta spec. Open Payments, solo en el servicio manual:

1. `createUnauthenticatedClient({ validateResponses: true }).walletAddress.get({ url })`.
2. `grant.request` con `subject: { sub_ids: [{ format: "uri", id: walletAddress }] }`, `interact.start: ["redirect"]` y `interact.finish: { method: "redirect", uri: callbackUrl, nonce: clientNonce }`.
3. En el callback, recomputar el hash. Si difiere, no llamar a `grant.continue`.
4. Si el `subject` confirma la URL, marcar `isVerified = true`, `verifiedAt = now()` y reemplazar la activa.

Las claves `Ed25519` del escrow no participan en esta verificación sin pago. Su custodia sigue siendo manual y fuera de los prompts.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

| Ruta | Comportamiento |
| :--- | :--- |
| `/sign-in`, `/sign-up` | Componentes de Clerk. Google y GitHub. |
| `/onboarding/wallet` | Formulario de URL. Estados: vacío, descubriendo, redirigiendo, verificado, error de hash, expirado. |
| `/settings/mode` | Dos acciones: `Buyer Mode` y `Seller Mode`. El modo vigente se lee del servidor (`await auth()`), no de un estado global de módulo. |

Cada página y cada Server Action comprueban la sesión dentro del propio handler. El middleware de Clerk queda mínimo (`clerkMiddleware()` en `middleware.ts`, porque la app es Next.js 15).

Mientras `BE-1` no publique el endpoint, `FE-1` apunta el formulario al handler MSW. El intercambio de adaptador no cambia los tipos Zod.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

No aplica en esta especificación. La verificación de billetera no monta `<Canvas>` ni lee el scroll. Queda prohibido, por la regla general del proyecto, guardar la posición de scroll en `useState`; esta pantalla no la necesita.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** Clerk v6 identifica al usuario. El `userId` de la sesión debe coincidir con `User.clerkId` antes de cambiar modo o wallet. Un usuario no lee ni reemplaza la wallet de otro (`403 WALLET_FORBIDDEN`).
- **Idempotencia e Integridad Criptográfica:** el `clientNonce` es único en `WalletVerificationChallenge`. Reusar un `interact_ref` ya consumido responde `409 GNAP_INTERACT_ALREADY_USED` y no vuelve a marcar la wallet. El hash se compara en tiempo constante. `🛡️` `BE-1` escribe y revisa `open-payments.service.ts`; la IA no lo genera. Secretos (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `OPEN_PAYMENTS_PRIVATE_KEY`) no se commitean.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Inicio de sesión Clerk
- **Origen:** `T-F1-FE1-01` / `.agents/CONTEXT.md` §4
- **Rol(es):** `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un visitante sin sesión
  - **Cuando** inicia sesión con Google o GitHub
  - **Entonces** Clerk emite sesión y la ruta `/onboarding/wallet` deja de responder como anónimo

### `RF-02` — Selector Buyer Mode / Seller Mode
- **Origen:** `T-F1-FE1-01` / `.agents/CONTEXT.md` §8.1
- **Rol(es):** `FE-1`, `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un usuario autenticado en `BUYER`
  - **Cuando** envía `ActiveModeSwitchSchema` con `SELLER`
  - **Entonces** `User.activeMode` pasa a `SELLER` y la otra orden en curso, si existe, no cambia de titular

### `RF-03` — Formulario de wallet sobre mock
- **Origen:** `T-F1-FE1-01`
- **Rol(es):** `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el adaptador MSW de descubrimiento
  - **Cuando** el usuario envía una URL `https://ilp.interledger-test.dev/...`
  - **Entonces** la UI muestra `assetCode` y el estado `PENDING_REDIRECT` sin llamar todavía al servicio real

### `RF-04` — Descubrimiento no autenticado
- **Origen:** `T-F1-BE1-01` / `.agents/CONTEXT.md` §4 y §5.5
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** una wallet address pública
  - **Cuando** `BE-1` ejecuta `walletAddress.get` con `UnauthenticatedClient`
  - **Entonces** persiste `authServer`, `resourceServer`, `assetCode` y `assetScale` y no usa la clave privada

### `RF-05` — Subject Grant y hash del callback
- **Origen:** `T-F1-BE1-01` / `.agents/CONTEXT.md` §4
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un reto `PENDING_REDIRECT` con `clientNonce` guardado
  - **Cuando** el IdP vuelve con `interact_ref` y `hash`
  - **Entonces** si el hash coincide se llama `grant.continue` y la wallet queda `isVerified = true`; si no coincide el estado pasa a `FAILED` y no se verifica

### `RF-06` — Reemplazo de la única wallet activa
- **Origen:** `.agents/CONTEXT.md` §1.2 / `T-F1-BE2-01`
- **Rol(es):** `BE-2`, `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un usuario que ya tiene una wallet activa verificada
  - **Cuando** verifica otra dirección
  - **Entonces** la anterior queda `isActive = false` y la nueva es la única activa, en la misma transacción

### `RF-07` — Webhook de sincronización Clerk
- **Origen:** `T-F1-BE2-01`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un evento `user.created` con firma válida
  - **Cuando** llega a `POST /api/v1/webhooks/clerk`
  - **Entonces** existe un `User` con ese `clerkId`, email y `activeMode = BUYER`
  - **Y** un evento con firma inválida responde `401` y no escribe filas

### `RF-08` — Bloqueo sin wallet verificada
- **Origen:** `.agents/CONTEXT.md` §4
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un usuario autenticado sin wallet `isVerified && isActive`
  - **Cuando** intenta publicar, ofertar o contratar
  - **Entonces** la API responde `403` con `WALLET_NOT_VERIFIED` y no crea `Gig`, `ClientTaskPublication` ni `TaskOrder`

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-03` | `Integración` | Con MSW, el formulario acepta una URL https y muestra `PENDING_REDIRECT`. Sin sesión, `/onboarding/wallet` no muestra el formulario. | `FE-1` |
| `TEST-02` | `RF-02` | `Integración` | `POST /api/v1/me/mode` persiste `SELLER` y un segundo GET lo devuelve. | `FE-1`, `BE-2` |
| `TEST-03` | `RF-04`, `RF-05` | `Integración` | Contra la Test Wallet, el hash correcto verifica y el hash alterado deja `FAILED` sin `grant.continue`. Lo ejecuta `BE-1` sobre el servicio manual. | `BE-1` |
| `TEST-04` | `RF-06`, `RF-08` | `Integración` | La segunda verificación deja una sola fila activa. Publicar sin wallet verificada devuelve `WALLET_NOT_VERIFIED`. | `BE-2` |
| `TEST-05` | `RF-07` | `Integración` | Firma Svix válida hace upsert; firma inválida no inserta. | `BE-2` |

Estas pruebas se ejecutan cuando la spec pase a implementación. No forman parte del turno de redacción.

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| URL que no es https | `WALLET_ADDRESS_INVALID` | Zod rechaza el cuerpo. No hay descubrimiento. |
| El IdP no vuelve y `expiresAt` pasó | `WALLET_CHALLENGE_EXPIRED` | El reto queda `EXPIRED`. La wallet anterior, si existía, sigue activa. |
| Hash distinto | `GNAP_HASH_MISMATCH` | Estado `FAILED`. No se llama `grant.continue`. |
| Caída entre desactivar la wallet vieja e insertar la nueva | `ACTIVE_WALLET_REPLACEMENT_ABORTED` | Rollback de la transacción. Sigue habiendo exactamente una activa. |
| Webhook repetido del mismo `clerkId` | `CLERK_USER_ALREADY_SYNCED` | Upsert idempotente. No duplica `User`. |
| `interact_ref` ya usado | `GNAP_INTERACT_ALREADY_USED` | No se vuelve a verificar ni se rota la wallet. |
| Firma de webhook ausente | `CLERK_WEBHOOK_INVALID_SIGNATURE` | `401` y cero escrituras. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes.

Decisiones operativas:

1. `🛡️` El archivo `apps/api/src/modules/open-payments/open-payments.service.ts` lo escribe y revisa `BE-1`. Esta spec fija entradas, salidas y el hash; no autoriza a la IA a generar ese módulo.
2. El callback canónico es `GET /api/v1/auth/wallet/callback` en NestJS. La UI de Next solo redirige al usuario hacia el `interactRedirectUri` del proveedor.
3. El modo por defecto al sincronizar un usuario nuevo es `BUYER`.
4. `verifyWebhook` es la verificación del webhook. No se añade `auth.protect()` a esa ruta.
5. Esta spec no se implementa en el turno en que se redacta.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` + equipo | Contrato de Clerk, selector de modo, descubrimiento GNAP, hash de callback y webhook. Sin implementación. |
| `1.1.0` | `2026-10-16` | `En Implementación` | `Antigravity` + equipo | Implementación frontend FE-1 y FE-2 (T-F1-FE1-01): Clerk v6 (/sign-in, /sign-up), middleware, selector interactivo Buyer/Seller (/settings/mode), ciclo de vida 6 estados y verificación GNAP (/onboarding/wallet) con adaptadores mock. |

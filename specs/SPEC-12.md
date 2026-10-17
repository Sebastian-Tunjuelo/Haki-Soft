# SPEC-12: Despliegue del MVP

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-12` |
| **Archivo** | `specs/SPEC-12.md` |
| **Fase de Desarrollo** | `Fase 5 — Despliegue` |
| **Estado del Ciclo SDD** | `Redactada (DRAFTED)` |
| **Roles Responsables** | `FE-1`, `FE-2`, `BE-1`, `BE-2`, `AI-1` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F5-ALL-02` |
| **Intervención Manual / IA Mínima-Nula** | `Sí (🛡️ claves Ed25519, token de escrow y secretos de entorno)` |
| **Dependencias SDD** | `SPEC-11` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

Esta spec deja el MVP desplegado para la demo del hackathon: web, API, Postgres, Redis, R2 y el consejero de imagen y texto apuntando a la Test Wallet. No cambia reglas de negocio. Cierra con salud del servicio y con las bitácoras al día.

### 1.2. En Alcance del MVP

- Variables de entorno a partir de `.env.example`, sin valores secretos en git (`T-F5-ALL-02`).
- `GET /api/v1/health` responde en el entorno desplegado.
- La web muestra el alta local y una orden de demostración solo si el recorrido de `SPEC-11` ya pasó.
- Registro final en `AI_USAGE.md`, `promptsAI_USAGE.md` y `prompts/AI_USAGE.md`.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se despliega la suscripción `Buyer AI Pro`.
- No se rota a producción de dinero real fuera de la Test Wallet salvo decisión explícita del líder.
- La IA no escribe ni lee la clave privada ni el token de escrow para "ayudar" al despliegue.
- Redactar esta spec no marca el deploy como hecho ni la spec como aprobada.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` §11 y `AGENTS.md` §2.
- **Invariantes del Módulo:**
  1. Ningún secreto entra al repositorio.
  2. El entorno de demo usa la misma fórmula 96/4 y la misma sesión local que el resto de las specs.
  3. `graphify-out/` no se publica dentro del repositorio.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Comprueba alta, catálogo y orden en la URL desplegada. | Puede seguir en local hasta `SPEC-11` | No |
| **`FE-2`** | Comprueba que la bóveda y los visores cargan en cliente sin error de WebGL obligatorio para el resto de la página. | Build local | No |
| **`BE-1`** | Coloca a mano la clave y el token del escrow en el entorno. | Test Wallet | `🛡️ Sí` |
| **`BE-2`** | Postgres, Redis, R2 y el proceso de la API. | `docker-compose` local no sustituye el deploy | No |
| **`AI-1`** | Confirma que el entorno tiene proveedor de `generateObject` solo para imagen y texto, y que las bitácoras mencionan ese uso. No despliega claves. | Suite de `packages/ai-advisor` | No |

### 3.1. Contrato frente a implementación

No hay contrato HTTP nuevo. El único acuerdo previo es la lista de variables, que ya vive en `.env.example` y no se duplica con valores. El deploy espera a `SPEC-11`. Hasta entonces cada rol publica su parte en local.

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

No se añaden esquemas. El health no devuelve datos de órdenes.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

El deploy aplica las migraciones ya existentes, incluida la de registro local y la del modelo v2. No se crea una migración en esta spec. No se ejecuta esa aplicación durante la redacción.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

`GET /api/v1/health` sigue público y no exige sesión. El resto de rutas exige la sesión local cuando su spec lo dice.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

Deben estar configurados el worker de preview, los cinco relojes, el bucket y el cliente de Open Payments. Si falta una variable, el proceso no arranca con un valor inventado. `AiAdvisorService` queda apagado de forma explícita si no hay clave de proveedor: las órdenes de imagen y texto siguen el flujo humano y el panel muestra ausencia de informe, sin caer el API.

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

La home desplegada enlaza a registro e inicio de sesión locales. Un fallo de API muestra error recuperable, no una sesión falsa.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

El canvas sigue con `ssr: false`. Si WebGL no está disponible, el resto de la página permanece usable. No se guarda el scroll en estado de React.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** las cookies de sesión son las de `SPEC-02`. No se añade un proveedor de login en el deploy.
- **Idempotencia e Integridad Criptográfica:** los secretos de Clerk no forman parte de este entorno. La clave `Ed25519` y `OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN` las carga `BE-1` fuera del chat y fuera de git.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Salud
- **Origen:** `T-F5-ALL-02`
- **Rol(es):** `BE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** el entorno desplegado con migraciones aplicadas
  - **Cuando** se llama a `GET /api/v1/health`
  - **Entonces** la respuesta es de éxito y no incluye secretos ni datos de usuarios

### `RF-02` — Alta local en la URL pública
- **Origen:** `T-F5-ALL-02` / `SPEC-02`
- **Rol(es):** `FE-1`, `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un visitante sin sesión
  - **Cuando** se registra con correo y contraseña
  - **Entonces** obtiene sesión y puede abrir el alta de wallet, sin un segundo proveedor de identidad

### `RF-03` — Secretos fuera de git
- **Origen:** `T-F5-ALL-02` / `AGENTS.md` §2.1
- **Rol(es):** `BE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el árbol que se despliega
  - **Cuando** se busca la clave privada o el token de escrow
  - **Entonces** no están en archivos versionados y el servicio manual los lee del entorno

### `RF-04` — Consejero ausente no tumba la demo
- **Origen:** `T-F5-ALL-02` / `SPEC-08`
- **Rol(es):** `AI-1`, `FE-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** un entorno sin clave de proveedor de IA
  - **Cuando** se entrega una imagen
  - **Entonces** la revisión humana sigue disponible y el panel no muestra un puntaje inventado

### `RF-05` — Bitácoras
- **Origen:** `T-F5-ALL-02` / `AGENTS.md` §2
- **Rol(es):** `AI-1`
- **Criterios de Aceptación (BDD):**
  - **Dado** el cierre del deploy
  - **Cuando** se revisan las tres bitácoras
  - **Entonces** el prompt de ese cierre está en `promptsAI_USAGE.md` y en `prompts/AI_USAGE.md`, y los archivos tocados están en `AI_USAGE.md`

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01` | `Integración` | Health del entorno desplegado, cuando exista. No se ejecuta en la redacción. | `BE-2` |
| `TEST-02` | `RF-02` | `BDD-E2E` | Registro local contra la URL de demo. | `FE-1` |
| `TEST-03` | `RF-03` | `Unitaria` | Búsqueda en el árbol de trabajo: sin token ni clave privada. | `BE-1` |
| `TEST-04` | `RF-04` | `Integración` | Entrega de imagen sin proveedor: revisión viva y sin puntaje falso. | `AI-1`, `FE-1` |
| `TEST-05` | `RF-05` | `Unitaria` | Las tres bitácoras contienen el mismo número de prompt de cierre. | `AI-1` |

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| Falta `DATABASE_URL` | `DEPLOY_CONFIG_MISSING` | El proceso no arranca. No se usa una base embebida silenciosa. |
| Migración fallida | `DEPLOY_MIGRATION_FAILED` | No se anuncia la demo. No se reescribe el historial de git para "arreglarlo". |
| WebGL caído en el navegador del jurado | `WEBGL_UNAVAILABLE` | La página sigue y muestra el contenido sin canvas. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

El proveedor de hosting no está elegido en `.agents/CONTEXT.md`. Esta spec no lo inventa. Sirve cualquier destino que cumpla los RF, cuando el líder lo nombre. Tampoco se cierra si la demo comprime los relojes: eso queda en `SPEC-11`.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `0.1.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` | Redacción inicial de `SPEC-12`: salud, sesión local, secretos fuera de git y bitácoras de cierre. Sin marcar el deploy como hecho. |

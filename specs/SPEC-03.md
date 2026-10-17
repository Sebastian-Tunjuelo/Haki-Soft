# SPEC-03: Arquitectura visual 3D vinculada al scroll

| Metadato | Valor |
| :--- | :--- |
| **ID de Especificación** | `SPEC-03` |
| **Archivo** | `specs/SPEC-03.md` |
| **Fase de Desarrollo** | `Fase 1 — Identidad multimoneda en América y motor 3D` |
| **Estado del Ciclo SDD** | `Testeada (TESTED)` |
| **Roles Responsables** | `FE-1`, `FE-2` |
| **Tareas Asociadas (`taskboard.md`)** | `T-F1-FE2-01`, `T-F1-FE2-02` |
| **Intervención Manual / IA Mínima-Nula** | `No aplica` |
| **Dependencias SDD** | `SPEC-01` |
| **Aprobada por / fecha** | `—` |

---

## 1. Propósito y Alcance del Módulo

### 1.1. Objetivo en el Aplicativo Final (MVP / Demo)

La landing tiene que recorrerse como una línea de tiempo, no como un ícono 3D suelto. Mientras la persona hace scroll, la cámara, la luz y una geometría de la custodia se mueven a 60–120 FPS sin que React vuelva a renderizar en cada frame. Esta spec deja el motor (`Lenis` + `GSAP ScrollTrigger` + `@react-three/fiber` v9 + `@react-three/drei` v10) y la primera escena hero. Las escenas de categorías y de bóveda llegan en `SPEC-04` y `SPEC-06`, reutilizando el mismo proveedor.

### 1.2. En Alcance del MVP

- Proveedor global de scroll suave en el layout de `apps/web` (`T-F1-FE2-01`).
- `<Canvas>` aislado en cliente, cargado con `next/dynamic(..., { ssr: false })`.
- Hero de la landing cuyo progreso lo marca `ScrollTrigger` con `scrub` (`T-F1-FE2-02`).
- Limpieza de triggers al cambiar de ruta mediante `useGSAP()`.
- Registro único de `ScrollTrigger` y del ticker de GSAP.

### 1.3. Fuera de Alcance del MVP (Límites Estrictos)

- No se implementa en el turno de redacción. El estado permanece `Redactada (DRAFTED)`.
- No se usa `<ScrollControls>` de drei como motor principal, ni Spline, ni `framer-motion-3d`.
- No se guarda la posición de scroll en `useState`.
- No incluye el visor protegido ni la bóveda de escrow. Esas escenas consumirán este proveedor más adelante.
- `motion` queda reservado a microinteracciones 2D si hicieran falta; no anima el WebGL.

---

## 2. Reglas de Dominio e Invariantes Vigentes

- **Referencias SSoT:** `.agents/CONTEXT.md` (§3.1, §3.2, §11), `planning/pbp-development.md` (Fase 1) y `planning/taskboard.md` (`T-F1-FE2-01`, `T-F1-FE2-02`).
- **Invariantes del Módulo:**
  1. Todo `<Canvas>` y todo `ScrollTrigger` declaran `"use client"` y entran por `next/dynamic` con `ssr: false`.
  2. `Lenis` avisa a ScrollTrigger (`lenis.on("scroll", ScrollTrigger.update)`) y el ticker de GSAP empuja a Lenis (`gsap.ticker.add((time) => lenis.raf(time * 1000))`) con `gsap.ticker.lagSmoothing(0)`.
  3. La animación muta `useRef` de `THREE.Group` o `THREE.Mesh` dentro de `useGSAP()`. Cero `useState` para la posición de scroll.
  4. Al desmontar la ruta, `useGSAP` mata tweens y triggers de ese scope. No quedan listeners de `scroll` huérfanos.
  5. El objetivo de cuadro es 60 FPS como mínimo y 120 FPS donde la pantalla lo permita. Si el dispositivo no tiene WebGL, se muestra el contenido HTML estático de la landing sin escena.

---

## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)

| Rol | Responsabilidad en Etapa Alfa (`DRAFTED`) y Beta (`IMPLEMENTED`) | Mecanismo de Desacoplamiento (Mocks / Adaptadores) | Frontera Manual `🛡️` |
| :--- | :--- | :--- | :--- |
| **`FE-1`** | Sin entregable directo en esta spec. El HTML de la landing (titular, bloques de texto) lo puede componer alrededor del hueco del canvas. | No espera la escena para maquetar formularios | No |
| **`FE-2`** | Proveedor Lenis, Canvas y hero (`T-F1-FE2-01`, `T-F1-FE2-02`). | La escena no lee la API. El progreso es el scroll del documento | No |
| **`BE-1`** | Sin entregable directo en esta spec. | No | No |
| **`BE-2`** | Sin entregable directo en esta spec. | No | No |
| **`AI-1`** | Sin entregable directo en esta spec. La escena no llama a `AiAdvisorService`. | No | No |

---

## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)

### 4.1. Esquemas Zod y Generadores de Mocks (`packages/shared-schemas`)

No aplica un esquema de negocio nuevo. La hero de Fase 1 no representa una orden. Cuando `SPEC-06` ate la bóveda al estado del escrow, el input visual será `TaskLifecycleStatusEnum` ya definido en `SPEC-01`. Esta spec no lo consume todavía.

### 4.2. Entidades en PostgreSQL + Prisma 6 (3NF Libre de *God-Entities*) y Restricciones `CHECK` SQL

No aplica en esta especificación. No hay tablas de escena ni de posición de scroll.

---

## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas

### 5.1. Endpoints REST / Webhooks (`apps/api`)

No aplica en esta especificación. La landing hero no llama a `/api/v1`.

### 5.2. Workers BullMQ, Cloudflare R2, Open Payments o `AiAdvisorService`

No aplica en esta especificación. No hay relojes, objetos R2 ni pagos en la escena base.

Paquetes que `FE-2` instalará al implementar, en las versiones de `.agents/CONTEXT.md` §11:

| Paquete | Versión |
| :--- | :--- |
| `gsap` | `3.12.5` o superior, con plugin `ScrollTrigger` |
| `@gsap/react` | `2.1.1` |
| `lenis` | `1.1.x` |
| `three` | `0.170.0` |
| `@react-three/fiber` | `9.0.x` |
| `@react-three/drei` | `10.0.x` |

---

## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido

### 6.1. Rutas, Componentes y Estados de Interfaz (`FE-1`)

`FE-1` no construye la escena. La ruta `/` conserva el HTML de la landing (titular y bloques) visible aunque el canvas tarde o falte WebGL. Estados de la zona 3D, responsabilidad de `FE-2` pero visibles en la misma página:

- **Listo:** el canvas ocupa la sección hero.
- **Sin WebGL:** el hueco muestra el mismo titular en HTML y no intenta crear un renderer.
- **Cargando el chunk:** `next/dynamic` muestra un alto reservado (`min-height`) para limitar el salto de layout. No es un spinner que bloquee el texto.

### 6.2. Escenas 3D Vinculadas al Scroll y Visores `Protected Preview` (`FE-2`)

Archivos previstos (no creados en la redacción):

- `apps/web/app/providers/smooth-scroll.tsx` — `"use client"`. Instancia `Lenis`, registra `ScrollTrigger` una sola vez y conecta el ticker. El `useGSAP` (o el efecto de limpieza equivalente del hook) destruye `lenis` y los triggers del scope al desmontar.
- `apps/web/app/scenes/hero-scene.tsx` — `"use client"`. `<Canvas>` con una cámara y un grupo. `useGSAP` crea `gsap.timeline({ scrollTrigger: { trigger, start: "top top", end: "bottom top", scrub: 1, pin: true } })` y anima `groupRef.current.rotation` / `position`. El callback no llama a `setState`.
- `apps/web/app/scenes/hero-scene-loader.tsx` — Server Component que hace `dynamic(() => import("./hero-scene"), { ssr: false })`.

Reglas de implementación:

1. `gsap.registerPlugin(ScrollTrigger, useGSAP)` una vez en el proveedor.
2. No animar el nodo pineado; animar hijos dentro del grupo.
3. `ScrollTrigger.defaults` no sustituye la limpieza por ruta: cada escena pasa `scope` a `useGSAP`.
4. Prohibido `useState` de la posición de scroll y prohibido un listener de `scroll` que haga `setState`.
5. `prefers-reduced-motion: reduce` deja la escena en el frame inicial y desactiva `scrub`. El contenido HTML sigue en orden.

El visor protegido no aplica en esta especificación.

---

## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection

- **Autenticación y Autorización:** la hero es pública. No lee sesión ni wallets. No se incrustan tokens en el canvas.
- **Idempotencia e Integridad Criptográfica:** no hay operaciones financieras. El aislamiento `ssr: false` evita ejecutar WebGL en el proceso Node de Next.js.

---

## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)

### `RF-01` — Proveedor Lenis sincronizado con ScrollTrigger
- **Origen:** `T-F1-FE2-01` / `.agents/CONTEXT.md` §3.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** el layout de `apps/web` con el proveedor montado
  - **Cuando** el documento recibe scroll
  - **Entonces** `Lenis` actualiza `ScrollTrigger` y el ticker de GSAP llama a `lenis.raf`, con `lagSmoothing(0)`

### `RF-02` — Canvas solo en cliente
- **Origen:** `T-F1-FE2-01` / `.agents/CONTEXT.md` §3.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** la página `/`
  - **Cuando** Next renderiza el HTML en el servidor
  - **Entonces** el módulo de la escena no se evalúa en Node y el canvas aparece solo después de la hidratación, vía `dynamic` con `ssr: false`

### `RF-03` — Sin re-render por posición de scroll
- **Origen:** `T-F1-FE2-02` / `.agents/CONTEXT.md` §3.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** la hero en marcha
  - **Cuando** el usuario recorre la sección pineada
  - **Entonces** la rotación del grupo cambia por mutación del `ref` y el componente de la escena no ejecuta `setState` en el callback de scroll

### `RF-04` — Hero a 60 FPS o más
- **Origen:** `T-F1-FE2-02`
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un escritorio con WebGL y la pestaña en primer plano
  - **Cuando** se recorre la hero durante al menos dos segundos de scroll continuo
  - **Entonces** el cuadro medio medido en el renderer se mantiene en 60 FPS o por encima, con tope de 120 FPS si la pantalla lo ofrece

### `RF-05` — Limpieza al cambiar de ruta
- **Origen:** `T-F1-FE2-01` / `.agents/CONTEXT.md` §3.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** la landing con triggers activos
  - **Cuando** la navegación desmonta el proveedor
  - **Entonces** `useGSAP` revierte el contexto, `lenis.destroy()` corre y un regreso a `/` no duplica listeners

### `RF-06` — Degradación sin WebGL y con movimiento reducido
- **Origen:** `.agents/CONTEXT.md` §3.2
- **Rol(es):** `FE-2`
- **Criterios de Aceptación (BDD):**
  - **Dado** un navegador sin WebGL o con `prefers-reduced-motion: reduce`
  - **Cuando** se abre `/`
  - **Entonces** el titular HTML sigue visible, no se crea un renderer en el caso sin WebGL, y con movimiento reducido la escena permanece en el frame inicial

---

## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)

| ID Prueba | RF Cubiertos | Nivel (`Contrato Zod` / `Unitaria` / `Integración` / `BDD-E2E`) | Descripción de la Verificación | Rol Responsable |
| :--- | :--- | :--- | :--- | :--- |
| `TEST-01` | `RF-01`, `RF-05` | `Integración` | Montar y desmontar el proveedor en jsdom (o en el navegador) y contar listeners: tras el desmontaje no queda un segundo `ScrollTrigger` vivo. | `FE-2` |
| `TEST-02` | `RF-02` | `Integración` | El HTML servido por Next no contiene el markup de `<canvas>` de la hero. Tras hidratar, el canvas existe. | `FE-2` |
| `TEST-03` | `RF-03` | `Unitaria` | Revisión estática: el callback de `useGSAP` de la hero no guarda la posición del scroll en estado de React. La mutación usa `groupRef`. | `FE-2` |
| `TEST-04` | `RF-04`, `RF-06` | `BDD-E2E` | En el navegador, recorrer la hero y leer FPS del renderer (≥ 60). Repetir con movimiento reducido y comprobar que el frame no sigue al scroll. | `FE-2` |

Estas pruebas se escriben al implementar. La redacción no las ejecuta.

---

## 10. Casos de Borde, Manejo de Errores y Rollbacks

| Caso de Borde / Fallo | Código de Error (`code`) | Respuesta Determinista del Sistema |
| :--- | :--- | :--- |
| WebGL no disponible | `WEBGL_UNAVAILABLE` | No se monta `<Canvas>`. El HTML de la landing permanece. |
| El chunk 3D falla al descargar | `HERO_SCENE_CHUNK_FAILED` | El hueco reservado muestra el titular estático. El resto de la página sigue usable. |
| Doble montaje del proveedor en la misma ruta | `SCROLL_PROVIDER_DUPLICATED` | Un guard de módulo reutiliza la instancia de `Lenis` en lugar de registrar otro ticker. |
| Cambio de ruta a mitad de scroll | `SCROLL_TRIGGER_LEAK` | `useGSAP` limpia el scope antes de que la ruta nueva registre los suyos. |
| `prefers-reduced-motion` | `MOTION_REDUCED` | `scrub` no se activa. La escena queda en el frame 0. |

---

## 11. Preguntas Abiertas y Decisiones Técnicas Operativas

Sin preguntas abiertas bloqueantes.

Decisiones operativas:

1. El motor es `Lenis` + `GSAP ScrollTrigger`. `<ScrollControls>` de drei no dirige el scroll de la página.
2. El loader de la hero es el único punto que importa la escena, siempre con `ssr: false`.
3. El pin de la hero usa `start: "top top"` y `end: "bottom top"` con `scrub: 1`. Los valores finos de cámara se ajustan al implementar sin cambiar el contrato de “mutar refs, no estado”.
4. No se añaden dependencias 3D al `package.json` en el turno de redacción.
5. La medición de FPS de `RF-04` usa el promedio del loop del renderer durante el scroll, no un número fijo incrustado en el código.

---

## 12. Registro de Cambios y Trazabilidad de Gobernanza IA

| Versión | Fecha | Estado | Autor / Herramienta | Resumen de Cambios |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | `2026-10-16` | `Redactada (DRAFTED)` | `Cursor` + `FE-2` | Contrato del proveedor Lenis, del canvas aislado y de la hero sin re-renders. Sin implementación. |
| `1.1.0` | `2026-10-16` | `Testeada (TESTED)` | `Antigravity` + `FE-1` / `FE-2` | Implementación completa del motor 3D y scroll: proveedor global `SmoothScrollProvider` (Lenis + GSAP ScrollTrigger ticker con lagSmoothing 0), componente de escena `HeroScene` en Three.js / R3F / Drei con mutación directa de `useRef` (zero-setState), `HeroSceneLoader` con dynamic ssr:false y placeholder de 480px, maquetación de landing enriquecida por FE-1 (timeline de estados y split 96/4), y suite de pruebas unitarias/integración con Vitest (8/8 pruebas verdes). |
| `1.1.1` | `2026-10-16` | `Testeada (TESTED)` | `Cursor` | Verificación de integración: la hero, el loader y el proveedor de scroll no llaman a `/api/v1`. El progreso sigue siendo el scroll del documento. |
| `1.1.2` | `2026-10-17` | `Testeada (TESTED)` | `Cursor` | Revisión documental: `check-spec.mjs` en 0 errores. El contrato de scroll por `useRef` no cambia. |

# TaskStream AI — Contexto Maestro del Proyecto y Especificación General (SDD + BDD)

> **Propósito de este Documento (`CONTEXT.md`):** Este archivo constituye la **Única Fuente de Verdad (Single Source of Truth - SSoT)** de **TaskStream AI**. Está diseñado para servir como contexto fundacional vivo a los **Agentes de IA de Desarrollo** y al equipo humano de ingeniería (5 desarrolladores en células **2 Frontend / 2 Backend / 1 IA**) bajo la metodología **SDD Evolutivo (Spec-Driven Development)** complementada con criterios **BDD (Behavior-Driven Development)** y regida por la **Política Inmutable de Uso y Trazabilidad de IA**.

---

## 0. Política Inmutable de Uso y Trazabilidad de IA (Fuente de Verdad de Gobernanza)

De conformidad con las premisas del proyecto y la [Política de Uso de IA del Hackathon de Interledger](https://interledger.org/es/hackathon/ai-policy/), **toda acción, decisión arquitectónica, creación o modificación de archivos realizada por una herramienta de IA dentro de este repositorio debe quedar registrada obligatoriamente y sin excepción** en los artefactos oficiales de trazabilidad:

1. **Archivo Raíz [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md):**
   * **Herramienta(s) de IA utilizada(s):** Se debe indicar únicamente la herramienta de IA empleada (ej. **`Antigravity`**), **sin añadir nombres específicos de modelos internos ni niveles de esfuerzo**.
   * **Propósito y Áreas de Aplicación:** Se debe detallar para qué se utilizó la herramienta de IA desglosado por área del proyecto (`Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`, etc.).
   * **Registro Exacto de Archivos Modificados por la IA:** Cada vez que la IA cree, edite o refactorice cualquier archivo del proyecto, debe actualizar la tabla de archivos intervenidos en [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md).
   * **Archivos y Componentes con Uso de IA Mínimo o Nulo:** Se deben especificar explícitamente los archivos donde la intervención de IA es mínima o nula y predomina la autoría/verificación manual del equipo (por ejemplo, el archivo del servicio nuclear de pagos abiertos `apps/api/src/modules/open-payments/open-payments.service.ts` / `escrow-payment.service.ts`, la configuración de firmas criptográficas `Ed25519` / credenciales de Rafiki y archivos de bloqueo como `skills-lock.json`).
2. **Registro Íntegro de Prompts en [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) y [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md):**
   * **Todos y cada uno de los prompts enviados por el equipo a la herramienta de IA, sin excepción**, deben añadirse con su **texto literal completo (no solo un resumen)**.
   * Cada entrada de prompt debe incluir obligatoriamente:
     1. **Fecha/Número de Secuencia del Prompt.**
     2. **Área del Proyecto donde toma lugar** (`Planeación`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests`, etc.).
     3. **Breve resumen acerca de su funcionalidad y decisiones aplicadas.**
     4. **Archivos creados o modificados** como resultado del prompt.
     5. **Texto íntegro (verbatim) del prompt enviado a la IA.**
   * Para garantizar compatibilidad total tanto con la instrucción directa del proyecto (`promptsAI_USAGE.md` en la raíz) como con la estructura de carpetas del jurado de Interledger (`/prompts/AI_USAGE.md`), ambos archivos se mantienen sincronizados en cada actualización.

---

## 1. Visión General y Problema Verificable

### 1.1. Resumen Ejecutivo

**TaskStream AI** es una plataforma marketplace híbrida de servicios digitales y publicación de encargos (inspirada tanto en el catálogo de paquetes *Gigs* de [Fiverr](https://www.fiverr.com/) como en tablones de licitación con negociación directa), diseñada para conectar emprendedores y trabajadores autónomos (*Freelancers / Sellers*) con empresas o personas (*Contratistas / Solicitantes / Buyers*) a lo largo de **todo el continente de América (Norteamérica, Centroamérica, el Caribe y Sudamérica)**. Su objetivo central es democratizar el trabajo digital transfronterizo mediante pagos instantáneos, **diversificación multimoneda continental** a bajo costo y baja comisión sobre el estándar abierto [Open Payments](https://interledger.org/es/tech/open-payments/) e [Interledger Protocol (ILP)](https://interledger.org/es/hackathon/overview/), asegurados por un **Bloqueo Condicional de Fondos de Un Solo Bloque (Escrow Único)** y asistidos por un **Consejero de IA** que audita de forma consultiva las entregas.

### 1.2. Problema Verificable, Alcance Continental y Propuesta de Valor

Los trabajadores digitales independientes y contratistas en todo el continente americano enfrentan comisiones acumuladas del 10% al 20% en plataformas tradicionales (sumando tarifas de intermediación, costos bancarios Swift y spreads cambiarios abusivos) y tiempos de liquidación de días o semanas. **TaskStream AI** aprovecha el enrutamiento de paquetes de valor de **Open Payments** para conectar billeteras en múltiples divisas del continente (`USD`, `CAD`, `MXN`, `COP`, `BRL`, `ARS`, `CLP`, `PEN`, `UYU`, `CRC`, `DOP`, `GTQ`, entre otras) con liquidación inmediata y costos de conversión mínimos.

**Reglas Inmutables de Valor en TaskStream AI:**

* **Pago Único en un Solo Bloque (Sin Hitos ni Pagos Divididos):** Todo encargo se financia mediante **un único bloqueo del 100% del presupuesto acordado** al inicio del trabajo y se liquida en **un único desembolso** cuando finaliza el ciclo de entrega y la ventana final de reclamaciones de 30 minutos. No existen pagos fraccionados, entregas parciales pagadas ni acuerdos porcentuales divididos.
* **Comisión Transparente del 4% (Desembolso 96% / 4%):** La plataforma aplica una comisión plana reducida del **4%** sobre el valor acordado para diferenciarse competitivamente de las pasarelas y marketplaces tradicionales. Si el encargo acordado es de **\$100.00 USD**, el Escrow recibe **\$100.00 USD**, transfiere **\$96.00 USD (96%)** al Freelancer al liberarse el pago y retiene **\$4.00 USD (4%)** para TaskStream.
* **Costo de Conversión de Divisa (FX Doble) Asumido por el Cliente (Buyer):** El comprador asume siempre el costo de conversión cambiaria tanto al fondear el Escrow (desde su divisa local hacia `USD`) como en el escenario de un reembolso de vuelta a su billetera (desde `USD` hacia su divisa local).
* **Alcance de Auditoría de IA en el MVP (Exclusivo para Imagen y Texto) y Suscripción Planteada a Futuro:** En el MVP, el Consejero de IA (`AiAdvisorService`) **únicamente auditará y asesorará tareas que tengan que ver con IMAGEN y TEXTO**. El resto de tipos de entregables (video, audio, archivos de código complejos, etc.) así como el modelo de suscripción opcional (`Buyer AI Pro Subscription`) **quedan planteados como visión a futuro, pero no entrarán dentro del MVP**. Para crear `AiAdvisorReportSchema`, es requisito concretar con claridad en su especificación (`SPEC-08.md`) el **contrato exacto de entrada que recibirá `AiAdvisorService`**.

---

## 2. Metodología de Ingeniería: SDD Evolutivo + BDD y Estructura del Equipo (2 / 2 / 1)

### 2.1. Metodología SDD (Living Spec-Driven Development) + BDD (Behavior-Driven Development)

El desarrollo del proyecto se rige por especificaciones vivas (`SPEC-00.md` para la creación de la carpeta `specs` y su `README.md`, hasta `SPEC-12.md` para el `Deploy`) que evolucionan de forma sincronizada con el contexto y la implementación real del aplicativo:

1. **Ciclo de Vida Evolutivo de las Especificaciones (4 Estados):** Las especificaciones técnicas (`SPEC-00.md` a `SPEC-12.md`) evolucionan conforme se implementan las funcionalidades, siguiendo estrictamente el flujo:
   * **Paso 1 — `Spec Redactada` (`DRAFTED`):** Se estructura el contrato inicial (modelos de base de datos, esquemas de entrada/salida y reglas de negocio) a partir del contexto vigente.
   * **Paso 2 — `Spec Implementada` (`IMPLEMENTED`):** La especificación se construye y ajusta en paralelo a la escritura del código en Frontend, Backend e IA, evolucionando orgánicamente cada vez que emergen decisiones técnicas durante el desarrollo.
   * **Paso 3 — `Spec Testeada` (`TESTED`):** Se valida la implementación contra los escenarios de negocio y pruebas de integración/E2E, retroalimentando la especificación para cubrir todos los casos borde descubiertos.
   * **Paso 4 — `Spec Aprobada` (`APPROVED`):** Con las pruebas pasando al 100% y la documentación sincronizada con el código real, la especificación queda aprobada y consolidada como parte de la fuente de verdad.
2. **BDD (Desarrollo Guiado por Comportamiento):** Cada especificación incluye criterios de aceptación en sintaxis **Gherkin (`Dado / Cuando / Entonces` — `Given / When / Then`)**, traducibles directamente en pruebas automatizadas.
3. **Avance Basado en Funcionalidades Completadas (Feature-Gated Progression):** Las fases del proyecto **no se miden por tiempo**, sino exclusivamente por **funcionalidades cuyas specs hayan completado el ciclo (`Redactada -> Implementada -> Testeada -> Aprobada`)**.

### 2.2. Topología del Equipo de Desarrollo (5 Desarrolladores: 2 / 2 / 1)

| Célula / Rol | Integrantes | Responsabilidades Nucleares en el Monorepo (`apps/` y `packages/`) |
| :---- | :---- | :---- |
| **Equipo Frontend** | **2 Desarrolladores** (`FE-1`, `FE-2`) | **`FE-1` (Core UI, Marketplace & Negociación):** Catálogo de las 6 categorías, tablón de tareas publicadas por clientes, sala de negociación de presupuesto, gestión de extensión única (hasta 7 días adicionales con ventana de decisión de 24h), revisión de entregas (32h con máx. 2 correcciones globales), ventana final de reclamaciones (30 min), perfiles multimoneda y dashboards. **`FE-2` (Experiencia 3D Scroll-Driven & Visor Protegido):** Narrativa visual e interfaz inmersiva con animaciones 3D vinculadas al scroll (**`GSAP ScrollTrigger` + `Lenis` + `@react-three/fiber v9`**) y visores del módulo *Protected Preview* para los 6 tipos de archivo. |
| **Equipo Backend** | **2 Desarrolladores** (`BE-1`, `BE-2`) | **`BE-1` (Pagos Open Payments & Ciclo de Vida Financiero):** Integración `@interledger/open-payments` (con intervención de IA mínima/nula en el servicio core de pagos abiertos), bloqueo único en `taskstream-escrow`, desembolso **96% / 4%**, reembolsos automáticos y manuales del **100%** (por rechazo o falta de respuesta en 24h a solicitud de extensión, por no entregar dentro de la extensión aprobada o por fallo administrativo en disputa), ventana final de reclamaciones de 30 min e idempotencia. **`BE-2` (Storage R2 Sin Límite MVP, Workers & Timers BullMQ):** Subida directa con Presigned URLs a Cloudflare R2, colas BullMQ + Redis para marcas de agua (`sharp`, `ffmpeg`) y temporizadores independientes (**7 días** de entrega inicial, **24 horas** de respuesta a extensión, **hasta 7 días adicionales** de extensión única, **32 horas** de revisión por entrega y **30 minutos** de ventana final de reclamaciones). |
| **Equipo IA** | **1 Desarrollador** (`AI-1`) | **`AI-1` (Orquestador Consultivo para Imagen y Texto & Contratos IA):** Especificación en `SPEC-08.md` del contrato exacto de entrada que recibe `AiAdvisorService` (`AiAdvisorInputContractSchema`) y su salida (`AiAdvisorReportSchema`), auditar y asesorar en el MVP **exclusivamente tareas de imagen y texto**, validación determinista pre-IA y defensas contra *Prompt Injection*. |


---

## 3. Decisión Arquitectónica: Next.js 15/16 + Ecosistema de Animación 3D Basado en ScrollTrigger

### 3.1. Re-evaluación de Librerías Frontend y Animaciones 3D (Enfoque ScrollTrigger)

El objetivo de las animaciones 3D en **TaskStream AI** **no** es renderizar un avatar o ícono 3D aislado tipo MetaMask que solo siga el cursor, sino construir una **interfaz altamente llamativa impulsada por el desplazamiento del usuario (Estilo `ScrollTrigger` + Escenas 3D Interactivas)**. A medida que el usuario hace scroll por la plataforma (Landing Page, exploración del flujo de custodia Interledger, transiciones de estado del Escrow y paneles del Marketplace), la cámara 3D, la iluminación, las geometrías espaciales y los bloques del DOM se sincronizan en una línea de tiempo continua.

A partir del requisito de actualizar **Next.js a una versión entre la 15 y la 16**, se re-evaluaron todas las alternativas del ecosistema actual:

| Opción Evaluada | Compatibilidad con Next.js 15/16 + React 19 | Capacidad para 3D + ScrollTrigger en UI | Veredicto |
| :---- | :---- | :---- | :---- |
| **1. `GSAP (v3.12+)` (`ScrollTrigger`) + `Lenis` + `@react-three/fiber (v9)` + `@react-three/drei (v10)` + `three`** | **Alta y Nativa:** `@react-three/fiber v9` y `@react-three/drei v10` fueron reescritos específicamente para **React 19** y **Next.js 15/16 App Router** (aislados en Client Components con `next/dynamic(..., { ssr: false })`). | **Superior (Estándar Awwwards):** `Lenis` suaviza la inercia del scroll nativo y sincroniza el `raf` con `GSAP ScrollTrigger`, permitiendo fijar secciones del DOM (`pin: true`) mientras `gsap.timeline({ scrollTrigger: { scrub: 1 } })` interpola directamente las propiedades (`position`, `rotation`, `scale`, `camera`) de los objetos de Three.js a 60–120 FPS sin causar re-renders en React. | **ELEGIDA (Stack Oficial)** |
| **2. `@react-three/drei` (`<ScrollControls>`) sin GSAP** | Alta con R3F v9. | **Limitada para UI Híbrida:** Crea un contenedor de scroll virtual separado dentro del `<Canvas>`, lo que dificulta sincronizar componentes complejos de `shadcn/ui`, tablas y formularios del DOM real con la escena 3D. | **Descartada como motor principal** (se prefiere el scroll nativo del DOM controlado por `Lenis` + `GSAP ScrollTrigger`). |
| **3. `Three.js` Imperativo Puro + `GSAP ScrollTrigger`** | Total (agnóstico a React). | **Alta, pero verbosa:** Obliga a gestionar manualmente el ciclo de vida del `WebGLRenderer`, resize listeners, carga de texturas y limpieza de memoria en cada cambio de ruta del App Router de Next.js 15/16. | **Complementaria** (R3F v9 expone las referencias directas de `THREE.Mesh` y `THREE.Group` a GSAP sin perder declaratividad). |
| **4. `Spline` (`@splinetool/react-spline`)** | Media (paquetes pesados en cliente). | **Baja flexibilidad programática:** Depende de escenas externas pre-empaquetadas y ofrece menor control fino para atar estados dinámicos del Escrow o timelines complejos de `ScrollTrigger` con el DOM. | **Descartada.** |
| **5. `Motion` (`framer-motion v12`)** | Alta con React 19. | **Excelente para micro-interacciones 2D del DOM, insuficiente para WebGL 3D:** `framer-motion-3d` fue descontinuado para React 19. Se reserva `motion` opcionalmente solo para transiciones 2D de modales/tarjetas si se requiere, dejando el scroll y el 3D a **GSAP**. | **Secundaria (solo UI 2D).** |

### 3.2. Decisión Definitiva del Stack Frontend y 3D

> **Se establece el stack de Frontend en `Next.js 15.5.x` (compatible con las APIs asíncronas y Turbopack de la línea 15–16) + `React 19.0.0`, integrando `@react-three/fiber v9.0.x` + `@react-three/drei v10.0.x` + `Three.js r170+` orquestados por `GSAP v3.12.5+` (`ScrollTrigger` + `@gsap/react`) y `Lenis v1.1.x` para Smooth Scrolling.**

**Reglas de Arquitectura para `FE-2` y Agentes de IA en Next.js 15/16:**

1. **Aislamiento de Cliente y Hidratación Segura:** Todo componente que instancie `<Canvas>` de R3F o registre `ScrollTrigger` debe declarar `"use client"` y cargarse en las páginas del App Router mediante `next/dynamic(() => import(...), { ssr: false })` para evitar ejecuciones de WebGL en el servidor Node.js.
2. **Sincronización `Lenis` + `GSAP ScrollTrigger`:** El layout principal inicializa `Lenis`, enlaza `lenis.on('scroll', ScrollTrigger.update)` y conecta el reloj de GSAP (`gsap.ticker.add((time) => lenis.raf(time * 1000))` con `gsap.ticker.lagSmoothing(0)`).
3. **Cero Re-renders de React durante el Scroll:** Está prohibido guardar la posición de scroll en `useState`. Las animaciones de `ScrollTrigger` mutan directamente los `useRef<THREE.Group | THREE.Mesh>()` dentro del hook `useGSAP()` (que limpia automáticamente los triggers al desmontar rutas en Next.js 15/16).

---

## 4. Gestión de Identidad, Alcance Continental y Verificación de Billetera

* **Uso de Wallet Addresses Multimoneda en Toda América (Open Payments v7.4.0):** Cada contratista y freelancer del continente americano se identifica mediante su **Wallet Address** con formato URL HTTPS estándar (ej. `https://ilp.interledger-test.dev/usuario-latam`), operando de forma nativa con la moneda configurada en su proveedor de billetera (`USD`, `CAD`, `MXN`, `COP`, `BRL`, `ARS`, `CLP`, `PEN`, `UYU`, `CRC`, `DOP`, `GTQ`, `EUR`, etc.).
* **Protocolo de Verificación Criptográfica de Posesión (`Subject Grant` — Guía Oficial Open Payments):**
  1. **Autenticación Social (Clerk):** El usuario inicia sesión con Google o GitHub mediante Clerk (`clerkUserId`).
  2. **Descubrimiento de Metadatos (`walletAddress.get`):** Al registrar su `walletAddress`, el backend en NestJS consulta `GET {walletAddress}` mediante `unauthenticatedClient.walletAddress.get({ url })` para descubrir el `authServer`, el `resourceServer`, el `assetCode` (moneda local del usuario) y el `assetScale`.
  3. **Desafío GNAP Interact con `subject.sub_ids`:** El backend solicita al `authServer` una concesión interactiva sin movimiento de fondos (`client.grant.request`) enviando `subject: { sub_ids: [{ format: 'uri', id: userWalletAddress }] }` y un `interact` con `start: ['redirect']` y `finish: { method: 'redirect', uri: callbackUrl, nonce: clientNonce }`.
  4. **Confirmación de Titularidad y Verificación de Hash:** El usuario aprueba el consentimiento en el IdP de su proveedor de billetera (Interledger Test Wallet / Rafiki). Al volver al callback de NestJS (`/api/v1/auth/wallet/callback?interact_ref=...&hash=...`), el backend verifica criptográficamente el hash (`SHA-256(clientNonce + "\n" + finishNonce + "\n" + interact_ref + "\n" + authServerUrl)`), ejecuta `client.grant.continue` para confirmar la respuesta `subject` y marca la billetera como `isVerified: true` en PostgreSQL. Ninguna billetera con `isVerified: false` puede publicar tareas, negociar presupuestos, recibir desembolsos ni contratar encargos.

---

## 5. Flujos de Negocio, Negociación, Plazos y Orquestación de Pagos (Open Payments API)

La plataforma **TaskStream AI** opera su propia billetera oficial en Interledger (`https://ilp.interledger-test.dev/taskstream-escrow`) que actúa como **cuenta de custodia temporal con bloqueo condicional de fondos**.

### 5.1. Reglas Financieras y Operativas Inmutables

1. **Token de Acceso de Larga Duración y Rotación Segura en Rafiki / Test Wallet:** Para ejecutar desembolsos y reembolsos automáticos desde `taskstream-escrow` sin intervención manual en cada transacción, el backend de NestJS utiliza un **Token de Acceso de Larga Duración (`OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN`)** preconfigurado en la Test Wallet / instancia Rafiki junto con su par de claves `Ed25519` (`keyId` + `privateKey` para firmas HTTP RFC 9421), empleando `client.token.rotate` cuando se requiera renovar la vigencia del token.
2. **Modalidad de Pago Único (Single-Block Escrow):** Todo encargo se paga y bloquea en **una sola exhibición por el 100% del monto acordado** antes de iniciar la ejecución de la tarea. No existen pagos parciales ni hitos divididos.
3. **Conversión de Divisa (FX Doble) Asumida Íntegramente por el Buyer:**
   * **En el Fondeo (Entrada al Escrow):** Los encargos se referencian en `USD` en la cuenta `taskstream-escrow`. NestJS crea un `IncomingPayment` en `taskstream-escrow` por el 100% del valor acordado (ej. `\$100.00 USD`) y solicita un `Quote` desde la `walletAddress` del Buyer fijando `receiveAmount = \$100.00 USD`. El Buyer absorbe el costo de conversión desde su moneda local (`MXN`, `COP`, `BRL`, `ARS`, `CAD`, etc.).
   * **En el Reembolso (Salida del Escrow hacia el Buyer):** Si una tarea termina en reembolso (por vencimiento de plazo sin entrega, por re-publicación de la tarea, por rechazo o expiración de 24h en solicitud de prórroga, o por fallo del Administrador en una apelación), `taskstream-escrow` crea un `Quote` fijando `debitAmount = \$100.00 USD` (el 100% exacto custodiado en el Escrow). El Buyer recibe en su billetera el monto resultante tras la segunda conversión cambiaria (`USD -> Divisa del Buyer`), asumiendo así el costo de la doble conversión sin generar déficit en la cuenta de custodia.
4. **Distribución en el Desembolso (96% Freelancer / 4% Plataforma):** Al completarse satisfactoriamente un trabajo y cerrarse la ventana final de apelación de 30 minutos, el backend ejecuta desde `taskstream-escrow` una transferencia (`OutgoingPayment`) por el **96% del valor bloqueado (`\$96.00 USD`)** hacia la `walletAddress` del Freelancer (convertido automáticamente a su moneda local por la red Interledger) y retiene el **4% (`\$4.00 USD`)** como comisión de plataforma.

---

### 5.2. Flujo Preliminar (Etapa 0): Publicación de Tarea por el Cliente y Negociación de Presupuesto

Además de la contratación directa de *Gigs* publicados por los freelancers, **TaskStream AI** incorpora un flujo completo de **Publicación de Tarea por el Solicitante y Negociación a la Baja**:

1. **Publicación de la Tarea por el Solicitante (Buyer A):**
   * El Cliente (A) publica una tarea/trabajo en el tablón del Marketplace indicando: **Categoría** (1 de las 6 del MVP), **Título y Descripción detallada**, **Criterios de Aceptación preliminares**, **Plazo de Entrega requerido (máximo 7 días)** y un **Presupuesto Inicial Máximo (`initialBudgetUSDInCents`)**.
   * La publicación queda activa en estado `OPEN_FOR_PROPOSALS`.
2. **Contacto y Propuesta del Freelancer (Seller B):**
   * Un Freelancer (B) explora las tareas abiertas, visualiza la publicación del Cliente (A) e inicia un hilo de contacto/negociación (`NegotiationThread`).
   * El Freelancer (B) puede aceptar el presupuesto dispuesto originalmente por el Cliente (A) o **negociar el precio proponiendo un monto menor** (`proposedBudgetUSDInCents <= initialBudgetUSDInCents`). **Regla de Negocio Estricta:** El valor negociado siempre debe ser menor (o igual, si se acepta sin rebaja) al presupuesto planteado inicialmente por el cliente; el sistema rechaza cualquier contraoferta que supere el `initialBudgetUSDInCents`.
3. **Bifurcación de la Negociación en 2 Caminos:**
   * **Camino 1 — Acuerdo de Presupuesto y Paso al Flujo Convencional:**
     * El Cliente (A) y el Freelancer (B) llegan a un acuerdo sobre el precio final (`agreedAmountUSDInCents <= initialBudgetUSDInCents`) y los criterios de aceptación.
     * Se genera la **Tarjeta de Encargo Estructurada (`TaskOrderCard`)** por el monto acordado, la publicación se cierra para nuevos postulantes (`AGREED_AND_LOCKED`) y **se inicia inmediatamente la Etapa 1 del flujo convencional de la tarea** (bloqueo del 100% del monto acordado en `taskstream-escrow`).
   * **Camino 2 — Discrepancia, Fin del Contacto y Continuidad de la Publicación:**
     * El Cliente (A) y el Freelancer (B) discrepan en el presupuesto o alcance y cualquiera de los dos finaliza la negociación (**\[Terminar Contacto / Rechazar Propuesta\]**).
     * Se cierra definitivamente el hilo de comunicación entre el Cliente (A) y ese Freelancer (B) (`status = DISCREPANCY_CLOSED_PATH_2`), y **la publicación original del Cliente (A) continúa 100% activa (`OPEN_FOR_PROPOSALS`)** en el marketplace para recibir propuestas y negociaciones de más freelancers.

---

### 5.3. Flujo Completo de Contratación, Escrow, Entregas, Revisiones, Extensiones y Pagos

#### Tabla Resumen de los Plazos Independientes

| Situación | Plazo | Regla |
| :--- | ---: | :--- |
| **Entrega inicial** | **7 días** | Plazo inicial máximo para que el Freelancer entregue el trabajo. |
| **Respuesta a una solicitud de extensión** | **24 horas** | El Buyer debe aprobar o rechazar la extensión. |
| **Extensión de entrega** | **Hasta 7 días adicionales** | Solo puede solicitarse y aprobarse **una única vez por orden** (límite total de hasta 14 días desde el inicio original). |
| **Revisión de una entrega** | **32 horas** | El Buyer puede aceptar, solicitar correcciones o dejar vencer el plazo. |
| **Ventana final de reclamaciones** | **30 minutos** | Comienza después de una aceptación expresa o automática (tras vencer las 32 horas). |
| **Correcciones** | **Máximo 2 por orden** | El límite se aplica a toda la orden y **no se reinicia** con nuevas entregas ni con una extensión. |

#### Etapa 1: Inicio de una Orden y Plazo Inicial de Entrega (7 Días)

1. El Buyer contrata al Freelancer y deposita el **100 % de los fondos** correspondientes en el escrow de TaskStream (`taskstream-escrow`) mediante concesión interactiva GNAP.
2. La orden pasa a estar activa (`ESCROW_LOCKED`) y comienza el **plazo inicial de entrega de 7 días**.
3. El Freelancer debe entregar el trabajo conforme a los requisitos y el alcance acordados en la orden.

#### Etapa 2: Si el Freelancer Entrega Dentro de los Primeros 7 Días (o de la Extensión Aprobada) — Revisión de 32 Horas

1. El Freelancer sube su entregable a Cloudflare R2 (`/originals/{taskId}/{revision}/`), el sistema genera el *Protected Preview* con marca de agua en `/previews/{taskId}/{revision}/` y, **si la tarea corresponde a imagen o texto**, el servicio `AiAdvisorService` genera el informe consultivo (`AiAdvisorReportSchema`).
2. Se inicia el **periodo de revisión del Buyer (`IN_REVIEW`)**, quien tiene un máximo de **32 horas** para responder:
   * **Aceptar la entrega:** La aceptación **no libera el dinero de inmediato**. Primero se desbloquea el archivo original final y comienza la **ventana final de reclamaciones de 30 minutos** (`FINAL_CLAIM_WINDOW_30M`). Si transcurren los 30 minutos sin reclamación, se libera el **96 % para el Freelancer y el 4 % para TaskStream** (`COMPLETED`).
   * **No responder en 32 horas (Aceptación Automática):** Si pasan las **32 horas** sin respuesta del Buyer, la entrega se considera **aceptada automáticamente** y comienza la **ventana final de reclamaciones de 30 minutos** (`FINAL_CLAIM_WINDOW_30M`). La falta de respuesta durante las 32 horas no libera inmediatamente los fondos: primero debe transcurrir la ventana de 30 minutos sin reclamaciones antes de liberar el **96 % al Freelancer y el 4 % a TaskStream**.
   * **Solicitar correcciones (Máximo 2 por orden):** El Buyer puede pedir hasta **2 correcciones globales por orden** (`REVISION_REQUESTED`) dentro del alcance acordado originalmente. Cada vez que el Freelancer vuelve a entregar el trabajo corregido, comienza un **nuevo periodo de revisión de 32 horas** para el Buyer. El contador de correcciones es global para toda la orden y no se reinicia con nuevas entregas ni con una extensión.

#### Etapa 3: Si No Hay Acuerdo Después de las 2 Correcciones o Se Presenta una Reclamación en los 30 Minutos Finales (Disputa Administrativa)

1. **No hay acuerdo después de las 2 correcciones:** Si se agotan las **2 correcciones** y las partes no logran llegar a un acuerdo, se abre una **disputa administrativa (`DISPUTED`)**.
2. **Reclamación válida durante la ventana final de 30 minutos:** Si durante la ventana final de **30 minutos** (`FINAL_CLAIM_WINDOW_30M`) se presenta una reclamación válida (por ejemplo, al detectar discrepancia o corrupción en el archivo original desbloqueado), **se suspende y detiene de inmediato la liberación automática de fondos** en BullMQ y se abre la **disputa administrativa (`DISPUTED`)**.
3. **Reglas de la Disputa Administrativa:**
   * Los fondos permanecen retenidos en el escrow: mientras la disputa siga pendiente, **no se realiza ningún reembolso automático ni se libera automáticamente el pago al Freelancer**.
   * El Administrador revisa los requisitos y el alcance acordados originalmente, las entregas realizadas, las solicitudes de corrección y sus respuestas, los informes consultivos de IA (en tareas de imagen y texto) y los mensajes/evidencias de ambas partes.
   * **Decisión Binaria Justificada:** La decisión debe estar acompañada de una justificación basada en las evidencias:
     * **Si favorece al Buyer** (el Freelancer no cumplió los requisitos acordados): se reembolsa el **100 %** del importe reembolsable de la orden al Buyer (`REFUNDED`).
     * **Si favorece al Freelancer** (cumplió los requisitos y el Buyer rechaza injustificadamente o exige tareas fuera del alcance acordado): se libera el **96 % al Freelancer y el 4 % a TaskStream** (`COMPLETED`).

#### Etapa 4: Si el Freelancer No Entrega Dentro de los Primeros 7 Días (Extensión Única de Hasta 7 Días Adicionales y Ventana de 24 Horas)

Si vence el plazo inicial de 7 días sin que el Freelancer entregue el trabajo, puede solicitar **una única extensión de hasta 7 días adicionales** (`EXTENSION_REQUESTED`):

1. **El Buyer recibe la solicitud de extensión (24 Horas para Responder):**
   * TaskStream notifica al Buyer, quien dispone de un máximo de **24 horas** para aprobar o rechazar la solicitud. No se permite una segunda extensión para la misma orden.
2. **Si el Buyer aprueba la extensión (en $\le$ 24 horas):**
   * El Freelancer recibe **hasta 7 días adicionales**, contados a partir del vencimiento del plazo inicial (límite total de entrega de **hasta 14 días** desde el inicio original de la orden, estado `ESCROW_EXTENDED`).
   * La extensión no reinicia el contador global de 2 correcciones. Si el Freelancer entrega dentro del plazo extendido, se aplica el flujo normal de revisión de **32 horas**, máximo 2 correcciones y ventana final de **30 minutos**.
3. **Si el Buyer rechaza la extensión y solicita el reembolso (en $\le$ 24 horas):**
   * TaskStream devuelve el **100 %** del importe reembolsable de la orden al Buyer (`REFUNDED`, pudiendo también reabrir su publicación de forma limpia en `REFUNDED_AND_REOPENED`).
4. **Si el Buyer no responde en 24 horas (Reembolso Automático):**
   * Se activa el **reembolso automático del 100 %** del importe reembolsable de la orden al Buyer (`AUTO_REFUNDED_BY_TIMEOUT`) y se notifica a las partes que venció el plazo inicial, que el Freelancer solicitó una extensión y que, al no recibir respuesta del Buyer dentro de las 24 horas, se procesó el reembolso.
5. **Si el Buyer aprobó la extensión, pero el Freelancer tampoco entrega dentro de la extensión:**
   * Si el Freelancer no entrega antes de que venza el plazo extendido (hasta +7 días), se procesa un **reembolso automático del 100 %** del importe reembolsable de la orden al Buyer (`AUTO_REFUNDED_EXTENDED_EXPIRED`), no se permite segunda extensión y se notifica a ambas partes sobre el vencimiento y el reembolso.

### 5.4. Idempotencia en los Pagos

Toda operación financiera hacia `@interledger/open-payments` exige una clave determinista única almacenada en PostgreSQL con restricción `UNIQUE`:

* Para bloqueo inicial del encargo: `SHA256(taskId + ":" + attemptNumber + ":ESCROW_LOCK")`
* Para desembolso 96/4 al freelancer: `SHA256(taskId + ":FREELANCER_PAYOUT_96_4")`
* Para reembolso 100% al cliente (manual, por re-publicación o automático por vencimiento de 24h o de extensión): `SHA256(taskId + ":" + attemptNumber + ":BUYER_REFUND_100")`

---

### 5.5. Catálogo de Herramientas, Endpoints y Capacidades Oficiales de Open Payments e Interledger Aprovechadas en TaskStream AI

A partir de la revisión exhaustiva de la documentación oficial de [Open Payments (`openpayments.dev`)](https://openpayments.dev/es/overview/getting-started/) e [Interledger (`interledger.org`)](https://interledger.org/es/tech/open-payments/), **TaskStream AI** integra y aprovecha las siguientes herramientas nativas del ecosistema:

| # | Herramienta / Capacidad de Open Payments & Interledger | Endpoint / Método en `@interledger/open-payments` | Uso Específico dentro de TaskStream AI |
| :---- | :---- | :---- | :---- |
| **1** | **Cliente No Autenticado con Validación OpenAPI (`UnauthenticatedClient`)** | `createUnauthenticatedClient({ validateResponses: true })` -> `walletAddress.get({ url })` y `walletAddress.getKeys({ url })` | Descubrimiento público instantáneo de `assetCode` (divisa local del usuario en América), `assetScale`, `authServer` y `resourceServer`, más consulta de claves públicas JWK (`jwks.json`) sin requerir firma privada. |
| **2** | **Cliente Autenticado con Firmas HTTP RFC 9421 (`AuthenticatedClient`)** | `createAuthenticatedClient({ walletAddressUrl, privateKey, keyId, validateResponses: true })` | Firma criptográfica automática de cada petición desde `taskstream-escrow` con clave privada `Ed25519` (`Signature`, `Signature-Input` y `Content-Digest`) y validación estricta de esquemas OpenAPI. |
| **3** | **Verificación de Titularidad de Billetera sin Pago (`Subject Grant`)** | `client.grant.request` con `subject: { sub_ids: [{ format: 'uri', id: walletUrl }] }` + `client.grant.continue` | Verifica criptográficamente que el Contratista o Freelancer es el dueño legítimo de su `walletAddress` autenticándolo en su proveedor de billetera (IdP) sin mover dinero ([Guía Oficial](https://openpayments.dev/es/guides/verify-wallet-address-ownership/)). |
| **4** | **Verificación Criptográfica de Hash en Callback GNAP (`Hash Verification`)** | Cálculo `SHA-256(clientNonce + "\n" + finishNonce + "\n" + interact_ref + "\n" + authServerUrl)` | Previene ataques de *Session Fixation* y *CSRF* al regresar de la pantalla de consentimiento interactivo de la Test Wallet / Rafiki antes de llamar a `grant.continue`. |
| **5** | **Ciclo Completo de `IncomingPayment` con Metadatos Forenses y Cierre Explícito** | `incomingPayment.create`, `incomingPayment.get`, `incomingPayment.list` y `incomingPayment.complete` | Creación de cuentas de cobro con `expiresAt` (ISO 8601) y objeto `metadata` enriquecido (`taskId`, `category`, `escrowType: 'SINGLE_BLOCK'`), consulta de estado (`completed: true`) y cierre explícito con `incomingPayment.complete` si se cancela una orden. |
| **6** | **Motor Dual de Cotización Cambiaria (`Quote` con `receiveAmount` vs. `debitAmount`)** | `quote.create` y `quote.get` | **Modo 1 (`receiveAmount` fijo):** Al fondear el Escrow se fija `receiveAmount = 100% USD`, haciendo que el Buyer absorba el FX de entrada. **Modo 2 (`debitAmount` fijo):** En reembolsos del 100% y pagos del 96% al Freelancer se fija `debitAmount` desde `taskstream-escrow`, garantizando que el Escrow jamás sufra déficit cambiario y que el Buyer asuma el FX de retorno. |
| **7** | **Auditoría en Tiempo Real de Montos Gastados del Grant (`Get Spent Amounts`)** | `GET /outgoing-payment-grant` | Endpoint del Resource Server que devuelve `spentAmount` y `spentReceiveAmount` acumulados bajo el token activo de `taskstream-escrow`, permitiendo monitorear la salud financiera y el límite remanente del Token de Larga Duración antes de disparar un desembolso o reembolso. |
| **8** | **Gestión del Ciclo de Vida de Tokens y Concesiones (`rotate`, `revoke`, `cancel`)** | `token.rotate({ url, accessToken })`, `token.revoke({ url, accessToken })` y `grant.cancel({ url, accessToken })` | Rotación automática sin tiempo de inactividad del token de `taskstream-escrow` (`token.rotate`), revocación inmediata de tokens efímeros tras completar el bloqueo del Buyer (`token.revoke`) y cancelación limpia de concesiones pendientes si el usuario aborta el checkout (`grant.cancel`). |
| **9** | **Webhooks de Eventos de Rafiki (`Rafiki Webhook Events`)** | Receptor HTTP en NestJS (`/api/v1/webhooks/rafiki`) | Escucha eventos asíncronos del motor Rafiki (`incoming_payment.completed`, `incoming_payment.expired`, `outgoing_payment.completed`, `outgoing_payment.failed`) para conciliar estados del Escrow en tiempo real además de la confirmación síncrona. |
| **10** | **Estándar W3C Web Monetization para Portafolios de Freelancers** | `<link rel="monetization" href="https://ilp.interledger-test.dev/freelancer-wallet">` | Permite inyectar la etiqueta oficial de **Web Monetization** en las páginas públicas de perfil y *Gigs* de cada Freelancer, habilitando que visitantes con la extensión de Web Monetization envíen micropagos en streaming directamente a la billetera del creador mientras exploran su portafolio. |
| **11** | **Concesiones con Intervalos Repetitivos (`limits.interval` — Base Post-MVP)** | `limits: { debitAmount, interval: "R/2026-10-01T00:00:00Z/P1M" }` | Capacidad nativa de GNAP para autorizar pagos futuros y periódicos ([Guía Oficial](https://openpayments.dev/es/guides/outgoing-grant-future-payments/)), que servirá como base técnica para la idea de monetización futura (`Buyer AI Pro Subscription`) sin requerir re-autenticación mensual. |

---

## 6. Motor de IA Consejero (`AiAdvisorService` — Exclusivo para Imagen y Texto en el MVP)

### 6.1. Alcance Estricto del Consejero de IA en el MVP: Solo Tareas de Imagen y Texto

En el MVP de **TaskStream AI**, el servicio de Inteligencia Artificial (`AiAdvisorService`) **solo auditará y asesorará tareas que tengan que ver con IMAGEN y TEXTO (`IMAGE_RASTER_VECTOR` y `DOCUMENT_TEXT`)**:

1. **Enfoque Acotado a Imagen y Texto en el MVP:**
   * Cuando un Freelancer entrega un archivo de **imagen** (`.png`, `.jpg`, `.webp`, `.svg`) o de **texto** (`.txt`, `.md`, `.pdf`, `.docx`), `AiAdvisorService` evalúa el entregable frente a los criterios de aceptación de la orden y genera el informe consultivo (`AiAdvisorReportSchema`) para asesorar al Buyer durante su ventana de revisión de 32 horas.
   * **El resto de tipos de entregables (video, audio, archivos comprimidos de código, datasets, etc.) se deja planteado conceptualmente a futuro, pero NO entrará dentro de la auditoría de IA del MVP.** En esas categorías, la orden sigue su flujo normal de custodia, *Protected Preview* y revisión de 32 horas sin invocar auditoría de IA.
2. **Necesidad de Especificar el Contrato Exacto de Entrada (`SPEC-08.md`):**
   * Para construir y alimentar `AiAdvisorReportSchema` sin ambigüedades, **en `SPEC-08.md` se concreta con total claridad el contrato exacto de entrada (`AiAdvisorInputContractSchema`) que recibirá `AiAdvisorService`** (identificadores de la orden, número de entrega/corrección `0..2`, modalidad auditable `IMAGE | TEXT`, lista de criterios de aceptación, notas de corrección previas, texto extraído o referencia de imagen y resultado de la validación determinista previa).
3. **Rol Estrictamente Consultivo:** El Consejero de IA **nunca aprueba ni bloquea pagos por sí mismo**; la decisión pertenece siempre al Buyer (o al Administrador en caso de disputa).

### 6.2. Suscripción y Auditoría de Otros Formatos Planteadas para Post-MVP

> **Nota de Alcance (Fuera del MVP):** Tanto el modelo de suscripción opcional para compradores (`Buyer AI Pro Subscription` basado en concesiones recurrentes `limits.interval` de Open Payments) como la auditoría de IA sobre otros formatos pesados (video, audio y repositorios complejos) **se dejan únicamente planteados como proyección comercial y funcional a futuro, pero no se implementarán dentro del MVP**.

### 6.3. Defensa Básica de Integridad y Anti-Prompt Injection

1. **Encapsulamiento del Entregable:** El contenido extraído de los entregables de texto o metadatos de imagen se evalúa separado de las instrucciones del sistema (`<untrusted_deliverable_artifact>...</untrusted_deliverable_artifact>`).
2. **Validación Determinista Previa:** Antes de invocar a `AiAdvisorService`, el backend verifica que el archivo exista en Cloudflare R2, tenga tamaño `> 0 bytes` y corresponda a las extensiones permitidas.

---

## 7. Política de Previsualización (`Protected Preview`) y Almacenamiento Sin Límite en el MVP

### 7.1. Principios de Diseño Inmutables

1. **Sin Límite de Tamaño de Subida en el MVP:** Para el MVP no se delimitará el tamaño máximo de los archivos que suban los freelancers. La carga se realiza directamente hacia **Cloudflare R2** mediante *Presigned URLs*.
2. **Originales nunca públicos durante las 32 horas de `IN_REVIEW`:** Todo entregable original se guarda en el prefijo privado `/originals/{taskId}/{revision}/` en **Cloudflare R2**.
3. **Previsualización generada en servidor:** Los derivados seguros se guardan en `/previews/{taskId}/{revision}/` con marca de agua.
4. **Separación entre el Periodo de Revisión (`32h`) y la Ventana Final de Reclamaciones (`30 min`):**
   * Durante las **32 horas de revisión (`IN_REVIEW`)** y las solicitudes de corrección (`REVISION_REQUESTED`, máx. 2 globales), el Buyer evalúa el *Protected Preview* (acompañado del informe de IA cuando la tarea es de **imagen o texto**).
   * Tras la aceptación expresa o automática (al vencer las 32 horas), se desbloquea el archivo original final y comienza la **ventana final de reclamaciones de 30 minutos** (`FINAL_CLAIM_WINDOW_30M`) antes de liberar el pago `96% / 4%`.

### 7.2. Matriz de Categorías, Previsualización y Alcance de IA en el MVP

| # | Categoría del MVP | Formatos Aceptados (Original, Sin Límite de Peso en MVP) | Política de Previsualización (`Protected Preview`) | Alcance de Auditoría Consultiva de IA |
| :---- | :---- | :---- | :---- | :---- |
| **1** | **Marketing Digital** | `.pdf`, `.md`, `.csv`, `.xlsx`, `.png`, `.jpg` | **PDF/Imágenes:** Baja resolución con marca de agua (`sharp`). **CSV/XLSX/MD:** Muestra truncada al 30%. | **Activa en el MVP para Imagen y Texto** (`.png`, `.jpg`, `.pdf`, `.md`). *(Datos tabulares planteados Post-MVP).* |
| **2** | **Gráficos y Diseño** | `.png`, `.jpg`, `.webp`, `.svg`, `.pdf` | Imagen rasterizada (máx. 720px) con **marca de agua "TaskStream AI"** (`sharp`). | **Activa en el MVP (Imagen / PDF)** mediante `AiAdvisorService` (`SPEC-08.md`). |
| **3** | **Programación y Tecnología** | `.zip`, `.tar.gz`, `.ts`, `.js`, `.py`, `.sql`, `.json` | Árbol de archivos del paquete y extracto parcial del 20% sin permitir descarga del original. | **Planteada a futuro (Fuera del MVP):** Solo previsualización protegida y validación determinista de archivo en el MVP. |
| **4** | **Redacción Técnica o Traducción** | `.md`, `.pdf`, `.docx`, `.txt` | Vista del primer 30% del texto con conteo de palabras y marca de agua. | **Activa en el MVP (Texto)** mediante `AiAdvisorService` (`SPEC-08.md`). |
| **5** | **Video y Animación** | `.mp4`, `.webm`, `.mov`, `.gif` | Video de previsualización (`360p` / fragmento con marca de agua visual vía `ffmpeg`). | **Planteada a futuro (Fuera del MVP)** junto con la idea de suscripción Post-MVP. |
| **6** | **Música y Audio** | `.mp3`, `.wav`, `.ogg`, `.m4a` | Muestra de audio en baja tasa de bits (`64 kbps`) con marca de agua audible vía `ffmpeg`. | **Planteada a futuro (Fuera del MVP)** junto con la idea de suscripción Post-MVP. |

---

## 8. Especificaciones Funcionales del MVP (Perfiles, Negociación, Plazos y Schemas Zod)

### 8.1. Perfiles de Contratista (Buyer) y Freelancer (Seller) en Toda América

Se utiliza una **Cuenta Unificada en Clerk** con cambio de modo en tiempo real (`Buyer Mode` / `Seller Mode`) dentro de la interfaz:

* **Atributos Compartidos:** `userId` (UUID), `clerkId`, `displayName`, `avatarUrl`, `countryCode` (`US`, `CA`, `MX`, `CO`, `BR`, `AR`, `CL`, `PE`, `UY`, `CR`, `DO`, `GT`, `EC`, `PA`, etc.), `walletAddress` (URL HTTPS verificada mediante GNAP Subject Grant), `walletAssetCode` (`USD`, `CAD`, `MXN`, `COP`, `BRL`, `ARS`, `CLP`, `PEN`, `UYU`, etc.) y `walletAssetScale`.
* **Perfil Freelancer (`Seller`):**
  * Bio profesional, habilidades, idiomas, etiqueta opcional de **Web Monetization** en su portafolio público y catálogo por categoría.
  * **Publicación de "Gigs" y Postulación a Tareas de Clientes:** Capacidad de ofrecer paquetes propios y de negociar presupuestos `<= presupuesto inicial` en tareas publicadas por Buyers.
  * **Gestión de Plazos y Extensión Única:** Seguimiento del plazo inicial de **7 días** y opción de solicitar **una única extensión de hasta 7 días adicionales** (límite total de hasta 14 días).
* **Perfil Contratista (`Buyer`):**
  * **Publicación y Negociación de Tareas:** Panel para publicar tareas con presupuesto tope inicial, negociar precios a la baja (Camino 1) o descartar propuestas manteniendo activa la publicación (Camino 2).
  * **Gestión de Escrow, Extensión (24h), Revisión (32h) y Ventana Final (30m):** Opciones para aprobar o rechazar una extensión dentro de **24 horas** (con reembolso automático del 100 % si no responde en 24h), revisar cada entrega durante **32 horas** (aceptar, pedir hasta **2 correcciones globales** por orden o dejar vencer las 32h para aceptación automática) y presentar una reclamación fundada dentro de la **ventana final de 30 minutos**.

### 8.2. Contratos de Datos en Zod (`shared-schemas`)

```typescript
import { z } from 'zod';

/**
 * CATEGORÍAS OFICIALES DEL MVP (6 Categorías)
 */
export const TaskCategoryEnum = z.enum([
  'DIGITAL_MARKETING',       // 1. Marketing Digital
  'GRAPHICS_AND_DESIGN',     // 2. Gráficos y Diseño
  'PROGRAMMING_AND_TECH',    // 3. Programación y Tecnología
  'TECHNICAL_WRITING_TRANS', // 4. Redacción Técnica o Traducción
  'VIDEO_AND_ANIMATION',     // 5. Video y Animación
  'MUSIC_AND_AUDIO',         // 6. Música y Audio
]);

/**
 * TIPOS DE ARCHIVO DE ENTREGA SOPORTADOS EN R2 (Sin límite de tamaño en el MVP)
 */
export const DeliverableMediaTypeEnum = z.enum([
  'IMAGE_RASTER_VECTOR', // .png, .jpg, .webp, .svg -> Auditable por IA en el MVP
  'DOCUMENT_TEXT',       // .pdf, .md, .docx, .txt  -> Auditable por IA en el MVP
  'CODE_ARCHIVE',        // .zip, .tar.gz, .ts, .py -> IA planteada Post-MVP
  'DATA_CAMPAIGN',       // .csv, .xlsx, .json      -> IA planteada Post-MVP
  'VIDEO_STREAM',        // .mp4, .webm, .mov, .gif -> IA planteada Post-MVP
  'AUDIO_TRACK',         // .mp3, .wav, .ogg, .m4a  -> IA planteada Post-MVP
]);

/**
 * MODALIDADES AUDITABLES POR IA EN EL MVP (Exclusivamente Imagen y Texto)
 */
export const MvpAiAuditableModalityEnum = z.enum([
  'IMAGE',
  'TEXT',
]);

/**
 * ESTADOS DEL CICLO DE VIDA DE LA ORDEN
 */
export const TaskLifecycleStatusEnum = z.enum([
  'PENDING_ESCROW_FUNDING',
  'ESCROW_LOCKED',                  // Plazo inicial de 7 días activo
  'EXTENSION_REQUESTED',            // Única extensión de hasta +7 días solicitada; Buyer tiene 24h para responder
  'ESCROW_EXTENDED',                // Extensión aprobada (hasta 14 días totales desde el inicio original)
  'IN_REVIEW',                      // Entrega en revisión del Buyer (Reloj de 32 horas por entrega)
  'REVISION_REQUESTED',             // Corrección solicitada (Máximo 2 globales por orden)
  'FINAL_CLAIM_WINDOW_30M',         // Aceptación expresa o automática (tras 32h); ventana final de 30 minutos
  'DISPUTED',                       // Disputa administrativa (tras 2 correcciones sin acuerdo o reclamación en los 30 min)
  'COMPLETED',                      // Liberación definitiva: 96% Freelancer / 4% TaskStream
  'REFUNDED',                       // Reembolso 100% al Buyer (rechazo de extensión o fallo de disputa a favor del Buyer)
  'REFUNDED_AND_REOPENED',          // Reembolso 100% al Buyer y reapertura limpia de la publicación
  'AUTO_REFUNDED_BY_TIMEOUT',       // Reembolso automático 100% al Buyer por no responder en 24h a la extensión
  'AUTO_REFUNDED_EXTENDED_EXPIRED', // Reembolso automático 100% al Buyer por no entregar dentro de la extensión aprobada
]);

/**
 * 0. PUBLICACIÓN DE TAREA DEL SOLICITANTE Y NEGOCIACIÓN DE PRESUPUESTO
 */
export const ClientTaskPublicationSchema = z.object({
  publicationId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  title: z.string().min(10).max(120),
  description: z.string().min(20).max(3000),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  initialBudgetUSDInCents: z.number().int().positive(),
  initialDeliveryDays: z.number().int().min(1).max(7).default(7),
  status: z.enum(['OPEN_FOR_PROPOSALS', 'AGREED_AND_LOCKED', 'CANCELLED']),
});

export const FreelancerNegotiationProposalSchema = z.object({
  proposalId: z.string().uuid(),
  publicationId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  freelancerUserId: z.string().uuid(),
  initialBudgetUSDInCents: z.number().int().positive(),
  proposedBudgetUSDInCents: z.number().int().positive(),
  status: z.enum([
    'IN_NEGOTIATION',
    'AGREED_PATH_1',
    'DISCREPANCY_CLOSED_PATH_2',
  ]),
}).refine(
  (data) => data.proposedBudgetUSDInCents <= data.initialBudgetUSDInCents,
  {
    message: 'El valor negociado siempre debe ser menor o igual al presupuesto planteado inicialmente por el cliente.',
    path: ['proposedBudgetUSDInCents'],
  }
);

/**
 * 1. TARJETA DE ORDEN ESTRUCTURADA (TaskOrderCardSchema)
 */
export const AcceptanceCriterionSchema = z.object({
  criterionId: z.string().min(3).max(32),
  description: z.string().min(10).max(350),
  isMandatory: z.boolean().default(true),
});

export const DeadlineExtensionRequestSchema = z.object({
  requestedExtraDays: z.number().int().min(1).max(7)
    .describe('Única extensión permitida de hasta 7 días adicionales (límite total de hasta 14 días)'),
  requestedAt: z.string().datetime(),
  buyerDecisionDeadlineAt: z.string().datetime()
    .describe('El Buyer tiene 24 horas para aprobar o rechazar; sin respuesta se reembolsa el 100% automáticamente'),
  status: z.enum([
    'PENDING_BUYER_DECISION',
    'APPROVED_EXTRA_DAYS',
    'REJECTED_REFUND_REQUESTED',
    'REJECTED_BY_TIMEOUT_AUTO_REFUNDED',
  ]),
});

export const TaskOrderCardSchema = z.object({
  taskId: z.string().uuid(),
  gigId: z.string().uuid().optional(),
  publicationId: z.string().uuid().optional(),
  title: z.string().min(10).max(120),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  aiAuditableModality: MvpAiAuditableModalityEnum.optional()
    .describe('Definido únicamente cuando la tarea corresponde a IMAGEN o TEXTO en el MVP'),
  lifecycleStatus: TaskLifecycleStatusEnum,
  buyer: z.object({
    userId: z.string().uuid(),
    walletAddress: z.string().url(),
    originCurrency: z.string().length(3),
  }),
  seller: z.object({
    userId: z.string().uuid(),
    walletAddress: z.string().url(),
    targetCurrency: z.string().length(3),
  }),
  paymentTerms: z.object({
    paymentModality: z.literal('SINGLE_BLOCK_ESCROW'),
    escrowWalletAddress: z.string().url().default('https://ilp.interledger-test.dev/taskstream-escrow'),
    totalAmountUSDInCents: z.number().int().positive(),
    freelancerPayoutUSDInCents: z.number().int().positive().describe('96% para el Freelancer'),
    platformFeeUSDInCents: z.number().int().nonnegative().describe('4% para TaskStream'),
    buyerAssumesDoubleFxConversion: z.literal(true),
    deliveryReviewHours: z.literal(32).describe('32 horas para revisar cada entrega'),
    finalClaimWindowMinutes: z.literal(30).describe('30 minutos de ventana final tras aceptación expresa o automática'),
  }),
  executionDeadlineTerms: z.object({
    initialDeliveryDays: z.number().int().min(1).max(7).default(7),
    maxExtensionExtraDays: z.literal(7).describe('Única extensión de hasta 7 días adicionales (máx. 14 días totales)'),
    maxExtensionsPerOrder: z.literal(1),
    buyerExtensionResponseWindowHours: z.literal(24),
    autoRefundOnExtensionResponseTimeout: z.literal(true),
    autoRefundOnExtendedDeadlineMissed: z.literal(true),
    activeExtensionRequest: DeadlineExtensionRequestSchema.optional(),
  }),
  revisionTerms: z.object({
    maxRevisionsAllowed: z.literal(2).describe('Máximo 2 correcciones globales por orden; no se reinicia con extensión'),
    revisionsUsed: z.number().int().min(0).max(2).default(0),
    arbitrationAuthorityOnDispute: z.literal('PLATFORM_ADMIN'),
    adminDecisionModality: z.literal('STRICT_BINARY_JUSTIFIED'),
  }),
  acceptanceCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
  technicalConstraints: z.object({
    allowedExtensions: z.array(z.string()).min(1),
    maxFileSizeBytes: z.null().default(null),
    minWordCount: z.number().int().positive().optional(),
    minWidthPx: z.number().int().positive().optional(),
    minHeightPx: z.number().int().positive().optional(),
  }),
});

/**
 * 2. CONTRATO EXACTO DE ENTRADA Y SALIDA DEL CONSEJERO DE IA (SPEC-08.md)
 * En el MVP solo audita y asesora tareas de IMAGEN y TEXTO.
 */
export const AiAdvisorInputContractSchema = z.object({
  taskOrderId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  revisionNumber: z.number().int().min(0).max(2),
  category: TaskCategoryEnum,
  auditableModality: MvpAiAuditableModalityEnum,
  orderContext: z.object({
    title: z.string(),
    scopeDescription: z.string(),
    acceptanceCriteria: z.array(AcceptanceCriterionSchema).min(1),
    previousRevisionNotes: z.array(z.string()).optional(),
  }),
  deliverableArtifact: z.object({
    fileName: z.string(),
    mimeType: z.string(),
    fileExtension: z.string(),
    fileSizeBytes: z.number().int().positive(),
    sha256Checksum: z.string().length(64),
    extractedTextContent: z.string().optional(),
    wordCount: z.number().int().nonnegative().optional(),
    imageSignedUrlOrBase64: z.string().optional(),
    imageDimensions: z.object({
      widthPx: z.number().int().positive(),
      heightPx: z.number().int().positive(),
    }).optional(),
  }),
  deterministicPreCheckResult: z.object({
    extensionAllowed: z.boolean(),
    nonEmptyFile: z.boolean(),
    technicalConstraintsMet: z.boolean(),
    failureReasons: z.array(z.string()),
  }),
});

export const AiAdvisorReportSchema = z.object({
  taskId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  revisionEvaluated: z.number().int().min(0).max(2),
  auditableModality: MvpAiAuditableModalityEnum,
  advisoryScore: z.number().int().min(0).max(100),
  advisoryLabel: z.enum([
    'HIGH_COMPLIANCE',
    'PARTIAL_COMPLIANCE',
    'LOW_COMPLIANCE',
  ]),
  executiveSummaryForBuyer: z.string().max(500),
  suggestionsForFreelancer: z.array(z.string()).max(6),
  criteriaEvaluation: z.array(
    z.object({
      criterionId: z.string(),
      status: z.enum(['MET', 'PARTIALLY_MET', 'NOT_MET', 'REQUIRES_HUMAN_VERIFICATION']),
      evidence: z.string().max(300),
    })
  ),
  securityAndIntegrityAudit: z.object({
    promptInjectionDetected: z.boolean(),
    emptyOrCorruptedFileDetected: z.boolean(),
    deterministicCheckPassed: z.boolean(),
  }),
  mandatoryDisclaimer: z.literal(
    'Este informe es estrictamente consultivo para tareas de imagen y texto. El Consejero de IA nunca aprueba ni ejecuta pagos.'
  ),
});
```

---

## 9. Especificaciones de Comportamiento (BDD en Gherkin)

```gherkin
# language: es

Característica: Contratación, Escrow (96%/4%), Plazo Inicial (7d), Extensión Única (hasta +7d con 24h de respuesta), Revisión (32h con máx. 2 correcciones), Ventana Final (30m) y Disputas

  Escenario: 1. Publicación de tarea por el Buyer y Negociación exitosa a la baja (Camino 1)
    Dado que el Buyer publica una tarea con un presupuesto inicial de $100.00 USD
    Cuando el Freelancer propone realizar el trabajo por $85.00 USD (valor menor o igual al presupuesto inicial)
    Y el Buyer acepta la propuesta de $85.00 USD
    Entonces se genera la orden por $85.00 USD cerrando la publicación para otros postulantes ("AGREED_AND_LOCKED")

  Escenario: 2. Entrega a tiempo, revisión de 32 horas (aceptación expresa o automática) y ventana final de 30 minutos
    Dado que una orden activa en "ESCROW_LOCKED" por $100.00 USD recibe una entrega dentro del plazo de 7 días
    Entonces se inicia el periodo de revisión de 32 horas para el Buyer ("IN_REVIEW")
    Cuando el Buyer acepta la entrega (o transcurren las 32 horas sin respuesta produciéndose aceptación automática)
    Entonces comienza la ventana final de reclamaciones de 30 minutos ("FINAL_CLAIM_WINDOW_30M")
    Cuando transcurren los 30 minutos sin que se presente ninguna reclamación
    Entonces se libera el 96 % ($96.00 USD) para el Freelancer y el 4 % ($4.00 USD) para TaskStream ("COMPLETED")

  Escenario: 3. Solicitud de correcciones (máximo 2 por orden) y apertura de disputa administrativa si no hay acuerdo
    Dado que el Buyer revisa una entrega dentro de su periodo de 32 horas
    Cuando el Buyer solicita una corrección y el Freelancer vuelve a entregar el trabajo
    Entonces comienza un nuevo periodo de revisión de 32 horas sin reiniciar el contador global de correcciones
    Pero si se agotan las 2 correcciones permitidas por orden y las partes no llegan a un acuerdo
    Entonces se abre una disputa administrativa ("DISPUTED") manteniendo los fondos retenidos en el escrow hasta que el Administrador emita una decisión justificada (100% al Buyer o 96%/4% al Freelancer)

  Escenario: 4. Solicitud de extensión única de hasta 7 días adicionales y respuesta del Buyer en 24 horas
    Dado que vence el plazo inicial de 7 días sin entrega y el Freelancer solicita una única extensión de hasta 7 días adicionales
    Entonces se notifica al Buyer y comienza un plazo de 24 horas para aprobar o rechazar la solicitud ("EXTENSION_REQUESTED")
    Y si el Buyer aprueba en 24 horas, el Freelancer recibe hasta 7 días adicionales (máximo 14 días desde el inicio) sin reiniciar el contador de 2 correcciones
    Y si el Buyer rechaza la extensión y solicita el reembolso, se devuelve el 100 % al Buyer ("REFUNDED")
    Pero si el Buyer no responde en 24 horas, se activa automáticamente el reembolso del 100 % al Buyer ("AUTO_REFUNDED_BY_TIMEOUT")
    Y si el Buyer aprobó la extensión pero el Freelancer tampoco entrega dentro del plazo extendido, se procesa un reembolso automático del 100 % al Buyer ("AUTO_REFUNDED_EXTENDED_EXPIRED")

  Escenario: 5. Suspensión de liberación de pago al presentarse una reclamación en la ventana final de 30 minutos
    Dado que una orden se encuentra en la ventana final de reclamaciones de 30 minutos ("FINAL_CLAIM_WINDOW_30M")
    Cuando se presenta una reclamación válida antes de que finalicen los 30 minutos
    Entonces se suspende de inmediato la liberación automática del dinero y la orden pasa a "DISPUTED" para revisión justificada del Administrador
```

---

## 10. Plan de Desarrollo por Fases (`SPEC-00` a `SPEC-12`)

El proyecto se ejecuta desde `SPEC-00.md` (creación de la carpeta `specs` y su `README.md`) hasta `SPEC-12.md` (`Deploy`), distribuyendo el trabajo en la estructura **2 Frontend / 2 Backend / 1 IA**:

| Fase | Especificaciones | Entregables Frontend (`FE-1`, `FE-2`) | Entregables Backend (`BE-1`, `BE-2`) | Entregables IA (`AI-1`) |
| :---- | :---- | :---- | :---- | :---- |
| **Fase 0** | `SPEC-00`, `SPEC-01` | Inicialización de `apps/web` y cliente de mocks. | Inicialización de `apps/api` y modelo 3NF Prisma. | Creación de carpeta `specs` + `README.md` y contratos en `shared-schemas`. |
| **Fase 1** | `SPEC-02`, `SPEC-03` | Login Clerk, vinculación de billetera americana y motor 3D `ScrollTrigger` + `Lenis`. | Descubrimiento y verificación GNAP `Subject Grant` en `open-payments.service.ts` (Manual `BE-1`). | Estructura base de validación y pruebas de contrato. |
| **Fase 2** | `SPEC-04`, `SPEC-05` | Catálogo de 6 categorías, tablón de clientes y sala de negociación (Caminos 1 y 2). | Módulos de Marketplace y Negociación (`<= presupuesto inicial`). | Validación de criterios de aceptación de la orden. |
| **Fase 3** | `SPEC-06` | Checkout de custodia única y escena 3D de bóveda en escrow. | `escrow-payment.service.ts` (Manual `BE-1`): fondeo 100%, desembolso 96%/4%, reembolso 100% e idempotencia. | Pruebas de invariantes financieras 96%/4% y 100%. |
| **Fase 4** | `SPEC-07`, `SPEC-08` | Visores de *Protected Preview* y panel del informe de IA para tareas de imagen y texto. | Subida a R2 sin límite y workers `sharp`/`ffmpeg` para marcas de agua. | Contrato exacto `AiAdvisorInputContractSchema` + `AiAdvisorReportSchema` y `AiAdvisorService` exclusivo para **imagen y texto**. |
| **Fase 5** | `SPEC-09`, `SPEC-10`, `SPEC-11`, `SPEC-12` | Relojes (`7d`, `24h`, `+7d`, `32h`, `30m`), máximo 2 correcciones, consola de disputas y entrega final. | Workers BullMQ (`7d`, `24h`, `+7d`, `32h`, `30m`), suspensión por reclamación en los 30m, arbitraje binario y `Deploy`. | Historial de reportes para disputas, pruebas E2E integrales y verificación en producción. |

---

## 11. Stack Tecnológico Definitivo, Estable y Verificado (Actualizado a Next.js 15/16)

| Capa | Tecnología / Paquete | Versión Estable Seleccionada | Rol y Justificación de Estabilidad |
| :---- | :---- | :---- | :---- |
| **Runtime** | Node.js | `22.11.0` (LTS) / `20.18.0` | Soporte óptimo para Next.js 15/16, NestJS 10/11 y streams de archivos grandes hacia Cloudflare R2. |
| **Gestor y Monorepo** | pnpm + Turborepo | `9.12.3` / `2.3.x` | Gestión eficiente de paquetes (`apps/web`, `apps/api`, `packages/shared-schemas`). |
| **Frontend Framework** | **Next.js** | **`15.5.x` (Rango 15–16 Estable)** | App Router con Turbopack, Server Actions estables y compatibilidad directa con React 19. |
| **Librería UI** | **React + React DOM** | **`19.0.0`** | Base oficial para Next.js 15/16 y totalmente compatible con `@react-three/fiber v9`. |
| **Renderizado 3D (WebGL)** | **`three` + `@react-three/fiber` + `@react-three/drei`** | `0.170.0` / **`9.0.x`** / **`10.0.x`** | R3F v9 y Drei v10 soportan nativamente React 19 para construir escenas 3D conectadas al scroll. |
| **Motor de Animación y ScrollTrigger** | **`gsap` (`ScrollTrigger`) + `@gsap/react` + `lenis`** | `3.12.5+` / `2.1.1` / `1.1.x` | `GSAP ScrollTrigger` + `Lenis` sincronizan el scroll del DOM con las transformaciones 3D del `<Canvas>` a 60–120 FPS sin re-renders de React. |
| **Estilos y Componentes** | Tailwind CSS + shadcn/ui + Lucide | `3.4.15` / `4.0` | Sistema de diseño modular, accesible y rápido de iterar sobre React 19. |
| **Backend Framework** | NestJS (`@nestjs/core`) | `10.4.x` | Arquitectura modular en TypeScript con inyección de dependencias limpia. |
| **Colas, Workers y Timers** | BullMQ (`@nestjs/bullmq` + `bullmq`) + Redis | `5.25.x` | Procesamiento asíncrono de marcas de agua y **relojes independientes**: entrega inicial (`7d`), respuesta a extensión (`24h`), extensión única (`hasta +7d`), revisión por entrega (`32h`) y ventana final (`30m`). |
| **Procesadores Multimedia** | `sharp` + `fluent-ffmpeg` (`ffmpeg-static`) | `0.33.5` / `2.1.3` | `sharp` para marcas de agua en imágenes y `ffmpeg` para recortes/marcas de agua en video (360p) y audio (64kbps). |
| **Base de Datos y ORM** | PostgreSQL (Neon Serverless) + Prisma | `5.22.0` / `6.x` | Transacciones ACID y bloqueo de registros para llaves de idempotencia de pagos (96/4 y reembolsos). |
| **Autenticación Híbrida** | Clerk (`@clerk/nextjs` v6) + Open Payments Grant | Clerk `v6` (Next 15/16) + OP `7.4.0` | `@clerk/nextjs v6` ofrece soporte nativo para las APIs asíncronas de Next.js 15/16 + verificación criptográfica GNAP (`Subject Grant` + Hash Verification). |
| **Pagos Interledger** | `@interledger/open-payments` | `7.4.0` | SDK oficial para llamadas GNAP, `IncomingPayment`, `Quote`, `OutgoingPayment`, `token.rotate` y consulta de límites en Rafiki/Test Wallet. |
| **Almacenamiento (Storage)** | Cloudflare R2 (`@aws-sdk/client-s3` + `s3-request-presigner`) | `3.700.0` | Subida directa con Presigned URLs (sin límite de tamaño en el MVP) para originales y previsualizaciones. |
| **Notificaciones Email** | Resend (`resend`) | `4.0.1` | Alertas transaccionales de solicitud de extensión (`24h`), aceptación automática (`32h`), ventana de reclamaciones (`30m`), disputas y resultados. |
| **Orquestación IA** | Vercel AI SDK (`ai`) + `@ai-sdk/groq` / `@ai-sdk/google` | `4.0.x` / `1.0.x` | Generación de informes consultivos estructurados (`generateObject`) para tareas de **imagen y texto** en el MVP a partir de `AiAdvisorInputContractSchema`. |
| **Validación y Testing BDD** | `zod` + `vitest` + `@cucumber/cucumber` (o `vitest-cucumber`) | `3.23.8` | Contratos SDD evolutivos y ejecución automatizada de los escenarios BDD en Gherkin. |

---

## 12. Registro Histórico de Decisiones y Reglas de Negocio Vigentes

| ID | Tema de la Decisión | Regla Oficial Vigente en el Contexto Maestro |
| :---- | :---- | :---- |
| **✅ Regla 1** | **Revisión de Entrega (`32h`) y Ventana Final de Reclamaciones (`30 min`)** | Cada entrega abre un periodo de revisión de **32 horas**. Si el Buyer acepta o vencen las 32 horas sin respuesta (aceptación automática), comienza una **ventana final de reclamaciones de 30 minutos**. Si transcurren los 30 minutos sin reclamación, se libera el **96 % al Freelancer y 4 % a TaskStream**. Si se presenta una reclamación válida en los 30 minutos, se suspende la liberación automática y pasa a disputa administrativa. |
| **✅ Regla 2** | **Límite Global de Correcciones (`Máximo 2 por orden`) y Disputas** | El Buyer puede solicitar máximo **2 correcciones globales por orden** (no se reinicia con nuevas entregas ni con una extensión). Si se agotan las 2 correcciones sin acuerdo, se abre una **disputa administrativa** donde el Administrador decide de forma binaria y justificada (**100 % al Buyer** o **96 % / 4 % al Freelancer**). |
| **✅ Regla 3** | **Extensión Única (`Hasta 7 días adicionales`) y Respuesta en `24h`** | Si no entrega en los primeros 7 días, el Freelancer puede solicitar **una única extensión de hasta 7 días adicionales** (hasta 14 días totales). El Buyer tiene **24 horas** para aprobar o rechazar. Si rechaza o no responde en 24 horas, o si el Freelancer tampoco entrega dentro de la extensión aprobada, se reembolsa el **100 %** al Buyer. |
| **✅ Regla 4** | **Alcance del Consejero de IA (`Solo Imagen y Texto en MVP`) y Contrato en `SPEC-08`** | En el MVP, `AiAdvisorService` **solo audita y asesora tareas de imagen y texto**, concretando en `SPEC-08.md` el contrato exacto de entrada (`AiAdvisorInputContractSchema`) para producir `AiAdvisorReportSchema`. El resto de formatos y la suscripción se dejan planteados para Post-MVP. |

---

## 13. Enlaces Oficiales de Referencia y Documentación Técnica

* **Interledger Hackathon Overview:** [https://interledger.org/es/hackathon/overview/](https://interledger.org/es/hackathon/overview/)
* **Hackatones de Open Payments:** [https://interledger.org/es/hackathon/open-payments/](https://interledger.org/es/hackathon/open-payments/)
* **Política Oficial de Uso de IA del Hackathon:** [https://interledger.org/es/hackathon/ai-policy/](https://interledger.org/es/hackathon/ai-policy/)
* **Criterios de Envío y Evaluación del Hackathon:** [https://interledger.org/es/hackathon/submission-judging/](https://interledger.org/es/hackathon/submission-judging/)
* **Tecnología Open Payments:** [https://interledger.org/es/tech/open-payments/](https://interledger.org/es/tech/open-payments/)
* **Documentación Oficial Open Payments (`Getting Started`):** [https://openpayments.dev/es/overview/getting-started/](https://openpayments.dev/es/overview/getting-started/)
* **Guía Oficial — Verificar la Propiedad de una Wallet Address (`Subject Grant`):** [https://openpayments.dev/es/guides/verify-wallet-address-ownership/](https://openpayments.dev/es/guides/verify-wallet-address-ownership/)
* **Guía Oficial — Concesiones para Pagos Salientes Futuros y Recurrentes:** [https://openpayments.dev/es/guides/outgoing-grant-future-payments/](https://openpayments.dev/es/guides/outgoing-grant-future-payments/)
* **Guía Oficial — Dividir Pagos Entrantes (`Split Payments`):** [https://openpayments.dev/es/guides/split-payments/](https://openpayments.dev/es/guides/split-payments/)
* **Interledger Test Wallet (Sandbox Oficial):** [https://wallet.interledger-test.dev/](https://wallet.interledger-test.dev/)
* **Referencia de Marketplace y Categorías:** [https://www.fiverr.com/](https://www.fiverr.com/)
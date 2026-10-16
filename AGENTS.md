# Reglas Globales de Ingeniería y Política Inmutable de Uso de IA — TaskStream AI

> **Archivo de Gobernanza Activa (`AGENTS.md`):** Este archivo se carga automáticamente en el contexto de cualquier agente de IA que opere sobre el repositorio **TaskStream AI** (`Haki-Suave`). Su cumplimiento es **estricto, obligatorio e innegociable** en cada turno de conversación.

---

## 1. Fuente de Verdad del Proyecto

1. El archivo [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md) es la **Única Fuente de Verdad (Single Source of Truth - SSoT)** funcional, arquitectónica y de negocio del proyecto.
2. Antes de tomar decisiones de diseño, escribir especificaciones (`SPEC-XXX.md`) o modificar código en `apps/` o `packages/`, el agente debe verificar la coherencia con [`.agents/CONTEXT.md`](file:///c:/Users/maico/Desktop/Haki-Suave/.agents/CONTEXT.md).

---

## 2. Política Obligatoria de Trazabilidad de Uso de IA ([`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) y [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md))

Cada movimiento, cambio, modificación de archivos o decisión arquitectónica que tome una herramienta de IA dentro de este repositorio **debe registrarse obligatoriamente en el mismo turno en que se ejecuta**, cumpliendo las siguientes premisas:

### 2.1. Reglas para [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) (Raíz del Repositorio)

1. **Identificación de la Herramienta de IA (Sin Modelos ni Esfuerzos Específicos):**
   * Se debe indicar únicamente la herramienta de IA utilizada (ej. **`Antigravity`**).
   * **Prohibición expresa:** No se deben detallar nombres específicos de modelos internos ni niveles de esfuerzo computacional; únicamente la herramienta de IA empleada.
2. **Propósito y Desglose por Área del Proyecto:**
   * Se debe especificar claramente para qué se utilizó la IA y en qué área del proyecto tuvo lugar cada intervención: `Planeación`, `Gobernanza`, `Backend`, `Frontend`, `IA`, `Tests`, etc.
3. **Listado Exacto de Archivos Creados o Modificados por la IA:**
   * Todo archivo creado, editado o eliminado por la IA debe figurar explícitamente en la tabla de trazabilidad de [`AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/AI_USAGE.md) indicando su ruta, el área correspondiente y el resumen del cambio efectuado.
4. **Declaración de Archivos con Uso de IA Mínimo o Nulo:**
   * Se debe mantener actualizada la sección que especifica qué archivos o componentes del proyecto tienen intervención de IA mínima o nula y son de implementación/verificación manual prioritaria por el equipo humano (en particular, el archivo del servicio de pagos abiertos `apps/api/src/modules/open-payments/open-payments.service.ts` / `escrow-payment.service.ts`, la configuración criptográfica de claves `Ed25519` de Rafiki y archivos de infraestructura manual).

### 2.2. Reglas para [`promptsAI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/promptsAI_USAGE.md) y [`prompts/AI_USAGE.md`](file:///c:/Users/maico/Desktop/Haki-Suave/prompts/AI_USAGE.md)

1. **Registro del 100% de los Prompts Sin Excepción:**
   * **Todos y cada uno de los prompts** enviados por el usuario/equipo a la herramienta de IA deben añadirse de forma secuencial e íntegra.
2. **Contenido Obligatorio por Cada Prompt Registrado:**
   * **Texto literal e íntegro (verbatim) del prompt enviado a la IA** (está prohibido guardar únicamente un resumen).
   * **Breve resumen acerca de su funcionalidad** y de los cambios o decisiones que produjo.
   * **Área del proyecto en la que toma lugar** (`Planeación`, `Gobernanza`, `Frontend`, `Backend`, `IA`, `Tests`, etc.).
   * **Archivos creados o modificados** durante la ejecución de ese prompt.
3. **Sincronización Dual (`promptsAI_USAGE.md` y `prompts/AI_USAGE.md`):**
   * Para satisfacer simultáneamente la convención de archivo raíz (`promptsAI_USAGE.md`) y la estructura de directorio exigida por la [Política de IA del Hackathon de Interledger](https://interledger.org/es/hackathon/ai-policy/) (`/prompts/AI_USAGE.md`), ambos archivos deben actualizarse de manera idéntica en cada intervención.

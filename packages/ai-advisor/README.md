# `@taskstream/ai-advisor` (SPEC-08)

Consejero consultivo para entregables de **imagen** y **texto**. No mueve dinero ni cambia el lifecycle de la orden.

## API

```ts
import { advise, createFakeAiAdvisorProvider } from '@taskstream/ai-advisor';

const report = await advise(input, {
  provider: createFakeAiAdvisorProvider(/* salida fija */),
});
```

- `advise(input)` valida `AiAdvisorInputContractSchema`, comprueba modalidad vs categoría, aplica pre-check y, si pasa, llama al proveedor.
- Artefacto encapsulado en `<untrusted_deliverable_artifact>` (solo en el prompt de usuario).
- **IMAGE:** exige `imageSignedUrlOrBase64` como data URL; el proveedor envía bytes en un mensaje multimodal. No reenvía URLs http(s).
- Modelos texto (`AI_ADVISOR_MODEL_ID`, p. ej. `llama-3.3-70b-versatile` / `openai/gpt-oss-*`) **no** ven imágenes. Para IMAGE configure `AI_ADVISOR_VISION_MODEL_ID` (p. ej. `qwen/qwen3.8-27b`). Sin modelo vision, falla cerrado (no se simula visión). Groq exige ≥32px por lado.
- Proveedor por defecto: Groq + `generateObject` (carga diferida). Requiere `GROQ_API_KEY`.
- Persistencia y `GET .../ai-report`: responsabilidad de `BE-2`. Panel Buyer: `FE-1`.

## Tests

```bash
pnpm --filter @taskstream/ai-advisor test
```

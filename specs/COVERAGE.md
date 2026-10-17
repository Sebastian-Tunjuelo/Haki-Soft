# Matriz de cobertura del MVP — TaskStream AI

Fuente vigente de reglas: `.agents/CONTEXT.md`. Esta matriz no cierra las decisiones abiertas de `planning/taskboard.md` §4.

La autenticación vigente es el registro local (correo y contraseña) de `SPEC-02` y de `.agents/CONTEXT.md` §4. `origin/master` volvió a divergir con Clerk; no se integró. Las specs nuevas no definen `ClerkAuthGuard`.

| Requisito | SPEC | Depende de (contrato / implementación) | Equipos | Definición | Cubierto cuando |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Índice y ciclo SDD | `SPEC-00` | Ninguna | `AI-1` | `Testeada (TESTED)` | El índice lista `SPEC-00` a `SPEC-12` |
| Contratos Zod, mocks, Prisma | `SPEC-01` | Contrato de `SPEC-00` | `AI-1`, `FE-1`, `BE-2` | `Testeada (TESTED)` | `splitSingleBlockEscrow` y los esquemas de `CONTEXT.md` §8.2 parsean |
| Sesión local y wallet | `SPEC-02` | Contrato de `SPEC-01` | `FE-1`, `BE-1`, `BE-2` | `Implementada (IMPLEMENTED)` | Alta con correo y contraseña, y una sola wallet verificada |
| Scroll y escena base | `SPEC-03` | Contrato de `SPEC-01` | `FE-1`, `FE-2` | `Testeada (TESTED)` | Canvas aislado, sin scroll en estado de React |
| Catálogo, Gigs y publicaciones | `SPEC-04` | Contrato de `SPEC-02` | `FE-1`, `FE-2`, `BE-2` | `Redactada (DRAFTED)` | CRUD de Gig y publicación con tope y plazo de hasta 7 días |
| Ofertas, Gig fijo y modalidad IA | `SPEC-05` | Contrato de `SPEC-04`; la orden no espera el pago | `FE-1`, `BE-1`, `AI-1` | `Redactada (DRAFTED)` | Orden en `PENDING_ESCROW_FUNDING` y `resolveMvpAiAuditableModality` |
| Fondeo 100 %, 96/4, reembolso 100 % | `SPEC-06` | Contrato de dinero ya en `shared-schemas`; implementación `🛡️` de Rafiki | `BE-1`, `BE-2`, `FE-1`, `FE-2`, `AI-1` | `Redactada (DRAFTED)` | Ledger 96/4 o reembolso 100 % con clave única |
| Original, preview y visores | `SPEC-07` | Contrato `DeliverablePreviewViewSchema`; R2 es implementación | `BE-2`, `FE-2`, `BE-1` | `Redactada (DRAFTED)` | Original oculto en `IN_REVIEW` y seis previews |
| Informe consultivo imagen/texto | `SPEC-08` | Contratos de `CONTEXT.md` §8.2; el modelo es implementación de `AI-1` | `AI-1`, `FE-1`, `BE-2` | `Redactada (DRAFTED)` | `advise` no corre fuera de imagen/texto y no mueve dinero |
| Cinco relojes, extensión, dos correcciones | `SPEC-09` | Contrato de estados; el movimiento de dinero lo implementa `SPEC-06` | `BE-2`, `BE-1`, `FE-1` | `Redactada (DRAFTED)` | Cada job deja el estado de `CONTEXT.md` §5.3 |
| Disputa binaria | `SPEC-10` | Contrato `ResolveDisputeSchema`; el payout lo implementa `SPEC-06` | `BE-1`, `BE-2`, `FE-1` | `Redactada (DRAFTED)` | El job de 30 min se cancela y la decisión es solo 100 % o 96/4 |
| Recorrido completo | `SPEC-11` | Implementación de `SPEC-02` a `SPEC-10` | Todos | `Redactada (DRAFTED)` | Los cinco escenarios de `CONTEXT.md` §9 pasan sin mocks de negocio |
| Deploy de la demo | `SPEC-12` | Implementación de `SPEC-11` | Todos | `Redactada (DRAFTED)` | Health público, secretos fuera de git y sesión local |

## Huecos que no son specs nuevas

| Tema | Dónde queda | Por qué no hay otra SPEC |
| :--- | :--- | :--- |
| `DEC-OPEN-01` confirmación del Freelancer en el Gig | `SPEC-06` §11 | Cambiaría el arranque. No se cierra en la redacción. |
| `DEC-OPEN-02` TTL de `PENDING_ESCROW_FUNDING` | `SPEC-06` §11 | El tablero lo dejó urgente. Inventar el job sería una decisión de producto. |
| `DEC-OPEN-03` carrera del día 7 | `SPEC-09` §11 | Las dos opciones siguen abiertas. |
| `DEC-OPEN-04` grant diferido del escrow | `SPEC-06` §11 | Recomendación del tablero, sin cierre. |
| `DEC-OPEN-05` FX del reembolso | `SPEC-06` y `SPEC-10` | La cifra USD es el 100 % custodiado. El monto local lo pone Rafiki. |
| Texto viejo de Clerk en el tablero | `T-F1-FE1-01` y `T-F1-BE2-01` | Se alineó la frase al registro local. El estado de la tarea no se marcó hecho de más. |

## Paralelismo

`FE-1`, `FE-2`, `BE-2` y `AI-1` pueden avanzar con los esquemas y mocks citados en cada spec. `BE-1` puede avanzar en reglas de estado con un doble de escrow. El código de `open-payments.service.ts` y `escrow-payment.service.ts` sigue siendo manual. `SPEC-11` y `SPEC-12` sí esperan implementación: están en `[WAITING_SYNC]`.

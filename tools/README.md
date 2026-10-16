# Herramientas de Desarrollo de Open Payments e Interledger — TaskStream AI

Este directorio contiene las herramientas de desarrollo y prueba para la integración con **Open Payments API** y el protocolo **Interledger (ILP)**.

---

## 1. Open Payments CLI (`tools/open-payments-cli`)

CLI interactivo oficial desarrollado por la **Interledger Foundation**. Permite interactuar con la API de Open Payments y realizar pruebas de inicio a fin desde la terminal.

* **Ubicación:** `tools/open-payments-cli`
* **Instalación:** Ejecutada (`pnpm install --ignore-workspace`).

### Modos de Uso:

#### Modo Interactivo (solicita datos por consola):
```bash
cd tools/open-payments-cli
pnpm start
```

#### Modo Configurado (usando `.env`):
1. Copia la plantilla de variables:
   ```bash
   cp .env.example .env
   ```
2. Completa los valores con las credenciales obtenidas de [Interledger Test Wallet](https://wallet.interledger-test.dev/).
3. Inicia la sesión:
   ```bash
   pnpm start:config
   ```

### Comandos Disponibles dentro del CLI:
| Comando | Descripción |
| :--- | :--- |
| `ip:create [amount]` | Crea un pago entrante (*Incoming Payment*). |
| `ip:complete` | Completa el pago entrante creado previamente en la sesión. |
| `ip:get` | Consulta el pago entrante actual. |
| `quote:create [debitAmount]` | Solicita una cotización (*Quote*) en la billetera de origen. |
| `quote:get` | Consulta la cotización calculada. |
| `grant:op [debitAmount] [receiveAmount]` | Inicia la solicitud de concesión GNAP para pagos salientes. |
| `op:create` | Ejecuta el pago saliente (*Outgoing Payment*). |
| `op:get` | Consulta el estado del pago saliente. |
| `session:get` | Muestra la información de la sesión activa. |
| `session:wa:set-sending <url>` | Establece la billetera emisora. |
| `session:wa:set-receiving <url>` | Establece la billetera receptora. |
| `scenario <archivo.txt>` | Ejecuta una lista de comandos automatizados desde un archivo. |
| `exit` | Sale de la sesión del CLI. |

---

## 2. Open Payments MCP Server (`tools/open-payments-mcp`)

Servidor MCP (*Model Context Protocol*) que expone operaciones de Open Payments sobre `stdio` mediante el SDK `@interledger/open-payments` (v7.4.0) y `@modelcontextprotocol/sdk`. Permite que asistentes de IA (Antigravity, Cursor, Claude Desktop) descubran y ejecuten pagos, cotizaciones y validaciones directamente.

* **Ubicación:** `tools/open-payments-mcp`
* **Compilación:** Código TypeScript compilado a JavaScript en `dist/index.js`.
* **Tools MCP Disponibles:**
  * `get_wallet_address`: Consulta y valida metadatos de una dirección de billetera ILP.
  * `request_grant`: Inicia una solicitud de concesión GNAP interactiva o no interactiva.
  * `continue_grant`: Continúa la concesión GNAP tras interacción/aprobación del usuario.
  * `create_incoming_payment`: Crea un pago entrante en la billetera del receptor.
  * `get_incoming_payment`: Consulta detalles y estado de un pago entrante.
  * `create_quote`: Solicita una cotización (*Quote*) entre billeteras con tasas y montos.
  * `get_quote`: Consulta los detalles de una cotización generada.
  * `create_outgoing_payment`: Ejecuta un pago saliente (*Outgoing Payment*) debitando fondos.
  * `get_outgoing_payment`: Consulta el estado y confirmación del pago saliente.

### Activación en Antigravity (`~/.gemini/config/mcp_config.json`):

Una vez que tengas tus credenciales de la Test Wallet:

1. Crea tu archivo `.env` en `tools/open-payments-mcp/.env` copiando de `.env.example`:
   ```bash
   cd tools/open-payments-mcp
   cp .env.example .env
   ```
2. Añade la configuración al archivo `~/.gemini/config/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "open-payments": {
         "command": "node",
         "args": [
           "C:\\Users\\sebas\\OneDrive\\Desktop\\Haki-Soft\\tools\\open-payments-mcp\\dist\\index.js"
         ],
         "env": {
           "OPEN_PAYMENTS_CLIENT_ADDRESS": "https://wallet.interledger-test.dev/...",
           "OPEN_PAYMENTS_KEY_ID": "tu-key-id",
           "OPEN_PAYMENTS_PRIVATE_KEY_PATH": "C:\\ruta\\a\\tu-clave-privada.key"
         }
       }
     }
   }
   ```

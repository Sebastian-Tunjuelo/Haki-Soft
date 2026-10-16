# Open Payments MCP

Standalone MCP server exposing core Open Payments operations over stdio.

## Tools

- `get_wallet_address`
- `request_grant`
- `continue_grant`
- `create_incoming_payment`
- `get_incoming_payment`
- `create_quote`
- `get_quote`
- `create_outgoing_payment`
- `get_outgoing_payment`

## Configuration

Set these environment variables before running:

```sh
export OPEN_PAYMENTS_CLIENT_ADDRESS="https://example.com/client"
export OPEN_PAYMENTS_PRIVATE_KEY_PATH="/absolute/path/to/private.key"
export OPEN_PAYMENTS_KEY_ID="your-key-id"
```

Optional:

```sh
export OPEN_PAYMENTS_SESSION_FILE=".data/open-payments-sessions.json"
export OPEN_PAYMENTS_CALLBACK_PORT="3999"
export OPEN_PAYMENTS_MAX_DEBIT_AMOUNT="100000"
```

You can start from `.env.example` if you prefer loading env vars with your MCP client or shell.

The private key path, key ID, access tokens, and grant continuation tokens are never accepted as MCP tool inputs and are not returned in MCP tool responses.

## Run

```sh
pnpm install
pnpm build
pnpm start
```

For development:

```sh
pnpm dev
```

## Payment Flow

Typical peer-style flow using the core tools:

1. `get_wallet_address` for receiver and sender.
2. `request_grant` for receiver `incoming-payment` access.
3. `create_incoming_payment`.
4. `request_grant` for sender `quote` access.
5. `create_quote`.
6. `request_grant` for sender `outgoing-payment` access.
7. User opens `interactRedirectUrl` and approves in their wallet.
8. `continue_grant`.
9. `create_outgoing_payment`.
10. `get_outgoing_payment`.

Outgoing payment execution requires the finalized grant produced after user approval.

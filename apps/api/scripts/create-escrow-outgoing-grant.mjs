/**
 * Genera OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN (grant outgoing sobre la wallet de custodia).
 *
 * Uso (desde apps/api):
 *   node scripts/create-escrow-outgoing-grant.mjs
 *
 * 1) Abre la URL de interacción en el navegador (logueado en Test Wallet).
 * 2) Autoriza el grant.
 * 3) El script captura el callback, imprime el token y ofrece pegarlo en .env.
 *
 * La lista "Grants" de la Test Wallet estará vacía hasta que completes este flujo una vez.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
} from '@interledger/open-payments';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '..');
const envPath = resolve(apiRoot, '.env');
const finishPort = 3344;
const finishPath = '/escrow-grant-callback';
const finishUri = `http://127.0.0.1:${finishPort}${finishPath}`;

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function normalizePrivateKey(value) {
  const trimmed = value.trim();
  if (trimmed.includes('\\n') && !trimmed.includes('\n')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  return trimmed;
}

function readPrivateKey() {
  const filePath = (process.env.OPEN_PAYMENTS_PRIVATE_KEY_PATH ?? '').trim();
  if (filePath) {
    return normalizePrivateKey(readFileSync(filePath, 'utf8'));
  }
  return normalizePrivateKey(process.env.OPEN_PAYMENTS_PRIVATE_KEY ?? '');
}

/** Hash GNAP alineado con Rafiki (Base64 con padding). */
function gnapInteractHash({ clientNonce, finishNonce, interactRef, authServerUrl }) {
  const material = `${clientNonce}\n${finishNonce}\n${interactRef}\n${authServerUrl}`;
  return createHash('sha256').update(material, 'ascii').digest('base64');
}

function readFinishNonce(finish) {
  if (typeof finish === 'string' && finish.length > 0) return finish;
  if (finish && typeof finish === 'object' && typeof finish.nonce === 'string') {
    return finish.nonce;
  }
  return null;
}

function upsertEnvToken(token) {
  if (!existsSync(envPath)) {
    console.log('\nNo hay apps/api/.env; pega manualmente:');
    console.log(`OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN=${token}`);
    return;
  }
  let raw = readFileSync(envPath, 'utf8');
  if (/^OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN=/m.test(raw)) {
    raw = raw.replace(
      /^OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN=.*$/m,
      `OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN=${token}`,
    );
  } else {
    raw = `${raw.trimEnd()}\nOPEN_PAYMENTS_ESCROW_ACCESS_TOKEN=${token}\n`;
  }
  writeFileSync(envPath, raw, 'utf8');
  console.log('\nActualizado apps/api/.env → OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN');
}

loadEnvFile(envPath);

const walletAddressUrl =
  (process.env.OPEN_PAYMENTS_ESCROW_WALLET_ADDRESS ?? '').trim() ||
  (process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS ?? '').trim();
const keyId = (process.env.OPEN_PAYMENTS_KEY_ID ?? '').trim();
const privateKey = readPrivateKey();

if (!walletAddressUrl || !keyId || !privateKey) {
  console.error(
    'Faltan OPEN_PAYMENTS_ESCROW_WALLET_ADDRESS (o CLIENT), KEY_ID o PRIVATE_KEY(_PATH) en apps/api/.env',
  );
  process.exit(1);
}

const clientNonce = randomBytes(32).toString('base64url');
/** Límite alto para varios payouts demo (centavos / minor units). */
const debitLimitValue = process.env.ESCROW_GRANT_DEBIT_LIMIT ?? '10000000';

const client = await createAuthenticatedClient({
  walletAddressUrl: (process.env.OPEN_PAYMENTS_CLIENT_WALLET_ADDRESS ?? walletAddressUrl).trim(),
  keyId,
  privateKey,
  validateResponses: true,
  logLevel: 'silent',
});

const wallet = await client.walletAddress.get({ url: walletAddressUrl });
console.log('Wallet custodia:', wallet.id);
console.log('Asset:', wallet.assetCode, 'scale', wallet.assetScale);

const pending = await client.grant.request(
  { url: wallet.authServer },
  {
    access_token: {
      access: [
        {
          identifier: wallet.id,
          type: 'outgoing-payment',
          actions: ['create', 'read', 'list', 'list-all', 'read-all'],
          limits: {
            debitAmount: {
              assetCode: wallet.assetCode,
              assetScale: wallet.assetScale,
              value: debitLimitValue,
            },
          },
        },
      ],
    },
    interact: {
      start: ['redirect'],
      finish: {
        method: 'redirect',
        uri: finishUri,
        nonce: clientNonce,
      },
    },
  },
);

if (!isPendingGrant(pending)) {
  console.error('Se esperaba un grant interactivo pendiente.');
  process.exit(1);
}

const finishNonce = readFinishNonce(pending.interact.finish);
if (!finishNonce) {
  console.error('El grant no trajo finish nonce.');
  process.exit(1);
}

console.log('\n=== PASO 1 ===');
console.log('Abre esta URL en el navegador (misma sesión de Test Wallet que la custodia):');
console.log(pending.interact.redirect);
console.log('\nEsperando callback en', finishUri, '…');

await new Promise((resolvePromise, rejectPromise) => {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${finishPort}`);
      if (url.pathname !== finishPath) {
        res.writeHead(404);
        res.end('not found');
        return;
      }

      const interactRef = url.searchParams.get('interact_ref') ?? '';
      const hash = url.searchParams.get('hash') ?? '';
      if (!interactRef || !hash) {
        res.writeHead(400);
        res.end('Faltan interact_ref o hash');
        return;
      }

      const expected = gnapInteractHash({
        clientNonce,
        finishNonce,
        interactRef,
        authServerUrl: wallet.authServer,
      });
      if (expected !== hash) {
        res.writeHead(400);
        res.end('GNAP hash mismatch');
        console.error('Hash inválido. expected=', expected, 'got=', hash);
        return;
      }

      const continued = await client.grant.continue(
        {
          url: pending.continue.uri,
          accessToken: pending.continue.access_token.value,
        },
        { interact_ref: interactRef },
      );

      if (!isFinalizedGrantWithAccessToken(continued)) {
        res.writeHead(500);
        res.end('Grant no finalizado');
        return;
      }

      const token = continued.access_token.value;
      upsertEnvToken(token);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        `<html><body style="font-family:sans-serif;padding:2rem">
          <h1>Grant OK</h1>
          <p>Token guardado en <code>apps/api/.env</code> como <code>OPEN_PAYMENTS_ESCROW_ACCESS_TOKEN</code>.</p>
          <p>Reinicia la API Nest y cierra esta pestaña.</p>
          <pre style="word-break:break-all;background:#111;color:#eee;padding:1rem">${token.slice(0, 24)}…</pre>
        </body></html>`,
      );

      console.log('\n=== LISTO ===');
      console.log('Token (inicio):', token.slice(0, 24) + '…');
      console.log('Reinicia la API para cargarlo.');
      server.close();
      resolvePromise();
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end(String(err));
      server.close();
      rejectPromise(err);
    }
  });

  server.listen(finishPort, '127.0.0.1', () => {
    console.log(`Servidor local escuchando :${finishPort}`);
  });
});

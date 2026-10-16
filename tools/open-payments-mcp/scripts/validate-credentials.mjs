#!/usr/bin/env node
import fs from "node:fs";
import { createAuthenticatedClient } from "@interledger/open-payments";

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

const clientAddress = process.env.OPEN_PAYMENTS_CLIENT_ADDRESS;
const privateKeyPath = process.env.OPEN_PAYMENTS_PRIVATE_KEY_PATH;
const keyId = process.env.OPEN_PAYMENTS_KEY_ID;

if (!clientAddress || !privateKeyPath || !keyId) {
  fail("Missing required envs. Set OPEN_PAYMENTS_CLIENT_ADDRESS, OPEN_PAYMENTS_PRIVATE_KEY_PATH, OPEN_PAYMENTS_KEY_ID");
}

if (!fs.existsSync(privateKeyPath)) {
  fail(`Private key not found at ${privateKeyPath}`);
}

try {
  // createAuthenticatedClient accepts a path for `privateKey` in this codebase
  await createAuthenticatedClient({ walletAddressUrl: clientAddress, privateKey: privateKeyPath, keyId });
  console.log("Credentials validated: createAuthenticatedClient succeeded");
  process.exit(0);
} catch (err) {
  console.error("createAuthenticatedClient error:");
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
}

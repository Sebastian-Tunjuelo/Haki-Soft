import path from "node:path";
import fs from "node:fs";

export type AppConfig = {
  clientAddress: string;
  privateKeyPath: string;
  keyId: string;
  sessionFile: string;
  callbackPort: number;
  maxDebitAmount?: bigint;
};

function loadDotEnv(filePath = path.resolve(process.cwd(), ".env")): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalPositiveInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  loadDotEnv();

  const sessionFile =
    process.env.OPEN_PAYMENTS_SESSION_FILE ??
    path.resolve(process.cwd(), ".data/open-payments-sessions.json");

  const maxDebitAmount = process.env.OPEN_PAYMENTS_MAX_DEBIT_AMOUNT
    ? BigInt(process.env.OPEN_PAYMENTS_MAX_DEBIT_AMOUNT)
    : undefined;

  return {
    clientAddress: requireEnv("OPEN_PAYMENTS_CLIENT_ADDRESS"),
    privateKeyPath: requireEnv("OPEN_PAYMENTS_PRIVATE_KEY_PATH"),
    keyId: requireEnv("OPEN_PAYMENTS_KEY_ID"),
    sessionFile,
    callbackPort: optionalPositiveInt("OPEN_PAYMENTS_CALLBACK_PORT", 3999),
    maxDebitAmount,
  };
}

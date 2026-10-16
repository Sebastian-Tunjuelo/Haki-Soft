import { z } from "zod";
import type { Amount } from "./types.js";

export const amountSchema = z.object({
  value: z.string().regex(/^[1-9][0-9]*$/, "value must be a positive integer string"),
  assetCode: z.string().min(1),
  assetScale: z.number().int().nonnegative(),
});

export const accessItemSchema = z
  .object({
    type: z.enum(["incoming-payment", "quote", "outgoing-payment"]),
    actions: z.array(z.string()).min(1),
  })
  .passthrough();

export function assertHttpsUrl(value: string, fieldName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use https://`);
  }
}

export function validateAmount(amount: Amount, fieldName: string): void {
  const parsed = amountSchema.safeParse(amount);
  if (!parsed.success) {
    throw new Error(`${fieldName} is invalid: ${parsed.error.issues[0]?.message}`);
  }
}

export function findOutgoingDebitAmount(access: unknown[]): Amount | undefined {
  for (const item of access) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type !== "outgoing-payment") continue;
    const limits = record.limits;
    if (!limits || typeof limits !== "object") continue;
    const debitAmount = (limits as Record<string, unknown>).debitAmount;
    const parsed = amountSchema.safeParse(debitAmount);
    if (parsed.success) return parsed.data;
  }
  return undefined;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

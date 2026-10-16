import { createHash, timingSafeEqual } from "node:crypto";

function base64UrlNoPadding(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function calculateInteractionHash(params: {
  clientNonce: string;
  interactNonce: string;
  interactRef: string;
  authServer: string;
}): string {
  const data = `${params.clientNonce}\n${params.interactNonce}\n${params.interactRef}\n${params.authServer}`;
  return base64UrlNoPadding(createHash("sha256").update(data, "ascii").digest());
}

export function verifyInteractionHash(params: {
  clientNonce: string;
  interactNonce: string;
  interactRef: string;
  authServer: string;
  receivedHash: string;
}): boolean {
  const expected = calculateInteractionHash(params);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(params.receivedHash);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

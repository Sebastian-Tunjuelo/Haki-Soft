export type JsonObject = Record<string, unknown>;

export type GrantStatus =
  | "requested"
  | "awaiting_approval"
  | "approved"
  | "finalized"
  | "payment_created"
  | "failed";

export type Amount = {
  value: string;
  assetCode: string;
  assetScale: number;
};

export type GrantSession = {
  id: string;
  status: GrantStatus;
  authServer: string;
  access: unknown[];
  createdAt: string;
  updatedAt: string;
  error?: string;
  continueUri?: string;
  continueAccessToken?: string;
  accessToken?: string;
  interactRedirectUrl?: string;
  clientNonce?: string;
  interactNonce?: string;
  interactRef?: string;
  interactHash?: string;
  hashVerified?: boolean;
  outgoingPayment?: unknown;
};

export type SessionStoreData = {
  sessions: Record<string, GrantSession>;
};

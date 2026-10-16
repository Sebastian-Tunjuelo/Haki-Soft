import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenPaymentsService } from "./open-payments-service.js";
import { accessItemSchema, amountSchema, sanitizeError } from "./validation.js";

function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResponse(error: unknown) {
  return {
    ...jsonResponse({
      error: {
        message: sanitizeError(error),
      },
    }),
    isError: true,
  };
}

async function handleTool<T>(handler: () => Promise<T>) {
  try {
    return jsonResponse(await handler());
  } catch (error) {
    return errorResponse(error);
  }
}

export function registerTools(server: McpServer, service: OpenPaymentsService): void {
  server.registerTool(
    "get_wallet_address",
    {
      title: "Get Wallet Address",
      description: "Resolve an Open Payments wallet address and return sanitized wallet details.",
      inputSchema: {
        walletAddress: z.string().url(),
      },
    },
    async ({ walletAddress }) => handleTool(() => service.getWalletAddress(walletAddress)),
  );

  server.registerTool(
    "request_grant",
    {
      title: "Request Grant",
      description: "Request an Open Payments grant. Outgoing payment grants are made interactive and return an approval URL.",
      inputSchema: {
        authServer: z.string().url(),
        access: z.array(accessItemSchema).min(1),
        interact: z.record(z.unknown()).optional(),
      },
    },
    async ({ authServer, access, interact }) => handleTool(() => service.requestGrant({ authServer, access, interact })),
  );

  server.registerTool(
    "continue_grant",
    {
      title: "Continue Grant",
      description: "Continue an interactive Open Payments grant after the user approves it.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        interactRef: z.string().optional(),
      },
    },
    async ({ grantSessionId, interactRef }) => handleTool(() => service.continueGrant({ grantSessionId, interactRef })),
  );

  server.registerTool(
    "create_incoming_payment",
    {
      title: "Create Incoming Payment",
      description: "Create an incoming payment using a finalized incoming-payment grant session.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        receiverWalletAddress: z.string().url(),
        incomingAmount: amountSchema.optional(),
        description: z.string().optional(),
        expiresAt: z.string().datetime().optional(),
      },
    },
    async ({ grantSessionId, receiverWalletAddress, incomingAmount, description, expiresAt }) =>
      handleTool(() =>
        service.createIncomingPayment({
          grantSessionId,
          receiverWalletAddress,
          incomingAmount,
          description,
          expiresAt,
        }),
      ),
  );

  server.registerTool(
    "get_incoming_payment",
    {
      title: "Get Incoming Payment",
      description: "Read incoming payment details using a finalized incoming-payment read grant.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        incomingPaymentUrl: z.string().url(),
      },
    },
    async ({ grantSessionId, incomingPaymentUrl }) => handleTool(() => service.getIncomingPayment({ grantSessionId, incomingPaymentUrl })),
  );

  server.registerTool(
    "create_quote",
    {
      title: "Create Quote",
      description: "Create a quote using a finalized quote grant session.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        senderWalletAddress: z.string().url(),
        receiver: z.string().url(),
        debitAmount: amountSchema.optional(),
        receiveAmount: amountSchema.optional(),
        method: z.string().optional(),
      },
    },
    async ({ grantSessionId, senderWalletAddress, receiver, debitAmount, receiveAmount, method }) =>
      handleTool(() =>
        service.createQuote({
          grantSessionId,
          senderWalletAddress,
          receiver,
          debitAmount,
          receiveAmount,
          method,
        }),
      ),
  );

  server.registerTool(
    "get_quote",
    {
      title: "Get Quote",
      description: "Read quote details using a finalized quote read grant.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        quoteUrl: z.string().url(),
      },
    },
    async ({ grantSessionId, quoteUrl }) => handleTool(() => service.getQuote({ grantSessionId, quoteUrl })),
  );

  server.registerTool(
    "create_outgoing_payment",
    {
      title: "Create Outgoing Payment",
      description: "Create an outgoing payment using a finalized outgoing-payment grant session.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        senderWalletAddress: z.string().url(),
        quoteId: z.string().url(),
        description: z.string().optional(),
      },
    },
    async ({ grantSessionId, senderWalletAddress, quoteId, description }) =>
      handleTool(() =>
        service.createOutgoingPayment({
          grantSessionId,
          senderWalletAddress,
          quoteId,
          description,
        }),
      ),
  );

  server.registerTool(
    "get_outgoing_payment",
    {
      title: "Get Outgoing Payment",
      description: "Read outgoing payment details using a finalized outgoing-payment read grant.",
      inputSchema: {
        grantSessionId: z.string().uuid(),
        outgoingPaymentUrl: z.string().url(),
      },
    },
    async ({ grantSessionId, outgoingPaymentUrl }) => handleTool(() => service.getOutgoingPayment({ grantSessionId, outgoingPaymentUrl })),
  );

  server.registerTool(
    "execute_peer_to_peer_payment",
    {
      title: "Execute Peer-to-Peer Payment",
      description:
        "Orchestrate a full peer-to-peer payment flow: incoming payment, quote, interactive outgoing grant, and outgoing payment (blocks until approval).",
      inputSchema: {
        sendingWalletAddressUrl: z.string().url(),
        receivingWalletAddressUrl: z.string().url(),
        incomingAmount: amountSchema.optional(),
        method: z.string().optional(),
        timeoutMs: z.number().int().positive().optional(),
        dryRun: z.boolean().optional(),
      },
    },
    async ({ sendingWalletAddressUrl, receivingWalletAddressUrl, incomingAmount, method, timeoutMs, dryRun }) =>
      handleTool(() =>
        service.executePeerToPeerPayment({
          sendingWalletAddressUrl,
          receivingWalletAddressUrl,
          incomingAmount,
          method,
          timeoutMs,
          dryRun,
        }),
      ),
  );
}

import http from "node:http";
import type { AddressInfo } from "node:net";
import { verifyInteractionHash } from "./hash.js";
import { SessionStore } from "./session-store.js";

function html(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 3rem; line-height: 1.5; }
      main { max-width: 42rem; margin: 0 auto; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`;
}

export class CallbackServer {
  private server?: http.Server;

  constructor(
    private readonly store: SessionStore,
    private readonly configuredPort: number,
  ) {}

  callbackUrl(sessionId: string): string {
    const port = this.port();
    return `http://localhost:${port}/callbacks/open-payments/${sessionId}`;
  }

  async start(): Promise<void> {
    if (this.server) return;

    this.server = http.createServer(async (request, response) => {
      try {
        if (!request.url) {
          this.send(response, 404, "Not Found", "Missing request URL.");
          return;
        }

        const url = new URL(request.url, `http://localhost:${this.port()}`);
        const match = url.pathname.match(/^\/callbacks\/open-payments\/([^/]+)$/u);
        if (!match) {
          this.send(response, 404, "Not Found", "Unknown callback route.");
          return;
        }

        const grantSessionId = decodeURIComponent(match[1]);
        const interactRef = url.searchParams.get("interact_ref");
        const receivedHash = url.searchParams.get("hash");

        if (!interactRef || !receivedHash) {
          this.send(response, 400, "Approval callback incomplete", "The wallet callback did not include interact_ref and hash.");
          return;
        }

        const session = await this.store.getRequired(grantSessionId);
        if (!session.clientNonce || !session.interactNonce) {
          throw new Error("Grant session is missing interaction nonce data.");
        }

        const hashVerified = verifyInteractionHash({
          clientNonce: session.clientNonce,
          interactNonce: session.interactNonce,
          interactRef,
          authServer: session.authServer,
          receivedHash,
        });

        await this.store.save({
          ...session,
          status: hashVerified ? "approved" : "failed",
          interactRef,
          interactHash: receivedHash,
          hashVerified,
          error: hashVerified ? undefined : "Open Payments callback hash verification failed.",
        });

        if (!hashVerified) {
          this.send(response, 400, "Approval verification failed", "The callback was received, but hash verification failed.");
          return;
        }

        this.send(response, 200, "Payment approval captured", "You can close this window and return to the agent to continue the grant.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown callback error.";
        this.send(response, 500, "Callback error", message);
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(this.configuredPort, () => {
        this.server?.off("error", reject);
        resolve();
      });
    });
  }

  private port(): number {
    if (!this.server) return this.configuredPort;
    const address = this.server.address() as AddressInfo | null;
    return address?.port ?? this.configuredPort;
  }

  private send(response: http.ServerResponse, status: number, title: string, message: string): void {
    response.writeHead(status, { "content-type": "text/html; charset=utf-8" });
    response.end(html(title, message));
  }

  async waitForInteractRef(grantSessionId: string, timeoutMs = 300_000): Promise<string> {
    const start = Date.now();
    const pollInterval = 500;

    // Poll the session store until an interactRef is present (set by the callback handler)
    while (Date.now() - start < timeoutMs) {
      try {
        const session = await this.store.get(grantSessionId);
        if (session && (session.interactRef || (session.status === "approved" && session.interactRef))) {
          return session.interactRef as string;
        }
      } catch {
        // ignore and retry
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Timed out waiting for interact_ref from wallet callback");
  }
}

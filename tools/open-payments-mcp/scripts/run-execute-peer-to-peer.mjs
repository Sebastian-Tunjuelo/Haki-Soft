#!/usr/bin/env node
import { loadConfig } from "../src/config.js";
import { SessionStore } from "../src/session-store.js";
import { CallbackServer } from "../src/callback-server.js";
import { OpenPaymentsService } from "../src/open-payments-service.js";

async function main() {
  const config = loadConfig();
  const store = new SessionStore(config.sessionFile);
  const callbackServer = new CallbackServer(store, config.callbackPort);
  const service = new OpenPaymentsService(config, store, callbackServer);

  const sending = "https://ilp.interledger-test.dev/thankssantosh";
  const receiving = "https://ilp.interledger-test.dev/isantoshv";

  console.error("Starting peer-to-peer tool (will block until you approve the outgoing grant)");
  try {
    const result = await service.executePeerToPeerPayment({
      sendingWalletAddressUrl: sending,
      receivingWalletAddressUrl: receiving,
      timeoutMs: 300000,
    });

    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error running peer-to-peer tool:");
    console.error(err);
    process.exit(1);
  }
}

main();

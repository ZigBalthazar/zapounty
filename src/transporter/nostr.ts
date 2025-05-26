import { hexToBytes } from "@noble/hashes/utils";
import { Relay, nip19, finalizeEvent } from "nostr-tools";
import { config } from "../config";
import { ITransporter } from "../transporter.interface";
import semver from "semver";

const nodeVersion = process.version;
if (semver.lt(nodeVersion, "20.0.0")) {
  // polyfills for node 18
  global.WebSocket = require("isomorphic-ws");
} else {
  // polyfills for node 20
  global.WebSocket = require("isomorphic-ws");
}

export class NostrTransporter implements ITransporter {
  private relays: string[];
  private privateKey: Uint8Array;

  constructor() {
    if (!config.privateKey) {
      throw new Error("Missing NOSTR_PRIVATE_KEY in .env");
    }

    if (config.nostrRelays.length == 0) {
      throw new Error("Missing NOSTR_RELAYS in .env");
    }
    this.relays = config.nostrRelays;
    this.privateKey = hexToBytes(config.privateKey);
  }

  async send(message: string): Promise<void> {
    const createdAt = Math.floor(Date.now() / 1000);

    let event = {
      kind: 1,
      created_at: createdAt,
      tags: [["t","devstr"],["t","dev"], ["t","zap"], ["t","bounty"], ["t","job"], ["t","jobstr"]],
      content: message,
    };

    

    const signedEvent = finalizeEvent(event, this.privateKey);

    let successfulRelays = 0;
    for (const relayUrl of this.relays) {
      const relay = await Relay.connect(relayUrl);

      try {
        await relay.publish(signedEvent);
        successfulRelays++;
        console.info(`Publish event to ${relayUrl} successdully.`);
      } catch (error) {
        console.error(`Failed to publish event to ${relayUrl}:`, error);
      } finally {
        relay.close();
      }
    }

    // Report success or failure
    if (successfulRelays === 0) {
      throw Error("Failed to connect to any relays.");
    } else {
      console.info(`Publish event to ${successfulRelays} relays`);
    }
  }

  async getPublicKeys(recipients: string) {
    const recipientsList = recipients.split("\n");
    const publicKeys = [];
    for (const recipient of recipientsList) {
      try {
        const recipientDecodeResult = await nip19.decode(recipient);
        const { type, data } = recipientDecodeResult;
        if (type === "npub") {
          publicKeys.push(data);
        } else {
          throw new Error(`Recipient ${recipient} is not an npub`);
        }
      } catch (error) {
        throw new Error(`Error decoding recipient ${recipient}: ${error}`);
      }
    }
    return publicKeys;
  }
}

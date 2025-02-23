import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent, SimplePool, EventTemplate } from "nostr-tools";
import { config } from "../config";
import { ITransporter } from "../transporter.interface";

export class NostrTransporter implements ITransporter {
  private relays: string[];
  private privateKey: Uint8Array;
  private pool: SimplePool;

  constructor() {
    if (!config.privateKey) {
      throw new Error("Missing PRIVATE_KEY in .env");
    }

    if (config.nostrRelays.length == 0) {
      throw new Error("Missing NOSTR_RELAYS in .env");
    }

    this.relays = config.nostrRelays;
    this.privateKey = hexToBytes(config.privateKey);
    this.pool = new SimplePool();
  }

  async send(message: string): Promise<void> {
    const event: EventTemplate = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: message,
    };

    const signedEvent = finalizeEvent(event, this.privateKey);
    await this.pool.publish(this.relays, signedEvent);
  }
}

import { ITransporter } from "./transporter.interface";
import { NostrTransporter } from "./transporter/nostr";
import { TelegramTransporter } from "./transporter/telegram";

export class TransporterFactory {
  static create(type: string): ITransporter {
    switch (type) {
      case "telegram":
        return new TelegramTransporter();
      case "nostr":
        return new NostrTransporter();
      default:
        throw new Error(`Unsupported transporter type: ${type}`);
    }
  }
}

import axios from "axios";
import { ITransporter } from "../transporter.interface";
import { config } from "../config";

export class TelegramTransporter implements ITransporter {
  private botToken: string;
  private chatId: string;

  constructor() {
    if (!config.botToken) {
      throw new Error("Missing BOT_TOKEN in .env");
    }

    if (!config.telegramChatId) {
      throw new Error("Missing TELEGRAM_CHAT_ID in .env");
    }
    this.botToken = config.botToken;
    this.chatId = config.telegramChatId;
  }

  async send(message: string): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      chat_id: this.chatId,
      text: message,
      parse_mode: "Markdown",
    });

    console.info("send new message to telegram")
  }
}

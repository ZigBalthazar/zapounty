import dotenv from "dotenv";

dotenv.config();

export const config = {
  privateKey: process.env.PRIVATE_KEY || "",
  botToken: process.env.BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  nostrRelays: process.env.NOSTR_RELAYS ? process.env.NOSTR_RELAYS.split(",") : [],
};

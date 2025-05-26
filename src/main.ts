import { Probot } from "probot";
import { TransporterFactory } from "./transporter.factory";
import { name, version } from "../package.json";

export default (app: Probot) => {
  console.info(`Running ${name}: ${version}`);

  app.on("issues.labeled", async (context) => {
    try {
      const issue = context.payload.issue;
      const label = context.payload.label?.name;
      const lang = context.payload.repository.language ?? "Unknown";

      if (isZapLabel(label)) {
        const message = generateMessage(undefined, issue.title, issue.html_url, lang, label);
        await sendToAll(message);
      }
    } catch (error) {
      console.error("Error processing labeled issue:", error);
    }
  });

  app.on("issue_comment.created", async (context) => {
    try {
      const comment = context.payload.comment.body ?? "";
      const issue = context.payload.issue;
      const lang = context.payload.repository.language ?? "Unknown";

      if (isZapComment(comment)) {
        const message = generateMessage(undefined, issue.title, issue.html_url, lang, comment);
        await sendToAll(message);
      }
    } catch (error) {
      console.error("Error processing issue comment:", error);
    }
  });
};

function isZapLabel(label?: string) {
  return label === "zap reward" || label === "zapounty";
}

function isZapComment(comment: string) {
  return /zap reward|zapounty/i.test(comment);
}

async function sendToAll(message: string) {
  try {
    const telegram = TransporterFactory.create("telegram");
    await telegram.send(message);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }

  try {
    const nostr = TransporterFactory.create("nostr");
    await nostr.send(message);
  } catch (error) {
    console.error("Error sending message to Nostr:", error);
  }
}

function generateMessage(
  amount: number | undefined,
  title: string,
  link: string,
  language: string,
  trigger: string
): string {
  return (
    `🌟 New Zap Notification 🌟\n\n` +
    `**Issue:** 📌 ${title}\n\n` +
    (amount ? `**Amount:** ${amount} ⚡ Sats \n\n` : "") +
    `**Language:** 💻 ${language}\n\n` +
    `Triggered by: ${trigger}\n\n` +
    `🔗 View Issue Here:\n${link}\n\n` +
    `Thank you for your participation! 🎉\n\n` +
    `#devstr #dev #bounty #zap #job #jobstr`
  );
}

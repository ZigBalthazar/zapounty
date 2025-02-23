import { Probot } from "probot";
import { TransporterFactory } from "./transporter.factory";
import { name, version } from "../package.json";

export default (app: Probot) => {
  console.info(`Running ${name}: ${version}`);

  app.on("issues.labeled", async (context) => {
    try {
      const issue = context.payload.issue;
      const label = context.payload.label?.name;
      const lang = context.payload.repository.language ?? "Unknown"

      if (label === "zap reward") {
        const comments = await context.octokit.issues.listComments({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: issue.number,
        });

        const zapRequest = comments.data
          .map((comment) => parseZapReward(comment.body ?? ""))
          .find((request) => request !== null);

        if (zapRequest) {
          const message = generateMessage(zapRequest.amount, issue.title, issue.html_url, lang);
          await sendToAll(message);
        }
      }
    } catch (error) {
      console.error("Error processing labeled issue:", error);
    }
  });

  app.on("issue_comment.created", async (context) => {
    try {
      const comment = context.payload.comment.body;
      const issue = context.payload.issue;
      const lang = context.payload.repository.language?? "Unknown"
      const zapRequest = parseZapReward(comment);

      if (zapRequest) {
        const message = generateMessage(zapRequest.amount, issue.title, issue.html_url, lang);
        await sendToAll(message);
      }
    } catch (error) {
      console.error("Error processing issue comment:", error);
    }
  });
};

/**
 * Sends a message to both Telegram and Nostr.
 */
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

/**
 * Parses a Zap Reward template from the comment.
 */
function parseZapReward(comment: string) {
  try {
    const zapRegex = /zap reward:\s*amount:\s*(\d+)/i;
    const match = comment.match(zapRegex);

    if (match) {
      return {
        amount: parseInt(match[1], 10),
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing Zap Reward:", error);
    return null;
  }
}

function generateMessage(amount: number, title: string, link: string, language: string): string {
  return (
    `🌟 New Zap Reward Request 🌟\n\n` +
    `**Issue:** 📌 ${title}\n\n` +
    `**Amount:** ${amount} ⚡ Sats \n\n` +
    `**Language:** 💻 ${language}\n\n` +
    `This reward has been requested for the following issue:\n` +
    `🔗 View Issue Here:\n${link}\n\n` +
    `Thank you for your participation! 🎉\n\n` +
    `#devstr #dev #bounty #zap #job #jobstr`
  );
}

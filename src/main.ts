import { Probot } from "probot";
import { TransporterFactory } from "./transporter.factory";
import { name, version } from "../package.json";

export default (app: Probot) => {
  console.info(`running ${name}: ${version}`);
  app.on("issues.labeled", async (context) => {
    const issue = context.payload.issue;
    const label = context.payload.label?.name;

    if (label === "zap reward") {
      const comments = await context.octokit.issues.listComments({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: issue.number,
      });

      const zapRequest = comments.data.map((comment) => parseZapReward(comment.body ?? "")).find((request) => request !== null);

      if (zapRequest) {
        const message =
          `🌟 **Zap Reward Request** 🌟\n\n` +
          `**Amount:** ${zapRequest.amount} ${zapRequest.currency}\n` +
          `**Expires On:** ${zapRequest.expireAt}\n\n` +
          `This reward has been requested for the following issue:\n` +
          `🔗 [View Issue Here](${issue.html_url})\n\n` +
          `Thank you for your participation! 🎉`;
        await sendToAll(message);
      }
    }
  });

  app.on("issue_comment.created", async (context) => {
    const comment = context.payload.comment.body;
    const issueUrl = context.payload.issue.html_url;

    const parsedData = parseZapReward(comment);

    if (parsedData) {
      const message =
        `🌟 **Zap Reward Request** 🌟\n\n` +
        `**Amount:** ${parsedData.amount} ${parsedData.currency}\n` +
        `**Expires On:** ${parsedData.expireAt}\n\n` +
        `This reward has been requested for the following issue:\n` +
        `🔗 [View Issue Here](${issueUrl})\n\n` +
        `Thank you for your participation! 🎉`;

      await sendToAll(message);
    }
  });
};

/**
 * Sends a message to both Telegram and Nostr.
 */
async function sendToAll(message: string) {
  // const telegram = TransporterFactory.create("telegram");
  // await telegram.send(message);

  const nostr = TransporterFactory.create("nostr");
  await nostr.send(message);
}

/**
 * Parses a Zap Reward template from the comment.
 */
function parseZapReward(comment: string) {
  const zapRegex = /zap reward:\s*amount:\s*(\d+)\s*currency:\s*(Sats|BTC)\s*expire at:\s*([\d-]+)/i;
  const match = comment.match(zapRegex);

  if (match) {
    return {
      amount: parseInt(match[1], 10),
      currency: match[2],
      expireAt: match[3],
    };
  }
  return null;
}

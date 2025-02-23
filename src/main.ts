import { Probot } from "probot";
import { TransporterFactory } from "./transporter.factory";

export default (app: Probot) => {
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
        const message = `⚡ Zap Reward Request ⚡\nAmount: ${zapRequest.amount} ${zapRequest.currency}\nExpires: ${zapRequest.expireAt}\n🔗 Issue Link: ${issue.html_url}`;
        await sendToAll(message);
      }
    }
  });

  app.on("issue_comment.created", async (context) => {
    const comment = context.payload.comment.body;
    const issueUrl = context.payload.issue.html_url;

    if (comment.includes("@your-bot")) {
      const parsedData = parseZapReward(comment);

      if (parsedData) {
        const message = `⚡ Zap Reward Request ⚡\nAmount: ${parsedData.amount} ${parsedData.currency}\nExpires: ${parsedData.expireAt}\n🔗 Issue Link: ${issueUrl}`;
        await sendToAll(message);
      } else {
        const fallbackMessage = `👤 Mentioned in issue: ${issueUrl}\n💬 Comment: ${comment}`;
        await sendToAll(fallbackMessage);
      }
    }
  });
};

/**
 * Sends a message to both Telegram and Nostr.
 */
async function sendToAll(message: string) {
  const telegram = TransporterFactory.create("telegram");
  await telegram.send(message);

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

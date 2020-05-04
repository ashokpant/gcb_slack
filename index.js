const { IncomingWebhook } = require('@slack/webhook');
const humanizeDuration = require('humanize-duration');
const url = process.env.SLACK_WEBHOOK_URL;

const webhook = new IncomingWebhook(url);

// subscribeSlack is the main function called by Cloud Functions.
module.exports.subscribeSlack = (pubSubEvent, context) => {
  const build = eventToBuild(pubSubEvent.data);

  // Skip if the current status is not in the status list.
  // Add additional statuses to list if you'd like:
  // QUEUED, WORKING, SUCCESS, FAILURE,
  // INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = ['SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT'];
  if (status.indexOf(build.status) === -1) {
    return;
  }

  // Send message to Slack.
  const message = createSlackMessage(build);
  webhook.send(message);
};

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

const DEFAULT_COLOR = '#4285F4'; // blue
const STATUS_COLOR = {
  QUEUED: DEFAULT_COLOR,
  WORKING: DEFAULT_COLOR,
  SUCCESS: '#34A853', // green
  FAILURE: '#EA4335', // red
  TIMEOUT: '#FBBC05', // yellow
  INTERNAL_ERROR: '#EA4335', // red
};

// createSlackMessage creates a message from a build object.
const createSlackMessage = (build) => {
  const buildFinishTime = new Date(build.finishTime);
  const buildStartTime = new Date(build.startTime);

  const isWorking = build.status === 'WORKING';
  const timestamp = Math.round(((isWorking) ? buildStartTime : buildFinishTime).getTime() / 1000);

  const text = (isWorking)
    ? `Build \`${build.id}\` started`
    : `Build \`${build.id}\` finished`;

  const fields = [{
    title: 'Status',
    value: build.status,
  }];

  if (!isWorking) {
    const buildTime = humanizeDuration(buildFinishTime - buildStartTime);

    fields.push({
      title: 'Duration',
      value: buildTime,
    });
  }

  const message = {
    text,
    mrkdwn: true,
    attachments: [
      {
        color: STATUS_COLOR[build.status] || DEFAULT_COLOR,
        title: 'Build logs',
        title_link: build.logUrl,
        fields,
        footer: 'Google Cloud Build',
        footer_icon: 'https://ssl.gstatic.com/pantheon/images/containerregistry/container_registry_color.png',
        ts: timestamp,
      },
    ],
  };

  let repoName, branchName;
  if (build.source && build.source.repoSource) {
    ({ repoName, branchName } = build.source.repoSource);
  }
  else if (build.substitutions) {
    repoName = build.substitutions.REPO_NAME;
    branchName = build.substitutions.BRANCH_NAME;
  }

  // Add source information to the message.
  if (repoName && branchName) {
    message.attachments[0].fields.push({
      title: 'Repository',
      value: repoName,
    });

    message.attachments[0].fields.push({
      title: 'Branch',
      value: branchName,
    });
  }

  // Add image(s) to the message.
  const images = build.images || [];
  if (images.length) {
    message.attachments[0].fields.push({
      title: `Image${(images.length > 1) ? 's' : ''}`,
      value: images.join('\n'),
    });
  }
  return message;
}

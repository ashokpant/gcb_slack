# gcb_slack
Google codebuild slack bot

## Steps

### Create slack app 
https://cloud.google.com/cloud-build/docs/configure-third-party-notifications#index.js

You will get slack webhook url from this step, e.g.,
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/TEPRC011N/XXXXXXX/ABCDN15ctR9QgCPrSaZ"

### Create Google Cloud Function
https://console.cloud.google.com/functions/

* Create new cloud function
* Create Trigger -> cloud pub/sub and select topic cloud-builds
* Select source->Node js 10 and paste code from index.js and package.json in corresponding tab.
* Ceate a ENV variable SLACK_WEBHOOK_URL and set the webhook from above
* Deploy and enjoy

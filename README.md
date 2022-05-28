# telegram-bot-for-workers

A simple telegram bot, to deploy on Cloudflare Workers.

## Deploy

Prerequisites: have `wrangler` installed, and logged in.

1. Fill your API token in `src/config.ts`
2. Change the source, if you want to.
3. `wrangler publish`.
4. Register your worker with telegram.

To tell telegram where your bot is, please set a webhook for your bot.

```shell
curl -sv https://api.telegram.org/bot<yourBotToken>/setWebhook\?url\=https://<workerName>.<yourSubDomain>.workers.dev/<WEBHOOK_PREFIX>
```

`WEBHOOK_PREFIX` can be set at `src/config.ts`.

## Features

1. Unpin messages in a group if they were forwarded from the corresponding channel.
2. Delete bot commands after a certain period (default: 8000 ms).

## Bugs & Suggestions

Please open an issue. Thanks in advance!

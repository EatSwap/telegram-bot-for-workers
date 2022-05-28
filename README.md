# telegram-bot-for-workers

A simple telegram bot, to deploy on Cloudflare Workers.

## Deploy

Prerequisites: have `wrangler` installed, and logged in.

1. Fill your API token in `src/config.ts`
2. Change the source, if you want to.
3. `wrangler publish`.

## Features

1. Unpin messages in a channel if they were forwarded from the corresponding channel.
2. Delete bot commands after a certain period (default: 8000 ms).

## Bugs & Suggestions

Please open an issue. Thanks in advance!

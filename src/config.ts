// Replace this with your API token.
export const API_TOKEN = "";

// Replace this with your random string.
export const WEBHOOK_PREFIX = "PaWX9rkB4dAnnE5r64DwN5JCUL9RyHsM"

// Set your custom delay here (ms)
export const DELETE_DELAY = 8000;

/**
 * Set grace time of new user here (seconds)
 * Note: set a value lower than 30 to make auto-kick work.
 * From Cloudflare Docs https://developers.cloudflare.com/workers/platform/limits/ :
 *
 * No limit* for duration
 * There is no hard limit for duration. However, after 30 seconds, there is a higher chance of eviction.
 */
export const NEW_MEMBER_GRACE = 30;

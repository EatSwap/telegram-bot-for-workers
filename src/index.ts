import { WEBHOOK_PREFIX } from "./config";
import {generateSimpleResponse} from "./utility";
import {handleBotRequest} from "./handleBot";

export interface Env {
	// Not used here, maybe in the future.
}

// Export function "fetch" for external use.
// "fetch" is where a request begins at.
export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		// ----- HTTP CHECK & PATH PARSE BEGINS -----
		// Check insecure HTTP
		if (request.url.startsWith("http://")) {
			return new Response("Insecure HTTP detected. Use HTTPS instead!", {
				headers: {
					"Location": "https" + request.url.substring(4)
				},
				status: 308
			});
		}

		// Now: https
		// Get path. "https://" is 8 chars long.
		const path = request.url.substring(request.url.indexOf("/", 8));
		// ----- HTTP CHECK & PATH PARSE ENDS -----

		// ----- Filter non-bot requests -----
		if (path.startsWith(WEBHOOK_PREFIX)) {
			return await handleBotRequest(request);
		}

		// If reached here, the request is not what we want.
		// Return a "402 Payment Required" response for fun.
		return generateSimpleResponse("402 Payment Required", 402);
	},
};







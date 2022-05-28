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


// Replace this with your random string.
const WEBHOOK_PREFIX = "/PaWX9rkB4dAnnE5r64DwN5JCUL9RyHsM"

async function handleBotRequest(request : Request) {
	// Non-POST requests were not from Telegram.
	if (request.method != "POST") {
		return generateSimpleResponse("405 Method Not Allowed", 405);
	}

	// POST body
	// This is a string
	const requestBody = await request.text();

	// Parse JSON from body
	let jsonObj : any;
	try {
		jsonObj = JSON.parse(requestBody);
	} catch (err) {
		return generateSimpleResponse("400 Bad Request", 400);
	}

	if (!jsonObj.hasOwnProperty("message")) {
		return generateSimpleResponse("400 Bad Request", 400);
	}
	const message = jsonObj.message;



	// Respond to requester
	return generateSimpleResponse("200 OK", 200);
}

async function callTelegramAPI(token : string, methodName : string, body : any) {
	const URL = getApiRoot(token) + "/" + methodName;
	const bodyStr = JSON.stringify(body);
	const request = new Request(URL, {
		body: bodyStr,
		headers: new Headers({
			"Content-Type": "application/json"
		}),
		method: "POST"
	});

	return await fetch(request);
}

/**
 * Generate a simple HTTP response using given body and status.
 * @param body string of response body
 * @param status status code of response
 */
function generateSimpleResponse(body : string, status : number) {
	return new Response(body, {
		status: status,
	})
}

/**
 * Construct API root for specific Telegram token
 * @param token the api token to be used
 */
function getApiRoot(token : string) {
	return "https://api.telegram.org/bot" + token;
}

import * as utility from "./utility"
import * as telegram from "./telegram";
import {API_TOKEN, DELETE_DELAY} from "./config";

export async function handleBotRequest(request : Request, ctx : ExecutionContext) {
	// Non-POST requests were not from Telegram.
	if (request.method != "POST") {
		return utility.generateSimpleResponse("405 Method Not Allowed", 405);
	}

	// POST body
	// This is a string
	const requestBody = await request.text();

	// Parse JSON from body
	let jsonObj : any;
	try {
		jsonObj = JSON.parse(requestBody);
	} catch (err) {
		return utility.generateSimpleResponse("400 Bad Request", 400);
	}

	if (!jsonObj.hasOwnProperty("message")) {
		return utility.generateSimpleResponse("400 Bad Request", 400);
	}

	const message = jsonObj.message;

	// Detect auto-forward & auto-pin
	if (message.hasOwnProperty("is_automatic_forward")) {
		await telegram.unpinChatMessage(API_TOKEN, message["chat"]["id"], message["message_id"]);
	}

	// Detect bot commands
	if (message.hasOwnProperty("entities")) {
		const len = message["entities"].length;
		for (let i = 0; i < len; i++) {
			const entity = message["entities"][i];
			// @ts-ignore
			if (!entity.hasOwnProperty("type") || entity["type"] != "bot_command")
				continue;
			ctx.waitUntil(new Promise(resolve => {
				setTimeout(() => {
					telegram.deleteMessage(API_TOKEN, message["chat"]["id"], message["message_id"]);
				}, DELETE_DELAY);
			}));
			break;
		}
	}

	// Respond to requester
	return utility.generateSimpleResponse("200 OK", 200);
}

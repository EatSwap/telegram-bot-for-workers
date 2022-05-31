import * as utility from "./utility"
import * as telegram from "./telegram";
import * as func from "./func"
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
	// todo: make this async.
	await func.handleAutoPin(message);

	// Detect bot commands
	// todo: make this async.
	await func.deleteBotCommands(message, ctx);

	// Restrict new user
	// todo: make async.
	await func.banNewMembers(message, ctx);

	// Respond to requester
	return utility.generateSimpleResponse("200 OK", 200);
}

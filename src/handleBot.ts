import * as utility from "./utility"
import * as func from "./func"

export async function handleBotRequest(request : Request, ctx : ExecutionContext) {
	// Non-POST requests were not from Telegram.
	if (request.method != "POST") {
		return utility.generateSimpleResponse("405 Method Not Allowed", 405);
	}

	// POST body
	// This is a string
	const requestBody = await request.text();
	console.log(requestBody);

	// Parse JSON from body
	const [jsonObj, parseOK] = utility.parseJSON(requestBody);
	if (!parseOK || !jsonObj.hasOwnProperty("message")) {
		// Discard silently.
		// For telegram, this means something not implemented (thus cannot handle, 2xx to ignore).
		// For any 3rd party, do not let them know how we worked.
		return utility.generateSimpleResponse("201 Created", 201);
	}
	const message = jsonObj.message;

	// Private or Group ?
	const isPrivate = message["from"]["id"].toString() == message["chat"]["id"].toString();
	console.log("Is private chat: " + isPrivate);

	if (isPrivate) {
		// Handle "/verify"
		if (message.hasOwnProperty("text") && message["text"].startsWith("/verify")) {
			await func.handleVerification(message);
		} else {
			await func.handleDefaultResponse(message);
		}

	} else {
		// Detect auto-forward & auto-pin
		// todo: make this async.
		await func.handleAutoPin(message);

		// Detect bot commands
		// todo: make this async.
		await func.deleteBotCommands(message, ctx);

		// Restrict new user
		// todo: make async.
		await func.banNewMembers(message, ctx);
	}

	// Respond to requester
	return utility.generateSimpleResponse("200 OK", 200);
}

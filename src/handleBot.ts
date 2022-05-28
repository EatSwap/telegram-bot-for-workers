import * as utility from "./utility"

export async function handleBotRequest(request : Request) {
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

	// Respond to requester
	return utility.generateSimpleResponse("200 OK", 200);
}
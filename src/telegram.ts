import {getApiRoot} from "./utility";

export async function callTelegramAPI(token : string, methodName : string, body : any) {
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

export async function unpinChatMessage(token : string, chat_id : string | number, message_id : number) {
	return await callTelegramAPI(token, "unpinChatMessage", {
		"chat_id" : chat_id,
		"message_id" : message_id,
	});
}

export async function deleteMessage(token : string, chat_id : string | number, message_id : number) {
	return await callTelegramAPI(token, "deleteMessage", {
		"chat_id" : chat_id,
		"message_id" : message_id,
	});
}

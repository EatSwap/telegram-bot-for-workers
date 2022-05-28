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
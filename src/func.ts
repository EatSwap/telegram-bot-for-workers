import * as telegram from "./telegram";
import {API_TOKEN, DELETE_DELAY} from "./config";

export async function handleAutoPin(message : any) {
	if (message.hasOwnProperty("is_automatic_forward")) {
		await telegram.unpinChatMessage(API_TOKEN, message["chat"]["id"], message["message_id"]);
	}
}

export async function deleteBotCommands(message : any, ctx : ExecutionContext) {
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
}

import {getApiRoot} from "./utility";

export class ChatPermissions {
	can_send_messages = false;
	can_send_media_messages = false;
	can_send_polls = false;
	can_send_other_messages = false;
	can_add_web_page_previews = false;
	can_change_info = false;
	can_invite_users = false;
	can_pin_messages = false;


	constructor(can_send_messages = false,
				can_send_media_messages = false,
				can_send_polls = false,
				can_send_other_messages = false,
				can_add_web_page_previews = false,
				can_change_info = false,
				can_invite_users = false,
				can_pin_messages = false) {
		this.can_send_messages = can_send_messages;
		this.can_send_media_messages = can_send_media_messages;
		this.can_send_polls = can_send_polls;
		this.can_send_other_messages = can_send_other_messages;
		this.can_add_web_page_previews = can_add_web_page_previews;
		this.can_change_info = can_change_info;
		this.can_invite_users = can_invite_users;
		this.can_pin_messages = can_pin_messages;
	}
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

export async function restrictChatMember(token : string, chat_id : string | number, user_id : number, perm : ChatPermissions) {
	return await callTelegramAPI(token, "restrictChatMember", {
		"chat_id" : chat_id,
		"user_id" : user_id,
		"permissions" : perm,
	});
}

export async function sendMessage(token : string, chat_id : string | number, text : string, parsing : string) {
	return await callTelegramAPI(token, "sendMessage", {
		"chat_id" : chat_id,
		"text" : text,
		"parse_mode" : parsing,
	});
}

export async function getChatMember(token : string, chat_id : string | number, user_id : number) {
	return await callTelegramAPI(token, "getChatMember", {
		"chat_id" : chat_id,
		"user_id" : user_id,
	});
}

export async function unbanChatMember(token : string, chat_id : string | number, user_id : number, only_if_banned : boolean) {
	return await callTelegramAPI(token, "unbanChatMember", {
		"chat_id" : chat_id,
		"user_id" : user_id,
		"only_if_banned" : only_if_banned,
	});
}

export async function sendSticker(token : string, chat_id : string | number, sticker_id : string) {
	return await callTelegramAPI(token, "sendSticker", {
		"chat_id" : chat_id,
		"sticker" : sticker_id,
	});
}

import * as telegram from "./telegram";
import {API_TOKEN, DELETE_DELAY} from "./config";
import {ChatPermissions} from "./telegram";
import * as sha256 from "fast-sha256";

export async function handleAutoPin(message : any) {
	if (message.hasOwnProperty("is_automatic_forward")) {
		await telegram.unpinChatMessage(API_TOKEN, message["chat"]["id"], message["message_id"]);
	}
}

export async function deleteBotCommands(message : any, ctx : ExecutionContext) {
	if (!message.hasOwnProperty("entities"))
		return;
	console.log("Handling bot commands");
	const len = message["entities"].length;
	for (let i = 0; i < len; i++) {
		const entity = message["entities"][i];
		// @ts-ignore
		if (!entity.hasOwnProperty("type") || entity["type"] != "bot_command")
			continue;
		ctx.waitUntil(new Promise(resolve => {
			setTimeout(() => {
				telegram.deleteMessage(API_TOKEN, message["chat"]["id"], message["message_id"]).then(resp => {
					console.log(resp.status);
					resp.text().then(console.log);
				})
			}, DELETE_DELAY);
		}));
		break;
	}
}

function toStringThenUint8Array(d : any) {
	return Uint8Array.from(d.toString().split("").map((x: string) => x.charCodeAt(0)));
}

function toHexStr(d : Uint8Array) {
	return Array.from(d, x => {
		return ('0' + (x & 0xFF).toString(16)).slice(-2);
	}).join('');
}

export async function banNewMembers(message : any, ctx : ExecutionContext) {
	if (!message.hasOwnProperty("new_chat_member"))
		return;
	const newMemberId = message["new_chat_member"]["id"];

	console.log("New member joined!");

	// First, restrict the new member.
	let resp = await telegram.restrictChatMember(API_TOKEN, message["chat"]["id"], newMemberId, new ChatPermissions());
	console.log(resp.status);
	console.log(await resp.text());

	// Generate magic string to identify user.
	// Basic concept: "/verify <chatId>:<sha256(userId + (timestamp / 30))>
	let h = new sha256.Hash();
	h.update(toStringThenUint8Array(newMemberId));
	h.update(toStringThenUint8Array(Date.now() / (30 * 1000)));
	const hStr = "/verify " + message["chat"]["id"] + ":" + toHexStr(h.digest());

	// Construct text message
	const textToSend = "您好，[" + message["new_chat_member"]["first_name"] + "](tg://user?id=" + newMemberId.toString() + ")！" +
		"非常欢迎您加入。在您可以发消息之前，请先完成验证。请在 120 秒内，私聊发送如下内容给我：\n\n```\n" + hStr + "\n```";

	await telegram.sendMessage(API_TOKEN, message["chat"]["id"], textToSend, "MarkdownV2");

	// todo: After 120 seconds, if a user was still under restriction, remove the user from chat.
}

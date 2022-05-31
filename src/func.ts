import * as telegram from "./telegram";
import {API_TOKEN, DELETE_DELAY, NEW_MEMBER_GRACE} from "./config";
import {ChatPermissions} from "./telegram";
import * as sha256 from "fast-sha256";
import * as utility from "./utility";

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
		"非常欢迎您加入。在您可以发消息之前，请先完成验证。请在 " + NEW_MEMBER_GRACE + " 秒内，私聊发送如下内容给我：\n\n```\n" + hStr + "\n```";

	let messageSentId : number;
	{
		const sendResp = await telegram.sendMessage(API_TOKEN, message["chat"]["id"], textToSend, "MarkdownV2");
		const [sendRespObj, parseSendOK] = utility.parseJSON(await sendResp.text());
		if (!parseSendOK || !sendRespObj["ok"] || !sendRespObj.hasOwnProperty("result")) {
			console.warn("Cannot parse sending response to JSON.");
			messageSentId = 0;
		}
		messageSentId = sendRespObj["result"]["message_id"];
	}

	// todo: After 120 seconds, if a user was still under restriction, remove the user from chat.
	ctx.waitUntil(new Promise(resolve => {
		setTimeout(processPostNewMemberJoin, 1000 * NEW_MEMBER_GRACE, message, newMemberId, messageSentId);
	}));
}

async function processPostNewMemberJoin(message : any, newMemberId : number, messageSentId : number) {
	const resp = await telegram.getChatMember(API_TOKEN, message["chat"]["id"], newMemberId);
	console.log(resp.status);

	const getChatMemberText = await resp.text();
	console.log(getChatMemberText);

	// Parse JSON from body
	const [getChatMemberResp, parseOK] = utility.parseJSON(getChatMemberText);
	if (!parseOK || !getChatMemberResp["ok"] || !getChatMemberResp.hasOwnProperty("result")) {
		console.warn("Error occurred when calling telegram API.");
		return;
	}

	const res = getChatMemberResp["result"];
	if (!res.hasOwnProperty("can_send_messages") || res["can_send_messages"]) {
		// Restriction lifted
		console.log("Ok, Restriction lifted");
	} else {
		console.log("Restriction not lifted, kicking");
		// Kick user
		await telegram.unbanChatMember(API_TOKEN, message["chat"]["id"], newMemberId, false);
	}

	// Delete welcome message
	if (messageSentId != 0) {
		await telegram.deleteMessage(API_TOKEN, message["chat"]["id"], messageSentId);
	}
}

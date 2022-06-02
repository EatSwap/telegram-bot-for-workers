import * as telegram from "./telegram";
import {ChatPermissions, sendMessage, sendSticker} from "./telegram";
import {API_TOKEN, DELETE_DELAY, NEW_MEMBER_GRACE} from "./config";
import * as sha256 from "fast-sha256";
import * as utility from "./utility";
import {toHexStr, toStringThenUint8Array} from "./utility";

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

export async function banNewMembers(message : any, ctx : ExecutionContext) {
	if (!message.hasOwnProperty("new_chat_member"))
		return;
	const newMemberId = message["new_chat_member"]["id"];
	console.log("New member joined!");

	// First, restrict the new member.
	{
		let resp = await telegram.restrictChatMember(API_TOKEN, message["chat"]["id"], newMemberId, new ChatPermissions());
		console.log("Restrict the new member. OK = " + (resp.status == 200));
	}

	// Generate magic string to identify user.
	// Basic concept: "/verify <chatId>:<sha256(userId + (timestamp / 30))>
	let h = new sha256.Hash();
	h.update(toStringThenUint8Array(newMemberId));
	h.update(toStringThenUint8Array(Math.floor(Date.now() / (30 * 1000))));
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
	console.log("Prompt message sent, id = " + messageSentId);

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

export async function handleVerification(message : any) {
	// Extract info. "/verify " is 8 ch long.
	const messageText = message["text"].substring(8);
	const chatId = messageText.substring(0, messageText.indexOf(":"));
	const verificationHash = messageText.substring(messageText.indexOf(":") + 1);
	const userId = message["from"]["id"];

	const timestamp = Math.floor(Date.now() / (30 * 1000));
	const offsetCount = NEW_MEMBER_GRACE / timestamp + 1;
	let success = false;
	for (let i = 0; i <= offsetCount; ++i) {
		let h = new sha256.Hash();
		h.update(toStringThenUint8Array(userId));
		h.update(toStringThenUint8Array(timestamp - i));

		if (toHexStr(h.digest()) != verificationHash)
			continue;

		// Success now. Lift restrictions!
		success = true;
		let resp = await telegram.restrictChatMember(
			API_TOKEN,
			chatId,
			userId,
			new ChatPermissions(true, true, true, true, true));
		console.log(resp.status);
		console.log(await resp.text());
		break;
	}

	await sendMessage(API_TOKEN, userId, success ? "谢谢您的验证！您已经能够发言。" : "不对不对，不要玩我。", "MarkdownV2")
}

export async function handleDefaultResponse(message : any) {
	// Send a sticker.
	// Thanks to Fang the Dragon (Twitter: @FangSladeDrum), for making this sticker public!
	// Sticker: "Astonished Fang"
	const file_id = "CAACAgUAAxkBAAMUYpY8vBeMC4WzrSeZxxWsBo3dnEAAAi0GAAJ0pvhVP_rKZ6TV-rUkBA";
	await sendSticker(API_TOKEN, message["from"]["id"], file_id);
}

/**
 * Generate a simple HTTP response using given body and status.
 * @param body string of response body
 * @param status status code of response
 */
export function generateSimpleResponse(body : string, status : number) {
	return new Response(body, {
		status: status,
	})
}

/**
 * Construct API root for specific Telegram token
 * @param token the api token to be used
 */
export function getApiRoot(token : string) {
	return "https://api.telegram.org/bot" + token;
}

export function parseJSON(str : string) : readonly [any, boolean] {
	let jsonObj : any;
	try {
		jsonObj = JSON.parse(str);
		return [jsonObj, true] as const;
	} catch (err) {
		return [null, false] as const;
	}
}

export function toStringThenUint8Array(d: any) {
	return Uint8Array.from(d.toString().split("").map((x: string) => x.charCodeAt(0)));
}

export function toHexStr(d: Uint8Array) {
	return Array.from(d, x => {
		return ('0' + (x & 0xFF).toString(16)).slice(-2);
	}).join('');
}
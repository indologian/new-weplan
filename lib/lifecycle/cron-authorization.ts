const encoder = new TextEncoder();

async function digest(value: string) {
	return new Uint8Array(
		await crypto.subtle.digest("SHA-256", encoder.encode(value)),
	);
}

async function safeEqual(left: string, right: string) {
	const [leftDigest, rightDigest] = await Promise.all([
		digest(left),
		digest(right),
	]);
	let difference = left.length === right.length ? 0 : 1;
	for (let index = 0; index < leftDigest.length; index += 1) {
		difference |= leftDigest[index] ^ rightDigest[index];
	}
	return difference === 0;
}

export async function authorizeCronRequest(
	authorization: string | null,
	secret: string | undefined,
) {
	if (!secret || !authorization?.startsWith("Bearer ")) return false;
	const token = authorization.slice("Bearer ".length);
	return token.length > 0 && safeEqual(token, secret);
}

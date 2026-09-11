import "server-only";

import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

const keyEnvironmentName = "INVITEE_TOKEN_ENCRYPTION_KEY";
const tokenBytes = 32;
const ivBytes = 12;

function encryptionKey() {
	const encoded = process.env[keyEnvironmentName];
	if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
		throw new Error("Konfigurasi keamanan token tamu tidak valid.");
	}
	const key = Buffer.from(encoded, "base64");
	const canonicalInput = encoded.replace(/=+$/, "");
	const canonicalDecoded = key.toString("base64").replace(/=+$/, "");
	if (key.length !== 32 || canonicalDecoded !== canonicalInput) {
		throw new Error("Konfigurasi keamanan token tamu tidak valid.");
	}
	return key;
}

export function generateInviteeToken() {
	return randomBytes(tokenBytes).toString("base64url");
}

export function hashInviteeToken(token: string) {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

export function encryptInviteeToken(token: string) {
	const iv = randomBytes(ivBytes);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(token, "utf8"),
		cipher.final(),
	]);
	return [
		"v1",
		iv.toString("base64url"),
		cipher.getAuthTag().toString("base64url"),
		ciphertext.toString("base64url"),
	].join(".");
}

export function decryptInviteeToken(value: string) {
	const [version, encodedIv, encodedTag, encodedCiphertext, extra] =
		value.split(".");
	if (
		version !== "v1" ||
		!encodedIv ||
		!encodedTag ||
		!encodedCiphertext ||
		extra
	) {
		throw new Error("Data tautan tamu tidak valid.");
	}
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			encryptionKey(),
			Buffer.from(encodedIv, "base64url"),
		);
		decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
		return Buffer.concat([
			decipher.update(Buffer.from(encodedCiphertext, "base64url")),
			decipher.final(),
		]).toString("utf8");
	} catch {
		throw new Error("Data tautan tamu tidak valid.");
	}
}

export function buildPersonalInvitationPath(slug: string, token: string) {
	return `/invitation/${encodeURIComponent(slug)}/${encodeURIComponent(token)}`;
}

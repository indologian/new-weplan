import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
	buildPersonalInvitationPath,
	decryptInviteeToken,
	encryptInviteeToken,
	generateInviteeToken,
	hashInviteeToken,
} from "./invitee-token";

const originalKey = process.env.INVITEE_TOKEN_ENCRYPTION_KEY;

describe("invitee token crypto", () => {
	beforeEach(() => {
		process.env.INVITEE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
			"base64",
		);
	});

	afterEach(() => {
		if (originalKey === undefined) {
			delete process.env.INVITEE_TOKEN_ENCRYPTION_KEY;
		} else {
			process.env.INVITEE_TOKEN_ENCRYPTION_KEY = originalKey;
		}
	});

	it("generates URL-safe tokens with at least 256 bits of entropy", () => {
		const first = generateInviteeToken();
		const second = generateInviteeToken();
		expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(second).not.toBe(first);
	});

	it("hashes with deterministic SHA-256", () => {
		expect(hashInviteeToken("token")).toBe(
			"3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
		);
	});

	it("round-trips AES-256-GCM ciphertext without plaintext persistence", () => {
		const token = generateInviteeToken();
		const encrypted = encryptInviteeToken(token);
		expect(encrypted).not.toContain(token);
		expect(decryptInviteeToken(encrypted)).toBe(token);
	});

	it.each([undefined, "not base64!", Buffer.alloc(31).toString("base64")])(
		"fails closed for missing or malformed key %s",
		(value) => {
			if (value === undefined) delete process.env.INVITEE_TOKEN_ENCRYPTION_KEY;
			else process.env.INVITEE_TOKEN_ENCRYPTION_KEY = value;
			expect(() => encryptInviteeToken("token")).toThrow(
				"Konfigurasi keamanan",
			);
		},
	);

	it("rejects tampered ciphertext", () => {
		const parts = encryptInviteeToken("token").split(".");
		parts[2] = `${parts[2]?.startsWith("A") ? "B" : "A"}${parts[2]?.slice(1)}`;
		expect(() => decryptInviteeToken(parts.join("."))).toThrow(
			"Data tautan tamu tidak valid",
		);
	});

	it("constructs only an application-relative personal path", () => {
		expect(buildPersonalInvitationPath("trusted-slug", "raw-token")).toBe(
			"/invitation/trusted-slug/raw-token",
		);
	});
});

const RETURN_PATH_BASE = "https://weplan.invalid";

function hasControlCharacter(value: string): boolean {
	return Array.from(value).some((character) => {
		const code = character.charCodeAt(0);
		return code <= 31 || code === 127;
	});
}

function hasUnsafePathSyntax(value: string): boolean {
	return (
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\") ||
		hasControlCharacter(value)
	);
}

export function getSafeReturnPath(
	value: string | null | undefined,
	fallback = "/dashboard",
): string {
	if (!value || hasUnsafePathSyntax(value)) {
		return fallback;
	}

	let decoded = value;
	try {
		for (let pass = 0; pass < 3; pass += 1) {
			const next = decodeURIComponent(decoded);
			if (hasUnsafePathSyntax(next)) {
				return fallback;
			}
			if (next === decoded) {
				break;
			}
			decoded = next;
		}
	} catch {
		return fallback;
	}

	try {
		const resolved = new URL(value, RETURN_PATH_BASE);
		if (resolved.origin !== RETURN_PATH_BASE) {
			return fallback;
		}

		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	} catch {
		return fallback;
	}
}

type PublicSupabaseEnvironment = {
	url: string;
	publishableKey: string;
};

function requiredEnvironmentVariable(
	name: string,
	value: string | undefined,
): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function getPublicSupabaseEnvironment(): PublicSupabaseEnvironment {
	return {
		url: requiredEnvironmentVariable(
			"NEXT_PUBLIC_SUPABASE_URL",
			process.env.NEXT_PUBLIC_SUPABASE_URL,
		),
		publishableKey: requiredEnvironmentVariable(
			"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		),
	};
}

export function getSupabaseSecretKey(): string {
	return requiredEnvironmentVariable(
		"SUPABASE_SECRET_KEY",
		process.env.SUPABASE_SECRET_KEY,
	);
}

import { AuthForm } from "../_components/auth-form";

type LoginPageProps = {
	searchParams: Promise<{
		error?: string;
		message?: string;
		callbackUrl?: string;
	}>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { error, message, callbackUrl } = await searchParams;
	return (
		<AuthForm
			initialState={{ error, message }}
			mode="login"
			callbackUrl={callbackUrl}
		/>
	);
}

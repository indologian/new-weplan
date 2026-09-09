import { AuthForm } from "../_components/auth-form";

type RegisterPageProps = {
	searchParams: Promise<{
		error?: string;
		message?: string;
		callbackUrl?: string;
	}>;
};

export default async function RegisterPage({
	searchParams,
}: RegisterPageProps) {
	const { error, message, callbackUrl } = await searchParams;
	return (
		<AuthForm
			initialState={{ error, message }}
			mode="register"
			callbackUrl={callbackUrl}
		/>
	);
}

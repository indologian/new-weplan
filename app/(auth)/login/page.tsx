import { AuthForm } from "../_components/auth-form";

type LoginPageProps = {
	searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { error, message } = await searchParams;
	return <AuthForm initialState={{ error, message }} mode="login" />;
}

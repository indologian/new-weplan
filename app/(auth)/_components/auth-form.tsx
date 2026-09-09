"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import {
	googleOAuthAction,
	loginAction,
	registerAction,
} from "@/actions/auth/actions";
import {
	type AuthActionState,
	initialAuthActionState,
	type LoginInput,
	loginSchema,
	type RegisterInput,
	registerSchema,
} from "@/lib/auth/schemas";

type AuthFormProps = {
	initialState?: AuthActionState;
	mode: "login" | "register";
	callbackUrl?: string;
};

export function AuthForm({
	initialState = initialAuthActionState,
	mode,
	callbackUrl,
}: AuthFormProps) {
	const isRegister = mode === "register";
	const action = isRegister ? registerAction : loginAction;
	const schema = isRegister ? registerSchema : loginSchema;
	const [state, formAction, pending] = useActionState(action, initialState);
	const {
		formState: { errors },
		getValues,
		register,
		setError,
	} = useForm<LoginInput & Partial<RegisterInput>>();

	function validateBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
		const parsed = schema.safeParse(getValues());

		if (parsed.success) {
			return;
		}

		event.preventDefault();
		for (const issue of parsed.error.issues) {
			const field = issue.path[0];
			if (field === "email" || field === "password" || field === "fullName") {
				setError(field, { message: issue.message, type: "zod" });
			}
		}
	}

	const fieldClass =
		"mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary";

	return (
		<div className="rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm">
			<p className="font-bold text-primary">Weplan</p>
			<h1 className="mt-2 font-serif text-3xl">
				{isRegister ? "Buat akun" : "Masuk ke akun"}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{isRegister
					? "Mulai rencanakan undangan pernikahan Anda."
					: "Lanjutkan pengelolaan rencana pernikahan Anda."}
			</p>

			<form
				action={formAction}
				className="mt-8 space-y-5"
				onSubmit={validateBeforeSubmit}
			>
				{callbackUrl ? (
					<input type="hidden" name="callbackUrl" value={callbackUrl} />
				) : null}

				{isRegister ? (
					<label className="block text-sm font-medium" htmlFor="fullName">
						Nama lengkap
						<input
							className={fieldClass}
							id="fullName"
							autoComplete="name"
							{...register("fullName")}
						/>
						{errors.fullName ? (
							<span className="mt-1 block text-sm text-destructive">
								{errors.fullName.message}
							</span>
						) : null}
					</label>
				) : null}

				<label className="block text-sm font-medium" htmlFor="email">
					Email
					<input
						className={fieldClass}
						id="email"
						type="email"
						autoComplete="email"
						{...register("email")}
					/>
					{errors.email ? (
						<span className="mt-1 block text-sm text-destructive">
							{errors.email.message}
						</span>
					) : null}
				</label>

				<label className="block text-sm font-medium" htmlFor="password">
					Kata sandi
					<input
						className={fieldClass}
						id="password"
						type="password"
						autoComplete={isRegister ? "new-password" : "current-password"}
						{...register("password")}
					/>
					{errors.password ? (
						<span className="mt-1 block text-sm text-destructive">
							{errors.password.message}
						</span>
					) : null}
				</label>

				{state.error ? (
					<p
						className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
						role="alert"
					>
						{state.error}
					</p>
				) : null}
				{state.message ? (
					<p
						className="rounded-md bg-success/10 p-3 text-sm text-success"
						role="status"
					>
						{state.message}
					</p>
				) : null}

				<button
					className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
					disabled={pending}
					type="submit"
				>
					{pending ? "Memproses…" : isRegister ? "Daftar" : "Masuk"}
				</button>
			</form>

			<div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				atau
				<span className="h-px flex-1 bg-border" />
			</div>

			<form action={googleOAuthAction}>
				{callbackUrl ? (
					<input type="hidden" name="callbackUrl" value={callbackUrl} />
				) : null}
				<button
					className="w-full rounded-md border border-border bg-secondary px-4 py-2 font-medium text-secondary-foreground"
					type="submit"
				>
					Lanjutkan dengan Google
				</button>
			</form>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				{isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
				<Link
					className="font-medium text-primary"
					href={
						(isRegister ? "/login" : "/register") +
						(callbackUrl
							? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
							: "")
					}
				>
					{isRegister ? "Masuk" : "Daftar"}
				</Link>
			</p>
		</div>
	);
}

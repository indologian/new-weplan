import type { ReactNode } from "react";

export default function AuthLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground">
			<div className="w-full max-w-md">{children}</div>
		</main>
	);
}

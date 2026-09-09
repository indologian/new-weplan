import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Weplan",
	description: "Wedding planning and invitation platform",
};

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="id">
			<body>{children}</body>
		</html>
	);
}

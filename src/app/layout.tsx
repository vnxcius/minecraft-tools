import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "../components/header";
import { ThemeProvider } from "../providers/theme-provider";
import "./globals.css";

const mojangles = localFont({
	src: "../assets/fonts/Minecraft-Seven_v2.woff2",
	variable: "--font-mojangles",
	weight: "400",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Useful Minecraft Tools",
	description:
		"Collection of useful Minecraft tools for you to easy your life while playing",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={`${mojangles.className} antialiased dark:text-gray-300`}>
				<ThemeProvider
					attribute={"class"}
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<Header />
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}

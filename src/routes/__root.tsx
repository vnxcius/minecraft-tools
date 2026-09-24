import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ title: "Useful Minecraft Tools" },
			{
				name: "description",
				content: "Collection of useful Minecraft tools for you to easy your life while playing",
			},
		],
	}),
	component: RootLayout,
});

function RootLayout() {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
			<TooltipProvider>
				<HeadContent />
				<Header />
				<main className="mx-auto w-full max-w-6xl border-x">
					<Outlet />
				</main>
				<Footer />
			</TooltipProvider>
		</ThemeProvider>
	);
}

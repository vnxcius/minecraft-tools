import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
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
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
			<TooltipProvider>
				<HeadContent />
				<Header />
				<Outlet />
			</TooltipProvider>
		</ThemeProvider>
	);
}

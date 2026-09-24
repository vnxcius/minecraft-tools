import { createRootRoute, HeadContent, Link, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
	// every page sets its own tags, see src/lib/seo.ts
	component: RootLayout,
	notFoundComponent: NotFound,
});

function NotFound() {
	return (
		<section className="px-6 py-24 text-center">
			{/* React puts this in the head, unknown urls must not be indexed */}
			<meta name="robots" content="noindex" />
			<title>Page not found | Minecraft Tools</title>
			<h1 className="display text-4xl">Page not found</h1>
			<p className="mt-4 text-muted-foreground">There is no tool at this address.</p>
			<Link to="/" className="mt-6 inline-block text-brand hover:underline">
				Back to all tools
			</Link>
		</section>
	);
}

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

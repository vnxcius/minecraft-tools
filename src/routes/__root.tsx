import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	redirect,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import RelatedTools from "@/components/related-tools";
import { ThemeHotkey } from "@/components/theme-selector";
import { toolByPath, toolDescription, toolTitle } from "@/components/tools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";
import { localizedPage, MOVED } from "@/lib/seo";

export const Route = createRootRoute({
	// every page sets its own tags, see src/lib/seo.ts
	beforeLoad: ({ location }) => {
		const to = MOVED[location.pathname.replace(/\/$/, "")];
		if (to) throw redirect({ href: to + location.searchStr, replace: true });
	},
	component: RootLayout,
	notFoundComponent: NotFound,
});

function NotFound() {
	const { t } = useI18n();
	return (
		<section>
			{/* React puts this in the head, unknown urls must not be indexed */}
			<meta name="robots" content="noindex" />
			<title>{`${t("site.notFound.title")} | ${t("site.name")}`}</title>
			<h1 className="pb-1 page-title text-3xl">{t("site.notFound.title")}</h1>
			<p className="mt-4">{t("site.notFound.text")}</p>
			<Link to="/" className="mt-2 inline-block text-link hover:underline">
				{t("site.notFound.back")}
			</Link>
		</section>
	);
}

/** the tool on screen, not the one being loaded, so nothing tool specific sits on the previous page */
function useShownTool() {
	const pathname = useRouterState({
		select: (state) => (state.resolvedLocation ?? state.location).pathname,
	});
	return toolByPath(pathname);
}

function ToolTitle() {
	const tool = useShownTool();
	useI18n();
	if (!tool) return null;
	return (
		<div className="mb-6">
			<h1 className="pb-1 page-title text-[1.8rem]">
				{localizedPage(tool.to)?.heading ?? toolTitle(tool)}
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">{toolDescription(tool)}</p>
		</div>
	);
}

function ToolFooter() {
	const tool = useShownTool();
	return tool ? <RelatedTools tool={tool} /> : null;
}

/** the page title and meta tags come from the route's head(), which reads the language */
function useLocalizedHead() {
	const router = useRouter();
	const { language } = useI18n();
	const shown = useRef(language);
	useEffect(() => {
		if (shown.current === language) return;
		shown.current = language;
		router.invalidate();
	}, [router, language]);
}

function RootLayout() {
	useLocalizedHead();
	return (
		<>
			<TooltipProvider>
				<HeadContent />
				<ThemeHotkey />
				<div className="relative min-h-svh overflow-x-clip">
					{/* the scenery: deepslate all around, sky over a strip of grass and dirt at the top */}
					<div
						aria-hidden
						className="absolute inset-0 -z-10 bg-page bg-[url(/decor/deepslate.png)] bg-size-[64px] bg-blend-multiply pixelated"
					/>
					<div aria-hidden className="absolute inset-x-0 top-0 h-36 sky">
						<div className="absolute inset-x-0 bottom-0 h-8 border-t-4 border-t-[#5fa03a] bg-[#6b5645] bg-[url(/decor/dirt.png)] bg-size-[32px] bg-blend-multiply pixelated" />
					</div>

					<div className="relative w-full px-3 pb-8 sm:px-6 lg:px-8">
						<Header />
						<main className="border-t-6 border-l-6 border-t-[#b4bec3] border-l-neutral-600 bg-background p-4 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)] in-data-modal:[clip-path:none] sm:p-6 lg:p-8 dark:border-t-[#3b4247]">
							<ToolTitle />
							<Outlet />
							<ToolFooter />
							<Footer />
						</main>
					</div>
				</div>
			</TooltipProvider>
		</>
	);
}

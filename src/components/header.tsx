import { Link, useRouterState } from "@tanstack/react-router";
import {
	ArrowRight as ArrowRightIcon,
	ChevronRight,
	Close as CloseIcon,
	Menu as MenuIcon,
} from "pixelarticons/react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import LanguageSelector from "./language-selector";
import SiteNav from "./site-nav";
import ThemeSelector from "./theme-selector";
import ToolSearch from "./tool-search";
import { CATEGORIES, categoryName, TOOLS, toolByPath, toolDescription, toolTitle } from "./tools";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { useLastUsedTool } from "./use-last-used-tool";

function Logo({ className }: { className?: string }) {
	const { t } = useI18n();
	return (
		<Link to="/" aria-label={t("site.logoLabel")} className={cn("block shrink-0", className)}>
			<img src="/minecraft_tools.webp" width={794} height={216} alt="" className="w-full" />
		</Link>
	);
}

function Tab({ children, active }: { children: React.ReactNode; active?: boolean }) {
	return (
		<span
			className={cn(
				"block depth px-3 pt-1 pb-1 text-[13px] font-bold",
				active
					? "bg-background text-foreground [--depth-face:var(--background)]"
					: "bg-secondary text-secondary-foreground hover:bg-accent",
			)}
		>
			{children}
		</span>
	);
}

// the dark buttons that sit on the sky, like the language and theme ones
const skyButton =
	"h-8 border-2 border-black bg-black/75 px-2.5 text-xs font-bold text-[#bfbfbf] hover:bg-black/85 hover:text-white";

// same look as the page tabs next to them (Home, Last used); the open one looks like the active tab
const categoryButton =
	"h-auto gap-1.5 rounded-none depth bg-secondary px-3 pt-1 pb-1 text-[13px] font-bold text-secondary-foreground hover:bg-accent hover:text-secondary-foreground data-active:bg-accent data-active:text-secondary-foreground data-popup-open:bg-background data-popup-open:text-foreground data-popup-open:[--depth-face:var(--background)]";

function ToolsMenu({ pathname }: { pathname: string }) {
	const { t } = useI18n();
	return (
		<NavigationMenu aria-label={t("site.menu")}>
			<NavigationMenuList className="items-end gap-1">
				{CATEGORIES.map((category) => {
					const tools = TOOLS.filter((tool) => tool.category === category);
					const active = tools.some((tool) => pathname.startsWith(tool.to));
					return (
						<NavigationMenuItem key={category}>
							<NavigationMenuTrigger
								data-active={active ? "" : undefined}
								chevron={false}
								className={categoryButton}
							>
								<ChevronRight className="size-3 transition-transform group-data-popup-open/navigation-menu-trigger:rotate-90" />
								{categoryName(category)}
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-[min(88vw,40rem)] gap-1 p-2 sm:grid-cols-2">
									{tools.map((tool) => (
										<li key={tool.to}>
											<NavigationMenuLink
												closeOnClick
												render={<Link to={tool.to} />}
												active={pathname.startsWith(tool.to)}
												className="group h-full flex-row items-start gap-3 p-3 data-active:bg-accent"
											>
												<img
													src={tool.image}
													alt=""
													width={32}
													height={32}
													className="size-8 shrink-0 pixelated"
												/>
												<span className="flex min-w-0 flex-col gap-1">
													<span className="flex items-center gap-2 font-bold">
														{toolTitle(tool)}
														<ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
													</span>
													<span className="text-xs leading-relaxed text-muted-foreground">
														{toolDescription(tool)}
													</span>
												</span>
											</NavigationMenuLink>
										</li>
									))}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
					);
				})}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

export default function Header() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const tool = toolByPath(pathname);
	const lastUsed = useLastUsedTool(tool);
	const [menuOpen, setMenuOpen] = useState(false);
	const { t } = useI18n();

	return (
		<header className="relative z-30">
			{/* phones and tablets: logo, menu and theme, then the search on its own row */}
			<div className="flex flex-wrap items-center gap-2 py-2.5 lg:hidden">
				<Logo className="w-32" />
				<ToolSearch className="order-last w-full sm:order-0 sm:ml-4 sm:w-64" />
				<button
					type="button"
					aria-expanded={menuOpen}
					aria-controls="site-menu"
					onClick={() => setMenuOpen((open) => !open)}
					className={cn(skyButton, "ml-auto flex shrink-0 items-center gap-1.5")}
				>
					{menuOpen ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
					{t("site.menu")}
				</button>
				<LanguageSelector />
				<ThemeSelector />
			</div>
			{menuOpen && (
				<div id="site-menu" className="pb-3 lg:hidden">
					<SiteNav onNavigate={() => setMenuOpen(false)} />
				</div>
			)}

			{/* desktop: logo, search and settings; the page tabs and the category menus below */}
			<div className="hidden items-center gap-4 pt-3 lg:flex">
				<Logo className="mt-2 mr-6 mb-4 w-50" />
				<div className="ml-auto flex items-center gap-2">
					<ToolSearch className="w-64" />
					<LanguageSelector />
					<ThemeSelector />
				</div>
			</div>
			<div className="hidden items-end gap-4 pt-2 lg:flex">
				<nav aria-label={t("site.pageTabs")} className="flex items-end gap-1">
					<Link to="/">
						<Tab active={!tool && pathname === "/"}>{t("site.home")}</Tab>
					</Link>
					{tool && (
						<Link to={tool.to}>
							<Tab active>{toolTitle(tool)}</Tab>
						</Link>
					)}
					{lastUsed && (
						<Link to={lastUsed.to}>
							<Tab>
								<span className="font-normal text-muted-foreground">{t("site.lastUsed")} </span>
								{toolTitle(lastUsed)}
							</Tab>
						</Link>
					)}
				</nav>
				<ToolsMenu pathname={pathname} />
			</div>
		</header>
	);
}

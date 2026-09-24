import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import ThemeSelector from "./theme-selector";
import { CATEGORIES, TOOLS } from "./tools";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "./ui/navigation-menu";

export default function Header() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });

	return (
		<header className="sticky top-0 z-40 border-b bg-card shadow-[0_4px_0_rgb(0_0_0/0.25)]">
			<div className="mx-auto flex max-w-6xl items-center gap-4 border-x px-4 py-2.5">
				<Link to="/" className="flex shrink-0 items-center gap-2">
					<img src="/logo.svg" width={52} height={44} alt="" className="w-6 dark:invert" />
					<span className="hidden font-pixel text-xl sm:inline">Minecraft Tools</span>
				</Link>

				<NavigationMenu className="min-w-0 flex-1 justify-start" aria-label="Tools">
					<NavigationMenuList className="justify-start gap-1">
						{CATEGORIES.map((category) => {
							const tools = TOOLS.filter((tool) => tool.category === category);
							const active = tools.some((tool) => pathname.startsWith(tool.to));

							// a category with a single tool needs no menu
							if (tools.length === 1) {
								const [tool] = tools;
								return (
									<NavigationMenuItem key={category}>
										<NavigationMenuLink
											render={<Link to={tool.to} />}
											active={active}
											className="h-9 px-3 text-muted-foreground hover:text-foreground data-active:text-foreground"
										>
											<tool.icon size={16} />
											{tool.short}
										</NavigationMenuLink>
									</NavigationMenuItem>
								);
							}

							return (
								<NavigationMenuItem key={category}>
									<NavigationMenuTrigger data-active={active ? "" : undefined}>
										{category}
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-[min(88vw,36rem)] gap-1 p-2 sm:grid-cols-2">
											{tools.map(({ to, title, description, icon: Icon }) => (
												<li key={to}>
													<NavigationMenuLink
														render={<Link to={to} />}
														active={pathname.startsWith(to)}
														className="group h-full flex-col items-stretch gap-1.5 p-3"
													>
														<span className="flex items-center gap-2">
															<Icon size={18} className="text-brand" />
															<span className="font-pixel text-lg">{title}</span>
															<ArrowRightIcon className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
														</span>
														<span className="text-muted-foreground text-xs leading-relaxed">
															{description}
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

				<ThemeSelector />
			</div>
		</header>
	);
}

import { Link } from "@tanstack/react-router";
import ThemeSelector from "./theme-selector";
import { TOOLS } from "./tools";

export default function Header() {
	return (
		<header className="sticky top-0 z-40 border-b bg-card shadow-[0_4px_0_rgb(0_0_0/0.05)]">
			<div className="mx-auto flex max-w-6xl items-center gap-6 border-x px-4 py-2.5">
				<Link to="/" className="flex shrink-0 items-center gap-2">
					<img src="/logo.svg" width={52} height={44} alt="" className="w-6 dark:invert" />
					<span className="hidden font-pixel text-xl sm:inline">Minecraft Tools</span>
				</Link>

				<nav
					aria-label="Tools"
					className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
				>
					{TOOLS.map(({ to, short, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1.5 text-muted-foreground text-sm hover:bg-accent hover:text-foreground"
							activeProps={{ className: "bg-accent text-foreground" }}
						>
							<Icon size={16} />
							{short}
						</Link>
					))}
				</nav>

				<ThemeSelector />
			</div>
		</header>
	);
}

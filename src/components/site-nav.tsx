import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Gitlab as GitlabIcon,
	Home as HomeIcon,
	Shuffle as ShuffleIcon,
} from "pixelarticons/react";
import { useI18n } from "@/i18n";
import { CATEGORIES, categoryName, TOOLS, toolTitle } from "./tools";

export const REPO_URL = "https://gitlab.com/vncius/minecraft-tools";

const rowClass =
	"group flex w-full items-center gap-2 py-0.5 pr-1 text-left text-xs leading-tight data-[status=active]:font-bold";

/** an inventory slot holding the item; it lights up on hover and for the page you are on */
function Slot({ children }: { children: React.ReactNode }) {
	return (
		<span className="relative flex size-7 shrink-0 items-center justify-center gui-slot">
			<span className="absolute inset-0.5 group-hover:bg-white/35 group-data-[status=active]:bg-white/50 dark:group-hover:bg-white/15 dark:group-data-[status=active]:bg-white/20" />
			<span className="relative flex">{children}</span>
		</span>
	);
}

/** styled like an inventory screen; also the mobile menu */
export default function SiteNav({ onNavigate }: { onNavigate?: () => void }) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const { t } = useI18n();

	const randomTool = () => {
		const others = TOOLS.filter((tool) => tool.to !== pathname);
		navigate({ to: others[Math.floor(Math.random() * others.length)].to });
		onNavigate?.();
	};

	return (
		<nav aria-label={t("site.navLabel")} className="flex flex-col gap-3 gui-panel p-2.5">
			<div className="flex flex-col gap-1">
				<Link to="/" onClick={onNavigate} activeOptions={{ exact: true }} className={rowClass}>
					<Slot>
						<HomeIcon className="size-4" />
					</Slot>
					{t("site.home")}
				</Link>
				<button type="button" onClick={randomTool} className={rowClass}>
					<Slot>
						<ShuffleIcon className="size-4" />
					</Slot>
					{t("site.randomTool")}
				</button>
				<a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={rowClass}>
					<Slot>
						<GitlabIcon className="size-4" />
					</Slot>
					{t("site.sourceCode")}
				</a>
			</div>

			{CATEGORIES.map((category) => (
				<section key={category} aria-label={categoryName(category)} className="flex flex-col gap-1">
					<h2 className="font-pixel text-sm tracking-wide">{categoryName(category)}</h2>
					<ul className="flex flex-col gap-1">
						{TOOLS.filter((tool) => tool.category === category).map((tool) => (
							<li key={tool.to}>
								<Link to={tool.to} onClick={onNavigate} className={rowClass}>
									<Slot>
										<img
											src={tool.image}
											alt=""
											width={20}
											height={20}
											className="size-5 pixelated"
										/>
									</Slot>
									{toolTitle(tool)}
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</nav>
	);
}

import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { REPO_URL } from "@/components/site-nav";
import {
	CATEGORIES,
	categoryName,
	type Tool,
	TOOLS,
	toolDescription,
	toolTitle,
} from "@/components/tools";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { rich } from "@/i18n/rich";

export const Route = createFileRoute("/")({
	head: () => pageHead("/"),
	component: Home,
});

function ToolTile({ tool }: { tool: Tool }) {
	return (
		<Link
			to={tool.to}
			className="group flex flex-col border-2 border-black/40 bg-secondary text-center text-sm font-bold text-secondary-foreground hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
		>
			<span className="flex h-24 items-center justify-center border-b-2 border-black/15 bg-black/10 dark:bg-black/25">
				<img
					src={tool.image}
					alt=""
					width={64}
					height={64}
					className="size-16 transition-transform group-hover:scale-110"
				/>
			</span>
			<span className="flex flex-1 items-center justify-center px-2 pt-2 pb-3 leading-tight shadow-[inset_0_-4px_0_rgb(0_0_0/0.16)] group-hover:bg-primary group-hover:text-primary-foreground">
				{toolTitle(tool)}
			</span>
		</Link>
	);
}

function Home() {
	const { t } = useI18n();
	return (
		<div className="flex flex-col gap-4">
			<section className="flex flex-col items-center gap-3 section-box px-4 py-6 text-center">
				<img
					src="/minecraft_tools.webp"
					alt="Minecraft Tools"
					width={794}
					height={216}
					className="w-full max-w-3xl"
				/>
				<h1 className="my-4 text-xl font-bold">{t("home.heading")}</h1>
				<p className="max-w-xl">{t("home.intro")}</p>
				<p className="my-4 text-sm text-muted-foreground">
					{rich(t("home.stats"), {
						count: <b className="text-foreground">{TOOLS.length}</b>,
						openSource: (
							<a
								href={REPO_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="text-link hover:underline"
							>
								{t("home.openSource")}
							</a>
						),
					})}
				</p>
			</section>

			<section aria-labelledby="all-tools" className="section-box p-3">
				<h2 id="all-tools" className="mb-3 text-lg font-bold">
					{t("home.allTools")}
				</h2>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))]">
					{TOOLS.map((tool) => (
						<ToolTile key={tool.to} tool={tool} />
					))}
				</div>
			</section>

			<div className="grid gap-4 md:grid-cols-2">
				{CATEGORIES.map((category) => (
					<section
						key={category}
						aria-labelledby={`category-${category}`}
						className="section-box p-3"
					>
						<h2 id={`category-${category}`} className="mb-2 text-lg font-bold">
							{categoryName(category)}
						</h2>
						<ul className="flex flex-col gap-3">
							{TOOLS.filter((tool) => tool.category === category).map((tool) => (
								<li key={tool.to} className="flex gap-3">
									<img
										src={tool.image}
										alt=""
										width={32}
										height={32}
										className="mt-0.5 size-8 shrink-0 pixelated"
									/>
									<p className="text-sm leading-relaxed">
										<Link to={tool.to} className="font-bold text-link hover:underline">
											{toolTitle(tool)}
										</Link>
										<br />
										{toolDescription(tool)}
									</p>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>

			<section className="flex flex-wrap items-center justify-between gap-3 section-box p-3">
				<div>
					<h2 className="text-lg font-bold">{t("home.missing.title")}</h2>
					<p className="text-sm">{t("home.missing.text")}</p>
				</div>
				<Button
					nativeButton={false}
					render={<a href={`${REPO_URL}/-/issues`} target="_blank" rel="noopener noreferrer" />}
				>
					{t("site.suggestTool")}
				</Button>
			</section>
		</div>
	);
}

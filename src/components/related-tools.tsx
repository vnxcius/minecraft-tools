import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { relatedTools, type Tool, toolDescription, toolTitle } from "./tools";

export default function RelatedTools({ tool }: { tool: Tool }) {
	const { t } = useI18n();
	return (
		<section aria-labelledby="related-tools" className="mt-10 section-box p-3">
			<h2 id="related-tools" className="mb-3 text-lg font-bold">
				{t("site.relatedTools")}
			</h2>
			<ul className="grid gap-2 md:grid-cols-3">
				{relatedTools(tool).map((related) => (
					<li key={related.to}>
						<Link
							to={related.to}
							className="group flex h-full gap-3 border-2 border-black/40 bg-secondary p-2.5 pb-3.5 text-secondary-foreground shadow-[inset_0_-4px_0_rgb(0_0_0/0.16)] hover:border-black/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
						>
							<span className="flex size-14 shrink-0 items-center justify-center bg-black/10 dark:bg-black/25">
								<img
									src={related.image}
									alt=""
									width={40}
									height={40}
									className="size-10 transition-transform group-hover:scale-110"
								/>
							</span>
							<span className="min-w-0">
								<span className="block text-sm font-bold">{toolTitle(related)}</span>
								<span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
									{toolDescription(related)}
								</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

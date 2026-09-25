import { useI18n } from "@/i18n";
import { REPO_URL } from "./site-nav";

const year = new Date().getFullYear();

export default function Footer() {
	const { t } = useI18n();
	return (
		<footer className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
			<p>{t("site.copyright", { year })}</p>
			<p className="flex gap-4">
				<a
					className="text-link hover:underline"
					href={REPO_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					{t("site.sourceCode")}
				</a>
				<a
					className="text-link hover:underline"
					href={`${REPO_URL}/-/blob/master/LICENSE`}
					target="_blank"
					rel="noopener noreferrer"
				>
					GPL-3.0
				</a>
				<a
					className="text-link hover:underline"
					href={`${REPO_URL}/-/issues`}
					target="_blank"
					rel="noopener noreferrer"
				>
					{t("site.suggestTool")}
				</a>
				<a
					className="text-link hover:underline"
					href="mailto:contato@vncius.dev"
					target="_blank"
					rel="noopener noreferrer"
				>
					{t("site.contactMe")}
				</a>
			</p>
		</footer>
	);
}

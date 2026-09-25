import { ArrowUp as ArrowUpIcon } from "pixelarticons/react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** shows up once the page is scrolled past about a screen */
const SHOW_AFTER = 600;

/** floating button back to the top of the page, styled like the header's language and theme buttons */
export default function BackToTop() {
	const { t } = useI18n();
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const update = () => setShown(window.scrollY > SHOW_AFTER);
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, []);

	const toTop = () => {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
	};

	return (
		<button
			type="button"
			onClick={toTop}
			aria-label={t("site.backToTop")}
			title={t("site.backToTop")}
			tabIndex={shown ? 0 : -1}
			aria-hidden={!shown}
			className={cn(
				"fixed right-4 bottom-4 z-40 flex size-10 items-center justify-center border-2 border-black bg-black/75 text-[#bfbfbf] transition-[opacity,translate] duration-200 hover:bg-black/85 hover:text-white sm:right-6 sm:bottom-6",
				shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
			)}
		>
			<ArrowUpIcon className="size-5" />
		</button>
	);
}

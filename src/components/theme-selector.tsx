import { useTheme } from "@/lib/theme";
import { useEffect } from "react";
import { useI18n } from "@/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Laptop as LaptopIcon, Moon as MoonIcon, Sun as SunIcon } from "pixelarticons/react";

/** pressing T anywhere flips between light and dark; mount it once, the selector itself renders twice */
export function ThemeHotkey() {
	const { setTheme, resolvedTheme } = useTheme();

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "t" && event.key !== "T") return;
			if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
			// typing a "t" in the search, a seed or any other field must not change the theme
			const target = event.target as HTMLElement | null;
			if (
				target?.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])")
			)
				return;
			setTheme(resolvedTheme === "dark" ? "light" : "dark");
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [resolvedTheme, setTheme]);

	return null;
}

export default function ThemeSelector() {
	const { t } = useI18n();
	const { setTheme, resolvedTheme } = useTheme();

	const icon =
		resolvedTheme === "dark" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={t("site.theme")}
				title={t("site.themeHint")}
				className="flex size-8 cursor-pointer items-center justify-center border-2 border-black bg-black/75 text-[#bfbfbf] hover:text-white"
			>
				{icon}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					<MoonIcon className="size-4.5" /> {t("site.theme.dark")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("light")}>
					<SunIcon className="size-4.5" /> {t("site.theme.light")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setTheme("system")}>
					<LaptopIcon className="size-4.5" /> {t("site.theme.system")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

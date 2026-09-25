import { Check as CheckIcon, Languages as LanguagesIcon } from "pixelarticons/react";
import { LANGUAGES, useI18n } from "@/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/** each language is written in itself, no flags */
export default function LanguageSelector() {
	const { language, setLanguage, t } = useI18n();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={t("site.language")}
				title={t("site.language")}
				className="flex h-8 cursor-pointer items-center gap-1 border-2 border-black bg-black/75 px-1.5 text-xs font-bold text-[#bfbfbf] uppercase hover:text-white"
			>
				<LanguagesIcon className="size-4" />
				{language.slice(0, 2)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{LANGUAGES.map((option) => (
					<DropdownMenuItem
						key={option.id}
						lang={option.id}
						onClick={() => setLanguage(option.id)}
						className="justify-between gap-4"
					>
						{option.name}
						{option.id === language && <CheckIcon className="size-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

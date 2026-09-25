import { useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "pixelarticons/react";
import { useId, useRef, useState } from "react";
import { fold, useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { categoryName, type Tool, TOOLS, toolDescription, toolTitle } from "./tools";

/**
 * every word of the query has to appear somewhere in the tool's name, category or description, in
 * the language shown; accents do not matter ("pocao" finds "Poções")
 */
function matches(tool: Tool, query: string) {
	const haystack = fold(
		`${toolTitle(tool)} ${categoryName(tool.category)} ${toolDescription(tool)}`,
	);
	return fold(query)
		.split(/\s+/)
		.every((word) => haystack.includes(word));
}

/** focusing it with nothing typed lists every tool */
export default function ToolSearch({ className }: { className?: string }) {
	const navigate = useNavigate();
	const { t } = useI18n();
	const listId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [highlighted, setHighlighted] = useState(0);

	// nine tools: filtering on every render is cheaper than keeping a memo in step with the language
	const text = fold(query.trim());
	// tools named after the query first ("slime" -> the slime chunk finder before the seed map)
	const results = text
		? TOOLS.filter((tool) => matches(tool, text)).sort(
				(a, b) =>
					Number(!fold(toolTitle(a)).includes(text)) - Number(!fold(toolTitle(b)).includes(text)),
			)
		: [...TOOLS];

	const go = (tool: Tool) => {
		setOpen(false);
		setQuery("");
		inputRef.current?.blur();
		navigate({ to: tool.to });
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			setOpen(true);
			const step = event.key === "ArrowDown" ? 1 : -1;
			setHighlighted((i) => (i + step + results.length) % Math.max(results.length, 1));
		} else if (event.key === "Enter" && results[highlighted]) {
			go(results[highlighted]);
		} else if (event.key === "Escape") {
			// search inputs clear themselves on Escape, which would reopen the list
			event.preventDefault();
			setOpen(false);
			inputRef.current?.blur();
		}
	};

	return (
		<div className={cn("relative", className)}>
			<input
				ref={inputRef}
				type="search"
				role="combobox"
				aria-label={t("search.label")}
				aria-expanded={open}
				aria-controls={listId}
				aria-activedescendant={
					open && results[highlighted] ? `${listId}-${highlighted}` : undefined
				}
				placeholder={t("search.placeholder")}
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setHighlighted(0);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				onKeyDown={onKeyDown}
				className="h-8 w-full border border-input bg-card/60 pr-8 pl-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-card focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
			/>
			<SearchIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />

			{open && (
				<div
					id={listId}
					role="listbox"
					aria-label={t("site.menu")}
					className="absolute top-full right-0 z-50 mt-1 max-h-[70svh] w-full min-w-72 overflow-y-auto border-2 border-black/40 bg-popover py-1 text-popover-foreground shadow-lg"
				>
					{results.length === 0 && (
						<p className="px-3 py-2 text-sm text-muted-foreground">
							{t("search.noMatch", { query })}
						</p>
					)}
					{results.map((tool, index) => (
						// the keyboard is handled by the input (aria-activedescendant), options never take focus
						// oxlint-disable-next-line jsx-a11y/click-events-have-key-events
						<div
							key={tool.to}
							tabIndex={-1}
							id={`${listId}-${index}`}
							role="option"
							aria-selected={index === highlighted}
							onMouseEnter={() => setHighlighted(index)}
							// keep the focus in the input so the list does not close before the click lands
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => go(tool)}
							className={cn(
								"flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5",
								index === highlighted && "bg-accent",
							)}
						>
							<img src={tool.image} alt="" width={32} height={32} className="size-8 pixelated" />
							<span className="min-w-0">
								<span className="block text-sm font-semibold">{toolTitle(tool)}</span>
								<span className="block truncate text-xs text-muted-foreground">
									{categoryName(tool.category)}
								</span>
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

import { Collapse as CollapseIcon } from "pixelarticons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid } from "react-window";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { fold, useI18n } from "@/i18n";
import { type Item, versions } from "@/lib/items";
import { cn } from "@/lib/utils";
import { parseYouTube, watchUrl, type YouTubeVideo } from "@/lib/youtube";
import CellComponent from "./cell-component";
import ChecklistTable, { type ChecklistEntry } from "./checklist-table";
import GridTooltip from "./grid-tooltip";
import TutorialVideo from "./tutorial-video";

const VIDEO_KEY = "item-checklist:tutorial";
const CELL = 40;
const MAX_COLUMNS = 11;

/** the tutorial link survives reloads and leaving the page; read back through the parser */
function loadVideo() {
	try {
		return parseYouTube(localStorage.getItem(VIDEO_KEY) ?? "");
	} catch {
		return null;
	}
}

function saveVideo(video: YouTubeVideo | null) {
	try {
		if (video) localStorage.setItem(VIDEO_KEY, watchUrl(video));
		else localStorage.removeItem(VIDEO_KEY);
	} catch {
		// private mode or storage disabled: the video just is not remembered
	}
}

interface Props {
	items: Item[];
	version: string;
	onVersionChange: (version: string) => void;
}

export default function ItemChecklist({ items, version, onVersionChange }: Props) {
	// entries are kept across version changes so items come back if you switch back
	const [entries, setEntries] = useState<ChecklistEntry[]>([]);
	const [search, setSearch] = useState<string>("");
	const [debouncedSearch] = useDebounce(search, 250);
	const [video, setVideo] = useState<YouTubeVideo | null>(loadVideo);
	const { t, tn, itemName, language } = useI18n();
	const [expanded, setExpanded] = useState(false);

	useEffect(() => saveVideo(video), [video]);

	// the page panel lets go of its clip while the expanded view is open; the clip would cut the
	// overlay down to the panel and leave the header clickable
	useEffect(() => {
		if (!expanded) return;
		document.documentElement.dataset.modal = "";
		return () => {
			delete document.documentElement.dataset.modal;
		};
	}, [expanded]);

	// the expanded view is modal: Escape closes it and the page behind does not scroll
	useEffect(() => {
		if (!expanded) return;
		const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [expanded]);

	// searched by the official name in the language shown, accents aside ("pocao" finds "Poção")
	const searchableItems = useMemo(
		() => items.map((item) => ({ item, key: fold(itemName(item.id)) })),
		[items, itemName],
	);

	const filteredItems = useMemo(() => {
		if (!debouncedSearch) return items;
		const query = fold(debouncedSearch.trim());
		return searchableItems.filter(({ key }) => key.includes(query)).map(({ item }) => item);
	}, [items, searchableItems, debouncedSearch]);

	const selectedIds = useMemo(() => new Set(entries.map((e) => e.id)), [entries]);

	// only the entries that exist in the selected version
	const rows = useMemo(() => {
		const byId = new Map(items.map((i) => [i.id, i]));
		return entries.flatMap((entry) => {
			const item = byId.get(entry.id);
			return item ? [{ entry, item }] : [];
		});
	}, [items, entries]);

	const doneCount = rows.filter((r) => r.entry.done).length;
	const hiddenCount = entries.length - rows.length;

	const handleToggleItem = (item: Item) => {
		setEntries((prev) =>
			prev.some((e) => e.id === item.id)
				? prev.filter((e) => e.id !== item.id)
				: [...prev, { id: item.id, goal: 1, done: false }],
		);
	};

	const handleChange = (id: string, patch: Partial<Omit<ChecklistEntry, "id">>) =>
		setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

	const handleRemove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

	// as many 40px columns as fit (up to 11), leaving room for the scrollbar; phones get fewer
	const [columns, setColumns] = useState(MAX_COLUMNS);
	const measureGrid = useCallback((el: HTMLDivElement | null) => {
		if (!el) return;
		const observer = new ResizeObserver(([entry]) =>
			setColumns(
				Math.min(Math.max(Math.floor((entry.contentRect.width - 16) / CELL), 1), MAX_COLUMNS),
			),
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const itemsPanel = (className: string, gridClassName: string) => (
		<div className={cn("flex min-h-0 flex-col gap-3", className)}>
			<div className="flex h-9 items-center">
				<h2 className="font-bold">{t("checklist.items")}</h2>
			</div>
			<div className="flex gap-2">
				<Input
					placeholder={t("checklist.search")}
					aria-label={t("checklist.search")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<Select value={version} onValueChange={(v) => v && onVersionChange(v)}>
					<SelectTrigger aria-label={t("checklist.version")}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="end">
						{versions.map((v) => (
							<SelectItem key={v.id} value={v.id}>
								{v.id}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<GridTooltip ref={measureGrid} className={cn("mx-auto min-h-48 w-full", gridClassName)}>
				<Grid
					cellComponent={CellComponent}
					columnCount={columns}
					rowCount={Math.ceil(filteredItems.length / columns)}
					columnWidth={CELL}
					rowHeight={41}
					cellProps={{
						items: filteredItems,
						selectedIds,
						columns,
						// not read by the cells: a new language makes them render again
						language,
						onClick: handleToggleItem,
					}}
					className="mx-auto"
					style={{ height: "100%", overflowX: "hidden" }}
				/>
			</GridTooltip>
		</div>
	);

	const selectedPanel = (className?: string) => (
		<div className={cn("flex min-h-0 flex-col gap-3", className)}>
			<div className="flex h-9 items-center justify-between">
				<h2 className="flex items-center gap-2 font-bold">{t("checklist.selected")}</h2>
				{rows.length > 0 && (
					<span className="text-sm text-muted-foreground">
						{t("checklist.progress", { done: doneCount, total: rows.length })}
					</span>
				)}
			</div>
			<ChecklistTable rows={rows} onChange={handleChange} onRemove={handleRemove} />
			{hiddenCount > 0 && (
				<p className="text-xs text-muted-foreground">
					{tn("checklist.hidden", hiddenCount, { version })}
				</p>
			)}
		</div>
	);

	return (
		<section className="lg:h-[80svh] lg:min-h-128">
			<div className="relative flex h-full flex-col">
				<div className="grid min-h-0 w-full flex-1 gap-6 lg:grid-cols-[30rem_minmax(0,1fr)]">
					{expanded ? (
						<p className="text-sm text-muted-foreground">{t("checklist.openBeside")}</p>
					) : (
						itemsPanel("", "h-[60svh] lg:h-auto lg:flex-1")
					)}

					<div className="flex min-h-0 flex-col gap-4">
						<TutorialVideo
							video={video}
							onVideoChange={setVideo}
							expanded={expanded}
							onExpandedChange={setExpanded}
						/>
						{!expanded && selectedPanel()}
					</div>
				</div>
			</div>

			{expanded && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label={t("tutorial.title")}
					className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
				>
					<button
						type="button"
						tabIndex={-1}
						aria-label={t("checklist.closeExpanded")}
						className="absolute inset-0 cursor-default"
						onClick={() => setExpanded(false)}
					/>
					<div className="absolute inset-x-3 top-[calc(1.5rem+(100vw-1.5rem)*9/16)] bottom-3 flex flex-col gap-4 overflow-y-auto border-2 border-black/40 bg-background p-3 lg:inset-y-6 lg:right-6 lg:left-auto lg:w-120">
						<div className="flex items-center justify-between gap-2">
							<p className="font-bold">{t("checklist.checklist")}</p>
							<Button variant="outline" size="sm" autoFocus onClick={() => setExpanded(false)}>
								<CollapseIcon />
								{t("checklist.collapse")}
							</Button>
						</div>
						{itemsPanel("shrink-0", "h-[40svh]")}
						{selectedPanel("shrink-0")}
					</div>
				</div>
			)}
		</section>
	);
}

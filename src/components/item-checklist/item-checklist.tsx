import { useMemo, useState } from "react";
import { Grid } from "react-window";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { type Item, versions } from "@/lib/items";
import CellComponent from "./cell-component";
import ChecklistTable, { type ChecklistEntry } from "./checklist-table";
import GridTooltip from "./grid-tooltip";

interface Props {
	items: Item[];
	version: string;
	onVersionChange: (version: string) => void;
}

export default function ItemChecklist({ items, version, onVersionChange }: Props) {
	const { headerHeight } = useHeaderHeight();
	// entries are kept across version changes so items come back if you switch back
	const [entries, setEntries] = useState<ChecklistEntry[]>([]);
	const [search, setSearch] = useState<string>("");
	const [debouncedSearch] = useDebounce(search, 250);

	const normalizedItems = useMemo(
		() => items.map((i) => ({ ...i, _name: i.name.toLowerCase() })),
		[items],
	);

	const filteredItems = useMemo(() => {
		if (!debouncedSearch) return normalizedItems;
		const q = debouncedSearch.toLowerCase();
		return normalizedItems.filter((item) => item._name.includes(q));
	}, [normalizedItems, debouncedSearch]);

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

	return (
		<section
			className="lg:h-(--section-height)"
			style={{ "--section-height": `calc(100svh - ${headerHeight}px)` } as React.CSSProperties}
		>
			<div className="relative flex h-full flex-col py-12">
				<h1 className="display mb-2 text-center text-4xl">Items Checklist</h1>
				<p className="text-center text-muted-foreground">
					Make yourself a item list for building something cool!
				</p>

				<Separator className="mx-auto my-4 max-w-lg" />

				<div className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 gap-6 px-6 lg:grid-cols-[30rem_minmax(0,1fr)]">
					<div className="flex min-h-0 flex-col gap-3">
						<div className="flex h-9 items-center">
							<h2 className="text-muted-foreground">Items</h2>
						</div>
						<div className="flex gap-2">
							<Input
								placeholder="Search items (ENGLISH ONLY)"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<Select value={version} onValueChange={(v) => v && onVersionChange(v)}>
								<SelectTrigger aria-label="Minecraft version">
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

						{/* bounded height so react-window only renders the visible rows */}
						<GridTooltip className="mx-auto h-[60svh] min-h-48 w-full lg:h-auto lg:flex-1">
							<Grid
								cellComponent={CellComponent}
								columnCount={11}
								rowCount={Math.ceil(filteredItems.length / 11)}
								columnWidth={40}
								rowHeight={41}
								cellProps={{
									items: filteredItems,
									selectedIds,
									onClick: handleToggleItem,
								}}
								className="mx-auto"
								style={{ height: "100%", overflowX: "hidden" }}
							/>
						</GridTooltip>
					</div>

					<div className="flex min-h-0 flex-col gap-3">
						<div className="flex h-9 items-center justify-between">
							<h2 className="flex items-center gap-2 text-muted-foreground">
								<img
									src="/diamond_pickaxe.gif"
									alt=""
									width={26}
									height={26}
									className="size-6.5"
								/>
								Selected items
							</h2>
							{rows.length > 0 && (
								<span className="text-muted-foreground text-sm">
									{doneCount}/{rows.length} completed
								</span>
							)}
						</div>
						<ChecklistTable rows={rows} onChange={handleChange} onRemove={handleRemove} />
						{hiddenCount > 0 && (
							<p className="text-muted-foreground text-xs">
								{hiddenCount} selected {hiddenCount === 1 ? "item does not" : "items do not"} exist
								in {version} and {hiddenCount === 1 ? "is" : "are"} hidden.
							</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

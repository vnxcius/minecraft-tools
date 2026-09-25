import { useState } from "react";
import type { CellComponentProps } from "react-window";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { itemName, type Language } from "@/i18n";
import type { Item } from "@/lib/items";

/**
 * Icons that already loaded once. The grid is virtualized, so searching or scrolling mounts new
 * cells; without this every new cell would start on the skeleton, even for an icon the browser
 * serves straight from its cache.
 */
const loadedIcons = new Set<string>();

interface Props {
	items: Item[];
	onClick: (item: Item) => void;
	selectedIds: Set<string>;
	columns: number;
	language: Language;
}

export default function CellComponent({
	items,
	onClick,
	selectedIds,
	columns,
	rowIndex,
	columnIndex,
	style,
}: CellComponentProps<Props>) {
	const item = items[rowIndex * columns + columnIndex];
	const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
	if (!item) return <div style={style} role="gridcell" tabIndex={-1} />;
	// a cell is reused for another item when the search changes, so compare against its own icon
	const isLoaded = loadedSrc === item.src || loadedIcons.has(item.src);
	return (
		// no per-cell Tooltip: ~100 mounted tooltips made scrolling laggy, see item-checklist.tsx
		<button
			type="button"
			className={cn(
				"mx-0.5 block min-w-fit rounded-sm p-1 hover:bg-accent",
				selectedIds.has(item.id) && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
			)}
			style={style}
			data-item-name={itemName(item.id)}
			onClick={() => onClick(item)}
		>
			<div className="relative size-8">
				{!isLoaded && <Skeleton className="absolute inset-0" />}
				{/* no loading="lazy": the grid already renders only the visible cells */}
				<img
					src={item.src}
					width={32}
					height={32}
					alt={itemName(item.id)}
					className="relative size-8"
					onLoad={() => {
						loadedIcons.add(item.src);
						setLoadedSrc(item.src);
					}}
				/>
			</div>
		</button>
	);
}

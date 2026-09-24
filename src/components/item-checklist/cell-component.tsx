import { useState } from "react";
import type { CellComponentProps } from "react-window";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/items";

interface Props {
	items: Item[];
	onClick: (item: Item) => void;
	selectedIds: Set<string>;
}

export default function CellComponent({
	items,
	onClick,
	selectedIds,
	rowIndex,
	columnIndex,
	style,
}: CellComponentProps<Props>) {
	const item = items[rowIndex * 11 + columnIndex];
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	if (!item) return <div style={style} role="gridcell" tabIndex={-1} />;
	return (
		// no per-cell Tooltip: ~100 mounted tooltips made scrolling laggy, see item-checklist.tsx
		<button
			type="button"
			className={cn(
				"mx-0.5 block min-w-fit rounded-sm p-1 hover:bg-accent",
				selectedIds.has(item.id) && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
			)}
			style={style}
			data-item-name={item.name}
			onClick={() => onClick(item)}
		>
			<div>
				{!isLoaded && <Skeleton className="size-8" />}
				<img
					src={item.src}
					loading="lazy"
					decoding="async"
					width={32}
					height={32}
					alt={item.name}
					className="w-8"
					onLoad={() => setIsLoaded(true)}
				/>
			</div>
		</button>
	);
}

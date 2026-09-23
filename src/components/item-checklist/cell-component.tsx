import { useState } from "react";
import type { CellComponentProps } from "react-window";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/items";

interface Props {
	items: Item[];
	onClick: (item: Item) => void;
	selectedItems: Item[];
}

export default function CellComponent({
	items,
	onClick,
	selectedItems,
	rowIndex,
	columnIndex,
	style,
}: CellComponentProps<Props>) {
	const item = items[rowIndex * 11 + columnIndex];
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	if (!item) return <div style={style} role="gridcell" tabIndex={-1} />;
	return (
		<Tooltip>
			<TooltipTrigger
				delay={500}
				className={cn(
					"mx-0.5 block min-w-fit rounded-sm p-1 hover:bg-foreground/5",
					selectedItems.some((i) => i.id === item.id) && "bg-primary/80 hover:bg-primary/90",
				)}
				style={style}
				onClick={() => onClick(item)}
			>
				<div>
					{!isLoaded && <Skeleton className="size-8 bg-neutral-200" />}
					<img
						src={item.src}
						loading="lazy"
						width={32}
						height={32}
						alt={item.name}
						className="w-8"
						onLoad={() => setIsLoaded(true)}
					/>
				</div>
			</TooltipTrigger>
			<TooltipContent>{item.name}</TooltipContent>
		</Tooltip>
	);
}

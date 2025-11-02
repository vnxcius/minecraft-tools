import Image from "next/image";
import type { CellComponentProps } from "react-window";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Item } from "./item-checklist";

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
	if (!item)
		return (
			// biome-ignore lint/a11y/useSemanticElements: grid should return a semantic element
			<div style={style} role="gridcell" tabIndex={-1} />
		);
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger
				className={cn(
					"mx-0.5 block min-w-fit rounded-sm p-1 hover:bg-foreground/5",
					selectedItems.includes(item) && "bg-primary/80 hover:bg-primary/90",
				)}
				style={style}
				onClick={() => onClick(item)}
			>
				<Image
					src={`/minecraft/1.21.10/${item.path}`}
					width={32}
					height={32}
					alt={item.name}
					className="w-8"
					unoptimized
				/>
			</TooltipTrigger>
			<TooltipContent>{item.name}</TooltipContent>
		</Tooltip>
	);
}

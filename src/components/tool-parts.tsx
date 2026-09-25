import { cn } from "@/lib/utils";

export function Heading({
	className,
	children,
	aside,
}: {
	children: React.ReactNode;
	aside?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className="flex h-9 items-center justify-between">
			<h2 className={cn("font-bold", className)}>{children}</h2>
			{aside}
		</div>
	);
}

/** item icon from the CDN catalog (`icons` maps item id to url) */
export function ItemIcon({
	icons,
	item,
	className,
}: {
	icons: Record<string, string>;
	item: string;
	className?: string;
}) {
	const src = icons[item];
	return src ? (
		<img src={src} alt="" width={32} height={32} className={cn("size-8 shrink-0", className)} />
	) : (
		<span className={cn("size-8 shrink-0", className)} />
	);
}

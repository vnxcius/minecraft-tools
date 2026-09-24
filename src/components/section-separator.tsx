import { cn } from "@/lib/utils";

/** small "+" drawn where the hairlines of the layout cross, like on zed.dev */
function Cross({ className }: { className: string }) {
	return (
		<svg
			aria-hidden
			width="9"
			height="9"
			viewBox="0 0 9 9"
			className={cn("absolute text-muted-foreground/70", className)}
		>
			<path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
		</svg>
	);
}

/** full width hairline row with crosses on the vertical borders of the page */
export default function SectionSeparator({ className }: { className?: string }) {
	return (
		<div role="presentation" className={cn("relative h-8 border-y", className)}>
			<Cross className="-top-[5px] -left-[5px]" />
			<Cross className="-top-[5px] -right-[5px]" />
			<Cross className="-bottom-[5px] -left-[5px]" />
			<Cross className="-right-[5px] -bottom-[5px]" />
		</div>
	);
}

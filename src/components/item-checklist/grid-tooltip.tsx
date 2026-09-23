import { type ComponentProps, useRef, useState } from "react";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";

const DELAY = 500;

/**
 * One shared tooltip for the whole grid. Any descendant with `data-item-name`
 * gets a tooltip after a short hover/focus. Mounting a Tooltip per cell was far
 * too expensive while scrolling the virtualized grid.
 */
export default function GridTooltip({ children, ...props }: ComponentProps<"div">) {
	const [tip, setTip] = useState<{ el: HTMLElement; name: string } | null>(null);
	const current = useRef<HTMLElement | null>(null);
	const timer = useRef<number | undefined>(undefined);

	const hide = () => {
		window.clearTimeout(timer.current);
		current.current = null;
		setTip(null);
	};

	const schedule = (target: EventTarget) => {
		const el = (target as HTMLElement).closest<HTMLElement>("[data-item-name]");
		if (el === current.current) return;
		hide();
		if (!el) return;
		current.current = el;
		timer.current = window.setTimeout(() => setTip({ el, name: el.dataset.itemName ?? "" }), DELAY);
	};

	return (
		<div
			{...props}
			onPointerOver={(e) => schedule(e.target)}
			onPointerLeave={hide}
			onScrollCapture={hide}
			onFocus={(e) => schedule(e.target)}
			onBlur={hide}
		>
			{children}
			<Tooltip open={tip !== null}>
				<TooltipContent anchor={tip?.el}>{tip?.name}</TooltipContent>
			</Tooltip>
		</div>
	);
}

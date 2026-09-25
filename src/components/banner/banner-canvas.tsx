import { useEffect, useRef } from "react";
import {
	BANNER_SIZE,
	type BannerDesign,
	drawBanner,
	drawShield,
	FLAG,
	type Kind,
	SHIELD_SIZE,
} from "@/lib/banner";
import { cn } from "@/lib/utils";

interface Props {
	design: Pick<BannerDesign, "base"> & { layers: { pattern: string; color: string }[] };
	kind?: Kind;
	/** draw the crossbar the banner hangs from */
	bar?: boolean;
	className?: string;
}

/** pixel perfect banner: drawn at native resolution and scaled with CSS */
export default function BannerCanvas({ design, kind = "banner", bar = true, className }: Props) {
	const ref = useRef<HTMLCanvasElement>(null);
	// the pickers pass a new object on every render: drawing from its contents, the dozens of
	// previews on the page only redraw when their picture changes, not on every click
	const drawn = JSON.stringify({
		base: design.base,
		layers: design.layers.map(({ pattern, color }) => ({ pattern, color })),
	});

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const picture: Props["design"] = JSON.parse(drawn);
		let stale = false;
		(kind === "shield" ? drawShield(canvas, picture) : drawBanner(canvas, picture, { bar })).catch(
			() => {
				if (!stale) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
			},
		);
		return () => {
			stale = true;
		};
	}, [drawn, kind, bar]);

	return (
		<canvas
			ref={ref}
			role="img"
			aria-label={kind === "shield" ? "Shield preview" : "Banner preview"}
			width={kind === "shield" ? SHIELD_SIZE.w : BANNER_SIZE.w}
			height={kind === "shield" ? SHIELD_SIZE.h : FLAG.h + (bar ? 2 : 0)}
			className={cn("pixelated", className)}
		/>
	);
}

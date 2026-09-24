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
	/** what to draw the design on */
	kind?: Kind;
	/** draw the crossbar the banner hangs from */
	bar?: boolean;
	className?: string;
}

/** pixel perfect banner: drawn at native resolution and scaled with CSS */
export default function BannerCanvas({ design, kind = "banner", bar = true, className }: Props) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		let stale = false;
		(kind === "shield" ? drawShield(canvas, design) : drawBanner(canvas, design, { bar })).catch(
			() => {
				if (!stale) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
			},
		);
		return () => {
			stale = true;
		};
	}, [design, kind, bar]);

	return (
		<canvas
			ref={ref}
			role="img"
			aria-label={kind === "shield" ? "Shield preview" : "Banner preview"}
			width={kind === "shield" ? SHIELD_SIZE.w : BANNER_SIZE.w}
			height={kind === "shield" ? SHIELD_SIZE.h : FLAG.h + (bar ? 2 : 0)}
			className={cn("[image-rendering:pixelated]", className)}
		/>
	);
}

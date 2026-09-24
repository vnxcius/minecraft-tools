import { useEffect, useRef } from "react";
import { BANNER_SIZE, type BannerDesign, drawBanner, FLAG } from "@/lib/banner";
import { cn } from "@/lib/utils";

interface Props {
	design: Pick<BannerDesign, "base"> & { layers: { pattern: string; color: string }[] };
	/** draw the crossbar the banner hangs from */
	bar?: boolean;
	className?: string;
}

/** pixel perfect banner: drawn at native resolution and scaled with CSS */
export default function BannerCanvas({ design, bar = true, className }: Props) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		let stale = false;
		drawBanner(canvas, design, { bar }).catch(() => {
			if (!stale) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
		});
		return () => {
			stale = true;
		};
	}, [design, bar]);

	return (
		<canvas
			ref={ref}
			role="img"
			aria-label="Banner preview"
			width={BANNER_SIZE.w}
			height={FLAG.h + (bar ? 2 : 0)}
			className={cn("[image-rendering:pixelated]", className)}
		/>
	);
}

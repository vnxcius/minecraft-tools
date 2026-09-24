import { useEffect, useRef } from "react";
import { loadImage } from "@/lib/image";
import type { Form } from "@/lib/potions";
import { cn } from "@/lib/utils";

interface Props {
	/** liquid color, e.g. "#33ebff" */
	color: string;
	form: Form;
	className?: string;
}

const BASE: Record<Form, string> = {
	potion: "/potion/potion.png",
	splash: "/potion/splash_potion.png",
	lingering: "/potion/lingering_potion.png",
	arrow: "/potion/tipped_arrow_base.png",
};

/** grayscale texture multiplied with a color, like the game tints potion liquid and arrow heads */
function tint(img: HTMLImageElement, hex: string) {
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
	ctx.drawImage(img, 0, 0);
	const n = Number.parseInt(hex.slice(1), 16);
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	const pixels = ctx.getImageData(0, 0, img.width, img.height);
	for (let i = 0; i < pixels.data.length; i += 4) {
		pixels.data[i] = (pixels.data[i] * r) / 255;
		pixels.data[i + 1] = (pixels.data[i + 1] * g) / 255;
		pixels.data[i + 2] = (pixels.data[i + 2] * b) / 255;
	}
	ctx.putImageData(pixels, 0, 0);
	return canvas;
}

/** pixel perfect potion bottle / tipped arrow, drawn at 16x16 and scaled with CSS */
export default function PotionIcon({ color, form, className }: Props) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		let stale = false;
		const tinted =
			form === "arrow" ? "/potion/tipped_arrow_head.png" : "/potion/potion_overlay.png";
		Promise.all([loadImage(BASE[form]), loadImage(tinted)]).then(([base, overlay]) => {
			if (stale) return;
			const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
			ctx.clearRect(0, 0, 16, 16);
			ctx.drawImage(base, 0, 0);
			ctx.drawImage(tint(overlay, color), 0, 0);
		});
		return () => {
			stale = true;
		};
	}, [color, form]);

	return (
		<canvas
			ref={ref}
			width={16}
			height={16}
			aria-hidden
			className={cn("size-8 shrink-0 [image-rendering:pixelated]", className)}
		/>
	);
}

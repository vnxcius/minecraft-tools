import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
	type Chunk,
	type Hover,
	type MapPoint,
	MapRenderer,
	type MapState,
	type Selection,
} from "@/lib/seedmap/renderer";
import { cn } from "@/lib/utils";

export type { Chunk, Hover, MapPoint, Selection };

export interface SeedMapHandle {
	goTo: (x: number, z: number, blocksPerPixel?: number) => void;
	zoom: (direction: 1 | -1) => void;
	center: () => MapPoint;
}

interface Props extends MapState {
	onHover: (hover: Hover | null) => void;
	onSelect: (selection: Selection) => void;
	ariaLabel: string;
	className?: string;
}

/** wires MapRenderer, which draws and handles input, to React */
const SeedMap = forwardRef<SeedMapHandle, Props>(function SeedMap(props, ref) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const renderer = useRef<MapRenderer | null>(null);
	const {
		engine,
		info,
		epoch,
		dim,
		y,
		features,
		showSlime,
		showGrid,
		spawn,
		strongholds,
		pin,
		highlight,
		chunk,
		icons,
		scaleLabel,
		onHover,
		onSelect,
		ariaLabel,
		className,
	} = props;

	// created on the first update, then kept up to date
	useEffect(() => {
		const state = {
			engine,
			info,
			epoch,
			dim,
			y,
			features,
			showSlime,
			showGrid,
			spawn,
			strongholds,
			pin,
			highlight,
			chunk,
			icons,
			scaleLabel,
		};
		if (renderer.current) renderer.current.update(state, { onHover, onSelect });
		else
			renderer.current = new MapRenderer(canvasRef.current as HTMLCanvasElement, state, {
				onHover,
				onSelect,
			});
	}, [
		engine,
		info,
		epoch,
		dim,
		y,
		features,
		showSlime,
		showGrid,
		spawn,
		strongholds,
		pin,
		highlight,
		chunk,
		icons,
		scaleLabel,
		onHover,
		onSelect,
	]);

	useEffect(
		() => () => {
			renderer.current?.destroy();
			renderer.current = null;
		},
		[],
	);

	useImperativeHandle(ref, () => ({
		goTo: (x, z, blocksPerPixel) => renderer.current?.goTo(x, z, blocksPerPixel),
		zoom: (direction) => renderer.current?.zoom(direction),
		center: () => renderer.current?.center() ?? { x: 0, z: 0 },
	}));

	return (
		<canvas
			ref={canvasRef}
			role="img"
			aria-label={ariaLabel}
			className={cn("block size-full cursor-grab touch-none active:cursor-grabbing", className)}
		/>
	);
});

export default SeedMap;

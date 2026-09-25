import { useEffect, useMemo, useRef, useState } from "react";
import { Heading } from "@/components/tool-parts";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { type MessageKey, useI18n } from "@/i18n";
import { countBlocks, ellipse, type Grid, type Outline, sphereLayer } from "@/lib/circle";
import { cn } from "@/lib/utils";

type Shape = "circle" | "sphere" | "dome";

const SHAPES: Shape[] = ["circle", "sphere", "dome"];
const OUTLINES: Outline[] = ["thin", "thick", "filled"];
const MAX_SIZE = 256;
const MAX_DIAMETER = 128;

function Segmented<T extends string>({
	label,
	value,
	options,
	onChange,
	name,
}: {
	label: string;
	value: T;
	options: T[];
	onChange: (value: T) => void;
	name: (value: T) => string;
}) {
	return (
		<div className="space-y-1.5">
			<h3 className="text-sm text-muted-foreground">{label}</h3>
			<div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
				{options.map((option) => (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={value === option}
						onClick={() => onChange(option)}
						className={cn(
							"tile bg-secondary px-3 pt-1.5 pb-2 text-sm hover:bg-accent",
							value === option &&
								"border-primary bg-primary/25 hover:border-primary hover:bg-primary/35",
						)}
					>
						{name(option)}
					</button>
				))}
			</div>
		</div>
	);
}

function SizeInput({
	id,
	label,
	value,
	max,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	max: number;
	onChange: (value: number) => void;
}) {
	// what is being typed, until the field loses focus; otherwise the value itself
	const [draft, setDraft] = useState<string | null>(null);
	return (
		<label htmlFor={id} className="flex flex-col gap-1 text-sm text-muted-foreground">
			{label}
			<Input
				id={id}
				type="number"
				min={1}
				max={max}
				inputMode="numeric"
				value={draft ?? String(value)}
				onChange={(event) => {
					setDraft(event.target.value);
					const n = Math.floor(Number(event.target.value));
					if (n >= 1 && n <= max) onChange(n);
				}}
				onBlur={() => setDraft(null)}
				className="w-24 text-foreground"
			/>
		</label>
	);
}

/** the grid as blocks; the layer below is drawn faintly so each ring can be lined up */
function GridCanvas({
	grid,
	below,
	onHoverRow,
}: {
	grid: Grid;
	below?: Grid;
	onHoverRow: (row: number | null) => void;
}) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const box = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(600);

	useEffect(() => {
		const element = box.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const rows = grid.length;
	const cols = grid[0]?.length ?? 0;
	const cell = Math.max(2, Math.floor(Math.min(width, 720) / Math.max(rows, cols)));

	useEffect(() => {
		const element = canvas.current;
		if (!element) return;
		const ratio = window.devicePixelRatio || 1;
		element.width = cols * cell * ratio;
		element.height = rows * cell * ratio;
		element.style.width = `${cols * cell}px`;
		element.style.height = `${rows * cell}px`;
		const ctx = element.getContext("2d") as CanvasRenderingContext2D;
		ctx.scale(ratio, ratio);
		const dark = document.documentElement.classList.contains("dark");
		ctx.fillStyle = dark ? "#23272b" : "#f3f6f8";
		ctx.fillRect(0, 0, cols * cell, rows * cell);
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				if (grid[y][x]) ctx.fillStyle = "#3c8527";
				else if (below?.[y]?.[x]) ctx.fillStyle = dark ? "#3a4a36" : "#cfe0c8";
				else continue;
				ctx.fillRect(x * cell, y * cell, cell, cell);
			}
		}
		if (cell >= 6) {
			ctx.strokeStyle = dark ? "rgb(255 255 255 / 0.08)" : "rgb(0 0 0 / 0.1)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (let x = 0; x <= cols; x++) {
				ctx.moveTo(x * cell + 0.5, 0);
				ctx.lineTo(x * cell + 0.5, rows * cell);
			}
			for (let y = 0; y <= rows; y++) {
				ctx.moveTo(0, y * cell + 0.5);
				ctx.lineTo(cols * cell, y * cell + 0.5);
			}
			ctx.stroke();
		}
		// the center: a line through the middle block, or between the two middle ones
		ctx.strokeStyle = "rgb(224 49 49 / 0.7)";
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo((cols * cell) / 2, 0);
		ctx.lineTo((cols * cell) / 2, rows * cell);
		ctx.moveTo(0, (rows * cell) / 2);
		ctx.lineTo(cols * cell, (rows * cell) / 2);
		ctx.stroke();
	}, [grid, below, cell, rows, cols]);

	return (
		<div ref={box} className="flex w-full justify-center overflow-x-auto">
			<canvas
				ref={canvas}
				className="pixelated"
				onMouseMove={(event) => {
					const rect = event.currentTarget.getBoundingClientRect();
					onHoverRow(Math.floor((event.clientY - rect.top) / cell));
				}}
				onMouseLeave={() => onHoverRow(null)}
			/>
		</div>
	);
}

export default function CircleGenerator() {
	const { t, tn } = useI18n();
	const [shape, setShape] = useState<Shape>("circle");
	const [width, setWidth] = useState(21);
	const [height, setHeight] = useState(21);
	const [round, setRound] = useState(true);
	const [mode, setMode] = useState<Outline>("thin");
	const [diameter, setDiameter] = useState(15);
	const [hollow, setHollow] = useState(true);
	const [layerIndex, setLayerIndex] = useState(0);
	const [hoverRow, setHoverRow] = useState<number | null>(null);

	// the layers shown: all of a sphere, the top half of a dome, bottom first
	const firstLayer = shape === "dome" ? Math.floor(diameter / 2) : 0;
	const layerCount = diameter - firstLayer;
	const layer = firstLayer + Math.min(layerIndex, layerCount - 1);

	const grid = useMemo(
		() =>
			shape === "circle"
				? ellipse(width, round ? width : height, mode)
				: sphereLayer(diameter, layer, hollow),
		[shape, width, height, round, mode, diameter, layer, hollow],
	);
	const below = useMemo(
		() =>
			shape !== "circle" && layer > firstLayer
				? sphereLayer(diameter, layer - 1, hollow)
				: undefined,
		[shape, diameter, layer, firstLayer, hollow],
	);
	const total = useMemo(() => {
		if (shape === "circle") return countBlocks(grid);
		let sum = 0;
		for (let l = firstLayer; l < diameter; l++)
			sum += countBlocks(sphereLayer(diameter, l, hollow));
		return sum;
	}, [shape, grid, diameter, firstLayer, hollow]);

	const rowBlocks =
		hoverRow !== null && grid[hoverRow] ? grid[hoverRow].filter(Boolean).length : null;

	return (
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("circle.options")}</Heading>
					<div className="space-y-4 rounded border p-3">
						<Segmented
							label={t("circle.shape")}
							value={shape}
							options={SHAPES}
							onChange={(value) => {
								setShape(value);
								setLayerIndex(0);
							}}
							name={(value) => t(`circle.shape.${value}` as MessageKey)}
						/>
						{shape === "circle" ? (
							<>
								<div className="flex gap-3">
									<SizeInput
										id="circle-width"
										label={round ? t("circle.diameter") : t("circle.width")}
										value={width}
										max={MAX_SIZE}
										onChange={setWidth}
									/>
									{!round && (
										<SizeInput
											id="circle-height"
											label={t("circle.height")}
											value={height}
											max={MAX_SIZE}
											onChange={setHeight}
										/>
									)}
								</div>
								<label className="flex cursor-pointer items-center gap-2 text-sm">
									<Checkbox
										checked={!round}
										onCheckedChange={(oval) => {
											setRound(!oval);
											setHeight(width);
										}}
									/>
									{t("circle.oval")}
								</label>
								<Segmented
									label={t("circle.style")}
									value={mode}
									options={OUTLINES}
									onChange={setMode}
									name={(value) => t(`circle.style.${value}` as MessageKey)}
								/>
							</>
						) : (
							<>
								<SizeInput
									id="circle-diameter"
									label={t("circle.diameter")}
									value={diameter}
									max={MAX_DIAMETER}
									onChange={(value) => {
										setDiameter(value);
										setLayerIndex(0);
									}}
								/>
								<label className="flex cursor-pointer items-center gap-2 text-sm">
									<Checkbox checked={hollow} onCheckedChange={(value) => setHollow(value)} />
									{t("circle.hollow")}
								</label>
								<div className="space-y-1.5">
									<label htmlFor="circle-layer" className="block text-sm text-muted-foreground">
										{t("circle.layer", { layer: layerIndex + 1, count: layerCount })}
									</label>
									<input
										id="circle-layer"
										type="range"
										min={0}
										max={layerCount - 1}
										value={Math.min(layerIndex, layerCount - 1)}
										onChange={(event) => setLayerIndex(Number(event.target.value))}
										className="w-full accent-primary"
									/>
								</div>
							</>
						)}
					</div>

					<div className="space-y-1 rounded border p-3 text-sm">
						<p>
							<b className="text-lg">{tn("circle.blocks", total)}</b>
						</p>
						{shape !== "circle" && (
							<p className="text-muted-foreground">{tn("circle.layerBlocks", countBlocks(grid))}</p>
						)}
						{total >= 64 && (
							<p className="text-muted-foreground">
								{tn("stack.stacks", Math.floor(total / 64))} + {tn("stack.items", total % 64)}
							</p>
						)}
					</div>
					<p className="text-xs leading-relaxed text-muted-foreground">{t("circle.hint")}</p>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							<span className="text-sm text-muted-foreground tabular-nums">
								{rowBlocks !== null && hoverRow !== null
									? t("circle.row", { row: hoverRow + 1, count: rowBlocks })
									: `${grid[0]?.length ?? 0} × ${grid.length}`}
							</span>
						}
					>
						{t("circle.plan")}
					</Heading>
					<div className="rounded border bg-card p-3">
						<GridCanvas grid={grid} below={below} onHoverRow={setHoverRow} />
					</div>
				</div>
			</div>
		</section>
	);
}

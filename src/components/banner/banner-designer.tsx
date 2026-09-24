import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	type BannerDesign,
	COLORS,
	colorById,
	giveCommand,
	itemName,
	type Layer,
	MAX_LAYERS,
	materials,
	PATTERNS,
	patternById,
	type Kind,
	shieldMaterials,
} from "@/lib/banner";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { cn } from "@/lib/utils";
import BannerCanvas from "./banner-canvas";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
	/** designs are the same for banners and shields, only the preview and materials differ */
	kind?: Kind;
}

function ColorDot({ color, className }: { color: string; className?: string }) {
	return (
		<span
			className={cn(
				"inline-block size-4 shrink-0 rounded-sm border border-foreground/20",
				className,
			)}
			style={{ backgroundColor: colorById(color).hex }}
		/>
	);
}

/** the 16 dye colors as a grid of swatches */
function Swatches({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (color: string) => void;
	label: string;
}) {
	return (
		<div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
			{COLORS.map((color) => (
				<Tooltip key={color.id}>
					<TooltipTrigger
						role="radio"
						aria-checked={value === color.id}
						aria-label={color.name}
						onClick={() => onChange(color.id)}
						className={cn(
							"size-7 rounded-sm border border-foreground/20",
							value === color.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
						)}
						style={{ backgroundColor: color.hex }}
					/>
					<TooltipContent>{color.name}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

export default function BannerDesigner({ icons, kind = "banner" }: Props) {
	const shield = kind === "shield";
	const newLayer = (pattern: string, color: string): Layer => ({
		key: crypto.randomUUID(),
		pattern,
		color,
	});

	const [base, setBase] = useState("blue");
	const [layers, setLayers] = useState<Layer[]>(() => [newLayer("straight_cross", "white")]);
	const [newColor, setNewColor] = useState("red");
	const [copied, setCopied] = useState(false);

	const design = useMemo<BannerDesign>(() => ({ base, layers }), [base, layers]);
	const needed = useMemo(
		() => (shield ? shieldMaterials(design) : materials(design)),
		[design, shield],
	);
	const command = giveCommand(design, kind);
	const full = layers.length >= MAX_LAYERS;

	const move = (index: number, by: -1 | 1) =>
		setLayers((prev) => {
			const target = index + by;
			if (target < 0 || target >= prev.length) return prev;
			const next = [...prev];
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});

	const copy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	return (
		<section className="py-12">
			<h1 className="display mb-2 text-center text-4xl">
				{shield ? "Shield Designer" : "Banner Designer"}
			</h1>
			<p className="text-center text-muted-foreground">
				Layer up to {MAX_LAYERS} patterns and dyes, then get the materials and the command.
			</p>

			<Separator className="mx-auto my-4 max-w-lg" />

			<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{shield ? "Shield" : "Banner"}</Heading>

					<div className="flex items-center justify-center rounded border bg-card py-8">
						<BannerCanvas
							design={design}
							kind={kind}
							className={shield ? "h-[384px] w-[224px]" : "h-[420px] w-[200px]"}
						/>
					</div>

					<Heading
						aside={
							<span className="text-muted-foreground text-sm">
								{layers.length}/{MAX_LAYERS} layers
							</span>
						}
					>
						Materials
					</Heading>
					<ul className="divide-y rounded border">
						{needed.map((m) => (
							<li key={m.item} className="flex items-center gap-3 px-3 py-1.5">
								<ItemIcon icons={icons} item={m.item} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{itemName(m.item)}</p>
									{m.note && <p className="truncate text-muted-foreground text-xs">{m.note}</p>}
								</div>
								<span className="text-sm tabular-nums">×{m.count}</span>
							</li>
						))}
						<li className="flex items-center gap-3 px-3 py-1.5 text-muted-foreground text-xs">
							<ItemIcon icons={icons} item="loom" className="size-6" />
							{shield
								? "Apply the patterns to the banner in a loom (2 planks + 2 string), then craft the shield with the banner"
								: "Apply the patterns in a loom (2 planks + 2 string)"}
						</li>
					</ul>

					<Heading>Command</Heading>
					<div className="flex items-start gap-2 rounded border bg-card p-3">
						<code className="min-w-0 flex-1 break-all text-xs leading-relaxed">{command}</code>
						<Button variant="outline" size="icon-sm" aria-label="Copy command" onClick={copy}>
							{copied ? <CheckIcon /> : <CopyIcon />}
						</Button>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>Design</Heading>

					<div className="space-y-5 rounded border p-3">
						<div className="space-y-2">
							<h3 className="text-muted-foreground text-sm">Base color</h3>
							<Swatches value={base} onChange={setBase} label="Base color" />
						</div>

						<div className="space-y-2">
							<h3 className="text-muted-foreground text-sm">Layers (bottom to top)</h3>
							{layers.length === 0 ? (
								<p className="rounded border border-dashed p-3 text-center text-muted-foreground text-sm">
									No layers yet. Pick a pattern below.
								</p>
							) : (
								<ul className="divide-y rounded border">
									{layers.map((layer, i) => (
										<li key={layer.key} className="flex items-center gap-2 p-1.5">
											<BannerCanvas
												design={{ base: "gray", layers: [layer] }}
												bar={false}
												className="h-10 w-5 shrink-0 rounded-sm"
											/>
											<span className="min-w-0 flex-1 truncate text-sm">
												{patternById(layer.pattern).name}
											</span>
											<Select
												value={layer.color}
												onValueChange={(color) =>
													color &&
													setLayers((prev) =>
														prev.map((l) => (l.key === layer.key ? { ...l, color } : l)),
													)
												}
											>
												<SelectTrigger aria-label="Layer color" className="h-8 min-w-0 px-2">
													<SelectValue>{(value: string) => <ColorDot color={value} />}</SelectValue>
												</SelectTrigger>
												<SelectContent align="end">
													{COLORS.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															<ColorDot color={c.id} />
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Move layer down"
												disabled={i === 0}
												onClick={() => move(i, -1)}
											>
												<ChevronUpIcon />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Move layer up"
												disabled={i === layers.length - 1}
												onClick={() => move(i, 1)}
											>
												<ChevronDownIcon />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Remove layer"
												onClick={() => setLayers((prev) => prev.filter((l) => l.key !== layer.key))}
											>
												<XIcon className="text-destructive" />
											</Button>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="space-y-2">
							<h3 className="text-muted-foreground text-sm">New layer color</h3>
							<Swatches value={newColor} onChange={setNewColor} label="New layer color" />
						</div>

						<div className="space-y-2">
							<h3 className="text-muted-foreground text-sm">
								{full ? `Layer limit reached (${MAX_LAYERS})` : "Add a pattern"}
							</h3>
							<div className="flex flex-wrap gap-1">
								{PATTERNS.map((pattern) => (
									<Tooltip key={pattern.id}>
										<TooltipTrigger
											aria-label={`Add ${pattern.name}`}
											disabled={full}
											onClick={() => setLayers((prev) => [...prev, newLayer(pattern.id, newColor)])}
											className="rounded-sm p-1 hover:bg-accent disabled:opacity-40"
										>
											<BannerCanvas
												design={{
													base: "gray",
													layers: [{ pattern: pattern.id, color: newColor }],
												}}
												bar={false}
												className="h-12 w-6"
											/>
										</TooltipTrigger>
										<TooltipContent>
											{pattern.name}
											{pattern.item && " *"}
										</TooltipContent>
									</Tooltip>
								))}
							</div>
							<p className="text-muted-foreground text-xs">* needs a banner pattern item</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

import {
	Check as CheckIcon,
	ChevronDown as ChevronDownIcon,
	ChevronUp as ChevronUpIcon,
	Close as CloseIcon,
	Copy as CopyIcon,
} from "pixelarticons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	type BannerDesign,
	COLORS,
	colorById,
	giveCommand,
	colorName,
	type Layer,
	MAX_LAYERS,
	materials,
	PATTERNS,
	patternName,
	type Kind,
	shieldMaterials,
} from "@/lib/banner";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { useI18n } from "@/i18n";
import { cn, uid } from "@/lib/utils";
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

function Swatches({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (color: string) => void;
	label: string;
}) {
	useI18n();
	return (
		<div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
			{COLORS.map((color) => (
				<Tooltip key={color.id}>
					<TooltipTrigger
						role="radio"
						aria-checked={value === color.id}
						aria-label={colorName(color.id)}
						onClick={() => onChange(color.id)}
						className={cn(
							"size-7 rounded-sm border border-foreground/20",
							value === color.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
						)}
						style={{ backgroundColor: color.hex }}
					/>
					<TooltipContent>{colorName(color.id)}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

export default function BannerDesigner({ icons, kind = "banner" }: Props) {
	const shield = kind === "shield";
	const newLayer = (pattern: string, color: string): Layer => ({
		key: uid(),
		pattern,
		color,
	});

	const [base, setBase] = useState("blue");
	const [layers, setLayers] = useState<Layer[]>(() => [newLayer("straight_cross", "white")]);
	const [newColor, setNewColor] = useState("red");
	const [copied, setCopied] = useState(false);
	const { t, itemName } = useI18n();

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
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{shield ? itemName("shield") : t("banner.banner")}</Heading>

					<div className="flex items-center justify-center rounded border bg-viewer py-8">
						<BannerCanvas
							design={design}
							kind={kind}
							className={shield ? "h-96 w-56" : "h-105 w-50"}
						/>
					</div>

					<Heading
						aside={
							<span className="text-sm text-muted-foreground">
								{t("banner.layers", { count: layers.length, max: MAX_LAYERS })}
							</span>
						}
					>
						{t("banner.materials")}
					</Heading>
					<ul className="divide-y rounded border">
						{needed.map((m) => (
							<li key={m.item} className="flex items-center gap-3 px-3 py-1.5">
								<ItemIcon icons={icons} item={m.item} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{itemName(m.item)}</p>
									{m.note && (
										<p className="truncate text-xs text-muted-foreground">
											{"recipe" in m.note
												? m.note.recipe.map(itemName).join(" + ")
												: t(m.note.message)}
										</p>
									)}
								</div>
								<span className="text-sm tabular-nums">×{m.count}</span>
							</li>
						))}
						<li className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted-foreground">
							<ItemIcon icons={icons} item="loom" className="size-6" />
							{shield ? t("banner.loomHintShield") : t("banner.loomHint")}
						</li>
					</ul>

					<Heading>{t("banner.command")}</Heading>
					<div className="flex items-start gap-2 rounded border bg-card p-3">
						<code className="min-w-0 flex-1 text-xs leading-relaxed break-all">{command}</code>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label={t("banner.copyCommand")}
							onClick={copy}
						>
							{copied ? <CheckIcon /> : <CopyIcon />}
						</Button>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("banner.design")}</Heading>

					<div className="space-y-5 rounded border p-3">
						<div className="space-y-2">
							<h3 className="text-sm text-muted-foreground">{t("banner.baseColor")}</h3>
							<Swatches value={base} onChange={setBase} label={t("banner.baseColor")} />
						</div>

						<div className="space-y-2">
							<h3 className="text-sm text-muted-foreground">{t("banner.layersTitle")}</h3>
							{layers.length === 0 ? (
								<p className="rounded border border-dashed p-3 text-center text-sm text-muted-foreground">
									{t("banner.noLayers")}
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
												{patternName(layer.pattern, layer.color)}
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
												<SelectTrigger
													aria-label={t("banner.layerColor")}
													className="h-8 min-w-0 px-2"
												>
													<SelectValue>{(value: string) => <ColorDot color={value} />}</SelectValue>
												</SelectTrigger>
												<SelectContent align="end">
													{COLORS.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															<ColorDot color={c.id} />
															{colorName(c.id)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={t("banner.moveDown")}
												disabled={i === 0}
												onClick={() => move(i, -1)}
											>
												<ChevronUpIcon />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={t("banner.moveUp")}
												disabled={i === layers.length - 1}
												onClick={() => move(i, 1)}
											>
												<ChevronDownIcon />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={t("banner.removeLayer")}
												onClick={() => setLayers((prev) => prev.filter((l) => l.key !== layer.key))}
											>
												<CloseIcon className="text-destructive" />
											</Button>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="space-y-2">
							<h3 className="text-sm text-muted-foreground">{t("banner.newLayerColor")}</h3>
							<Swatches value={newColor} onChange={setNewColor} label={t("banner.newLayerColor")} />
						</div>

						<div className="space-y-2">
							<h3 className="text-sm text-muted-foreground">
								{full ? t("banner.limit", { max: MAX_LAYERS }) : t("banner.addPattern")}
							</h3>
							<div className="flex flex-wrap gap-1">
								{PATTERNS.map((pattern) => (
									<Tooltip key={pattern.id}>
										<TooltipTrigger
											aria-label={t("banner.addNamed", { name: patternName(pattern.id, newColor) })}
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
											{patternName(pattern.id, newColor)}
											{pattern.item && " *"}
										</TooltipContent>
									</Tooltip>
								))}
							</div>
							<p className="text-xs text-muted-foreground">{t("banner.needsItem")}</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

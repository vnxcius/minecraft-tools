import {
	Check as CheckIcon,
	Close as CloseIcon,
	Copy as CopyIcon,
	Plus as PlusIcon,
	Reload as ReloadIcon,
} from "pixelarticons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heading, ItemIcon } from "@/components/tool-parts";
import {
	COLORS,
	colorName,
	type Firework,
	giveCommand,
	hex,
	MAX_FADE,
	materials,
	maxColors,
	maxStars,
	SHAPES,
	shapeName,
	starColorName,
	type Shape,
	type Star,
	starSteps,
} from "@/lib/firework";
import { useI18n } from "@/i18n";
import { cn, uid } from "@/lib/utils";
import FireworkCanvas from "./firework-canvas";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

const newStar = (): Star => ({
	key: uid(),
	shape: "large_ball",
	colors: ["red", "orange"],
	fade: ["yellow"],
	trail: false,
	twinkle: false,
});

/** toggle dyes on and off; `max` caps how many can be picked, `min` keeps at least one */
function MultiSwatches({
	value,
	onToggle,
	max,
	min = 0,
	label,
}: {
	value: string[];
	onToggle: (id: string) => void;
	max: number;
	min?: number;
	label: string;
}) {
	useI18n();
	return (
		<div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
			{COLORS.map((color) => {
				const selected = value.includes(color.id);
				const blocked = selected ? value.length <= min : value.length >= max;
				return (
					<Tooltip key={color.id}>
						<TooltipTrigger
							aria-label={colorName(color.id)}
							aria-pressed={selected}
							disabled={blocked}
							onClick={() => onToggle(color.id)}
							className={cn(
								"flex size-7 items-center justify-center rounded-sm border border-foreground/20 disabled:cursor-not-allowed disabled:opacity-40",
								selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
							)}
							style={{ backgroundColor: hex(color.rgb) }}
						>
							{selected && <CheckIcon className="size-4 text-white mix-blend-difference" />}
						</TooltipTrigger>
						<TooltipContent>{colorName(color.id)}</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}

export default function FireworkDesigner({ icons }: Props) {
	const [flight, setFlight] = useState(2);
	const [stars, setStars] = useState<Star[]>(() => [newStar()]);
	const [replayKey, setReplayKey] = useState(0);
	const [copied, setCopied] = useState(false);
	const { t, term, itemName } = useI18n();
	// the star's own words for trail and twinkle, as a label ("com feixe de luz" -> "Com feixe de luz")
	const label = (key: string) => {
		const text = term(key);
		return text.charAt(0).toUpperCase() + text.slice(1);
	};

	const firework = useMemo<Firework>(() => ({ flight, stars }), [flight, stars]);
	const needed = useMemo(() => materials(firework), [firework]);
	const command = giveCommand(firework);
	const limit = maxStars(flight);

	const changeFlight = (next: number) => {
		setFlight(next);
		// fewer slots left for stars: drop the extra ones
		setStars((prev) => prev.slice(0, maxStars(next)));
	};

	/** the dyes have to fit in the grid next to the gunpowder and extras */
	const fit = (star: Star): Star => ({ ...star, colors: star.colors.slice(0, maxColors(star)) });

	const update = (key: string, patch: (star: Star) => Star) =>
		setStars((prev) => prev.map((s) => (s.key === key ? fit(patch(s)) : s)));

	const toggle = (list: string[], id: string) =>
		list.includes(id) ? list.filter((c) => c !== id) : [...list, id];

	const copy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	return (
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							<Button variant="outline" size="sm" onClick={() => setReplayKey((k) => k + 1)}>
								<ReloadIcon />
								{t("firework.replay")}
							</Button>
						}
					>
						{t("firework.preview")}
					</Heading>
					<div className="flex justify-center rounded border bg-card p-3">
						<FireworkCanvas firework={firework} replayKey={replayKey} />
					</div>

					<Heading
						aside={
							<span className="text-sm text-muted-foreground">
								{t("firework.starsCount", { count: stars.length, max: limit })}
							</span>
						}
					>
						{t("firework.materials")}
					</Heading>
					<ul className="divide-y rounded border">
						{needed.map((m) => (
							<li key={m.item} className="flex items-center gap-3 px-3 py-1.5">
								<ItemIcon icons={icons} item={m.item} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{itemName(m.item)}</p>
									{m.item === "gunpowder" && (
										<p className="truncate text-xs text-muted-foreground">
											{t("firework.gunpowderNote", { flight, stars: stars.length })}
										</p>
									)}
								</div>
								<span className="text-sm tabular-nums">×{m.count}</span>
							</li>
						))}
						<li className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted-foreground">
							<ItemIcon icons={icons} item="firework_rocket" className="size-6" />
							{t("firework.craftHint")}
						</li>
					</ul>

					<Heading>{t("firework.command")}</Heading>
					<div className="flex items-start gap-2 rounded border bg-card p-3">
						<code className="min-w-0 flex-1 text-xs leading-relaxed break-all">{command}</code>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label={t("firework.copyCommand")}
							onClick={copy}
						>
							{copied ? <CheckIcon /> : <CopyIcon />}
						</Button>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("firework.rocket")}</Heading>
					<div className="space-y-2 rounded border p-3">
						<h3 className="text-sm text-muted-foreground">{t("firework.flight")}</h3>
						<div role="radiogroup" aria-label={t("firework.flightLabel")} className="flex gap-1">
							{[1, 2, 3].map((n) => (
								<button
									key={n}
									type="button"
									role="radio"
									aria-checked={flight === n}
									onClick={() => changeFlight(n)}
									className={cn(
										"tile bg-secondary px-4 pt-1.5 pb-2 text-sm hover:bg-accent",
										flight === n &&
											"border-primary bg-primary/25 hover:border-primary hover:bg-primary/35",
									)}
								>
									{n}
								</button>
							))}
						</div>
					</div>

					<Heading
						aside={
							<Button
								variant="outline"
								size="sm"
								disabled={stars.length >= limit}
								onClick={() => setStars((prev) => [...prev, newStar()])}
							>
								<PlusIcon />
								{t("firework.addStar")}
							</Button>
						}
					>
						{t("firework.stars")}
					</Heading>

					<ul className="space-y-3">
						{stars.map((star, index) => {
							const steps = starSteps(star);
							return (
								<li key={star.key} className="space-y-4 rounded border p-3">
									<div className="flex items-center justify-between">
										<h3 className="font-pixel text-lg">
											{t("firework.star", { number: index + 1 })}
										</h3>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={t("firework.removeStar")}
											disabled={stars.length === 1}
											onClick={() => setStars((prev) => prev.filter((s) => s.key !== star.key))}
										>
											<CloseIcon className="text-destructive" />
										</Button>
									</div>

									<div className="space-y-2">
										<h4 className="text-sm text-muted-foreground">{t("firework.shape")}</h4>
										<div
											role="radiogroup"
											aria-label={t("firework.shape")}
											className="flex flex-wrap gap-1"
										>
											{SHAPES.map((shape) => (
												<button
													key={shape.id}
													type="button"
													role="radio"
													aria-checked={star.shape === shape.id}
													onClick={() =>
														update(star.key, (s) => ({ ...s, shape: shape.id as Shape }))
													}
													className={cn(
														"flex items-center gap-1.5 tile bg-secondary px-2 pt-1 pb-1.5 text-sm hover:bg-accent",
														star.shape === shape.id &&
															"border-primary bg-primary/25 hover:border-primary hover:bg-primary/35",
													)}
												>
													{shape.item && (
														<ItemIcon icons={icons} item={shape.item} className="size-5" />
													)}
													{shapeName(shape.id)}
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<h4 className="text-sm text-muted-foreground">
											{t("firework.colors", { count: star.colors.length, max: maxColors(star) })}
										</h4>
										<MultiSwatches
											label={t("firework.colorsLabel")}
											value={star.colors}
											min={1}
											max={maxColors(star)}
											onToggle={(id) =>
												update(star.key, (s) => ({ ...s, colors: toggle(s.colors, id) }))
											}
										/>
									</div>

									<div className="space-y-2">
										<h4 className="text-sm text-muted-foreground">{t("firework.fade")}</h4>
										<MultiSwatches
											label={t("firework.fadeLabel")}
											value={star.fade}
											max={MAX_FADE}
											onToggle={(id) =>
												update(star.key, (s) => ({ ...s, fade: toggle(s.fade, id) }))
											}
										/>
									</div>

									<div className="flex flex-wrap gap-x-6 gap-y-2">
										<label
											htmlFor={`${star.key}-trail`}
											className="flex cursor-pointer items-center gap-2 text-sm"
										>
											<Checkbox
												id={`${star.key}-trail`}
												checked={star.trail}
												onCheckedChange={(trail) => update(star.key, (s) => ({ ...s, trail }))}
											/>
											<ItemIcon icons={icons} item="diamond" className="size-5" />
											{label("item.minecraft.firework_star.trail")}
										</label>
										<label
											htmlFor={`${star.key}-twinkle`}
											className="flex cursor-pointer items-center gap-2 text-sm"
										>
											<Checkbox
												id={`${star.key}-twinkle`}
												checked={star.twinkle}
												onCheckedChange={(twinkle) => update(star.key, (s) => ({ ...s, twinkle }))}
											/>
											<ItemIcon icons={icons} item="glowstone_dust" className="size-5" />
											{label("item.minecraft.firework_star.flicker")}
										</label>
									</div>

									<div className="space-y-1.5 rounded bg-row p-2 text-xs">
										<div className="flex flex-wrap items-center gap-1 text-muted-foreground">
											<span className="mr-1">{t("firework.craft")}</span>
											{steps.craft.map((item, i) => (
												<ItemIcon
													// the same dye can only appear once, the rest is unique per star
													key={`${item}-${i}`}
													icons={icons}
													item={item}
													className="size-6"
												/>
											))}
											<span>→ {itemName("firework_star")}</span>
										</div>
										{steps.fade.length > 0 && (
											<div className="flex flex-wrap items-center gap-1 text-muted-foreground">
												<span className="mr-1">{t("firework.thenFade")}</span>
												<ItemIcon icons={icons} item="firework_star" className="size-6" />
												{steps.fade.map((item) => (
													<ItemIcon key={item} icons={icons} item={item} className="size-6" />
												))}
												<span>
													{t("firework.fadesTo", {
														colors: star.fade.map(starColorName).join(", "),
													})}
												</span>
											</div>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</section>
	);
}

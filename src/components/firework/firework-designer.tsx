import { CheckIcon, CopyIcon, PlusIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heading, ItemIcon } from "@/components/tool-parts";
import {
	COLORS,
	colorById,
	type Firework,
	giveCommand,
	hex,
	itemName,
	MAX_FADE,
	materials,
	maxColors,
	maxStars,
	SHAPES,
	type Shape,
	type Star,
	starSteps,
} from "@/lib/firework";
import { cn } from "@/lib/utils";
import FireworkCanvas from "./firework-canvas";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

const newStar = (): Star => ({
	key: crypto.randomUUID(),
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
	return (
		<div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
			{COLORS.map((color) => {
				const selected = value.includes(color.id);
				const blocked = selected ? value.length <= min : value.length >= max;
				return (
					<Tooltip key={color.id}>
						<TooltipTrigger
							aria-label={color.name}
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
						<TooltipContent>{color.name}</TooltipContent>
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
		<section className="py-12">
			<h1 className="display mb-2 text-center text-4xl">Firework Crafting</h1>
			<p className="text-center text-muted-foreground">
				Design the stars of a rocket, watch them go off and get the crafting recipe.
			</p>

			<Separator className="mx-auto my-4 max-w-lg" />

			<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							<Button variant="outline" size="sm" onClick={() => setReplayKey((k) => k + 1)}>
								<RotateCcwIcon />
								Replay
							</Button>
						}
					>
						Preview
					</Heading>
					<div className="flex justify-center rounded border bg-card p-3">
						<FireworkCanvas firework={firework} replayKey={replayKey} />
					</div>

					<Heading
						aside={
							<span className="text-muted-foreground text-sm">
								{stars.length}/{limit} stars
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
									{m.item === "gunpowder" && (
										<p className="truncate text-muted-foreground text-xs">
											{flight} for flight + {stars.length} for the stars
										</p>
									)}
								</div>
								<span className="text-sm tabular-nums">×{m.count}</span>
							</li>
						))}
						<li className="flex items-center gap-3 px-3 py-1.5 text-muted-foreground text-xs">
							<ItemIcon icons={icons} item="firework_rocket" className="size-6" />
							Craft the rocket with paper, the gunpowder and the stars in any order.
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
					<Heading>Rocket</Heading>
					<div className="space-y-2 rounded border p-3">
						<h3 className="text-muted-foreground text-sm">Flight duration (gunpowder)</h3>
						<div role="radiogroup" aria-label="Flight duration" className="flex gap-1">
							{[1, 2, 3].map((n) => (
								<button
									key={n}
									type="button"
									role="radio"
									aria-checked={flight === n}
									onClick={() => changeFlight(n)}
									className={cn(
										"rounded border px-4 py-1.5 text-sm hover:bg-accent",
										flight === n && "border-primary bg-primary/20 hover:bg-primary/30",
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
								Add star
							</Button>
						}
					>
						Stars
					</Heading>

					<ul className="space-y-3">
						{stars.map((star, index) => {
							const steps = starSteps(star);
							return (
								<li key={star.key} className="space-y-4 rounded border p-3">
									<div className="flex items-center justify-between">
										<h3 className="font-pixel text-lg">Star {index + 1}</h3>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Remove star"
											disabled={stars.length === 1}
											onClick={() => setStars((prev) => prev.filter((s) => s.key !== star.key))}
										>
											<XIcon className="text-destructive" />
										</Button>
									</div>

									<div className="space-y-2">
										<h4 className="text-muted-foreground text-sm">Shape</h4>
										<div role="radiogroup" aria-label="Shape" className="flex flex-wrap gap-1">
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
														"flex items-center gap-1.5 rounded border px-2 py-1 text-sm hover:bg-accent",
														star.shape === shape.id &&
															"border-primary bg-primary/20 hover:bg-primary/30",
													)}
												>
													{shape.item && (
														<ItemIcon icons={icons} item={shape.item} className="size-5" />
													)}
													{shape.name}
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<h4 className="text-muted-foreground text-sm">
											Colors ({star.colors.length}/{maxColors(star)})
										</h4>
										<MultiSwatches
											label="Colors"
											value={star.colors}
											min={1}
											max={maxColors(star)}
											onToggle={(id) =>
												update(star.key, (s) => ({ ...s, colors: toggle(s.colors, id) }))
											}
										/>
									</div>

									<div className="space-y-2">
										<h4 className="text-muted-foreground text-sm">Fade to (optional)</h4>
										<MultiSwatches
											label="Fade colors"
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
											Trail
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
											Twinkle
										</label>
									</div>

									<div className="space-y-1.5 rounded bg-row p-2 text-xs">
										<div className="flex flex-wrap items-center gap-1 text-muted-foreground">
											<span className="mr-1">Craft:</span>
											{steps.craft.map((item, i) => (
												<ItemIcon
													// the same dye can only appear once, the rest is unique per star
													key={`${item}-${i}`}
													icons={icons}
													item={item}
													className="size-6"
												/>
											))}
											<span>→ Firework Star</span>
										</div>
										{steps.fade.length > 0 && (
											<div className="flex flex-wrap items-center gap-1 text-muted-foreground">
												<span className="mr-1">Then fade:</span>
												<ItemIcon icons={icons} item="firework_star" className="size-6" />
												{steps.fade.map((item) => (
													<ItemIcon key={item} icons={icons} item={item} className="size-6" />
												))}
												<span>
													→ fades to{" "}
													{star.fade.map((c) => colorById(c).name.toLowerCase()).join(", ")}
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

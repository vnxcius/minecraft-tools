import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	canEnhance,
	canExtend,
	effectSummary,
	FORMS,
	type Form,
	fullName,
	ingredientName,
	PICKABLE,
	potionById,
	recipe,
	totals,
	type Upgrade,
} from "@/lib/potions";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { cn } from "@/lib/utils";
import PotionIcon from "./potion-icon";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

/** row of mutually exclusive options */
function Segmented<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: { id: T; name: string; disabled?: boolean }[];
	onChange: (value: T) => void;
}) {
	return (
		<div className="space-y-2">
			<h3 className="text-muted-foreground text-sm">{label}</h3>
			<div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
				{options.map((option) => (
					<button
						key={option.id}
						type="button"
						role="radio"
						aria-checked={value === option.id}
						disabled={option.disabled}
						onClick={() => onChange(option.id)}
						className={cn(
							"rounded border px-3 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40",
							value === option.id && "border-primary bg-primary/20 hover:bg-primary/30",
						)}
					>
						{option.name}
					</button>
				))}
			</div>
		</div>
	);
}

export default function PotionMaker({ icons }: Props) {
	const [potionId, setPotionId] = useState("swiftness");
	const [requestedUpgrade, setUpgrade] = useState<Upgrade>("none");
	const [requestedForm, setForm] = useState<Form>("potion");
	const [bottles, setBottles] = useState(3);
	const [bottlesText, setBottlesText] = useState("3");

	const potion = potionById(potionId);
	const hasEffect = Boolean(potion.effects);

	// options that do not apply to the picked potion fall back to the default
	const upgrade: Upgrade =
		(requestedUpgrade === "extended" && canExtend(potion)) ||
		(requestedUpgrade === "enhanced" && canEnhance(potion))
			? requestedUpgrade
			: "none";
	const form: Form = requestedForm === "arrow" && !hasEffect ? "potion" : requestedForm;

	const steps = recipe(potion, upgrade, form);
	const needed = totals(steps, bottles);
	const summary = effectSummary(potion, upgrade, form);
	const last = steps.at(-1);
	const finished = last?.output.icon ?? { color: potion.color, form: "potion" as Form };

	return (
		<section className="py-12">
			<h1 className="display mb-2 text-center text-4xl">Potion Maker</h1>
			<p className="text-center text-muted-foreground">
				Pick a potion and get the full brewing recipe, from water bottle to finished item.
			</p>

			<Separator className="mx-auto my-4 max-w-lg" />

			<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>Potion</Heading>

					<div className="flex flex-wrap gap-0.5 rounded border p-3">
						{PICKABLE.map((p) => (
							<Tooltip key={p.id}>
								<TooltipTrigger
									aria-label={p.name}
									aria-pressed={p.id === potionId}
									onClick={() => setPotionId(p.id)}
									className={cn(
										"flex size-11 items-center justify-center rounded-sm hover:bg-accent",
										p.id === potionId && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
									)}
								>
									<PotionIcon color={p.color} form="potion" className="size-8" />
								</TooltipTrigger>
								<TooltipContent>{p.name}</TooltipContent>
							</Tooltip>
						))}
					</div>

					<Heading>Options</Heading>
					<div className="space-y-4 rounded border p-3">
						<Segmented
							label="Upgrade"
							value={upgrade}
							onChange={setUpgrade}
							options={[
								{ id: "none", name: "Normal" },
								{ id: "extended", name: "Extended", disabled: !canExtend(potion) },
								{
									id: "enhanced",
									name: potion.enhanced ? `Enhanced (${potion.enhanced.level})` : "Enhanced",
									disabled: !canEnhance(potion),
								},
							]}
						/>
						<Segmented
							label="Form"
							value={form}
							onChange={setForm}
							options={FORMS.map((f) => ({ ...f, disabled: f.id === "arrow" && !hasEffect }))}
						/>
						<div className="space-y-2">
							<label htmlFor="bottles" className="text-muted-foreground text-sm">
								{form === "arrow" ? "Lingering potions to make (8 arrows each)" : "Bottles to make"}
							</label>
							<Input
								id="bottles"
								type="number"
								min={1}
								max={999}
								inputMode="numeric"
								className="w-28"
								value={bottlesText}
								onChange={(e) => {
									setBottlesText(e.target.value);
									const n = Math.floor(Number(e.target.value));
									if (n >= 1 && n <= 999) setBottles(n);
								}}
								onBlur={() => setBottlesText(String(bottles))}
							/>
						</div>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>Recipe</Heading>

					<div className="flex items-center gap-4 rounded border bg-card p-4">
						<PotionIcon color={finished.color} form={finished.form} className="size-14" />
						<div className="min-w-0">
							<p className="font-semibold">{fullName(potion, upgrade, form)}</p>
							{summary && potion.effects ? (
								<ul className="mt-1 space-y-0.5 text-muted-foreground text-sm">
									{potion.effects.map((effect) => (
										<li key={effect.icon} className="flex items-center gap-2">
											<img
												src={`/potion/effect/${effect.icon}.png`}
												alt=""
												width={18}
												height={18}
												className="size-[18px] [image-rendering:pixelated]"
											/>
											{effect.name}
											{summary.level &&
												potion.effects &&
												potion.effects.length === 1 &&
												` ${summary.level}`}
											<span className="text-foreground">({summary.time})</span>
										</li>
									))}
								</ul>
							) : (
								<p className="mt-1 text-muted-foreground text-sm">
									No effect, used as a base for other potions.
								</p>
							)}
							{potion.detail && (
								<p className="mt-1 text-muted-foreground text-xs">{potion.detail}</p>
							)}
						</div>
					</div>

					<ol className="divide-y rounded border">
						{steps.map((step, i) => (
							<li key={`${step.output.name}-${i}`} className="space-y-2 p-3">
								<p className="text-muted-foreground text-xs">
									{i + 1}. {step.kind === "brew" ? "Brewing stand" : "Crafting table"}
								</p>
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<span className="flex items-center gap-2">
										<PotionIcon color={step.input.icon.color} form={step.input.icon.form} />
										{step.input.name}
									</span>
									<PlusIcon className="size-4 text-muted-foreground" />
									<span className="flex items-center gap-2">
										{step.ingredients.length === 1 ? (
											<>
												<ItemIcon icons={icons} item={step.ingredients[0]} />
												{step.amount ? `${step.amount} × ` : ""}
												{ingredientName(step.ingredients[0])}
											</>
										) : (
											<span className="flex flex-wrap items-center gap-1">
												{step.ingredients.map((item) => (
													<Tooltip key={item}>
														<TooltipTrigger
															aria-label={ingredientName(item)}
															className="rounded-sm p-0.5 hover:bg-accent"
														>
															<ItemIcon icons={icons} item={item} className="size-7" />
														</TooltipTrigger>
														<TooltipContent>{ingredientName(item)}</TooltipContent>
													</Tooltip>
												))}
											</span>
										)}
									</span>
									<ArrowRightIcon className="size-4 text-muted-foreground" />
									<span className="flex items-center gap-2">
										<PotionIcon color={step.output.icon.color} form={step.output.icon.form} />
										{step.output.name}
									</span>
								</div>
								{step.ingredients.length > 1 && (
									<p className="text-muted-foreground text-xs">
										Any one of these ingredients works.
									</p>
								)}
							</li>
						))}
						{steps.length === 0 && (
							<li className="p-3 text-muted-foreground text-sm">Nothing to brew.</li>
						)}
					</ol>

					{potion.note && <p className="text-muted-foreground text-xs">Tip: {potion.note}</p>}

					<Heading
						aside={
							<span className="text-muted-foreground text-sm">
								{needed.brews} {needed.brews === 1 ? "brew" : "brews"} per step
							</span>
						}
					>
						Ingredients
					</Heading>
					<ul className="divide-y rounded border">
						<li className="flex items-center gap-3 px-3 py-1.5">
							<PotionIcon color="#385dc6" form="potion" />
							<span className="flex-1 text-sm">Water Bottle</span>
							<span className="text-sm tabular-nums">×{bottles}</span>
						</li>
						{needed.items.map(({ item, count }) => (
							<li key={item} className="flex items-center gap-3 px-3 py-1.5">
								<ItemIcon icons={icons} item={item} />
								<span className="flex-1 text-sm">{ingredientName(item)}</span>
								<span className="text-sm tabular-nums">×{count}</span>
							</li>
						))}
						{needed.operations > 0 && (
							<li className="flex items-center gap-3 px-3 py-1.5">
								<ItemIcon icons={icons} item="blaze_powder" />
								<span className="flex-1 text-sm">
									Blaze Powder{" "}
									<span className="text-muted-foreground text-xs">(fuel, 20 brews each)</span>
								</span>
								<span className="text-sm tabular-nums">×{needed.fuel}</span>
							</li>
						)}
						<li className="flex items-center gap-3 px-3 py-1.5 text-muted-foreground text-xs">
							<ItemIcon icons={icons} item="brewing_stand" className="size-6" />
							A brewing stand makes up to 3 bottles at once.
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}

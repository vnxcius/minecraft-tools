import { ArrowRight as ArrowRightIcon, Plus as PlusIcon } from "pixelarticons/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	canEnhance,
	canExtend,
	effectName,
	effectSummary,
	FORMS,
	type Form,
	fullName,
	ingredientName,
	PICKABLE,
	potency,
	potionById,
	potionDetail,
	potionName,
	potionNote,
	recipe,
	totals,
	type Upgrade,
} from "@/lib/potions";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { useI18n } from "@/i18n";
import { rich } from "@/i18n/rich";
import { cn } from "@/lib/utils";
import PotionIcon from "./potion-icon";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

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
			<h3 className="text-sm text-muted-foreground">{label}</h3>
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
							"tile bg-secondary px-3 pt-1.5 pb-2 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40",
							value === option.id &&
								"border-primary bg-primary/25 hover:border-primary hover:bg-primary/35",
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
	const { t, tn, itemName } = useI18n();

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
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("potion.potion")}</Heading>

					<div className="flex flex-wrap gap-0.5 rounded border p-3">
						{PICKABLE.map((p) => (
							<Tooltip key={p.id}>
								<TooltipTrigger
									aria-label={potionName(p)}
									aria-pressed={p.id === potionId}
									onClick={() => setPotionId(p.id)}
									className={cn(
										"flex size-11 items-center justify-center rounded-sm hover:bg-accent",
										p.id === potionId && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
									)}
								>
									<PotionIcon color={p.color} form="potion" className="size-8" />
								</TooltipTrigger>
								<TooltipContent>{potionName(p)}</TooltipContent>
							</Tooltip>
						))}
					</div>

					<Heading>{t("potion.options")}</Heading>
					<div className="space-y-4 rounded border p-3">
						<Segmented
							label={t("potion.upgrade")}
							value={upgrade}
							onChange={setUpgrade}
							options={[
								{ id: "none", name: t("potion.upgrade.none") },
								{
									id: "extended",
									name: t("potion.upgrade.extended"),
									disabled: !canExtend(potion),
								},
								{
									id: "enhanced",
									name: potion.enhanced
										? t("potion.upgrade.enhancedLevel", { level: potency(potion.enhanced.level) })
										: t("potion.upgrade.enhanced"),
									disabled: !canEnhance(potion),
								},
							]}
						/>
						<Segmented
							label={t("potion.form")}
							value={form}
							onChange={setForm}
							options={FORMS.map((f) => ({
								id: f.id,
								name: itemName(f.item),
								disabled: f.id === "arrow" && !hasEffect,
							}))}
						/>
						<div className="space-y-2 space-x-2">
							<label htmlFor="bottles" className="text-sm text-muted-foreground">
								{form === "arrow" ? t("potion.lingeringForArrows") : t("potion.bottles")}
							</label>
							<Input
								id="bottles"
								type="number"
								min={1}
								max={999}
								inputMode="numeric"
								className="w-14"
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
					<Heading>{t("potion.recipe")}</Heading>

					<div className="flex items-center gap-4 rounded border bg-card p-4">
						<PotionIcon color={finished.color} form={finished.form} className="size-14" />
						<div className="min-w-0">
							<p className="font-semibold">{fullName(potion, upgrade, form)}</p>
							{summary && potion.effects ? (
								<ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
									{potion.effects.map((effect) => (
										<li key={effect.icon} className="flex items-center gap-2">
											<img
												src={`/potion/effect/${effect.icon}.png`}
												alt=""
												width={18}
												height={18}
												className="size-4.5 pixelated"
											/>
											{effectName(effect)}
											{summary.level &&
												potion.effects &&
												potion.effects.length === 1 &&
												` ${summary.level}`}
											<span className="text-foreground">({summary.time})</span>
										</li>
									))}
								</ul>
							) : (
								<p className="mt-1 text-sm text-muted-foreground">{t("potion.noEffect")}</p>
							)}
							{potion.detail && (
								<p className="mt-1 text-xs text-muted-foreground">{potionDetail(potion)}</p>
							)}
						</div>
					</div>

					<ol className="divide-y rounded border">
						{steps.map((step, i) => (
							<li key={`${step.output.name}-${i}`} className="space-y-2 p-3">
								<p className="text-xs text-muted-foreground">
									{i + 1}. {itemName(step.kind === "brew" ? "brewing_stand" : "crafting_table")}
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
									<p className="text-xs text-muted-foreground">{t("potion.anyIngredient")}</p>
								)}
							</li>
						))}
						{steps.length === 0 && (
							<li className="p-3 text-sm text-muted-foreground">{t("potion.nothingToBrew")}</li>
						)}
					</ol>

					{potion.note && (
						<p className="text-xs text-muted-foreground">
							{rich(t("potion.tip"), { text: potionNote(potion) })}
						</p>
					)}

					<Heading
						aside={
							<span className="text-sm text-muted-foreground">
								{tn("potion.brewsPerStep", needed.brews)}
							</span>
						}
					>
						{t("potion.ingredients")}
					</Heading>
					<ul className="divide-y rounded border">
						<li className="flex items-center gap-3 px-3 py-1.5">
							<PotionIcon color="#385dc6" form="potion" />
							<span className="flex-1 text-sm">{potionName(potionById("water"))}</span>
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
									{itemName("blaze_powder")}{" "}
									<span className="text-xs text-muted-foreground">{t("potion.fuel")}</span>
								</span>
								<span className="text-sm tabular-nums">×{needed.fuel}</span>
							</li>
						)}
						<li className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted-foreground">
							<ItemIcon icons={icons} item="brewing_stand" className="size-6" />
							{t("potion.standCapacity")}
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}

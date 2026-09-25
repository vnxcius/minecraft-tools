import { useMemo, useState } from "react";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";
import { type Book, type Piece, penalty, planOrder, TOO_EXPENSIVE } from "@/lib/anvil";
import {
	ENCHANTABLE,
	enchantmentById,
	enchantmentName,
	excludes,
	GEAR,
	GIVE_ITEM,
	GROUPS,
	gearById,
	gearName,
	groupName,
	levelName,
	levelOf,
} from "@/lib/enchantments";
import { cn } from "@/lib/utils";

interface Props {
	icons: Record<string, string>;
}

function label({ enchantment, level }: Book) {
	const name = enchantmentName(enchantment);
	return enchantmentById(enchantment).max === 1 ? name : `${name} ${levelName(level)}`;
}

function PieceView({ piece, item, icons }: { piece: Piece; item: string; icons: Props["icons"] }) {
	const { itemName } = useI18n();
	return (
		<span className="flex min-w-0 items-start gap-2">
			{piece.item ? (
				<ItemIcon icons={icons} item={item} className="size-7" />
			) : (
				// the CDN only has enchanted book variants, the site keeps a plain one
				<img src="/tools/enchanted_book.png" alt="" width={28} height={28} className="size-7" />
			)}
			<span className="min-w-0 text-xs leading-snug">
				{piece.item && <span className="block font-semibold">{itemName(item)}</span>}
				{piece.books.map((book) => (
					<span key={book.enchantment} className="block text-[#8a5cf5] dark:text-[#b8a2ff]">
						{label(book)}
					</span>
				))}
			</span>
		</span>
	);
}

export default function EnchantOrder({ icons }: Props) {
	const { t, tn } = useI18n();
	const [gearId, setGearId] = useState("sword");
	const [levels, setLevels] = useState<Record<string, number>>(() => bestBuild("sword"));
	const [uses, setUses] = useState(0);

	const gear = gearById(gearId);
	const item = GIVE_ITEM[gear.id];
	const books = useMemo(
		() =>
			ENCHANTABLE[gearId]
				.filter((id) => levels[id])
				.map((id) => ({ enchantment: id, level: levels[id] })),
		[gearId, levels],
	);
	const plan = useMemo(() => planOrder(books, uses), [books, uses]);
	const tooExpensive = plan ? plan.steps.findIndex((s) => s.cost >= TOO_EXPENSIVE) : -1;

	const pickGear = (id: string) => {
		setGearId(id);
		setLevels(bestBuild(id));
	};
	const toggle = (id: string) =>
		setLevels((prev) => {
			const next = { ...prev };
			if (next[id]) delete next[id];
			else next[id] = enchantmentById(id).max;
			return next;
		});

	return (
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("enchant.item")}</Heading>
					<div className="space-y-3 rounded border p-3">
						{GROUPS.map((group) => (
							<div key={group} className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{groupName(group)}</h3>
								<div className="flex flex-wrap gap-1">
									{GEAR.filter((g) => g.group === group).map((g) => (
										<Tooltip key={g.id}>
											<TooltipTrigger
												aria-label={gearName(g)}
												aria-pressed={g.id === gearId}
												onClick={() => pickGear(g.id)}
												className={cn(
													"flex size-11 items-center justify-center rounded-sm hover:bg-accent",
													g.id === gearId &&
														"bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
												)}
											>
												<ItemIcon icons={icons} item={g.icon} className="size-8" />
											</TooltipTrigger>
											<TooltipContent>{gearName(g)}</TooltipContent>
										</Tooltip>
									))}
								</div>
							</div>
						))}
					</div>

					<Heading
						aside={
							<Button variant="outline" size="sm" onClick={() => setLevels(bestBuild(gearId))}>
								{t("order.useBest")}
							</Button>
						}
					>
						{t("enchant.enchantments")}
					</Heading>
					<ul className="divide-y rounded border">
						{ENCHANTABLE[gearId].map((id) => {
							const { max } = enchantmentById(id);
							const clash = Object.keys(levels).find((other) => excludes(id, other));
							return (
								<li
									key={id}
									className={cn("flex items-center gap-2 px-3 py-1.5", clash && "opacity-50")}
								>
									<Checkbox
										id={`order-${id}`}
										checked={Boolean(levels[id])}
										disabled={Boolean(clash)}
										onCheckedChange={() => toggle(id)}
									/>
									<label htmlFor={`order-${id}`} className="min-w-0 flex-1 text-sm">
										{enchantmentName(id)}
										{clash && (
											<span className="block text-xs text-muted-foreground">
												{t("order.excludedBy", { name: enchantmentName(clash) })}
											</span>
										)}
									</label>
									{max > 1 && levels[id] ? (
										<div
											role="radiogroup"
											aria-label={enchantmentName(id)}
											className="flex gap-0.5"
										>
											{Array.from({ length: max }, (_, i) => i + 1).map((level) => (
												<button
													key={level}
													type="button"
													role="radio"
													aria-checked={levels[id] === level}
													onClick={() => setLevels((prev) => ({ ...prev, [id]: level }))}
													className={cn(
														"min-w-7 tile bg-secondary px-1 pt-0.5 pb-1 text-xs hover:bg-accent",
														levels[id] === level &&
															"border-primary bg-primary/25 hover:border-primary",
													)}
												>
													{levelName(level)}
												</button>
											))}
										</div>
									) : null}
								</li>
							);
						})}
					</ul>

					<div className="flex items-center justify-between gap-3 rounded border p-3 text-sm">
						<label htmlFor="order-uses">{t("order.uses")}</label>
						<select
							id="order-uses"
							value={uses}
							onChange={(event) => setUses(Number(event.target.value))}
							className="h-8 border border-input bg-card px-2"
						>
							{[0, 1, 2, 3, 4, 5].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							plan && (
								<span className="text-sm text-muted-foreground">
									{tn("order.total", plan.total)}
								</span>
							)
						}
					>
						{t("order.steps")}
					</Heading>

					{!plan ? (
						<p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
							{t("order.empty")}
						</p>
					) : (
						<>
							{tooExpensive >= 0 && (
								<p className="border-2 border-destructive/60 bg-destructive/10 p-3 text-sm">
									{t("order.tooExpensive", { step: tooExpensive + 1 })}
								</p>
							)}
							<ol className="divide-y rounded border">
								{plan.steps.map((step, i) => (
									<li
										// every book is sacrificed exactly once
										key={step.right.books.map((b) => b.enchantment).join()}
										className={cn(
											"grid grid-cols-[1.5rem_1fr_auto_1fr_auto] items-center gap-2 p-3",
											step.cost >= TOO_EXPENSIVE && "bg-destructive/10",
										)}
									>
										<span className="text-sm text-muted-foreground">{i + 1}.</span>
										<PieceView piece={step.left} item={item} icons={icons} />
										<span className="text-muted-foreground">+</span>
										<PieceView piece={step.right} item={item} icons={icons} />
										<span
											className={cn(
												"text-right text-sm font-semibold whitespace-nowrap tabular-nums",
												step.cost >= TOO_EXPENSIVE ? "text-destructive" : "text-brand",
											)}
										>
											{tn("order.levels", step.cost)}
										</span>
									</li>
								))}
							</ol>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{t("order.hint", { next: penalty(plan.uses) })}
							</p>
						</>
					)}
				</div>
			</div>
		</section>
	);
}

/** the levels of the first build of the Best Enchantments guide for this gear */
function bestBuild(gearId: string): Record<string, number> {
	const [build] = gearById(gearId).builds;
	return Object.fromEntries(build.picks.map((pick) => [pick.id, levelOf(pick)]));
}

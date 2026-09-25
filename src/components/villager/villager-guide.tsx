import { useState } from "react";
import PotionIcon from "@/components/potion/potion-icon";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { Input } from "@/components/ui/input";
import { type MessageKey, fold, useI18n } from "@/i18n";
import { potionById } from "@/lib/potions";
import { cn } from "@/lib/utils";
import {
	ALL_TRADES,
	BOOK_ENCHANTMENTS,
	bookPrice,
	DOUBLE_PRICE,
	levelName,
	PROFESSIONS,
	price,
	professionLabel,
	professionName,
	searchText,
	type Stack,
	stackName,
	type Trade,
	type TradeGroup,
	variantName,
	WANDERING_TRADER,
} from "@/lib/villagers";

interface Props {
	icons: Record<string, string>;
}

const MERCHANTS = [...PROFESSIONS.map((p) => p.id), "wandering_trader"];
const workstation = (id: string) =>
	PROFESSIONS.find((p) => p.id === id)?.workstation ?? "wandering_trader_spawn_egg";

function StackIcon({ stack, trade, icons }: { stack: Stack; trade: Trade; icons: Props["icons"] }) {
	if (stack.item === "potion" && trade.potion) {
		const potion = potionById(trade.potion.replace(/^(long|strong)_/, ""));
		return <PotionIcon color={potion?.color ?? "#385dc6"} form="potion" className="size-7" />;
	}
	// explorer maps and the plain book have no icon of their own in the catalog
	if (stack.item.endsWith("_map") && !icons[stack.item])
		return <ItemIcon icons={icons} item="filled_map" className="size-7" />;
	if (stack.item === "enchanted_book")
		return <img src="/tools/enchanted_book.png" alt="" width={28} height={28} className="size-7" />;
	return <ItemIcon icons={icons} item={stack.item} className="size-7" />;
}

function StackView({
	stack,
	trade,
	icons,
	count,
}: {
	stack: Stack;
	trade: Trade;
	icons: Props["icons"];
	count?: string;
}) {
	const shown = count ?? (stack.count > 1 ? String(stack.count) : "");
	return (
		<span className="flex min-w-0 items-center gap-1.5">
			<StackIcon stack={stack} trade={trade} icons={icons} />
			<span className="min-w-0 text-sm leading-tight">
				{shown && <b className="tabular-nums">{shown} × </b>}
				{stackName(stack, trade)}
			</span>
		</span>
	);
}

function TradeRow({ trade, icons }: { trade: Trade; icons: Props["icons"] }) {
	const { t } = useI18n();
	const [min, max] = price(trade);
	const priced = trade.kind === "book" || trade.kind === "enchanted";
	const notes = [
		trade.kind && t(`villager.kind.${trade.kind}` as MessageKey),
		trade.kind === "enchanted" &&
			trade.levels &&
			t("villager.enchantLevels", { min: trade.levels[0], max: trade.levels[1] }),
		trade.variants && t("villager.onlyFrom", { types: trade.variants.map(variantName).join(", ") }),
	].filter(Boolean);
	return (
		<li className="flex flex-col gap-1 px-3 py-2">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<StackView
					stack={trade.wants}
					trade={trade}
					icons={icons}
					count={priced ? `${min}–${max}` : undefined}
				/>
				{trade.also && (
					<>
						<span className="text-muted-foreground">+</span>
						<StackView stack={trade.also} trade={trade} icons={icons} />
					</>
				)}
				<span className="text-muted-foreground">→</span>
				<StackView stack={trade.gives} trade={trade} icons={icons} />
			</div>
			{(notes.length > 0 || trade.maxUses || trade.xp) && (
				<p className="text-xs text-muted-foreground">
					{[
						...notes,
						trade.maxUses && t("villager.maxUses", { count: trade.maxUses }),
						trade.xp && t("villager.xp", { count: trade.xp }),
					]
						.filter(Boolean)
						.join(" · ")}
				</p>
			)}
		</li>
	);
}

function Group({
	title,
	group,
	icons,
}: {
	title: string;
	group: TradeGroup;
	icons: Props["icons"];
}) {
	const { t } = useI18n();
	return (
		<section className="flex flex-col gap-1.5">
			<Heading
				aside={
					<span className="text-sm text-muted-foreground">
						{t("villager.picks", { amount: group.amount, count: group.trades.length })}
					</span>
				}
			>
				{title}
			</Heading>
			<ul className="divide-y rounded border">
				{group.trades.map((trade) => (
					<TradeRow key={trade.id} trade={trade} icons={icons} />
				))}
			</ul>
		</section>
	);
}

function BookTable() {
	const { t, term } = useI18n();
	return (
		<section className="flex flex-col gap-1.5">
			<Heading>{t("villager.books")}</Heading>
			<div className="space-y-3 rounded border p-3 text-sm">
				<table className="w-full text-left">
					<thead className="text-xs text-muted-foreground">
						<tr>
							<th className="py-1 font-normal">{t("villager.bookLevel")}</th>
							<th className="py-1 font-normal">{t("villager.bookPrice")}</th>
							<th className="py-1 font-normal">{t("villager.bookTreasurePrice")}</th>
						</tr>
					</thead>
					<tbody className="tabular-nums">
						{[1, 2, 3, 4, 5].map((level) => (
							<tr key={level} className="border-t">
								<td className="py-1">{term(`enchantment.level.${level}`)}</td>
								<td className="py-1">{bookPrice(level, false).join("–")}</td>
								<td className="py-1">{bookPrice(level, true).join("–")}</td>
							</tr>
						))}
					</tbody>
				</table>
				<p className="text-xs leading-relaxed text-muted-foreground">
					{t("villager.booksHint")}{" "}
					{BOOK_ENCHANTMENTS.map((id, i) => (
						<span key={id}>
							{i > 0 && ", "}
							<span className="text-[#8a5cf5] dark:text-[#b8a2ff]">
								{term(`enchantment.minecraft.${id}`)}
							</span>
							{DOUBLE_PRICE.has(id) && " (×2)"}
						</span>
					))}
				</p>
			</div>
		</section>
	);
}

export default function VillagerGuide({ icons }: Props) {
	const { t, itemName } = useI18n();
	const [merchant, setMerchant] = useState("librarian");
	const [query, setQuery] = useState("");

	// about 400 trades: searched on every keystroke, in the language shown
	const words = fold(query.trim()).split(/\s+/).filter(Boolean);
	const found = words.length
		? ALL_TRADES.filter(({ trade }) => {
				const text = searchText(trade);
				return words.every((word) => text.includes(word));
			}).slice(0, 40)
		: [];

	const profession = PROFESSIONS.find((p) => p.id === merchant);

	return (
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("villager.find")}</Heading>
					<div className="space-y-2">
						<Input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={t("villager.findPlaceholder")}
							aria-label={t("villager.find")}
						/>
						{query.trim() && (
							<ul className="max-h-96 divide-y overflow-y-auto rounded border">
								{found.length === 0 && (
									<li className="p-3 text-sm text-muted-foreground">{t("villager.noMatch")}</li>
								)}
								{found.map(({ merchant: id, level, trade }) => (
									<li key={`${id}-${trade.id}`}>
										<button
											type="button"
											onClick={() => setMerchant(id)}
											className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
										>
											<StackIcon stack={trade.gives} trade={trade} icons={icons} />
											<span className="min-w-0 text-sm">
												<span className="block">
													{trade.gives.item === "emerald"
														? t("villager.buys", { item: stackName(trade.wants, trade) })
														: t("villager.sells", { item: stackName(trade.gives, trade) })}
												</span>
												<span className="block text-xs text-muted-foreground">
													{professionLabel(id)}
													{level && ` · ${levelName(level)}`}
												</span>
											</span>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<Heading>{t("villager.merchants")}</Heading>
					<div className="grid grid-cols-2 gap-1 rounded border p-2">
						{MERCHANTS.map((id) => (
							<button
								key={id}
								type="button"
								aria-pressed={merchant === id}
								onClick={() => setMerchant(id)}
								className={cn(
									"flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
									merchant === id && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
								)}
							>
								<ItemIcon icons={icons} item={workstation(id)} className="size-6" />
								{professionLabel(id)}
							</button>
						))}
					</div>

					<div className="space-y-2 rounded border p-3 text-sm">
						<h3 className="font-bold">{t("villager.tips")}</h3>
						<ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed">
							<li>{t("villager.tipCycling")}</li>
							<li>{t("villager.tipCuring")}</li>
							<li>{t("villager.tipRestock")}</li>
						</ul>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-5">
					<div className="flex items-center gap-3 rounded border bg-card p-3">
						<ItemIcon icons={icons} item={workstation(merchant)} className="size-12" />
						<div>
							<p className="text-lg font-bold">{professionName(merchant)}</p>
							<p className="text-sm text-muted-foreground">
								{profession
									? t("villager.workstation", { block: itemName(profession.workstation) })
									: t("villager.wanderingHint")}
							</p>
						</div>
					</div>

					{profession
						? profession.levels.map((group) => (
								<Group
									key={group.level}
									title={levelName(group.level as number)}
									group={group}
									icons={icons}
								/>
							))
						: WANDERING_TRADER.map((group) => (
								<Group
									key={group.id}
									title={t(`villager.set.${group.id}` as MessageKey)}
									group={group}
									icons={icons}
								/>
							))}

					{merchant === "librarian" && <BookTable />}
				</div>
			</div>
		</section>
	);
}

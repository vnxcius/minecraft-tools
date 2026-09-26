import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Eye as EyeIcon, EyeOff as EyeOffIcon } from "pixelarticons/react";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type MessageKey, useI18n } from "@/i18n";
import {
	type Era,
	ERAS,
	ITEM_TYPES,
	type ItemType,
	itemsOfType,
	MAX_SHELVES,
	slotCosts,
	splitItem,
} from "@/lib/enchanting";
import type { OddsRequest, OddsResponse } from "@/lib/enchanting.worker";
import { enchantmentName, groupName, levelName } from "@/lib/enchantments";
import { cn } from "@/lib/utils";

interface Props {
	icons: Record<string, string>;
}

// three.js is large: the viewer arrives after the rest of the page
const EnchantingViewer = lazy(() => import("./enchanting-viewer"));

/** whether the 3D view is shown, remembered in this browser */
const VIEWER_KEY = "enchanting-table.viewer";

function loadViewer() {
	try {
		return localStorage.getItem(VIEWER_KEY) !== "hidden";
	} catch {
		return true;
	}
}

function saveViewer(shown: boolean) {
	try {
		if (shown) localStorage.removeItem(VIEWER_KEY);
		else localStorage.setItem(VIEWER_KEY, "hidden");
	} catch {
		// private mode or storage disabled: the choice just is not remembered
	}
}

const BOOK = "minecraft:book";
const LATEST = ERAS.length - 1;

/** what the odds are for: one of the three slots, or a level cost picked by hand */
type Target = { slot: 0 | 1 | 2 } | { level: number };

interface Result {
	enchantments: Map<string, number>;
	counts: number[];
}

let worker: Worker | null = null;
let nextId = 0;
const waiting = new Map<number, (response: OddsResponse) => void>();

/** one worker for the page, the odds of a book take a moment the first time */
function ask(request: Omit<OddsRequest, "id">) {
	worker ??= new Worker(new URL("../../lib/enchanting.worker.ts", import.meta.url), {
		type: "module",
	});
	worker.onmessage = ({ data }: MessageEvent<OddsResponse>) => {
		waiting.get(data.id)?.(data);
		waiting.delete(data.id);
	};
	const id = nextId++;
	return new Promise<OddsResponse>((resolve) => {
		waiting.set(id, resolve);
		worker?.postMessage({ id, ...request });
	});
}

/** the odds for a question; the last answer stays while a new one is worked out */
function useOdds(era: number, item: string, costs: number[]) {
	const [result, setResult] = useState<{ key: string; odds: Result | null }>({
		key: "",
		odds: null,
	});
	const key = `${era}|${item}|${costs.join()}`;
	const latest = useRef(key);
	useEffect(() => {
		latest.current = key;
		ask({ era, item, costs }).then((response) => {
			// a newer question was asked meanwhile
			if (latest.current !== key) return;
			setResult({
				key,
				odds: response.enchantments
					? { enchantments: new Map(response.enchantments), counts: response.counts ?? [] }
					: null,
			});
		});
	}, [key, era, item, costs]);
	return { odds: result.odds, loading: result.key !== key };
}

const eraName = (era: Era, t: ReturnType<typeof useI18n>["t"]) =>
	era.to === null
		? t("table.versionAndNewer", { version: era.from })
		: era.from === era.to
			? era.from
			: t("table.versionRange", { from: era.from, to: era.to });

/** the representative item of a kind: the diamond one when there is one */
function typeItem(era: Era, type: ItemType) {
	const items = itemsOfType(era, type);
	return items.find((id) => id.includes("diamond")) ?? items.at(-1);
}

export default function EnchantingTable({ icons }: Props) {
	const { t, tn, itemName, language } = useI18n();
	const [eraIndex, setEraIndex] = useState(LATEST);
	const era = ERAS[eraIndex];
	const [item, setItem] = useState("minecraft:diamond_sword");
	const [shelves, setShelves] = useState(MAX_SHELVES);
	const [target, setTarget] = useState<Target>({ slot: 2 });
	const [viewer, setViewer] = useState(loadViewer);
	const toggleViewer = () => {
		setViewer(!viewer);
		saveViewer(!viewer);
	};

	// an item the version picked does not have falls back to the same kind, or a book
	const current = era.items[item]
		? item
		: (itemsOfType(era, splitItem(item)?.type ?? "book").at(-1) ?? BOOK);
	const type = splitItem(current)?.type ?? "book";
	const materials = itemsOfType(era, type);
	const info = era.items[current];

	const slots = useMemo(() => slotCosts(shelves), [shelves]);
	const costs = useMemo(() => {
		if ("slot" in target) return slots[target.slot];
		const dist = Array.from({ length: target.level + 1 }, () => 0);
		dist[target.level] = 1;
		return dist;
	}, [slots, target]);
	const empty = "slot" in target ? (slots[target.slot][0] ?? 0) : 0;
	const { odds, loading } = useOdds(eraIndex, current, costs);

	const percent = useMemo(
		() =>
			new Intl.NumberFormat(language, {
				style: "percent",
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			}),
		[language],
	);
	const show = (p: number | undefined) =>
		!p ? "—" : p < 0.0005 ? `<${percent.format(0.001)}` : percent.format(p);

	const pool = current === BOOK ? Object.keys(era.enchantments) : info.enchantments;
	const rows = pool
		.map((id) => ({ id, total: odds?.enchantments.get(id) ?? 0 }))
		.sort(
			(a, b) =>
				b.total - a.total ||
				enchantmentName(strip(a.id)).localeCompare(enchantmentName(strip(b.id))),
		);
	const maxLevel = Math.max(...pool.map((id) => era.enchantments[id].costs.length));

	const slotName = (slot: 0 | 1 | 2) => t(`table.slot.${slot}` as MessageKey);

	return (
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("table.setup")}</Heading>
					<div className="space-y-4 rounded border p-3">
						<div className="space-y-2">
							<label htmlFor="table-version" className="block text-sm text-muted-foreground">
								{t("table.version")}
							</label>
							<Select
								value={String(eraIndex)}
								onValueChange={(value) => value !== null && setEraIndex(Number(value))}
							>
								<SelectTrigger id="table-version" className="w-full">
									<SelectValue>{(value: string) => eraName(ERAS[Number(value)], t)}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{ERAS.map((e, i) => (
										<SelectItem key={e.from} value={String(i)}>
											{eraName(e, t)}
										</SelectItem>
									)).reverse()}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-3 gap-x-2 gap-y-3">
							{ITEM_TYPES.map(({ group, types }) => {
								const present = types.filter((ty) => typeItem(era, ty));
								if (!present.length) return null;
								return (
									<div key={group} className="min-w-0 space-y-1">
										<h3 className="truncate text-sm text-muted-foreground">{groupName(group)}</h3>
										<div className="flex flex-wrap gap-0.5">
											{present.map((ty) => {
												const shown = typeItem(era, ty) as string;
												const name =
													ty === "book"
														? itemName("book")
														: ty === "spear"
															? t("table.spear")
															: t(`enchant.gear.${ty}` as MessageKey);
												return (
													<Tooltip key={ty}>
														<TooltipTrigger
															aria-label={name}
															aria-pressed={ty === type}
															onClick={() => setItem(shown)}
															className={cn(
																"flex size-11 items-center justify-center rounded-sm hover:bg-accent",
																ty === type &&
																	"bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
															)}
														>
															<ItemIcon icons={icons} item={strip(shown)} className="size-8" />
														</TooltipTrigger>
														<TooltipContent>{name}</TooltipContent>
													</Tooltip>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>

						{materials.length > 1 && (
							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("table.material")}</h3>
								<div className="flex flex-wrap gap-1">
									{materials.map((id) => (
										<Tooltip key={id}>
											<TooltipTrigger
												aria-label={itemName(strip(id))}
												aria-pressed={id === current}
												onClick={() => setItem(id)}
												className={cn(
													"flex size-11 items-center justify-center rounded-sm hover:bg-accent",
													id === current && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
												)}
											>
												<ItemIcon icons={icons} item={strip(id)} className="size-8" />
											</TooltipTrigger>
											<TooltipContent>
												{itemName(strip(id))} ·{" "}
												{t("table.enchantability", { value: era.items[id].enchantability })}
											</TooltipContent>
										</Tooltip>
									))}
								</div>
							</div>
						)}

						<p className="flex items-center gap-2 text-sm">
							<ItemIcon icons={icons} item={strip(current)} className="size-6" />
							<span className="font-semibold">{itemName(strip(current))}</span>
							<span className="text-muted-foreground">
								· {t("table.enchantability", { value: info.enchantability })}
							</span>
						</p>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<label
									htmlFor="table-shelves"
									className="flex items-center gap-2 text-sm text-muted-foreground"
								>
									<ItemIcon icons={icons} item="bookshelf" className="size-6" />
									{t("table.shelves")}
								</label>
								<span className="font-pixel tabular-nums">{shelves}</span>
							</div>
							<input
								id="table-shelves"
								type="range"
								min={0}
								max={MAX_SHELVES}
								value={shelves}
								onChange={(event) => setShelves(Number(event.target.value))}
								className="w-full accent-primary"
							/>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{t("table.shelvesHint", { max: MAX_SHELVES })}
							</p>
						</div>
					</div>

					<Heading>{t("table.slots")}</Heading>
					<div role="radiogroup" aria-label={t("table.slots")} className="space-y-1.5">
						{([0, 1, 2] as const).map((slot) => (
							<SlotCard
								key={slot}
								name={slotName(slot)}
								costs={slots[slot]}
								selected={"slot" in target && target.slot === slot}
								onSelect={() => setTarget({ slot })}
								show={show}
							/>
						))}
						<div
							className={cn(
								"flex items-center gap-3 rounded border p-3",
								"level" in target && "border-primary bg-primary/10",
							)}
						>
							<button
								type="button"
								role="radio"
								aria-checked={"level" in target}
								onClick={() => setTarget({ level: "level" in target ? target.level : 30 })}
								className="flex items-center gap-2 text-left text-sm font-semibold"
							>
								<img
									src="/villager/xp_orb.png"
									alt=""
									width={16}
									height={16}
									className="size-5 pixelated"
								/>
								{t("table.exact")}
							</button>
							<input
								type="range"
								min={1}
								max={30}
								aria-label={t("table.exact")}
								value={"level" in target ? target.level : 30}
								onChange={(event) => setTarget({ level: Number(event.target.value) })}
								className="min-w-0 flex-1 accent-primary"
							/>
							<span className="w-8 text-right font-pixel tabular-nums">
								{"level" in target ? target.level : 30}
							</span>
						</div>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							<Button variant="outline" size="sm" aria-expanded={viewer} onClick={toggleViewer}>
								{viewer ? <EyeOffIcon /> : <EyeIcon />}
								{viewer ? t("table.hideViewer") : t("table.showViewer")}
							</Button>
						}
					>
						{t("table.viewer")}
					</Heading>
					{/* hidden, the viewer is not mounted at all: no WebGL, no animation */}
					{viewer && (
						<Suspense fallback={<div className="h-100 rounded border bg-viewer" />}>
							<EnchantingViewer item={strip(current)} shelves={shelves} className="h-100" />
						</Suspense>
					)}

					<Heading
						aside={
							loading && (
								<span className="text-sm text-muted-foreground">{t("table.computing")}</span>
							)
						}
					>
						{"slot" in target
							? t("table.oddsSlot", { slot: slotName(target.slot), count: shelves })
							: t("table.oddsLevel", { level: target.level })}
					</Heading>

					{empty > 0 && (
						<p className="rounded border border-dashed p-3 text-sm text-muted-foreground">
							{t("table.emptyNote", { chance: show(empty) })}
						</p>
					)}

					<div className={cn("overflow-x-auto rounded border", loading && "opacity-60")}>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-xs text-muted-foreground">
									<th className="px-3 py-2 font-normal">{t("table.enchantment")}</th>
									{Array.from({ length: maxLevel }, (_, i) => (
										<th key={i} className="hidden px-1.5 py-2 text-right font-normal sm:table-cell">
											{levelName(i + 1)}
										</th>
									))}
									<th className="px-3 py-2 text-right font-normal">{t("table.anyLevel")}</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{rows.map(({ id, total }) => {
									const levels = era.enchantments[id].costs.length;
									return (
										<tr key={id} className={cn(!total && odds && "text-muted-foreground")}>
											<td className="px-3 py-1.5">
												<span className="flex items-center gap-2">
													<img
														src="/tools/enchanted_book.png"
														alt=""
														width={20}
														height={20}
														className={cn(
															"size-5 pixelated",
															!total && odds && "opacity-40 grayscale",
														)}
													/>
													<span className={cn("font-pixel", total || !odds ? "enchant-glint" : "")}>
														{enchantmentName(strip(id))}
													</span>
												</span>
												{/* on a narrow screen the levels go under the name instead of in columns */}
												<span className="block text-xs text-muted-foreground tabular-nums sm:hidden">
													{Array.from({ length: levels }, (_, i) => {
														const p = odds?.enchantments.get(`${id} ${i + 1}`);
														return p ? `${levelName(i + 1)} ${show(p)}` : null;
													})
														.filter(Boolean)
														.join(" · ")}
												</span>
											</td>
											{Array.from({ length: maxLevel }, (_, i) => (
												<td
													key={i}
													className="hidden px-1.5 py-1.5 text-right tabular-nums sm:table-cell"
												>
													{i < levels && (
														<Chance p={odds?.enchantments.get(`${id} ${i + 1}`)} show={show} />
													)}
												</td>
											))}
											<td className="px-3 py-1.5 text-right">
												<Chance p={total} show={show} strong />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{odds && (
						<div className="space-y-1.5 rounded border p-3 text-sm">
							<h3 className="text-muted-foreground">{t("table.count")}</h3>
							<ul className="flex flex-wrap gap-x-4 gap-y-1">
								{odds.counts.map((p, n) =>
									n > 0 && p >= 0.0005 ? (
										<li key={n}>
											{tn("table.enchantments", n)}:{" "}
											<span className="font-semibold tabular-nums">{show(p)}</span>
										</li>
									) : null,
								)}
							</ul>
						</div>
					)}

					<p className="text-xs leading-relaxed text-muted-foreground">
						{current === BOOK && `${t("table.bookNote")} `}
						{t("table.hint")}
					</p>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{t("table.javaOnly", { first: ERAS[0].from })}
					</p>
				</div>
			</div>
		</section>
	);
}

const strip = (id: string) => id.replace(/^minecraft:/, "");

/**
 * A chance, on a tint of the brand green that deepens with it (one hue, light to strong), so the
 * likely enchantments stand out; the number itself stays in the text color.
 */
function Chance({
	p,
	show,
	strong,
}: {
	p?: number;
	show: (p: number) => string;
	strong?: boolean;
}) {
	if (!p) return <span className="text-muted-foreground">{show(0)}</span>;
	// square root: small chances still get a visible tint
	const tint = Math.round(8 + Math.sqrt(Math.min(p, 1)) * 52);
	return (
		<span
			className={cn(
				"inline-block min-w-12 px-1.5 py-0.5 text-right tabular-nums",
				strong && "font-semibold",
			)}
			style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${tint}%, transparent)` }}
		>
			{show(p)}
		</span>
	);
}

/** a slot: its level range and how likely each level is, as small bars */
function SlotCard({
	name,
	costs,
	selected,
	onSelect,
	show,
}: {
	name: string;
	costs: number[];
	selected: boolean;
	onSelect: () => void;
	show: (p: number) => string;
}) {
	const { t } = useI18n();
	const levels = costs.map((p, cost) => ({ cost, p })).filter((c) => c.cost > 0 && c.p > 0);
	const min = levels[0]?.cost ?? 0;
	const max = levels.at(-1)?.cost ?? 0;
	const top = Math.max(...levels.map((l) => l.p));
	const empty = costs[0] ?? 0;
	return (
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			onClick={onSelect}
			className={cn(
				"flex w-full items-center gap-3 rounded border p-3 text-left hover:bg-accent/50",
				selected && "border-primary bg-primary/10 hover:bg-primary/15",
			)}
		>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold">{name}</span>
				<span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
					<img
						src="/villager/xp_orb.png"
						alt=""
						width={16}
						height={16}
						className="size-3.5 pixelated"
					/>
					{/* the level green of the table's buttons in the game, darker on a light page */}
					<span className="font-medium text-green-600 dark:text-[#80ff20]">
						{min === max ? t("table.level", { level: min }) : t("table.levels", { min, max })}
					</span>
					{empty > 0 && ` · ${t("table.empty", { chance: show(empty) })}`}
				</span>
			</span>
			<span className="flex h-8 items-end gap-0.5" aria-hidden>
				{levels.map(({ cost, p }) => (
					<span
						key={cost}
						title={`${t("table.level", { level: cost })}: ${show(p)}`}
						className="flex h-full w-1.5 items-end"
					>
						<span
							className="block w-full rounded-t-sm bg-primary"
							style={{ height: `${Math.max((p / top) * 100, 6)}%` }}
						/>
					</span>
				))}
			</span>
		</button>
	);
}

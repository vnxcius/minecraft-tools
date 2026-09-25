/**
 * Odds of the enchanting table (Java Edition), worked out exactly instead of simulated.
 *
 * 1. Each slot gets a level cost from the bookshelves (capped at 15):
 *    base = 1 + rand(0..7) + shelves / 2 + rand(0..shelves); top = max(base / 3, 1),
 *    middle = base * 2 / 3 + 1, bottom = max(base, shelves * 2). A slot whose cost is below its
 *    number (1, 2, 3) stays empty.
 * 2. The cost is raised by the item's enchantability: cost + 1 + rand(0..e/4) + rand(0..e/4), then
 *    scaled by 1 + (randFloat + randFloat - 1) * 0.15 (a triangular spread of ±15%) and rounded.
 * 3. Every enchantment the item takes gets its highest level whose cost range holds that value.
 *    One is picked by weight; then, while rand(0..49) <= value, the ones that conflict with the
 *    last pick are dropped, another is picked, and the value is halved.
 * 4. A book loses one of its enchantments at random when it got more than one.
 *
 * Verified against the game's own code (EnchantmentHelper, EnchantmentMenu) of every supported
 * version, see scripts/sync-enchanting.ts. Source: https://minecraft.wiki/w/Enchanting_table_mechanics
 */
import data from "@/data/enchanting.json";

interface EnchantmentInfo {
	weight: number;
	/** [min, max] cost of each level, from level 1 */
	costs: [number, number][];
	/** enchantments that cannot be on the same item */
	incompatible: string[];
}

interface ItemInfo {
	enchantability: number;
	/** enchantments the table can put on it; a book takes all of them */
	enchantments: string[];
}

export interface Era {
	/** first and last game version it covers; `to` is null for the latest */
	from: string;
	to: string | null;
	enchantments: Record<string, EnchantmentInfo>;
	items: Record<string, ItemInfo>;
}

export const ERAS = (data as unknown as { eras: Era[] }).eras;

export const MAX_SHELVES = 15;

/** probability of each value, index = value */
type Dist = number[];

function add(dist: Dist, value: number, p: number) {
	while (dist.length <= value) dist.push(0);
	dist[value] += p;
}

/**
 * Level cost of each slot (0 = top) for a number of bookshelves; index 0 of the result is the
 * chance of the slot being empty.
 */
export function slotCosts(shelves: number): [Dist, Dist, Dist] {
	const b = Math.min(Math.max(shelves, 0), MAX_SHELVES);
	const slots: [Dist, Dist, Dist] = [[], [], []];
	const p = 1 / (8 * (b + 1));
	for (let r1 = 0; r1 < 8; r1++) {
		for (let r2 = 0; r2 <= b; r2++) {
			const base = 1 + r1 + (b >> 1) + r2;
			const costs = [
				Math.max(Math.floor(base / 3), 1),
				Math.floor((base * 2) / 3) + 1,
				Math.max(base, b * 2),
			];
			costs.forEach((cost, slot) => add(slots[slot], cost < slot + 1 ? 0 : cost, p));
		}
	}
	return slots;
}

/** chance that (u1 + u2 - 1) falls below t, for u1, u2 uniform in [0, 1): a triangle on [-1, 1) */
function triangleBelow(t: number) {
	if (t <= -1) return 0;
	if (t >= 1) return 1;
	return t <= 0 ? (1 + t) ** 2 / 2 : 1 - (1 - t) ** 2 / 2;
}

/** the value the enchantments are picked with, for a level cost and the item's enchantability */
export function enchantValues(cost: number, enchantability: number): Dist {
	const dist: Dist = [];
	const spread = Math.floor(enchantability / 4) + 1;
	const p = 1 / (spread * spread);
	for (let a = 0; a < spread; a++) {
		for (let b = 0; b < spread; b++) {
			const level = cost + 1 + a + b;
			// Math.round(level * (1 + f)) = k  <=>  (k - 0.5) / level - 1 <= f < (k + 0.5) / level - 1
			const low = Math.max(1, Math.floor(level * 0.85));
			const high = Math.ceil(level * 1.15) + 1;
			for (let k = low; k <= high; k++) {
				const f = (x: number) => triangleBelow((x / level - 1) / 0.15);
				const chance = k === 1 ? f(1.5) : f(k + 0.5) - f(k - 0.5);
				if (chance > 0) add(dist, k, p * chance);
			}
		}
	}
	return dist;
}

export interface Candidate {
	id: string;
	level: number;
	weight: number;
}

/** the enchantments on offer at a value: each one at its highest level whose range holds it */
export function candidates(era: Era, item: string, value: number): Candidate[] {
	const ids =
		item === "minecraft:book" ? Object.keys(era.enchantments) : era.items[item].enchantments;
	const out: Candidate[] = [];
	for (const id of ids) {
		const info = era.enchantments[id];
		for (let level = info.costs.length; level >= 1; level--) {
			const [min, max] = info.costs[level - 1];
			if (value >= min && value <= max) {
				out.push({ id, level, weight: info.weight });
				break;
			}
		}
	}
	return out;
}

export interface Odds {
	/** chance of each enchantment, by "id level" and by id alone (any level) */
	enchantments: Map<string, number>;
	/** chance of ending up with 0, 1, 2... enchantments */
	counts: Dist;
}

/**
 * A path less likely than this stops picking right there instead of being followed: books have
 * dozens of candidates, and following every path would take seconds. The total chance moved this
 * way changes no chance by more than 0.01 percentage points (see tests/enchanting.test.ts).
 */
export const PRUNE = { value: 1e-8 };

/** candidates are kept as bits of two numbers: 0-25 in the low one, 26-51 in the high one */
const HALF = 26;
const bitLo = (i: number) => (i < HALF ? 1 << i : 0);
const bitHi = (i: number) => (i < HALF ? 0 : 1 << (i - HALF));

/** calls `fn` with the index of every bit set in a pair of halves */
function eachBit(lo: number, hi: number, fn: (i: number) => void) {
	for (let bits = lo; bits; bits &= bits - 1) fn(31 - Math.clz32(bits & -bits));
	for (let bits = hi; bits; bits &= bits - 1) fn(HALF + 31 - Math.clz32(bits & -bits));
}

/**
 * Odds for one value: a walk over the sets of picked enchantments, one pick at a time. What is
 * left to pick depends only on what was picked, so paths that picked the same set in another
 * order merge into one state.
 */
export function pickOdds(era: Era, item: string, value: number, fromTable = true): Odds {
	const pool = candidates(era, item, value);
	// the table takes one of a book's enchantments away when it got several
	const book = fromTable && item === "minecraft:book";
	const result: Odds = { enchantments: new Map(), counts: [] };
	const n = pool.length;
	if (!n) {
		result.counts[0] = 1;
		return result;
	}
	if (n > HALF * 2) throw new Error(`${n} candidates, at most ${HALF * 2} are supported`);
	const weight = pool.map((c) => c.weight);
	// what picking i takes out of the running: itself and what conflicts with it
	const blockLo: number[] = [];
	const blockHi: number[] = [];
	pool.forEach((c, i) => {
		let lo = bitLo(i);
		let hi = bitHi(i);
		pool.forEach((o, j) => {
			if (
				era.enchantments[c.id].incompatible.includes(o.id) ||
				era.enchantments[o.id].incompatible.includes(c.id)
			) {
				lo |= bitLo(j);
				hi |= bitHi(j);
			}
		});
		blockLo.push(lo);
		blockHi.push(hi);
	});

	const chance = new Float64Array(n);
	const finish = (lo: number, hi: number, picks: number, mass: number) => {
		// a book keeps all but one of several enchantments, each one lost as likely as the others
		const cut = book && picks > 1;
		add(result.counts, cut ? picks - 1 : picks, mass);
		const kept = cut ? (mass * (picks - 1)) / picks : mass;
		eachBit(lo, hi, (i) => (chance[i] += kept));
	};

	// the states of one round, side by side: picked set, set still open, its weight, chance
	type Round = {
		pLo: number[];
		pHi: number[];
		oLo: number[];
		oHi: number[];
		total: number[];
		mass: number[];
	};
	const round = (): Round => ({ pLo: [], pHi: [], oLo: [], oHi: [], total: [], mass: [] });
	let states = round();
	states.pLo.push(0);
	states.pHi.push(0);
	states.oLo.push((2 ** Math.min(n, HALF) - 1) | 0);
	states.oHi.push(n > HALF ? (2 ** (n - HALF) - 1) | 0 : 0);
	states.total.push(weight.reduce((a, b) => a + b, 0));
	states.mass.push(1);

	let current = value;
	for (let picks = 0; states.mass.length; picks++) {
		const next = round();
		const index = new Map<number, number>();
		const goOn = Math.min(current + 1, 50) / 50;
		for (let s = 0; s < states.mass.length; s++) {
			const { pLo, pHi, oLo, oHi } = {
				pLo: states.pLo[s],
				pHi: states.pHi[s],
				oLo: states.oLo[s],
				oHi: states.oHi[s],
			};
			const total = states.total[s];
			let mass = states.mass[s];
			if (picks > 0) {
				// the loop only goes on while rand(0..49) <= value, and ends when nothing is left
				if (total === 0) {
					finish(pLo, pHi, picks, mass);
					continue;
				}
				finish(pLo, pHi, picks, mass * (1 - goOn));
				mass *= goOn;
			}
			eachBit(oLo, oHi, (i) => {
				const m = (mass * weight[i]) / total;
				const lo = pLo | bitLo(i);
				const hi = pHi | bitHi(i);
				const key = hi * 2 ** HALF + lo;
				const known = index.get(key);
				if (known !== undefined) {
					next.mass[known] += m;
					return;
				}
				if (m < PRUNE.value) {
					// too unlikely to follow: this path ends with this pick
					finish(lo, hi, picks + 1, m);
					return;
				}
				const openLo = oLo & ~blockLo[i];
				const openHi = oHi & ~blockHi[i];
				let left = total;
				eachBit(oLo & blockLo[i], oHi & blockHi[i], (j) => (left -= weight[j]));
				index.set(key, next.mass.length);
				next.pLo.push(lo);
				next.pHi.push(hi);
				next.oLo.push(openLo);
				next.oHi.push(openHi);
				next.total.push(Math.abs(left) < 1e-9 ? 0 : left);
				next.mass.push(m);
			});
		}
		// the value is only halved from the second pick on
		if (picks > 0) current = Math.floor(current / 2);
		states = next;
	}

	pool.forEach(({ id, level }, i) => {
		result.enchantments.set(`${id} ${level}`, chance[i]);
		result.enchantments.set(id, (result.enchantments.get(id) ?? 0) + chance[i]);
	});
	return result;
}

/** mixes odds by the chance of each value */
function mix(parts: { odds: Odds; weight: number }[]): Odds {
	const out: Odds = { enchantments: new Map(), counts: [] };
	for (const { odds, weight } of parts) {
		for (const [key, p] of odds.enchantments)
			out.enchantments.set(key, (out.enchantments.get(key) ?? 0) + p * weight);
		odds.counts.forEach((p, n) => add(out.counts, n, p * weight));
	}
	return out;
}

/**
 * Odds of a slot showing a given level cost. `cache` keeps the odds of each value between calls
 * for the same item; `fromTable` false leaves out the table's rule for books.
 */
export function costOdds(
	era: Era,
	item: string,
	cost: number,
	cache = new Map<number, Odds>(),
	fromTable = true,
): Odds {
	const values = enchantValues(cost, itemEnchantability(era, item));
	return mix(
		values.flatMap((weight, value) => {
			if (!weight) return [];
			let odds = cache.get(value);
			if (!odds) cache.set(value, (odds = pickOdds(era, item, value, fromTable)));
			return [{ odds, weight }];
		}),
	);
}

const itemEnchantability = (era: Era, item: string) => era.items[item]?.enchantability ?? 0;

/** kinds of item the table enchants, grouped like the Best Enchantments guide */
export const ITEM_TYPES = [
	{ group: "Armor", types: ["helmet", "chestplate", "leggings", "boots"] },
	{ group: "Melee", types: ["sword", "spear", "axe", "mace"] },
	{ group: "Tools", types: ["pickaxe", "shovel", "hoe", "fishing_rod"] },
	{ group: "Ranged", types: ["bow", "crossbow", "trident"] },
	{ group: "Other", types: ["book"] },
] as const;

export type ItemType = (typeof ITEM_TYPES)[number]["types"][number];

/** weakest to strongest, the order the materials are offered in */
const MATERIALS = [
	"leather",
	"chainmail",
	"turtle",
	"wooden",
	"stone",
	"copper",
	"iron",
	"golden",
	"diamond",
	"netherite",
];

const TYPES: readonly string[] = ITEM_TYPES.flatMap((g) => g.types);

/** the kind of item and its material: "minecraft:golden_helmet" -> helmet, golden */
export function splitItem(id: string): { type: ItemType; material: string | null } | null {
	const name = id.replace(/^minecraft:/, "");
	if (TYPES.includes(name)) return { type: name as ItemType, material: null };
	const type = TYPES.find((t) => name.endsWith(`_${t}`));
	return type ? { type: type as ItemType, material: name.slice(0, -type.length - 1) } : null;
}

/** the items of a kind in a version, weakest material first */
export function itemsOfType(era: Era, type: ItemType) {
	const rank = (id: string) => MATERIALS.indexOf(splitItem(id)?.material ?? "");
	return Object.keys(era.items)
		.filter((id) => splitItem(id)?.type === type)
		.sort((a, b) => rank(a) - rank(b));
}

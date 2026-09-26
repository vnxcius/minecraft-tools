/**
 * Cheapest order to put enchanted books on an item in an anvil (Java Edition).
 *
 * A step costs the value of the sacrificed (right) book, the level times the enchantment's book
 * multiplier summed over its enchantments, plus the prior work penalty (2^uses - 1) of both sides.
 * The result has been used one more time than the most used side. A step of 40 levels or more is
 * "Too Expensive!" in Survival. Every way to pair the books up is tried (dynamic programming over
 * subsets), which stays instant for the handful of books an item takes.
 * Source: https://minecraft.wiki/w/Anvil_mechanics
 */

/** multiplier of an enchantment when it comes from a book */
const BOOK_MULTIPLIER: Record<string, number> = {
	protection: 1,
	fire_protection: 1,
	feather_falling: 1,
	blast_protection: 2,
	projectile_protection: 1,
	thorns: 4,
	respiration: 2,
	depth_strider: 2,
	aqua_affinity: 2,
	sharpness: 1,
	smite: 1,
	bane_of_arthropods: 1,
	knockback: 1,
	fire_aspect: 2,
	looting: 2,
	sweeping_edge: 2,
	efficiency: 1,
	silk_touch: 4,
	unbreaking: 1,
	fortune: 2,
	power: 1,
	punch: 2,
	flame: 2,
	infinity: 4,
	luck_of_the_sea: 2,
	lure: 2,
	frost_walker: 2,
	mending: 2,
	impaling: 2,
	riptide: 2,
	loyalty: 1,
	channeling: 4,
	multishot: 2,
	piercing: 1,
	quick_charge: 1,
	soul_speed: 4,
	swift_sneak: 4,
	wind_burst: 2,
	density: 1,
	breach: 2,
	lunge: 1,
};

export const TOO_EXPENSIVE = 40;

export const penalty = (uses: number) => 2 ** uses - 1;

export interface Book {
	enchantment: string;
	level: number;
}

/** what sits in a slot: the item, or a book carrying one or more enchantments */
export interface Piece {
	item: boolean;
	books: Book[];
	uses: number;
}

interface Step {
	left: Piece;
	right: Piece;
	cost: number;
}

export interface Plan {
	steps: Step[];
	total: number;
	/** the most expensive step, over 39 means the plan cannot be done in Survival */
	max: number;
	/** anvil uses of the finished item */
	uses: number;
}

interface Node {
	piece: Piece;
	value: number;
	cost: number;
	max: number;
	steps: Step[];
}

function merge(left: Node, right: Node): Node {
	const cost = right.value + penalty(left.piece.uses) + penalty(right.piece.uses);
	const piece: Piece = {
		item: left.piece.item,
		books: [...left.piece.books, ...right.piece.books],
		uses: Math.max(left.piece.uses, right.piece.uses) + 1,
	};
	return {
		piece,
		value: left.value + right.value,
		cost: left.cost + right.cost + cost,
		max: Math.max(left.max, right.max, cost),
		steps: [...left.steps, ...right.steps, { left: left.piece, right: right.piece, cost }],
	};
}

/** plans that are allowed come first, then the cheapest, then the gentlest step */
function better(a: Node, b: Node | undefined) {
	if (!b) return true;
	const okA = a.max < TOO_EXPENSIVE;
	const okB = b.max < TOO_EXPENSIVE;
	if (okA !== okB) return okA;
	return a.cost !== b.cost ? a.cost < b.cost : a.max < b.max;
}

/** best node per number of uses: fewer uses can pay off later, so each is kept */
type Front = Map<number, Node>;

function keep(front: Front, node: Node) {
	if (better(node, front.get(node.piece.uses))) front.set(node.piece.uses, node);
}

/** cheapest way to apply `books` (one enchantment each) to an item used `itemUses` times before */
export function planOrder(books: Book[], itemUses = 0): Plan | null {
	const n = books.length;
	if (n === 0) return null;
	const full = (1 << n) - 1;

	// every subset of books merged into a single book
	const bookFronts: Front[] = Array.from({ length: 1 << n }, () => new Map());
	books.forEach((book, i) => {
		const value = book.level * (BOOK_MULTIPLIER[book.enchantment] ?? 1);
		keep(bookFronts[1 << i], {
			piece: { item: false, books: [book], uses: 0 },
			value,
			cost: 0,
			max: 0,
			steps: [],
		});
	});
	for (let mask = 1; mask <= full; mask++) {
		if ((mask & (mask - 1)) === 0) continue;
		// every split into a left and a right part (both orders)
		for (let left = (mask - 1) & mask; left > 0; left = (left - 1) & mask) {
			const right = mask ^ left;
			for (const a of bookFronts[left].values())
				for (const b of bookFronts[right].values()) keep(bookFronts[mask], merge(a, b));
		}
	}

	// the item takes merged books one at a time, in any grouping
	const itemFronts: Front[] = Array.from({ length: 1 << n }, () => new Map());
	keep(itemFronts[0], {
		piece: { item: true, books: [], uses: itemUses },
		value: 0,
		cost: 0,
		max: 0,
		steps: [],
	});
	for (let mask = 1; mask <= full; mask++) {
		for (let part = mask; part > 0; part = (part - 1) & mask) {
			for (const a of itemFronts[mask ^ part].values())
				for (const b of bookFronts[part].values()) keep(itemFronts[mask], merge(a, b));
		}
	}

	let best: Node | undefined;
	for (const node of itemFronts[full].values()) if (better(node, best)) best = node;
	if (!best) return null;
	return { steps: best.steps, total: best.cost, max: best.max, uses: best.piece.uses };
}

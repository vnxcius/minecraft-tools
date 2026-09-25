/**
 * Villager trades, extracted from the game by `bun run villagers:sync`. Prices of enchanted items and
 * books are worked out by the game when the offer is made; the rules below are from
 * https://minecraft.wiki/w/Trading and the librarian and weaponsmith pages.
 */
import data from "@/data/villagers.json";
import { fold, itemName, t, term } from "@/i18n";

export interface Stack {
	item: string;
	count: number;
}

/** one thing a random trade can come out as */
export type Option =
	/** levels: lowest and highest it can have; max: the enchantment's max level (1 has no numeral) */
	| { type: "enchantment"; id: string; levels: number[]; max: number }
	| { type: "dye"; id: string }
	/** a suspicious stew effect and its seconds */
	| { type: "effect"; id: string; seconds: number }
	/** the potion of a tipped arrow, e.g. "long_swiftness" */
	| { type: "potion"; id: string };

export interface Trade {
	id: string;
	wants: Stack;
	also?: Stack;
	gives: Stack;
	maxUses?: number;
	xp?: number;
	kind?: "book" | "enchanted" | "dyed" | "map" | "stew" | "tipped" | "potion";
	levels?: number[];
	/** every way the random part can turn out: enchantments, dyes, stew effects or arrow potions */
	options?: Option[];
	/** how many dyes a "dyed" item is mixed from */
	dyes?: number[];
	potion?: string;
	variants?: string[];
}

export interface TradeGroup {
	/** 1 to 5, or the wandering trader's set */
	level?: number;
	id?: string;
	/** how many of the trades a merchant gets, picked at random */
	amount: number;
	trades: Trade[];
}

export interface Profession {
	id: string;
	workstation: string;
	levels: TradeGroup[];
}

export const PROFESSIONS = data.professions as Profession[];
export const WANDERING_TRADER = data.wanderingTrader as TradeGroup[];
export const BOOK_ENCHANTMENTS = data.books.tradeable;
export const DOUBLE_PRICE = new Set(data.books.double);

/** the max of the emerald stack a trade can ask for */
const CAP = 64;

/** emeralds a librarian asks for a book of `level`: 2 + 3L to 6 + 13L, twice for treasures */
export function bookPrice(level: number, treasure: boolean): [number, number] {
	const factor = treasure ? 2 : 1;
	return [Math.min((2 + 3 * level) * factor, CAP), Math.min((6 + 13 * level) * factor, CAP)];
}

/** emerald price of a trade: a range for enchanted items and books, else the stack count */
export function price(trade: Trade): [number, number] {
	if (trade.kind === "book") return [bookPrice(1, false)[0], CAP];
	if (trade.kind === "enchanted" && trade.levels) {
		const [min, max] = trade.levels;
		return [Math.min(trade.wants.count + min, CAP), Math.min(trade.wants.count + max, CAP)];
	}
	return [trade.wants.count, trade.wants.count];
}

export const professionName = (id: string) =>
	id === "wandering_trader"
		? term("entity.minecraft.wandering_trader")
		: term(`entity.minecraft.villager.${id}`);

/**
 * The profession name, plus its job site block when another profession has the same name
 * (Brazilian Portuguese calls both the armorer and the weaponsmith "Armeiro").
 */
export function professionLabel(id: string) {
	const name = professionName(id);
	const profession = PROFESSIONS.find((p) => p.id === id);
	const shared = PROFESSIONS.some((p) => p.id !== id && professionName(p.id) === name);
	return shared && profession ? `${name} (${itemName(profession.workstation)})` : name;
}

export const levelName = (level: number) => term(`merchant.level.${level}`);

/** villager types are named after their biome; "snow" is the snowy plains */
export const variantName = (variant: string) =>
	term(`biome.minecraft.${variant === "snow" ? "snowy_plains" : variant}`);

/** a tipped arrow's name for a potion id: "long_swiftness" is Arrow of Swiftness (Extended) */
function arrowName(potion: string) {
	const name = term(`item.minecraft.tipped_arrow.effect.${potion.replace(/^(long|strong)_/, "")}`);
	if (potion.startsWith("long_")) return t("potion.extendedName", { name });
	return potion.startsWith("strong_") ? `${name} II` : name;
}

/** the name of an option, as the chip shows it */
export function optionName(option: Option) {
	switch (option.type) {
		case "enchantment":
			return term(`enchantment.minecraft.${option.id}`);
		case "dye":
			return itemName(`${option.id}_dye`);
		case "effect":
			return term(`effect.minecraft.${option.id}`);
		case "potion":
			return arrowName(option.id);
	}
}

/** the name the item has in game; potions carry their own */
export function stackName(stack: Stack, trade: Trade) {
	if (stack.item === "potion" && trade.potion) {
		const potion = trade.potion.replace(/^(long|strong)_/, "");
		const name = term(`item.minecraft.potion.effect.${potion}`);
		return trade.potion.startsWith("long_") ? t("potion.extendedName", { name }) : name;
	}
	return itemName(stack.item);
}

/** every trade of every merchant, with who offers it, for the search */
export const ALL_TRADES = [
	...PROFESSIONS.flatMap((profession) =>
		profession.levels.flatMap((group) =>
			group.trades.map((trade) => ({ merchant: profession.id, level: group.level, trade })),
		),
	),
	...WANDERING_TRADER.flatMap((group) =>
		group.trades.map((trade) => ({ merchant: "wandering_trader", level: undefined, trade })),
	),
];

/** words a trade can be found by: its items, and every enchantment for a librarian's book */
export function searchText(trade: Trade) {
	const words = [trade.wants, trade.also, trade.gives]
		.filter((stack): stack is Stack => Boolean(stack))
		.map((stack) => stackName(stack, trade));
	if (trade.kind === "book")
		words.push(...BOOK_ENCHANTMENTS.map((id) => term(`enchantment.minecraft.${id}`)));
	for (const option of trade.options ?? []) words.push(optionName(option));
	return fold(words.join(" "));
}

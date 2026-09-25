/**
 * Villager and wandering trader trades from the official client jar (trades are data files since
 * 26.x: data/minecraft/villager_trade, trade_set and the villager_trade tags).
 *
 *   bun run villagers:sync            # latest release
 *   bun run villagers:sync 26.3       # a specific version
 *
 * Writes src/data/villagers.json and the XP orb icon public/villager/xp_orb.png. Run lang:sync
 * afterwards, it names every item the trades use.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";
import { openClientJar, resolveVersion } from "./lib/jar";

/** the job site block of each profession (hard-coded in the game) */
const WORKSTATIONS: Record<string, string> = {
	armorer: "blast_furnace",
	butcher: "smoker",
	cartographer: "cartography_table",
	cleric: "brewing_stand",
	farmer: "composter",
	fisherman: "barrel",
	fletcher: "fletching_table",
	leatherworker: "cauldron",
	librarian: "lectern",
	mason: "stonecutter",
	shepherd: "loom",
	toolsmith: "smithing_table",
	weaponsmith: "grindstone",
};

/**
 * Enchantability of the items sold enchanted. It is part of the item's code, not of the data files;
 * values from https://minecraft.wiki/w/Enchanting_mechanics
 */
const ENCHANTABILITY: Record<string, number> = {
	iron_sword: 14,
	iron_axe: 14,
	iron_pickaxe: 14,
	iron_shovel: 14,
	diamond_sword: 10,
	diamond_axe: 10,
	diamond_pickaxe: 10,
	diamond_shovel: 10,
	diamond_helmet: 10,
	diamond_chestplate: 10,
	diamond_leggings: 10,
	diamond_boots: 10,
	bow: 1,
	crossbow: 1,
	fishing_rod: 1,
};

/** the colors set_random_dyes picks from: every dye */
const DYES = [
	"white",
	"orange",
	"magenta",
	"light_blue",
	"yellow",
	"lime",
	"pink",
	"gray",
	"light_gray",
	"cyan",
	"purple",
	"blue",
	"brown",
	"green",
	"red",
	"black",
];

type Json = Record<string, unknown>;

/** one thing a random trade can come out as */
type Option =
	/** levels: lowest and highest it can have; max: the enchantment's max level (1 has no numeral) */
	| { type: "enchantment"; id: string; levels: [number, number]; max: number }
	| { type: "dye"; id: string }
	/** a suspicious stew effect and its seconds */
	| { type: "effect"; id: string; seconds: number }
	/** the potion of a tipped arrow, e.g. "long_swiftness" */
	| { type: "potion"; id: string };
interface Stack {
	item: string;
	count: number;
}
interface Trade {
	id: string;
	wants: Stack;
	also?: Stack;
	gives: Stack;
	maxUses?: number;
	xp?: number;
	/** how the game fills the item in */
	kind?: "book" | "enchanted" | "dyed" | "map" | "stew" | "tipped" | "potion";
	/** enchanting level of "enchanted" items, added to the emerald price */
	levels?: [number, number];
	/** every way the random part can turn out: enchantments, dyes, stew effects or arrow potions */
	options?: Option[];
	/** how many dyes a "dyed" item is mixed from */
	dyes?: [number, number];
	/** potion of a "potion" trade, or of the water bottle a trade wants */
	potion?: string;
	/** only villagers of these types (biomes) offer it */
	variants?: string[];
}

const strip = (id: string) => id.replace(/^minecraft:/, "");

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const ORB = "textures/entity/experience/experience_orb.png";
const jar = await openClientJar(
	version,
	(path) => path === ORB,
	(path) =>
		path.startsWith("villager_trade/") ||
		path.startsWith("trade_set/") ||
		path.startsWith("tags/villager_trade/") ||
		path.startsWith("tags/enchantment/") ||
		path.startsWith("tags/item/") ||
		path.startsWith("tags/potion/") ||
		path.startsWith("enchantment/"),
);

/** entries of a tag, nested tags resolved */
function tag(dir: string, id: string): string[] {
	const { values } = jar.dataJson<{ values: string[] }>(`tags/${dir}/${strip(id)}.json`);
	return values.flatMap((value) =>
		value.startsWith("#") ? tag(dir, value.slice(1)) : [strip(value)],
	);
}

/** items of an item field: an id, a #tag or a list of ids */
function items(value: unknown): Set<string> {
	const list = [value ?? []].flat() as string[];
	return new Set(list.flatMap((v) => (v.startsWith("#") ? tag("item", v.slice(1)) : [strip(v)])));
}

interface Cost {
	base: number;
	per_level_above_first: number;
}
interface EnchantmentData {
	max_level: number;
	min_cost: Cost;
	max_cost: Cost;
	primary_items?: unknown;
	supported_items: unknown;
}
const cost = (c: Cost, level: number) => c.base + c.per_level_above_first * (level - 1);

/**
 * What enchanting `item` at a level in [min, max] can give, like an enchanting table: the level gets
 * up to 2 × ⌊enchantability / 4⌋ + 1 added and ±15%, every enchantment the item is a primary item of
 * takes its highest level whose cost window holds the result, and each extra enchantment is picked
 * at half the cost before.
 */
function possibleEnchantments(item: string, options: string, [min, max]: [number, number]) {
	const enchantability = ENCHANTABILITY[item];
	if (enchantability === undefined) throw new Error(`No enchantability for ${item}`);
	const bonus = 2 * Math.floor(enchantability / 4);
	const low = Math.max(1, Math.round((min + 1) * 0.85));
	const high = Math.round((max + 1 + bonus) * 1.15);
	const costs = new Set<number>();
	for (let c = low; c <= high; c++) for (let h = c; h > 0; h = Math.floor(h / 2)) costs.add(h);

	const result: Option[] = [];
	for (const id of tag("enchantment", options.slice(1))) {
		const data = jar.dataJson<EnchantmentData>(`enchantment/${id}.json`);
		if (!items(data.primary_items ?? data.supported_items).has(item)) continue;
		const levels: number[] = [];
		for (const c of costs) {
			for (let level = data.max_level; level >= 1; level--) {
				if (c >= cost(data.min_cost, level) && c <= cost(data.max_cost, level)) {
					levels.push(level);
					break;
				}
			}
		}
		if (levels.length)
			result.push({
				type: "enchantment",
				id,
				levels: [Math.min(...levels), Math.max(...levels)],
				max: data.max_level,
			});
	}
	return result;
}

/** lowest and highest value of a number provider */
function range(value: unknown): [number, number] {
	if (typeof value === "number") return [value, value];
	const provider = value as Json;
	switch (provider.type) {
		case "minecraft:uniform":
			return [provider.min as number, provider.max as number];
		case "minecraft:binomial":
			return [0, provider.n as number];
		case "minecraft:add":
			return (provider.inputs as unknown[])
				.map(range)
				.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
		default:
			throw new Error(`Unknown number provider ${String(provider.type)}`);
	}
}

function stack(value: Json | undefined): Stack {
	return { item: strip(value?.id as string), count: (value?.count as number) ?? 1 };
}

function trade(id: string): Trade {
	const data = jar.dataJson<Json>(`villager_trade/${id}.json`);
	const result: Trade = { id, wants: stack(data.wants as Json), gives: stack(data.gives as Json) };
	if (data.additional_wants) result.also = stack(data.additional_wants as Json);
	if (typeof data.max_uses === "number") result.maxUses = data.max_uses;
	if (typeof data.xp === "number") result.xp = data.xp;

	const wantsPotion = (data.wants as Json).components as Json | undefined;
	if (wantsPotion)
		result.potion = strip((wantsPotion["minecraft:potion_contents"] as Json).potion as string);

	const modifiers = [data.given_item_modifier ?? []].flat() as Json[];
	for (const modifier of modifiers) {
		switch (modifier.type) {
			case "minecraft:enchant_randomly":
				result.kind = "book";
				// any enchantment of the list, at any of its levels
				result.options = tag("enchantment", (modifier.options as string).slice(1)).map(
					(enchantment) => {
						const { max_level: max } = jar.dataJson<EnchantmentData>(
							`enchantment/${enchantment}.json`,
						);
						return { type: "enchantment", id: enchantment, levels: [1, max], max };
					},
				);
				break;
			case "minecraft:enchant_with_levels": {
				const levels = modifier.levels as Json;
				result.kind = "enchanted";
				result.levels = [levels.min as number, levels.max as number];
				result.options = possibleEnchantments(
					result.gives.item,
					modifier.options as string,
					result.levels,
				);
				break;
			}
			case "minecraft:set_random_dyes":
				result.kind = "dyed";
				result.dyes = range(modifier.number_of_dyes);
				result.options = DYES.map((dye) => ({ type: "dye", id: dye }));
				break;
			case "minecraft:exploration_map":
				result.kind = "map";
				break;
			case "minecraft:set_stew_effect":
				result.kind = "stew";
				result.options = (modifier.effects as Json[]).map((effect) => ({
					type: "effect",
					id: strip(effect.type as string),
					seconds: range(effect.duration)[0],
				}));
				break;
			case "minecraft:set_random_potion":
				result.kind = "tipped";
				result.options = tag("potion", (modifier.options as string).slice(1)).map((potion) => ({
					type: "potion",
					id: potion,
				}));
				break;
			case "minecraft:set_potion":
				result.kind = "potion";
				result.potion = strip(modifier.id as string);
				break;
		}
	}

	const predicate = (data.merchant_predicate as Json | undefined)?.predicate as Json | undefined;
	const variants = (predicate?.["minecraft:predicates"] as Json | undefined)?.[
		"minecraft:villager/variant"
	];
	if (Array.isArray(variants)) result.variants = variants.map(strip);
	return result;
}

/** a trade set: how many offers the merchant gets from which trades */
function tradeSet(path: string) {
	const set = jar.dataJson<{ amount: number; trades: string }>(`trade_set/${path}.json`);
	const trades = tag("villager_trade", set.trades.slice(1)).map(trade);
	return { amount: Math.min(set.amount, trades.length), trades };
}

const professions = Object.entries(WORKSTATIONS).map(([id, workstation]) => ({
	id,
	workstation,
	levels: [1, 2, 3, 4, 5].map((level) => ({ level, ...tradeSet(`${id}/level_${level}`) })),
}));

const wanderingTrader = ["buying", "common", "uncommon"].map((set) => ({
	id: set,
	...tradeSet(`wandering_trader/${set}`),
}));

// the enchantments a librarian can sell, and the ones whose books cost twice as much
const books = {
	tradeable: tag("enchantment", "tradeable"),
	double: tag("enchantment", "double_trade_price"),
};

await writeFile(
	"src/data/villagers.json",
	`${JSON.stringify({ version, professions, wanderingTrader, books }, null, "\t")}\n`,
);
// the XP orb: the game draws a grey sprite sheet tinted lime, one orb of it tinted the same way
const sheet = PNG.sync.read(Buffer.from(jar.file(ORB)));
const orb = new PNG({ width: 16, height: 16 });
const TINT = [0.5, 1, 0.05];
for (let y = 0; y < 16; y++) {
	for (let x = 0; x < 16; x++) {
		const from = (y * sheet.width + 32 + x) * 4;
		const to = (y * 16 + x) * 4;
		for (let c = 0; c < 3; c++) orb.data[to + c] = Math.round(sheet.data[from + c] * TINT[c]);
		orb.data[to + 3] = sheet.data[from + 3];
	}
}
await mkdir("public/villager", { recursive: true });
await writeFile("public/villager/xp_orb.png", PNG.sync.write(orb));

const count = professions.reduce(
	(n, p) => n + p.levels.reduce((m, l) => m + l.trades.length, 0),
	0,
);
console.log(
	`Villagers: ${professions.length} professions, ${count} trades; wandering trader: ${wanderingTrader.reduce((n, s) => n + s.trades.length, 0)} trades; ${books.tradeable.length} book enchantments.`,
);

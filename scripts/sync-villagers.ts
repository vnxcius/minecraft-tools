/**
 * Villager and wandering trader trades from the official client jar (trades are data files since
 * 26.x: data/minecraft/villager_trade, trade_set and the villager_trade tags).
 *
 *   bun run villagers:sync            # latest release
 *   bun run villagers:sync 26.3       # a specific version
 *
 * Writes src/data/villagers.json. Run lang:sync afterwards, it names every item the trades use.
 */
import { writeFile } from "node:fs/promises";
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

type Json = Record<string, unknown>;
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
	/** potion of a "potion" trade, or of the water bottle a trade wants */
	potion?: string;
	/** only villagers of these types (biomes) offer it */
	variants?: string[];
}

const strip = (id: string) => id.replace(/^minecraft:/, "");

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const jar = await openClientJar(
	version,
	() => false,
	(path) =>
		path.startsWith("villager_trade/") ||
		path.startsWith("trade_set/") ||
		path.startsWith("tags/villager_trade/") ||
		path.startsWith("tags/enchantment/"),
);

/** entries of a tag, nested tags resolved */
function tag(dir: string, id: string): string[] {
	const { values } = jar.dataJson<{ values: string[] }>(`tags/${dir}/${strip(id)}.json`);
	return values.flatMap((value) =>
		value.startsWith("#") ? tag(dir, value.slice(1)) : [strip(value)],
	);
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
				break;
			case "minecraft:enchant_with_levels": {
				const levels = modifier.levels as Json;
				result.kind = "enchanted";
				result.levels = [levels.min as number, levels.max as number];
				break;
			}
			case "minecraft:set_random_dyes":
				result.kind = "dyed";
				break;
			case "minecraft:exploration_map":
				result.kind = "map";
				break;
			case "minecraft:set_stew_effect":
				result.kind = "stew";
				break;
			case "minecraft:set_random_potion":
				result.kind = "tipped";
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
const count = professions.reduce(
	(n, p) => n + p.levels.reduce((m, l) => m + l.trades.length, 0),
	0,
);
console.log(
	`Villagers: ${professions.length} professions, ${count} trades; wandering trader: ${wanderingTrader.reduce((n, s) => n + s.trades.length, 0)} trades; ${books.tradeable.length} book enchantments.`,
);

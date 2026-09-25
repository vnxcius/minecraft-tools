import versionsData from "@/data/versions.json";

export interface McVersion {
	id: string;
	source: string;
}

export interface Item {
	id: string;
	/** URL of the item icon on the mcitemgallery.com CDN */
	src: string;
}

const CDN = "https://mcitemgallery.com";

/** newest first */
export const versions: McVersion[] = versionsData;
export const latestVersion = versions[0];

// id -> icon folder, one lazily loaded chunk per version
const loaders = import.meta.glob<Record<string, string>>("../data/items/*.json", {
	import: "default",
});

/** items no survival player can get or place, so they have no place on a materials list */
const UNOBTAINABLE = new Set([
	// creative and operator only
	"air",
	"barrier",
	"light",
	"command_block",
	"chain_command_block",
	"repeating_command_block",
	"command_block_minecart",
	"structure_block",
	"structure_void",
	"jigsaw",
	"debug_stick",
	"knowledge_book",
	"test_block",
	"test_instance_block",
	// entries of the icon catalog that are not items at all
	"u",
	"x",
	// blocks that exist in the world but never drop as an item, not even with Silk Touch
	"bedrock",
	"end_portal_frame",
	"reinforced_deepslate",
	"spawner",
	"trial_spawner",
	"vault",
	"budding_amethyst",
	"farmland",
	"dirt_path",
	"chorus_plant",
	"frogspawn",
	"suspicious_sand",
	"suspicious_gravel",
	"petrified_oak_slab",
	"player_head",
]);

export const isObtainable = (id: string) =>
	!UNOBTAINABLE.has(id) && !id.endsWith("_spawn_egg") && !id.startsWith("infested_");

export function resolveVersion(id?: string): McVersion {
	return versions.find((v) => v.id === id) ?? latestVersion;
}

/**
 * item id -> icon url. The newer catalog keeps some items only per variant ("suspicious_stew__1c0f0534",
 * one per effect; potions, tipped arrows and enchanted books too), so each such item also gets the
 * icon of one of its variants under its own id.
 */
export function iconMap(items: Item[]) {
	const icons: Record<string, string> = Object.fromEntries(items.map((i) => [i.id, i.src]));
	for (const { id, src } of items) {
		const base = id.split("__")[0];
		if (base !== id) icons[base] ??= src;
	}
	return icons;
}

export async function loadItems(version: McVersion): Promise<Item[]> {
	const folders = await loaders[`../data/items/${version.id}.json`]();
	return Object.entries(folders).map(([id, folder]) => ({
		id,
		src: `${CDN}/${version.source}/${folder}/${id}.png`,
	}));
}

/**
 * The best enchantments for every armor piece, tool and weapon (Java Edition).
 * Enchantment ids and max levels follow the game; the picks are the usual survival consensus.
 */

export interface Enchantment {
	/** id in the item component, e.g. "sharpness" */
	id: string;
	name: string;
	max: number;
}

const ENCHANTMENTS: Enchantment[] = [
	{ id: "protection", name: "Protection", max: 4 },
	{ id: "fire_protection", name: "Fire Protection", max: 4 },
	{ id: "blast_protection", name: "Blast Protection", max: 4 },
	{ id: "projectile_protection", name: "Projectile Protection", max: 4 },
	{ id: "thorns", name: "Thorns", max: 3 },
	{ id: "respiration", name: "Respiration", max: 3 },
	{ id: "aqua_affinity", name: "Aqua Affinity", max: 1 },
	{ id: "depth_strider", name: "Depth Strider", max: 3 },
	{ id: "frost_walker", name: "Frost Walker", max: 2 },
	{ id: "feather_falling", name: "Feather Falling", max: 4 },
	{ id: "soul_speed", name: "Soul Speed", max: 3 },
	{ id: "swift_sneak", name: "Swift Sneak", max: 3 },
	{ id: "sharpness", name: "Sharpness", max: 5 },
	{ id: "smite", name: "Smite", max: 5 },
	{ id: "bane_of_arthropods", name: "Bane of Arthropods", max: 5 },
	{ id: "knockback", name: "Knockback", max: 2 },
	{ id: "fire_aspect", name: "Fire Aspect", max: 2 },
	{ id: "looting", name: "Looting", max: 3 },
	{ id: "sweeping_edge", name: "Sweeping Edge", max: 3 },
	{ id: "efficiency", name: "Efficiency", max: 5 },
	{ id: "silk_touch", name: "Silk Touch", max: 1 },
	{ id: "fortune", name: "Fortune", max: 3 },
	{ id: "unbreaking", name: "Unbreaking", max: 3 },
	{ id: "mending", name: "Mending", max: 1 },
	{ id: "power", name: "Power", max: 5 },
	{ id: "punch", name: "Punch", max: 2 },
	{ id: "flame", name: "Flame", max: 1 },
	{ id: "infinity", name: "Infinity", max: 1 },
	{ id: "luck_of_the_sea", name: "Luck of the Sea", max: 3 },
	{ id: "lure", name: "Lure", max: 3 },
	{ id: "loyalty", name: "Loyalty", max: 3 },
	{ id: "impaling", name: "Impaling", max: 5 },
	{ id: "riptide", name: "Riptide", max: 3 },
	{ id: "channeling", name: "Channeling", max: 1 },
	{ id: "multishot", name: "Multishot", max: 1 },
	{ id: "piercing", name: "Piercing", max: 4 },
	{ id: "quick_charge", name: "Quick Charge", max: 3 },
	{ id: "density", name: "Density", max: 5 },
	{ id: "breach", name: "Breach", max: 4 },
	{ id: "wind_burst", name: "Wind Burst", max: 3 },
];

export const enchantmentById = (id: string) => ENCHANTMENTS.find((e) => e.id === id) as Enchantment;

export const ROMAN = ["", "I", "II", "III", "IV", "V"];

export interface Pick {
	id: string;
	/** level to get, defaults to the maximum */
	level?: number;
	/** why it is worth it */
	why: string;
}

export interface Build {
	name: string;
	picks: Pick[];
	note?: string;
}

export interface Gear {
	id: string;
	name: string;
	/** item whose icon represents it */
	icon: string;
	group: "Armor" | "Melee" | "Tools" | "Ranged" | "Other";
	/** the first build is the best all-rounder */
	builds: Build[];
	/** enchantments that cannot go together on this item */
	conflicts?: string[];
}

const p = (id: string, why: string, level?: number): Pick => ({ id, why, level });

const DURABILITY: Pick[] = [
	p("unbreaking", "Makes the item last about 4 times longer"),
	p("mending", "Repairs it with the XP you pick up"),
];

export const GEAR: Gear[] = [
	{
		id: "helmet",
		name: "Helmet",
		icon: "diamond_helmet",
		group: "Armor",
		builds: [
			{
				name: "All-round",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("respiration", "Breathe underwater for much longer"),
					p("aqua_affinity", "Mine at normal speed underwater"),
					...DURABILITY,
				],
			},
			{
				name: "Thorns",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("thorns", "Hits attackers back, but wears the helmet down fast"),
					p("respiration", "Breathe underwater for much longer"),
					p("aqua_affinity", "Mine at normal speed underwater"),
					...DURABILITY,
				],
				note: "Thorns costs durability every time it triggers, so you rely on Mending.",
			},
		],
		conflicts: [
			"Protection, Fire Protection, Blast Protection and Projectile Protection exclude each other",
		],
	},
	{
		id: "chestplate",
		name: "Chestplate",
		icon: "diamond_chestplate",
		group: "Armor",
		builds: [
			{
				name: "All-round",
				picks: [p("protection", "Reduces almost all damage"), ...DURABILITY],
			},
			{
				name: "Thorns",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("thorns", "Hits attackers back, but wears the chestplate down fast"),
					...DURABILITY,
				],
				note: "Thorns costs durability every time it triggers, so you rely on Mending.",
			},
			{
				name: "Blast",
				picks: [p("blast_protection", "Best against creepers, ghasts and TNT"), ...DURABILITY],
			},
		],
		conflicts: [
			"Protection, Fire Protection, Blast Protection and Projectile Protection exclude each other",
		],
	},
	{
		id: "leggings",
		name: "Leggings",
		icon: "diamond_leggings",
		group: "Armor",
		builds: [
			{
				name: "All-round",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("swift_sneak", "Sneak nearly as fast as you walk, great for the Deep Dark"),
					...DURABILITY,
				],
			},
			{
				name: "Blast",
				picks: [
					p("blast_protection", "Best against creepers, ghasts and TNT"),
					p("swift_sneak", "Sneak nearly as fast as you walk, great for the Deep Dark"),
					...DURABILITY,
				],
			},
		],
		conflicts: [
			"Protection, Fire Protection, Blast Protection and Projectile Protection exclude each other",
		],
	},
	{
		id: "boots",
		name: "Boots",
		icon: "diamond_boots",
		group: "Armor",
		builds: [
			{
				name: "All-round",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("feather_falling", "Cuts fall damage, also protects against ender pearls"),
					p("depth_strider", "Move faster underwater"),
					p("soul_speed", "Run fast on soul sand and soul soil in the Nether"),
					...DURABILITY,
				],
			},
			{
				name: "Frost Walker",
				picks: [
					p("protection", "Reduces almost all damage"),
					p("feather_falling", "Cuts fall damage, also protects against ender pearls"),
					p("frost_walker", "Turns water into ice as you walk over it"),
					p("soul_speed", "Run fast on soul sand and soul soil in the Nether"),
					...DURABILITY,
				],
				note: "Frost Walker and Depth Strider cannot be on the same boots.",
			},
		],
		conflicts: [
			"Depth Strider and Frost Walker exclude each other",
			"Protection, Fire Protection, Blast Protection and Projectile Protection exclude each other",
		],
	},
	{
		id: "sword",
		name: "Sword",
		icon: "diamond_sword",
		group: "Melee",
		builds: [
			{
				name: "All-round",
				picks: [
					p("sharpness", "The most damage against everything"),
					p("looting", "More drops from mobs"),
					p("fire_aspect", "Sets targets on fire and cooks the meat", 2),
					p("sweeping_edge", "Sweep attacks hit more"),
					...DURABILITY,
				],
			},
			{
				name: "Undead",
				picks: [
					p("smite", "Extra damage to zombies, skeletons and other undead"),
					p("looting", "More drops from mobs"),
					p("fire_aspect", "Sets targets on fire", 2),
					...DURABILITY,
				],
			},
			{
				name: "Spiders",
				picks: [
					p("bane_of_arthropods", "Extra damage to spiders, silverfish and bees"),
					p("looting", "More drops from mobs"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Sharpness, Smite and Bane of Arthropods exclude each other"],
	},
	{
		id: "axe",
		name: "Axe",
		icon: "diamond_axe",
		group: "Melee",
		builds: [
			{
				name: "All-round",
				picks: [
					p("sharpness", "More damage in a fight"),
					p("efficiency", "Chop wood and break shields faster"),
					...DURABILITY,
				],
				note: "Silk Touch is only worth it when you want the block itself, like bookshelves or leaves.",
			},
			{
				name: "Silk Touch",
				picks: [
					p("silk_touch", "Get the block itself, like leaves and bookshelves"),
					p("efficiency", "Chop wood faster"),
					...DURABILITY,
				],
			},
		],
		conflicts: [
			"Sharpness, Smite and Bane of Arthropods exclude each other",
			"Fortune and Silk Touch exclude each other",
		],
	},
	{
		id: "mace",
		name: "Mace",
		icon: "mace",
		group: "Melee",
		builds: [
			{
				name: "All-round",
				picks: [
					p("density", "More smash damage for every block you fall"),
					p("wind_burst", "Launches you back up after a smash attack"),
					p("fire_aspect", "Sets targets on fire", 2),
					...DURABILITY,
				],
			},
			{
				name: "Armor breaker",
				picks: [
					p("breach", "Ignores most of the target's armor"),
					p("wind_burst", "Launches you back up after a smash attack"),
					p("fire_aspect", "Sets targets on fire", 2),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Density, Breach, Smite and Bane of Arthropods exclude each other"],
	},
	{
		id: "pickaxe",
		name: "Pickaxe",
		icon: "diamond_pickaxe",
		group: "Tools",
		builds: [
			{
				name: "Fortune",
				picks: [
					p("efficiency", "Mine as fast as possible"),
					p("fortune", "More drops from ores like diamonds and lapis"),
					...DURABILITY,
				],
			},
			{
				name: "Silk Touch",
				picks: [
					p("efficiency", "Mine as fast as possible"),
					p("silk_touch", "Collect ores, glass, ice and spawners' cages as blocks"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Fortune and Silk Touch exclude each other"],
	},
	{
		id: "shovel",
		name: "Shovel",
		icon: "diamond_shovel",
		group: "Tools",
		builds: [
			{
				name: "Silk Touch",
				picks: [
					p("efficiency", "Dig as fast as possible"),
					p("silk_touch", "Collect grass blocks, snow, clay, mycelium and podzol"),
					...DURABILITY,
				],
			},
			{
				name: "Fortune",
				picks: [
					p("efficiency", "Dig as fast as possible"),
					p("fortune", "More flint from gravel and more clay balls"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Fortune and Silk Touch exclude each other"],
	},
	{
		id: "hoe",
		name: "Hoe",
		icon: "diamond_hoe",
		group: "Tools",
		builds: [
			{
				name: "All-round",
				picks: [
					p("efficiency", "Clear leaves, hay bales and wart blocks faster"),
					p("fortune", "More saplings, apples and sticks from leaves"),
					...DURABILITY,
				],
			},
			{
				name: "Silk Touch",
				picks: [
					p("efficiency", "Clear leaves, hay bales and wart blocks faster"),
					p("silk_touch", "Collect leaves, sculk and moss as blocks"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Fortune and Silk Touch exclude each other"],
	},
	{
		id: "shears",
		name: "Shears",
		icon: "shears",
		group: "Tools",
		builds: [
			{
				name: "All-round",
				picks: [p("efficiency", "Shear and clear wool, leaves and cobwebs faster"), ...DURABILITY],
			},
		],
	},
	{
		id: "fishing_rod",
		name: "Fishing Rod",
		icon: "fishing_rod",
		group: "Tools",
		builds: [
			{
				name: "All-round",
				picks: [
					p("luck_of_the_sea", "More treasure, less junk"),
					p("lure", "Fish bite much sooner"),
					...DURABILITY,
				],
			},
		],
	},
	{
		id: "bow",
		name: "Bow",
		icon: "bow",
		group: "Ranged",
		builds: [
			{
				name: "Infinity",
				picks: [
					p("power", "Arrows hit much harder"),
					p("infinity", "Shoot with a single arrow, no need to restock"),
					p("flame", "Arrows set targets on fire"),
					p("unbreaking", "Makes the bow last about 4 times longer"),
				],
				note: "Infinity and Mending cannot be on the same bow in Java Edition.",
			},
			{
				name: "Mending",
				picks: [
					p("power", "Arrows hit much harder"),
					p("punch", "Knocks targets back"),
					p("flame", "Arrows set targets on fire"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Infinity and Mending exclude each other"],
	},
	{
		id: "crossbow",
		name: "Crossbow",
		icon: "crossbow",
		group: "Ranged",
		builds: [
			{
				name: "Piercing",
				picks: [
					p("quick_charge", "Reload much faster"),
					p("piercing", "Arrows go through several mobs"),
					...DURABILITY,
				],
			},
			{
				name: "Multishot",
				picks: [
					p("quick_charge", "Reload much faster"),
					p("multishot", "Fires three arrows at once"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Multishot and Piercing exclude each other"],
	},
	{
		id: "trident",
		name: "Trident",
		icon: "trident",
		group: "Ranged",
		builds: [
			{
				name: "Loyalty",
				picks: [
					p("impaling", "Extra damage to mobs in water and rain"),
					p("loyalty", "The trident flies back to you after a throw"),
					...DURABILITY,
				],
			},
			{
				name: "Riptide",
				picks: [
					p("riptide", "Launches you forward in water or rain"),
					p("impaling", "Extra damage to mobs in water and rain"),
					...DURABILITY,
				],
				note: "Riptide cannot be combined with Loyalty or Channeling.",
			},
			{
				name: "Channeling",
				picks: [
					p("channeling", "Calls lightning down on the target in a thunderstorm"),
					p("loyalty", "The trident flies back to you after a throw"),
					p("impaling", "Extra damage to mobs in water and rain"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["Riptide excludes Loyalty and Channeling"],
	},
	{
		id: "elytra",
		name: "Elytra",
		icon: "elytra",
		group: "Other",
		builds: [{ name: "All-round", picks: [...DURABILITY] }],
	},
	{
		id: "shield",
		name: "Shield",
		icon: "shield",
		group: "Other",
		builds: [{ name: "All-round", picks: [...DURABILITY] }],
	},
];

export const GROUPS: Gear["group"][] = ["Armor", "Melee", "Tools", "Ranged", "Other"];

export const gearById = (id: string) => GEAR.find((g) => g.id === id) as Gear;

export const levelOf = (pick: Pick) => pick.level ?? enchantmentById(pick.id).max;

/** `/give` command with the build already enchanted (1.21.5+ item component syntax) */
export function giveCommand(item: string, build: Build) {
	const list = build.picks.map((pick) => `${pick.id}:${levelOf(pick)}`).join(",");
	return `/give @p minecraft:${item}[enchantments={${list}}]`;
}

/** the item to hand out for the command: the best material of the gear */
export const GIVE_ITEM: Record<string, string> = {
	helmet: "netherite_helmet",
	chestplate: "netherite_chestplate",
	leggings: "netherite_leggings",
	boots: "netherite_boots",
	sword: "netherite_sword",
	axe: "netherite_axe",
	mace: "mace",
	pickaxe: "netherite_pickaxe",
	shovel: "netherite_shovel",
	hoe: "netherite_hoe",
	shears: "shears",
	fishing_rod: "fishing_rod",
	bow: "bow",
	crossbow: "crossbow",
	trident: "trident",
	elytra: "elytra",
	shield: "shield",
};

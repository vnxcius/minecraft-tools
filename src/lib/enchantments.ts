/**
 * The best enchantments for every armor piece, tool and weapon (Java Edition).
 * Enchantment ids and max levels follow the game; the picks are the usual survival consensus.
 * Names come from the game's language files; the explanations are site messages (src/i18n).
 */
import { type MessageKey, t, term } from "@/i18n";

export interface Enchantment {
	/** id in the item component, e.g. "sharpness" */
	id: string;
	max: number;
}

const ENCHANTMENTS: Enchantment[] = [
	{ id: "protection", max: 4 },
	{ id: "fire_protection", max: 4 },
	{ id: "blast_protection", max: 4 },
	{ id: "projectile_protection", max: 4 },
	{ id: "thorns", max: 3 },
	{ id: "respiration", max: 3 },
	{ id: "aqua_affinity", max: 1 },
	{ id: "depth_strider", max: 3 },
	{ id: "frost_walker", max: 2 },
	{ id: "feather_falling", max: 4 },
	{ id: "soul_speed", max: 3 },
	{ id: "swift_sneak", max: 3 },
	{ id: "sharpness", max: 5 },
	{ id: "smite", max: 5 },
	{ id: "bane_of_arthropods", max: 5 },
	{ id: "knockback", max: 2 },
	{ id: "fire_aspect", max: 2 },
	{ id: "looting", max: 3 },
	{ id: "sweeping_edge", max: 3 },
	{ id: "efficiency", max: 5 },
	{ id: "silk_touch", max: 1 },
	{ id: "fortune", max: 3 },
	{ id: "unbreaking", max: 3 },
	{ id: "mending", max: 1 },
	{ id: "power", max: 5 },
	{ id: "punch", max: 2 },
	{ id: "flame", max: 1 },
	{ id: "infinity", max: 1 },
	{ id: "luck_of_the_sea", max: 3 },
	{ id: "lure", max: 3 },
	{ id: "loyalty", max: 3 },
	{ id: "impaling", max: 5 },
	{ id: "riptide", max: 3 },
	{ id: "channeling", max: 1 },
	{ id: "multishot", max: 1 },
	{ id: "piercing", max: 4 },
	{ id: "quick_charge", max: 3 },
	{ id: "density", max: 5 },
	{ id: "breach", max: 4 },
	{ id: "wind_burst", max: 3 },
	{ id: "lunge", max: 3 },
];

export const enchantmentById = (id: string) => ENCHANTMENTS.find((e) => e.id === id) as Enchantment;

export const enchantmentName = (id: string) => term(`enchantment.minecraft.${id}`);

/** official roman numeral of a level, "IV" */
export const levelName = (level: number) => term(`enchantment.level.${level}`);

export interface Pick {
	id: string;
	/** level to get, defaults to the maximum */
	level?: number;
	why: MessageKey;
}

export interface Build {
	/** a site message, or the name of the enchantment the build is about */
	name: MessageKey | { enchantment: string };
	picks: Pick[];
	/** template with {enchantment_id} placeholders, filled with the official names */
	note?: MessageKey;
}

export interface Gear {
	id: string;
	/** item whose icon represents it */
	icon: string;
	group: "Armor" | "Melee" | "Tools" | "Ranged" | "Other";
	/** the first build is the best all-rounder */
	builds: Build[];
	/** enchantments that cannot go together on this item, templates like the notes */
	conflicts?: MessageKey[];
}

const p = (id: string, why: MessageKey, level?: number): Pick => ({ id, why, level });

export const buildName = (build: Build) =>
	typeof build.name === "string" ? t(build.name) : enchantmentName(build.name.enchantment);

export const gearName = (gear: Gear) => t(`enchant.gear.${gear.id}` as MessageKey);
export const groupName = (group: Gear["group"]) => t(`enchant.group.${group}`);

const DURABILITY: Pick[] = [
	p("unbreaking", "enchant.why.unbreaking"),
	p("mending", "enchant.why.mending"),
];

export const GEAR: Gear[] = [
	{
		id: "helmet",
		icon: "diamond_helmet",
		group: "Armor",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("protection", "enchant.why.protection"),
					p("respiration", "enchant.why.respiration"),
					p("aqua_affinity", "enchant.why.aquaAffinity"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "thorns" },
				picks: [
					p("protection", "enchant.why.protection"),
					p("thorns", "enchant.why.thornsHelmet"),
					p("respiration", "enchant.why.respiration"),
					p("aqua_affinity", "enchant.why.aquaAffinity"),
					...DURABILITY,
				],
				note: "enchant.note.thorns",
			},
		],
		conflicts: ["enchant.conflict.protection"],
	},
	{
		id: "chestplate",
		icon: "diamond_chestplate",
		group: "Armor",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [p("protection", "enchant.why.protection"), ...DURABILITY],
			},
			{
				name: { enchantment: "thorns" },
				picks: [
					p("protection", "enchant.why.protection"),
					p("thorns", "enchant.why.thornsChestplate"),
					...DURABILITY,
				],
				note: "enchant.note.thorns",
			},
			{
				name: "enchant.build.blast",
				picks: [p("blast_protection", "enchant.why.blastProtection"), ...DURABILITY],
			},
		],
		conflicts: ["enchant.conflict.protection"],
	},
	{
		id: "leggings",
		icon: "diamond_leggings",
		group: "Armor",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("protection", "enchant.why.protection"),
					p("swift_sneak", "enchant.why.swiftSneak"),
					...DURABILITY,
				],
			},
			{
				name: "enchant.build.blast",
				picks: [
					p("blast_protection", "enchant.why.blastProtection"),
					p("swift_sneak", "enchant.why.swiftSneak"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.protection"],
	},
	{
		id: "boots",
		icon: "diamond_boots",
		group: "Armor",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("protection", "enchant.why.protection"),
					p("feather_falling", "enchant.why.featherFalling"),
					p("depth_strider", "enchant.why.depthStrider"),
					p("soul_speed", "enchant.why.soulSpeed"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "frost_walker" },
				picks: [
					p("protection", "enchant.why.protection"),
					p("feather_falling", "enchant.why.featherFalling"),
					p("frost_walker", "enchant.why.frostWalker"),
					p("soul_speed", "enchant.why.soulSpeed"),
					...DURABILITY,
				],
				note: "enchant.note.frostWalker",
			},
		],
		conflicts: ["enchant.conflict.boots", "enchant.conflict.protection"],
	},
	{
		id: "sword",
		icon: "diamond_sword",
		group: "Melee",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("sharpness", "enchant.why.sharpness"),
					p("looting", "enchant.why.looting"),
					p("fire_aspect", "enchant.why.fireAspectCook", 2),
					p("sweeping_edge", "enchant.why.sweepingEdge"),
					...DURABILITY,
				],
			},
			{
				name: "enchant.build.undead",
				picks: [
					p("smite", "enchant.why.smite"),
					p("looting", "enchant.why.looting"),
					p("fire_aspect", "enchant.why.fireAspect", 2),
					...DURABILITY,
				],
			},
			{
				name: "enchant.build.spiders",
				picks: [
					p("bane_of_arthropods", "enchant.why.baneOfArthropods"),
					p("looting", "enchant.why.looting"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.damage"],
	},
	{
		id: "spear",
		icon: "diamond_spear",
		group: "Melee",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("sharpness", "enchant.why.sharpness"),
					p("lunge", "enchant.why.lunge"),
					p("looting", "enchant.why.looting"),
					p("fire_aspect", "enchant.why.fireAspectCook", 2),
					...DURABILITY,
				],
			},
			{
				name: "enchant.build.undead",
				picks: [
					p("smite", "enchant.why.smite"),
					p("lunge", "enchant.why.lunge"),
					p("looting", "enchant.why.looting"),
					p("fire_aspect", "enchant.why.fireAspect", 2),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.damage"],
	},
	{
		id: "axe",
		icon: "diamond_axe",
		group: "Melee",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("sharpness", "enchant.why.sharpnessAxe"),
					p("efficiency", "enchant.why.efficiencyAxe"),
					...DURABILITY,
				],
				note: "enchant.note.silkTouch",
			},
			{
				name: { enchantment: "silk_touch" },
				picks: [
					p("silk_touch", "enchant.why.silkTouchAxe"),
					p("efficiency", "enchant.why.efficiencyChop"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.damage", "enchant.conflict.fortune"],
	},
	{
		id: "mace",
		icon: "mace",
		group: "Melee",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("density", "enchant.why.density"),
					p("wind_burst", "enchant.why.windBurst"),
					p("fire_aspect", "enchant.why.fireAspect", 2),
					...DURABILITY,
				],
			},
			{
				name: "enchant.build.armorBreaker",
				picks: [
					p("breach", "enchant.why.breach"),
					p("wind_burst", "enchant.why.windBurst"),
					p("fire_aspect", "enchant.why.fireAspect", 2),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.mace"],
	},
	{
		id: "pickaxe",
		icon: "diamond_pickaxe",
		group: "Tools",
		builds: [
			{
				name: { enchantment: "fortune" },
				picks: [
					p("efficiency", "enchant.why.efficiencyMine"),
					p("fortune", "enchant.why.fortunePickaxe"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "silk_touch" },
				picks: [
					p("efficiency", "enchant.why.efficiencyMine"),
					p("silk_touch", "enchant.why.silkTouchPickaxe"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.fortune"],
	},
	{
		id: "shovel",
		icon: "diamond_shovel",
		group: "Tools",
		builds: [
			{
				name: { enchantment: "silk_touch" },
				picks: [
					p("efficiency", "enchant.why.efficiencyDig"),
					p("silk_touch", "enchant.why.silkTouchShovel"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "fortune" },
				picks: [
					p("efficiency", "enchant.why.efficiencyDig"),
					p("fortune", "enchant.why.fortuneShovel"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.fortune"],
	},
	{
		id: "hoe",
		icon: "diamond_hoe",
		group: "Tools",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("efficiency", "enchant.why.efficiencyHoe"),
					p("fortune", "enchant.why.fortuneHoe"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "silk_touch" },
				picks: [
					p("efficiency", "enchant.why.efficiencyHoe"),
					p("silk_touch", "enchant.why.silkTouchHoe"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.fortune"],
	},
	{
		id: "shears",
		icon: "shears",
		group: "Tools",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [p("efficiency", "enchant.why.efficiencyShears"), ...DURABILITY],
			},
		],
	},
	{
		id: "fishing_rod",
		icon: "fishing_rod",
		group: "Tools",
		builds: [
			{
				name: "enchant.build.allRound",
				picks: [
					p("luck_of_the_sea", "enchant.why.luckOfTheSea"),
					p("lure", "enchant.why.lure"),
					...DURABILITY,
				],
			},
		],
	},
	{
		id: "bow",
		icon: "bow",
		group: "Ranged",
		builds: [
			{
				name: { enchantment: "infinity" },
				picks: [
					p("power", "enchant.why.power"),
					p("infinity", "enchant.why.infinity"),
					p("flame", "enchant.why.flame"),
					p("unbreaking", "enchant.why.unbreakingBow"),
				],
				note: "enchant.note.infinity",
			},
			{
				name: { enchantment: "mending" },
				picks: [
					p("power", "enchant.why.power"),
					p("punch", "enchant.why.punch"),
					p("flame", "enchant.why.flame"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.infinity"],
	},
	{
		id: "crossbow",
		icon: "crossbow",
		group: "Ranged",
		builds: [
			{
				name: { enchantment: "piercing" },
				picks: [
					p("quick_charge", "enchant.why.quickCharge"),
					p("piercing", "enchant.why.piercing"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "multishot" },
				picks: [
					p("quick_charge", "enchant.why.quickCharge"),
					p("multishot", "enchant.why.multishot"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.multishot"],
	},
	{
		id: "trident",
		icon: "trident",
		group: "Ranged",
		builds: [
			{
				name: { enchantment: "loyalty" },
				picks: [
					p("impaling", "enchant.why.impaling"),
					p("loyalty", "enchant.why.loyalty"),
					...DURABILITY,
				],
			},
			{
				name: { enchantment: "riptide" },
				picks: [
					p("riptide", "enchant.why.riptide"),
					p("impaling", "enchant.why.impaling"),
					...DURABILITY,
				],
				note: "enchant.note.riptide",
			},
			{
				name: { enchantment: "channeling" },
				picks: [
					p("channeling", "enchant.why.channeling"),
					p("loyalty", "enchant.why.loyalty"),
					p("impaling", "enchant.why.impaling"),
					...DURABILITY,
				],
			},
		],
		conflicts: ["enchant.conflict.riptide"],
	},
	{
		id: "elytra",
		icon: "elytra",
		group: "Other",
		builds: [{ name: "enchant.build.allRound", picks: [...DURABILITY] }],
	},
	{
		id: "shield",
		icon: "shield",
		group: "Other",
		builds: [{ name: "enchant.build.allRound", picks: [...DURABILITY] }],
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
	spear: "netherite_spear",
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

const ARMOR = [
	"protection",
	"fire_protection",
	"blast_protection",
	"projectile_protection",
	"thorns",
];
const TOOL = ["efficiency", "silk_touch", "fortune"];
const DURABLE = ["unbreaking", "mending"];

/** every enchantment each piece of gear can take in survival (Java Edition, curses left out) */
export const ENCHANTABLE: Record<string, string[]> = {
	helmet: [...ARMOR, "respiration", "aqua_affinity", ...DURABLE],
	chestplate: [...ARMOR, ...DURABLE],
	leggings: [...ARMOR, "swift_sneak", ...DURABLE],
	boots: [...ARMOR, "feather_falling", "depth_strider", "frost_walker", "soul_speed", ...DURABLE],
	sword: [
		"sharpness",
		"smite",
		"bane_of_arthropods",
		"knockback",
		"fire_aspect",
		"looting",
		"sweeping_edge",
		...DURABLE,
	],
	spear: [
		"sharpness",
		"smite",
		"bane_of_arthropods",
		"knockback",
		"fire_aspect",
		"looting",
		"lunge",
		...DURABLE,
	],
	axe: ["sharpness", "smite", "bane_of_arthropods", ...TOOL, ...DURABLE],
	mace: [
		"density",
		"breach",
		"smite",
		"bane_of_arthropods",
		"fire_aspect",
		"wind_burst",
		...DURABLE,
	],
	pickaxe: [...TOOL, ...DURABLE],
	shovel: [...TOOL, ...DURABLE],
	hoe: [...TOOL, ...DURABLE],
	shears: ["efficiency", ...DURABLE],
	fishing_rod: ["luck_of_the_sea", "lure", ...DURABLE],
	bow: ["power", "punch", "flame", "infinity", ...DURABLE],
	crossbow: ["multishot", "piercing", "quick_charge", ...DURABLE],
	trident: ["impaling", "loyalty", "riptide", "channeling", ...DURABLE],
	elytra: DURABLE,
	shield: DURABLE,
};

/** groups whose members exclude each other */
const EXCLUSIVE = [
	["protection", "fire_protection", "blast_protection", "projectile_protection"],
	["sharpness", "smite", "bane_of_arthropods", "density", "breach"],
	["silk_touch", "fortune"],
	["infinity", "mending"],
	["depth_strider", "frost_walker"],
	["multishot", "piercing"],
	["riptide", "loyalty"],
	["riptide", "channeling"],
];

/** true when two enchantments cannot be on the same item (no gear takes Sharpness and Density) */
export const excludes = (a: string, b: string) =>
	a !== b && EXCLUSIVE.some((group) => group.includes(a) && group.includes(b));

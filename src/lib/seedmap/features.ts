import { type MessageKey, maybeTerm, t, term } from "@/i18n";
import type { Dim } from "./protocol";

/** cubiomes structure type ids (enum StructureType in finders.h) */
export interface Feature {
	type: number;
	id: string;
	/** one or two letters drawn on the marker */
	short: string;
	color: string;
	/** item whose icon marks the structure on the map */
	icon: string;
	dim: Dim;
}

export const FEATURES: Feature[] = [
	{ type: 5, id: "village", short: "V", color: "#c8842b", icon: "bell", dim: 0 },
	{
		type: 1,
		id: "desert_pyramid",
		short: "DP",
		color: "#d8b84c",
		icon: "sandstone",
		dim: 0,
	},
	{
		type: 2,
		id: "jungle_temple",
		short: "JT",
		color: "#4c9a3a",
		icon: "mossy_cobblestone",
		dim: 0,
	},
	{
		type: 3,
		id: "swamp_hut",
		short: "SH",
		color: "#5f7a4a",
		icon: "cauldron",
		dim: 0,
	},
	{ type: 4, id: "igloo", short: "I", color: "#8fb8d8", icon: "snow_block", dim: 0 },
	{
		type: 10,
		id: "outpost",
		short: "PO",
		color: "#8a3f3f",
		icon: "crossbow",
		dim: 0,
	},
	{
		type: 9,
		id: "mansion",
		short: "WM",
		color: "#7a5230",
		icon: "totem_of_undying",
		dim: 0,
	},
	{
		type: 8,
		id: "monument",
		short: "OM",
		color: "#2fa6a6",
		icon: "prismarine_bricks",
		dim: 0,
	},
	{
		type: 6,
		id: "ocean_ruin",
		short: "OR",
		color: "#3b6fb5",
		icon: "sea_lantern",
		dim: 0,
	},
	{
		type: 7,
		id: "shipwreck",
		short: "SW",
		color: "#9a7440",
		icon: "oak_boat",
		dim: 0,
	},
	{
		type: 11,
		id: "ruined_portal",
		short: "RP",
		color: "#9146d6",
		icon: "crying_obsidian",
		dim: 0,
	},
	{
		type: 13,
		id: "ancient_city",
		short: "AC",
		color: "#1f5f73",
		icon: "sculk_shrieker",
		dim: 0,
	},
	{
		type: 14,
		id: "treasure",
		short: "BT",
		color: "#e0bd12",
		icon: "heart_of_the_sea",
		dim: 0,
	},
	{
		type: 15,
		id: "mineshaft",
		short: "M",
		color: "#7d7d7d",
		icon: "rail",
		dim: 0,
	},
	{
		type: 23,
		id: "trail_ruins",
		short: "TR",
		color: "#b8794a",
		icon: "brush",
		dim: 0,
	},
	{
		type: 24,
		id: "trial_chambers",
		short: "TC",
		color: "#d0722c",
		icon: "trial_key",
		dim: 0,
	},
	{
		type: 18,
		id: "fortress",
		short: "NF",
		color: "#b32222",
		icon: "nether_bricks",
		dim: -1,
	},
	{
		type: 19,
		id: "bastion",
		short: "BR",
		color: "#6b6b6b",
		icon: "gilded_blackstone",
		dim: -1,
	},
	{
		type: 12,
		id: "ruined_portal_nether",
		short: "RP",
		color: "#9146d6",
		icon: "crying_obsidian",
		dim: -1,
	},
	{
		type: 20,
		id: "end_city",
		short: "EC",
		color: "#b58ad8",
		icon: "purpur_block",
		dim: 1,
	},
	{
		type: 21,
		id: "end_gateway",
		short: "EG",
		color: "#5fc8f0",
		icon: "ender_pearl",
		dim: 1,
	},
];

/** structure name in the language shown; the End gateway is a block the game names itself */
export const featureName = (feature: Feature) =>
	feature.id === "end_gateway"
		? term("block.minecraft.end_gateway")
		: t(`seed.structure.${feature.id}` as MessageKey);

export const STRONGHOLD_ICON = "ender_eye";
export const SPAWN_ICON = "compass";

/** on when the map opens */
export const DEFAULT_FEATURES = new Set([
	"village",
	"monument",
	"mansion",
	"ancient_city",
	"fortress",
]);

export interface McVersion {
	/** name the engine understands */
	id: string;
	/** the game versions it covers */
	name: string;
	/** also covers every later version */
	andNewer?: boolean;
}

// newest first; the engine covers everything up to 1.21.4
export const VERSIONS: McVersion[] = [
	{ id: "1.21", name: "1.21.4", andNewer: true },
	{ id: "1.21.3", name: "1.21.2 - 1.21.3" },
	{ id: "1.21.1", name: "1.21 - 1.21.1" },
	{ id: "1.20", name: "1.20" },
	{ id: "1.19", name: "1.19.3 - 1.19.4" },
	{ id: "1.19.2", name: "1.19 - 1.19.2" },
	{ id: "1.18", name: "1.18" },
	{ id: "1.17", name: "1.17" },
	{ id: "1.16", name: "1.16.2 - 1.16.5" },
	{ id: "1.15", name: "1.15" },
	{ id: "1.14", name: "1.14" },
	{ id: "1.13", name: "1.13" },
	{ id: "1.12", name: "1.12" },
];

export const versionName = (version: McVersion) =>
	version.andNewer ? t("seed.versionAndNewer", { version: version.name }) : version.name;

/** the dimensions, with the game's language key of their name */
export const DIMENSIONS: { id: Dim; key: string }[] = [
	{ id: 0, key: "flat_world_preset.minecraft.overworld" },
	{ id: -1, key: "advancements.nether.root.title" },
	{ id: 1, key: "biome.minecraft.the_end" },
];

/** official biome name from the engine's id ("lush_caves" -> "Lush Caves" / "Cavernas verdejantes") */
export const biomeName = (id: string) =>
	maybeTerm(`biome.minecraft.${id}`) ?? id.replace(/_/g, " ");

// biomes that live outside of the overworld
const NETHER_BIOMES = new Set([8, 170, 171, 172, 173]);
const END_BIOMES = new Set([9, 40, 41, 42, 43]);

export function biomeDim(id: number): Dim {
	return NETHER_BIOMES.has(id) ? -1 : END_BIOMES.has(id) ? 1 : 0;
}

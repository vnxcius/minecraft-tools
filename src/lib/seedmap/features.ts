import type { Dim } from "./protocol";

/** cubiomes structure type ids (enum StructureType in finders.h) */
export interface Feature {
	type: number;
	id: string;
	name: string;
	/** one or two letters drawn on the marker */
	short: string;
	color: string;
	dim: Dim;
}

export const FEATURES: Feature[] = [
	{ type: 5, id: "village", name: "Village", short: "V", color: "#c8842b", dim: 0 },
	{ type: 1, id: "desert_pyramid", name: "Desert Pyramid", short: "DP", color: "#d8b84c", dim: 0 },
	{ type: 2, id: "jungle_temple", name: "Jungle Temple", short: "JT", color: "#4c9a3a", dim: 0 },
	{ type: 3, id: "swamp_hut", name: "Swamp Hut", short: "SH", color: "#5f7a4a", dim: 0 },
	{ type: 4, id: "igloo", name: "Igloo", short: "I", color: "#8fb8d8", dim: 0 },
	{ type: 10, id: "outpost", name: "Pillager Outpost", short: "PO", color: "#8a3f3f", dim: 0 },
	{ type: 9, id: "mansion", name: "Woodland Mansion", short: "WM", color: "#7a5230", dim: 0 },
	{ type: 8, id: "monument", name: "Ocean Monument", short: "OM", color: "#2fa6a6", dim: 0 },
	{ type: 6, id: "ocean_ruin", name: "Ocean Ruin", short: "OR", color: "#3b6fb5", dim: 0 },
	{ type: 7, id: "shipwreck", name: "Shipwreck", short: "SW", color: "#9a7440", dim: 0 },
	{ type: 11, id: "ruined_portal", name: "Ruined Portal", short: "RP", color: "#9146d6", dim: 0 },
	{ type: 13, id: "ancient_city", name: "Ancient City", short: "AC", color: "#1f5f73", dim: 0 },
	{ type: 14, id: "treasure", name: "Buried Treasure", short: "BT", color: "#e0bd12", dim: 0 },
	{ type: 15, id: "mineshaft", name: "Mineshaft", short: "M", color: "#7d7d7d", dim: 0 },
	{ type: 23, id: "trail_ruins", name: "Trail Ruins", short: "TR", color: "#b8794a", dim: 0 },
	{ type: 24, id: "trial_chambers", name: "Trial Chambers", short: "TC", color: "#d0722c", dim: 0 },
	{ type: 18, id: "fortress", name: "Nether Fortress", short: "NF", color: "#b32222", dim: -1 },
	{ type: 19, id: "bastion", name: "Bastion Remnant", short: "BR", color: "#6b6b6b", dim: -1 },
	{
		type: 12,
		id: "ruined_portal_nether",
		name: "Ruined Portal",
		short: "RP",
		color: "#9146d6",
		dim: -1,
	},
	{ type: 20, id: "end_city", name: "End City", short: "EC", color: "#b58ad8", dim: 1 },
	{ type: 21, id: "end_gateway", name: "End Gateway", short: "EG", color: "#5fc8f0", dim: 1 },
];

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
	name: string;
}

// newest first; the engine covers everything up to 1.21.4
export const VERSIONS: McVersion[] = [
	{ id: "1.21", name: "1.21.4 and newer" },
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

export const DIMENSIONS: { id: Dim; name: string }[] = [
	{ id: 0, name: "Overworld" },
	{ id: -1, name: "Nether" },
	{ id: 1, name: "The End" },
];

// biomes that live outside of the overworld
const NETHER_BIOMES = new Set([8, 170, 171, 172, 173]);
const END_BIOMES = new Set([9, 40, 41, 42, 43]);

export function biomeDim(id: number): Dim {
	return NETHER_BIOMES.has(id) ? -1 : END_BIOMES.has(id) ? 1 : 0;
}

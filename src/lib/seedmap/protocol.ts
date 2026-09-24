/** messages between the page and the world generation worker */

export type Dim = -1 | 0 | 1;

export type Request = { id: number } & (
	| { op: "init"; version: string; seed: string }
	| { op: "tile"; dim: Dim; scale: number; x: number; z: number; size: number }
	| {
			op: "structures";
			type: number;
			x0: number;
			z0: number;
			x1: number;
			z1: number;
			max: number;
	  }
	| { op: "strongholds"; count: number }
	| { op: "spawn" }
	| { op: "slime"; cx: number; cz: number; w: number; h: number }
	| { op: "biomeAt"; dim: Dim; x: number; z: number }
	| { op: "findBiome"; dim: Dim; biome: number; x: number; z: number; radius: number }
);

export type Response = { id: number; result?: unknown; error?: string };

export interface EngineInfo {
	/** rgb triplets, indexed by biome id */
	colors: Uint8Array;
	names: Record<number, string>;
	/** structure type -> dimension, only the structures the version has */
	dims: Record<number, number>;
}

/**
 * The world generation engine (public/engine/engine.wasm) gives the same worlds after a rebuild: a
 * fingerprint of biomes, structures, strongholds, spawn and slime chunks for a few versions and seeds,
 * taken from the engine as it was built before. A new cubiomes commit that changes worlds on purpose
 * updates these values.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { FEATURES } from "@/lib/seedmap/features";

interface Engine {
	memory: WebAssembly.Memory;
	_initialize?: () => void;
	alloc: (n: number) => number;
	mc_id: (name: number) => number;
	setup: (mc: number, seed: bigint) => void;
	biomes: (...args: number[]) => number;
	biome_at: (dim: number, x: number, y: number, z: number) => number;
	structures: (...args: number[]) => number;
	structure_dim: (type: number) => number;
	strongholds: (count: number, out: number) => number;
	spawn: (out: number) => void;
	slime_chunks: (cx: number, cz: number, w: number, h: number, out: number) => void;
}

const EXPECTED: Record<string, string> = {
	"1.21": "58123a612881b074",
	"1.18": "ae0eec5730205b9c",
	"1.16": "7fd197c4b2c7f280",
	"1.12": "64f927fdafd7672a",
};

async function fingerprint(version: string) {
	const { instance } = await WebAssembly.instantiate(readFileSync("public/engine/engine.wasm"), {
		wasi_snapshot_preview1: new Proxy({}, { get: () => () => 0 }),
	});
	const engine = instance.exports as unknown as Engine;
	engine._initialize?.();
	const bytes = (pointer: number, length: number) =>
		new Uint8Array(engine.memory.buffer, pointer, length);
	const name = new TextEncoder().encode(`${version}\0`);
	const namePointer = engine.alloc(name.length);
	bytes(namePointer, name.length).set(name);
	const mc = engine.mc_id(namePointer);
	const out = engine.alloc(1 << 16);
	const hash = createHash("sha256");

	for (const seed of [0n, -4172144997902289642n, 8675309n]) {
		engine.setup(mc, BigInt.asUintN(64, seed));
		for (const dim of [0, -1, 1])
			for (const scale of [1, 4, 16, 64]) {
				hash.update(String(engine.biomes(dim, scale, -37, 91, 16, 16, scale === 1 ? 63 : 15, out)));
				hash.update(bytes(out, 16 * 16 * 4));
			}
		for (let i = 0; i < 20; i++)
			hash.update(`${engine.biome_at(0, i * 997 - 9000, ((i * 13) % 384) - 64, 7000 - i * 761)},`);
		// the structures the map shows, when the version has them
		for (const { type } of FEATURES) {
			if (engine.structure_dim(type) === 1000) continue;
			const n = engine.structures(type, -1500, -1500, 1500, 1500, out, 1024);
			hash.update(`${type}:${n}`);
			if (n > 0) hash.update(bytes(out, n * 8));
		}
		hash.update(bytes(out, engine.strongholds(3, out) * 8));
		engine.spawn(out);
		hash.update(bytes(out, 8));
		engine.slime_chunks(-20, -20, 40, 40, out);
		hash.update(bytes(out, 1600));
	}
	return hash.digest("hex").slice(0, 16);
}

test.each(["1.21", "1.18", "1.16", "1.12"])(
	"the engine builds the same %s worlds",
	async (version) => {
		expect(await fingerprint(version)).toBe(EXPECTED[version]);
	},
);

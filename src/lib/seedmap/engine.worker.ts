/**
 * Runs the WebAssembly world generator (cubiomes, see native/engine.c) off the main thread.
 * Requests come in as { id, op, ...args } and are answered with { id, result } or { id, error }.
 */
import type { Request, Response } from "./protocol";

interface Exports {
	memory: WebAssembly.Memory;
	_initialize?: () => void;
	alloc: (n: number) => number;
	release: (p: number) => void;
	mc_id: (name: number) => number;
	setup: (mc: number, seed: bigint) => void;
	biomes: (
		dim: number,
		scale: number,
		x: number,
		z: number,
		sx: number,
		sz: number,
		y: number,
		out: number,
	) => number;
	biome_at: (dim: number, x: number, y: number, z: number) => number;
	structures: (
		type: number,
		x0: number,
		z0: number,
		x1: number,
		z1: number,
		out: number,
		max: number,
	) => number;
	structure_dim: (type: number) => number;
	strongholds: (count: number, out: number) => number;
	spawn: (out: number) => void;
	slime_chunks: (cx: number, cz: number, w: number, h: number, out: number) => void;
	biome_colors: (out: number) => void;
	biome_name: (id: number) => number;
}

const ctx = self as unknown as {
	postMessage: (message: Response, transfer?: Transferable[]) => void;
	onmessage: ((event: MessageEvent<Request | WebAssembly.Module | string>) => void) | null;
};

let wasm: Exports | null = null;
// the page compiles the generator once and sends it to every worker (see engine.ts)
let receive: (setup: WebAssembly.Module | string) => void = () => {};
const ready = new Promise<WebAssembly.Module | string>((resolve) => (receive = resolve)).then(
	async (module) => {
		if (typeof module === "string") throw new Error(module);
		const instance = await WebAssembly.instantiate(module, {
			// the engine never prints or reads files: every system call can be a no-op
			wasi_snapshot_preview1: new Proxy({}, { get: () => () => 0 }),
		});
		wasm = instance.exports as unknown as Exports;
		wasm._initialize?.();
	},
);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cString(w: Exports, pointer: number) {
	if (!pointer) return null;
	const bytes = new Uint8Array(w.memory.buffer);
	let end = pointer;
	while (bytes[end]) end++;
	return decoder.decode(bytes.subarray(pointer, end));
}

/** runs `fn` with a scratch buffer of `bytes` bytes and frees it afterwards */
function withBuffer<T>(w: Exports, bytes: number, fn: (pointer: number) => T): T {
	const pointer = w.alloc(bytes);
	try {
		return fn(pointer);
	} finally {
		w.release(pointer);
	}
}

/** block height -> the height in the 1:4 biome coordinates of coarser scales */
const scaledY = (scale: number, y: number) => (scale === 1 ? y : Math.floor(y / 4));

function tile(
	w: Exports,
	dim: number,
	scale: number,
	x: number,
	z: number,
	size: number,
	y: number,
) {
	return withBuffer(w, size * size * 4, (pointer) => {
		const error = w.biomes(dim, scale, x, z, size, size, scaledY(scale, y), pointer);
		if (error) throw new Error(`Could not generate biomes (${error})`);
		return new Int32Array(w.memory.buffer, pointer, size * size).slice();
	});
}

/**
 * Nearest spot of a biome around a point. A coarse pass in growing rings of 1:64 tiles finds the
 * closest cell of the biome (16 times fewer samples than 1:16, the search used to take seconds), then
 * a 1:4 pass around that cell pins down the spot of it nearest to the point.
 */
function findBiome(
	w: Exports,
	dim: number,
	biome: number,
	cx: number,
	y: number,
	cz: number,
	radius: number,
) {
	const cells = 64;
	const coarse = 64;
	const span = cells * coarse;
	const home = [Math.floor(cx / span), Math.floor(cz / span)];
	let best: { x: number; z: number; d: number } | null = null;

	for (let ring = 0; ring * span <= radius + span; ring++) {
		// once something is found, only rings that could still hold a closer cell are searched
		if (best && (ring - 1) * span > best.d) break;
		for (let tz = -ring; tz <= ring; tz++) {
			for (let tx = -ring; tx <= ring; tx++) {
				if (Math.max(Math.abs(tx), Math.abs(tz)) !== ring) continue;
				const ids = tile(w, dim, coarse, (home[0] + tx) * cells, (home[1] + tz) * cells, cells, y);
				for (let i = 0; i < ids.length; i++) {
					if (ids[i] !== biome) continue;
					const x = (home[0] + tx) * span + (i % cells) * coarse + coarse / 2;
					const z = (home[1] + tz) * span + Math.floor(i / cells) * coarse + coarse / 2;
					const d = Math.hypot(x - cx, z - cz);
					if (d <= radius + coarse && (!best || d < best.d)) best = { x, z, d };
				}
			}
		}
	}
	if (!best) return null;

	// 1:4 around the coarse hit: the cell of the biome closest to the point
	const fine = 4;
	const size = 48;
	const x0 = Math.floor(best.x / fine) - size / 2;
	const z0 = Math.floor(best.z / fine) - size / 2;
	const ids = tile(w, dim, fine, x0, z0, size, y);
	let precise: { x: number; z: number; d: number } | null = null;
	for (let i = 0; i < ids.length; i++) {
		if (ids[i] !== biome) continue;
		const x = (x0 + (i % size)) * fine + fine / 2;
		const z = (z0 + Math.floor(i / size)) * fine + fine / 2;
		const d = Math.hypot(x - cx, z - cz);
		if (d <= radius && (!precise || d < precise.d)) precise = { x, z, d };
	}
	const found = precise ?? (best.d <= radius ? best : null);
	return found && { x: Math.round(found.x), z: Math.round(found.z) };
}

async function handle(request: Request) {
	await ready;
	const w = wasm as Exports;

	switch (request.op) {
		case "init": {
			const name = encoder.encode(`${request.version}\0`);
			const pointer = w.alloc(name.length);
			new Uint8Array(w.memory.buffer, pointer, name.length).set(name);
			const mc = w.mc_id(pointer);
			w.release(pointer);
			if (!mc) throw new Error(`Unknown version ${request.version}`);
			w.setup(mc, BigInt.asUintN(64, BigInt(request.seed)));

			const colors = withBuffer(w, 256 * 3, (p) => {
				w.biome_colors(p);
				return new Uint8Array(w.memory.buffer, p, 256 * 3).slice();
			});
			const names: Record<number, string> = {};
			for (let id = 0; id < 256; id++) {
				const biomeName = cString(w, w.biome_name(id));
				if (biomeName) names[id] = biomeName;
			}
			// structure types this version knows about, with the dimension they live in
			const dims: Record<number, number> = {};
			for (let type = 0; type < 32; type++) {
				const dim = w.structure_dim(type);
				if (dim !== 1000) dims[type] = dim;
			}
			return { colors, names, dims };
		}
		case "tile":
			return tile(w, request.dim, request.scale, request.x, request.z, request.size, request.y);
		case "structures":
			return withBuffer(w, request.max * 8, (pointer) => {
				const n = w.structures(
					request.type,
					request.x0,
					request.z0,
					request.x1,
					request.z1,
					pointer,
					request.max,
				);
				return new Int32Array(w.memory.buffer, pointer, n * 2).slice();
			});
		case "strongholds":
			return withBuffer(w, request.count * 8, (pointer) => {
				const n = w.strongholds(request.count, pointer);
				return new Int32Array(w.memory.buffer, pointer, n * 2).slice();
			});
		case "spawn":
			return withBuffer(w, 8, (pointer) => {
				w.spawn(pointer);
				return new Int32Array(w.memory.buffer, pointer, 2).slice();
			});
		case "slime":
			return withBuffer(w, request.w * request.h, (pointer) => {
				w.slime_chunks(request.cx, request.cz, request.w, request.h, pointer);
				return new Uint8Array(w.memory.buffer, pointer, request.w * request.h).slice();
			});
		case "biomeAt": {
			const id = w.biome_at(request.dim, request.x, request.y, request.z);
			return { id, name: cString(w, w.biome_name(id)) };
		}
		case "findBiome":
			const { dim, biome, x, y, z, radius } = request;
			return findBiome(w, dim, biome, x, y, z, radius);
	}
}

ctx.onmessage = async (event) => {
	const request = event.data;
	if (request instanceof WebAssembly.Module || typeof request === "string") {
		receive(request);
		return;
	}
	try {
		const result = await handle(request);
		const transfer =
			result instanceof Int32Array || result instanceof Uint8Array ? [result.buffer] : [];
		ctx.postMessage({ id: request.id, result }, transfer);
	} catch (error) {
		ctx.postMessage({ id: request.id, error: String(error) });
	}
};

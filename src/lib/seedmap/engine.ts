import type { Dim, EngineInfo, Request, Response } from "./protocol";

type Payload<T extends Request["op"]> = Omit<Extract<Request, { op: T }>, "id" | "op">;

interface Call {
	resolve: (v: never) => void;
	reject: (e: Error) => void;
}

let compiled: Promise<WebAssembly.Module> | null = null;

/**
 * The generator, downloaded and compiled once for every worker: each worker fetching it for itself
 * downloaded the 2 MB file again, as none of them was cached yet.
 */
function compileEngine() {
	compiled ??= fetch("/engine/engine.wasm").then(async (response) => {
		// streaming compiles while it downloads, but only takes the application/wasm type
		try {
			return await WebAssembly.compileStreaming(response.clone());
		} catch {
			return WebAssembly.compile(await response.arrayBuffer());
		}
	});
	return compiled;
}

/** one engine worker and the calls waiting on it */
class Lane {
	worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
	pending = new Map<number, Call>();
	/** long calls (searches, structures, all the strongholds) in flight; quick calls stay off this lane meanwhile */
	slow = 0;

	constructor() {
		// the worker waits for the compiled generator, or the reason there is none
		compileEngine().then(
			(module) => this.worker.postMessage(module),
			(error) => this.worker.postMessage(String(error)),
		);
		this.worker.onmessage = (event: MessageEvent<Response>) => {
			const { id, result, error } = event.data;
			const call = this.pending.get(id);
			if (!call) return;
			this.pending.delete(id);
			if (error) call.reject(new Error(error));
			else call.resolve(result as never);
		};
	}
}

/**
 * Promise based client for the world generation workers. Generating biomes is the slow part, so a few
 * workers run side by side, each with its own copy of the generator; every call goes to the least
 * busy one, and a long biome search no longer holds up the map.
 */
export class SeedEngine {
	private lanes: Lane[];
	private nextId = 0;

	constructor() {
		const cores = navigator.hardwareConcurrency || 4;
		this.lanes = Array.from({ length: Math.min(Math.max(cores - 1, 2), 6) }, () => new Lane());
	}

	/** how many calls can run at the same time */
	get parallel() {
		return this.lanes.length;
	}

	private send<T>(lane: Lane, op: Request["op"], payload: object, slow = false): Promise<T> {
		const id = this.nextId++;
		if (slow) lane.slow++;
		const promise = new Promise<T>((resolve, reject) => {
			lane.pending.set(id, { resolve: resolve as (v: never) => void, reject });
			lane.worker.postMessage({ id, op, ...payload });
		});
		return slow ? promise.finally(() => lane.slow--) : promise;
	}

	private request<T>(op: Request["op"], payload: object, slow = false): Promise<T> {
		const load = (lane: Lane) => lane.slow * 1000 + lane.pending.size;
		const lane = this.lanes.reduce((a, b) => (load(b) < load(a) ? b : a));
		return this.send<T>(lane, op, payload, slow);
	}

	/** every worker gets the same world */
	async init(payload: Payload<"init">) {
		const [info] = await Promise.all(
			this.lanes.map((lane) => this.send<EngineInfo>(lane, "init", payload)),
		);
		return info;
	}
	tile(payload: Payload<"tile">) {
		return this.request<Int32Array>("tile", payload);
	}
	structures(payload: Payload<"structures">) {
		return this.request<Int32Array>("structures", payload, true);
	}
	strongholds(count: number) {
		return this.request<Int32Array>("strongholds", { count }, count > 16);
	}
	spawn() {
		return this.request<Int32Array>("spawn", {});
	}
	slime(payload: Payload<"slime">) {
		return this.request<Uint8Array>("slime", payload);
	}
	biomeAt(dim: Dim, x: number, y: number, z: number) {
		return this.request<{ id: number; name: string | null }>("biomeAt", { dim, x, y, z });
	}
	findBiome(payload: Payload<"findBiome">) {
		return this.request<{ x: number; z: number } | null>("findBiome", payload, true);
	}

	terminate() {
		for (const lane of this.lanes) {
			lane.worker.terminate();
			for (const call of lane.pending.values()) call.reject(new Error("terminated"));
			lane.pending.clear();
		}
	}
}

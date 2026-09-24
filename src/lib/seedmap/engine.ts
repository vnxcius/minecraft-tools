import type { Dim, EngineInfo, Request, Response } from "./protocol";

type Payload<T extends Request["op"]> = Omit<Extract<Request, { op: T }>, "id" | "op">;

/** promise based client for the world generation worker */
export class SeedEngine {
	private worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
	private pending = new Map<number, { resolve: (v: never) => void; reject: (e: Error) => void }>();
	private nextId = 0;

	constructor() {
		this.worker.onmessage = (event: MessageEvent<Response>) => {
			const { id, result, error } = event.data;
			const call = this.pending.get(id);
			if (!call) return;
			this.pending.delete(id);
			if (error) call.reject(new Error(error));
			else call.resolve(result as never);
		};
	}

	private request<T>(op: Request["op"], payload: object): Promise<T> {
		const id = this.nextId++;
		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, { resolve: resolve as (v: never) => void, reject });
			this.worker.postMessage({ id, op, ...payload });
		});
	}

	init(payload: Payload<"init">) {
		return this.request<EngineInfo>("init", payload);
	}
	tile(payload: Payload<"tile">) {
		return this.request<Int32Array>("tile", payload);
	}
	structures(payload: Payload<"structures">) {
		return this.request<Int32Array>("structures", payload);
	}
	strongholds(count: number) {
		return this.request<Int32Array>("strongholds", { count });
	}
	spawn() {
		return this.request<Int32Array>("spawn", {});
	}
	slime(payload: Payload<"slime">) {
		return this.request<Uint8Array>("slime", payload);
	}
	biomeAt(dim: Dim, x: number, z: number) {
		return this.request<{ id: number; name: string | null }>("biomeAt", { dim, x, z });
	}
	findBiome(payload: Payload<"findBiome">) {
		return this.request<{ x: number; z: number } | null>("findBiome", payload);
	}

	terminate() {
		this.worker.terminate();
		for (const call of this.pending.values()) call.reject(new Error("terminated"));
		this.pending.clear();
	}
}

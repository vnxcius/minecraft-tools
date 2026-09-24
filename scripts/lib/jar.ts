/** Shared helpers for the scripts that extract assets from the official client jar. */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";

const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const CACHE_DIR = ".cache";
const ASSETS = "assets/minecraft/";
const DATA = "data/minecraft/";

interface Manifest {
	latest: { release: string };
	versions: { id: string; url: string }[];
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function downloadClientJar(version: string): Promise<Uint8Array> {
	const cached = join(CACHE_DIR, `client-${version}.jar`);
	if (existsSync(cached)) return new Uint8Array(await readFile(cached));

	const manifest = await getJson<Manifest>(MANIFEST_URL);
	const entry = manifest.versions.find((v) => v.id === version);
	if (!entry) throw new Error(`Unknown Minecraft version "${version}"`);
	const meta = await getJson<{ downloads: { client: { url: string } } }>(entry.url);

	console.log(`Downloading client ${version}...`);
	const res = await fetch(meta.downloads.client.url);
	if (!res.ok) throw new Error(`Client jar download failed: ${res.status}`);
	const jar = new Uint8Array(await res.arrayBuffer());
	await mkdir(CACHE_DIR, { recursive: true });
	await writeFile(cached, jar);
	return jar;
}

/** version from argv[2] or the latest release */
export async function resolveVersion() {
	const manifest = await getJson<Manifest>(MANIFEST_URL);
	return process.argv[2] ?? manifest.latest.release;
}

/**
 * Opens the client jar (downloaded once, cached in .cache/). `keepAssets` / `keepData` pick which
 * entries of `assets/minecraft/` and `data/minecraft/` are unpacked (paths relative to those).
 */
export async function openClientJar(
	version: string,
	keepAssets: (path: string) => boolean,
	keepData: (path: string) => boolean = () => false,
) {
	const jar = unzipSync(await downloadClientJar(version), {
		filter: (f) =>
			(f.name.startsWith(ASSETS) && keepAssets(f.name.slice(ASSETS.length))) ||
			(f.name.startsWith(DATA) && keepData(f.name.slice(DATA.length))),
	});
	const decoder = new TextDecoder();
	const read = (path: string) => {
		const data = jar[path];
		if (!data) throw new Error(`Missing ${path} in the client jar`);
		return data;
	};
	return {
		has: (path: string) => ASSETS + path in jar,
		file: (path: string) => read(ASSETS + path),
		json: <T>(path: string): T => JSON.parse(decoder.decode(read(ASSETS + path))),
		/** png ids inside an assets directory, e.g. list("textures/trims/entity/humanoid/") */
		list(dir: string) {
			return Object.keys(jar)
				.filter((f) => f.startsWith(ASSETS + dir) && f.endsWith(".png"))
				.map((f) => f.slice((ASSETS + dir).length, -".png".length))
				.sort();
		},
		dataJson: <T>(path: string): T => JSON.parse(decoder.decode(read(DATA + path))),
		hasData: (path: string) => DATA + path in jar,
		/** json file names (without extension) inside a data directory */
		dataList(dir: string) {
			return Object.keys(jar)
				.filter((f) => f.startsWith(DATA + dir) && f.endsWith(".json"))
				.map((f) => f.slice((DATA + dir).length, -".json".length))
				.sort();
		},
	};
}

export const titleCase = (id: string) =>
	id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

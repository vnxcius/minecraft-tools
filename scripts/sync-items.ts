/**
 * Keeps the item checklist in sync with a Minecraft release.
 *
 *   bun run items:sync            # latest release
 *   bun run items:sync 1.21.11    # specific version
 *
 * 1. Downloads the official client jar for the version (cached in .cache/).
 * 2. Reads the item ids from `assets/minecraft/items/*.json` and the display
 *    names from `assets/minecraft/lang/en_us.json`.
 * 3. Compares them with the icons in `public/items/<id>.webp`.
 * 4. Writes `src/data/items.json` with every item that has an icon and prints
 *    which icons are still missing (new items) or orphaned (removed items).
 *
 * Adding the missing icons to `public/items/` and running the script again is
 * all that's needed to ship a new version.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";

const ICONS_DIR = "public/items";
const OUTPUT = "src/data/items.json";
const CACHE_DIR = ".cache";
// has an item model but is not a real, obtainable item
const EXCLUDED = new Set(["air"]);
const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

interface Manifest {
	latest: { release: string; snapshot: string };
	versions: { id: string; url: string }[];
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function getClientJar(version: string): Promise<Uint8Array> {
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

const titleCase = (id: string) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function main() {
	const manifest = await getJson<Manifest>(MANIFEST_URL);
	const version = process.argv[2] ?? manifest.latest.release;
	console.log(`Minecraft version: ${version}`);

	const jar = unzipSync(await getClientJar(version), {
		filter: (f) =>
			f.name.startsWith("assets/minecraft/items/") || f.name === "assets/minecraft/lang/en_us.json",
	});

	const decoder = new TextDecoder();
	const lang: Record<string, string> = JSON.parse(
		decoder.decode(jar["assets/minecraft/lang/en_us.json"]),
	);

	const gameItems = Object.keys(jar)
		.filter((f) => f.endsWith(".json") && f.includes("/items/"))
		.map((f) => f.slice(f.lastIndexOf("/") + 1, -".json".length))
		.filter((id) => !EXCLUDED.has(id))
		.sort();

	const icons = new Set(
		(await readdir(ICONS_DIR))
			.filter((f) => f.endsWith(".webp"))
			.map((f) => f.slice(0, -".webp".length)),
	);

	const items = gameItems
		.filter((id) => icons.has(id))
		.map((id) => ({
			id,
			name: lang[`item.minecraft.${id}`] ?? lang[`block.minecraft.${id}`] ?? titleCase(id),
		}));

	const missing = gameItems.filter((id) => !icons.has(id));
	const gameSet = new Set(gameItems);
	const orphaned = [...icons].filter((id) => !gameSet.has(id)).sort();

	await writeFile(OUTPUT, `${JSON.stringify({ version, items }, null, "\t")}\n`);

	console.log(`\nWrote ${OUTPUT}: ${items.length} items with icons.`);
	console.log(`Items in game: ${gameItems.length}`);
	if (missing.length) {
		console.log(`\n${missing.length} items WITHOUT an icon (add ${ICONS_DIR}/<id>.webp):`);
		for (const id of missing) console.log(`  ${id}`);
	}
	if (orphaned.length) {
		console.log(
			`\n${orphaned.length} icons that are no longer items in ${version} (safe to delete):`,
		);
		for (const id of orphaned) console.log(`  ${id}.webp`);
	}
	if (!missing.length && !orphaned.length) console.log("Everything is in sync.");
}

await main();

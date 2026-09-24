/**
 * Syncs the item catalog with the mcitemgallery.com public CDN.
 *
 *   bun run items:sync
 *
 * The CDN publishes item icons per Minecraft version. The "images" source is
 * incremental (a version folder only holds the icons that changed since the
 * previous version) while "images-v2" ships full sets. For every version the
 * script works out which folder holds the current icon of every item and writes:
 *
 *   src/data/versions.json          versions, newest first, with their CDN source
 *   src/data/item-names.json        item id -> display name
 *   src/data/items/<version>.json   item id -> CDN folder version of its icon
 *
 * When a new version shows up on the CDN, running this is all that's needed.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CDN = "https://mcitemgallery.com";
const SOURCES = ["images", "images-v2"] as const;
type Source = (typeof SOURCES)[number];

const DATA_DIR = "src/data";
const ITEMS_DIR = join(DATA_DIR, "items");

interface VersionList {
	versions: string[];
	base: string;
}
interface Manifest {
	images: string[];
}
interface Changes {
	added?: string[];
	modified?: string[];
}
interface IndexEntry {
	displayName: string;
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

/** "1.21.10" > "1.21.9" > "1.9"; "26.2" > "1.21.10" */
function compareVersions(a: string, b: string): number {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
		if (diff) return diff;
	}
	return 0;
}

const stripExt = (file: string) => file.replace(/\.png$/, "");
const titleCase = (id: string) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** one entry per line so git diffs stay readable */
const toLines = (obj: Record<string, string>) => {
	const entries = Object.entries(obj).map(
		([k, v]) => `\t${JSON.stringify(k)}: ${JSON.stringify(v)}`,
	);
	return `{\n${entries.join(",\n")}\n}\n`;
};

async function syncSource(source: Source) {
	const { versions, base } = await getJson<VersionList>(`${CDN}/${source}/versions.json`);
	const ordered = [...versions].sort(compareVersions);

	// item id -> folder version holding its latest icon, updated as we walk forward
	const folderOf = new Map<string, string>();
	const result: { version: string; items: Record<string, string> }[] = [];

	for (const version of ordered) {
		const manifest = await getJson<Manifest>(`${CDN}/${source}/${version}/manifest.json`);
		if (version === base) {
			for (const file of manifest.images) folderOf.set(stripExt(file), version);
		} else {
			const changes = await getJson<Changes>(`${CDN}/${source}/${version}/changes.json`);
			for (const file of [...(changes.added ?? []), ...(changes.modified ?? [])]) {
				folderOf.set(stripExt(file), version);
			}
		}

		const items: Record<string, string> = {};
		for (const file of [...manifest.images].sort()) {
			const id = stripExt(file);
			const folder = folderOf.get(id);
			if (!folder) throw new Error(`${source}/${version}: no icon for ${id}`);
			items[id] = folder;
		}
		result.push({ version, items });
	}
	return result;
}

async function main() {
	const all = new Map<string, { source: Source; items: Record<string, string> }>();
	for (const source of SOURCES) {
		for (const { version, items } of await syncSource(source)) {
			// same version on both sources: prefer the newer "images-v2"
			all.set(version, { source, items });
		}
	}

	const versions = [...all.keys()].sort((a, b) => compareVersions(b, a));

	const index = await getJson<Record<string, IndexEntry>>(`${CDN}/metadata/items-index.json`);
	const names: Record<string, string> = {};
	const ids = new Set([...all.values()].flatMap((v) => Object.keys(v.items)));
	for (const id of [...ids].sort()) {
		names[id] = index[`${id}.png`]?.displayName ?? titleCase(id);
	}

	await mkdir(ITEMS_DIR, { recursive: true });
	for (const file of await readdir(ITEMS_DIR)) {
		await rm(join(ITEMS_DIR, file));
	}
	for (const [version, { items }] of all) {
		await writeFile(join(ITEMS_DIR, `${version}.json`), toLines(items));
	}
	await writeFile(
		join(DATA_DIR, "versions.json"),
		`${JSON.stringify(
			versions.map((id) => ({ id, source: all.get(id)?.source })),
			null,
			"\t",
		)}\n`,
	);
	await writeFile(join(DATA_DIR, "item-names.json"), toLines(names));

	console.log(`Synced ${versions.length} versions, ${ids.size} distinct items:`);
	for (const v of versions) {
		const entry = all.get(v);
		console.log(
			`  ${v.padEnd(8)} ${Object.keys(entry?.items ?? {}).length} items (${entry?.source})`,
		);
	}
}

await main();

/**
 * Enchanting table data of every supported Java Edition version, straight from the game.
 *
 *   bun run enchanting:sync
 *
 * Needs a JDK 25 or newer (`java` and `javac` on the PATH, or JAVA_HOME): the official server jar
 * of each version below is downloaded to .cache/servers/ and scripts/enchanting/Probe.java runs the
 * game's own code on it, through Mojang's name mappings (there are none before 1.14.4, so older
 * versions are not covered):
 *
 *   before 1.21  enchantments live in code: their weights, level cost ranges and conflicts, and the
 *                candidates EnchantmentHelper offers each item at every cost, are all asked from it
 *   1.20.5       the items an enchantment goes on became item tags named in its code definition;
 *                tags are data files, so these are read from the jar
 *   1.21 on      enchantments are data files (data/minecraft/enchantment, the in_enchanting_table
 *                tag and item tags), read from the jar; only the enchantability comes from the code
 *   26.1 on      item components are bound with the world, so the enchantability comes from the
 *                game's data generator report (--reports) instead
 *
 * Versions with the same data are merged into one choice. Before writing, the calculator is checked
 * against the game: its candidates must match the game's at every cost, and its odds must match
 * 200,000 enchantments rolled by the game's selectEnchantment for a few items and costs.
 *
 * Writes src/data/enchanting.json.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { unzipSync } from "fflate";

const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const CACHE = join(".cache", "servers");
const OUT = "src/data/enchanting.json";

/**
 * Versions asked, oldest first. The last patch of each update, plus both sides of every change
 * found, so each choice's range is exact.
 */
const VERSIONS = [
	"1.14.4",
	"1.15.2",
	"1.16",
	"1.16.1",
	"1.16.5",
	"1.17.1",
	"1.18.2",
	"1.19.4",
	"1.20.1",
	"1.20.4",
	"1.20.5",
	"1.20.6",
	"1.21",
	"1.21.1",
	"1.21.3",
	"1.21.4",
	"1.21.5",
	"1.21.8",
	"1.21.9",
	"1.21.10",
	"1.21.11",
	"26.1.2",
	"26.2",
	"26.3",
];

/** item and cost pairs rolled by the game to check the odds against */
const SAMPLES = [
	"minecraft:diamond_sword@30",
	"minecraft:book@30",
	"minecraft:diamond_pickaxe@12",
	"minecraft:bow@20",
	"minecraft:golden_helmet@25",
	"minecraft:book@8",
];

const dataDriven = (version: string) => !/^1\.(1\d|20)(\.|$)/.test(version);
/** item components are only in the data generator's report */
const fromReport = (version: string) => !version.startsWith("1.");

const java = (tool: string) =>
	process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin", tool) : tool;

function run(cmd: string, args: string[], cwd?: string) {
	const result = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, cwd });
	if (result.status !== 0)
		throw new Error(`${cmd} ${args.slice(-3).join(" ")} failed:\n${result.stderr.slice(-2000)}`);
	return result.stdout;
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

type Manifest = { versions: { id: string; url: string; type: string }[] };
let manifest: Manifest | null = null;
/** the version manifest, fetched once */
const versionManifest = async () => (manifest ??= await getJson<Manifest>(MANIFEST_URL));

/** the server jar and its mappings in .cache/servers/<version>, and the jars of its classpath */
async function server(version: string) {
	const dir = join(CACHE, version);
	if (!existsSync(join(dir, "server.jar"))) {
		const entry = (await versionManifest()).versions.find((v) => v.id === version);
		if (!entry) throw new Error(`Unknown Minecraft version "${version}"`);
		const meta = await getJson<{
			downloads: Record<string, { url: string } | undefined>;
		}>(entry.url);
		console.log(`  downloading server ${version}...`);
		await mkdir(dir, { recursive: true });
		const mappings = meta.downloads.server_mappings;
		if (mappings)
			await writeFile(join(dir, "mappings.txt"), await (await fetch(mappings.url)).text());
		const jar = await (await fetch(meta.downloads.server!.url)).arrayBuffer();
		await writeFile(join(dir, "server.jar"), new Uint8Array(jar));
	}
	// since 1.18 the server jar is a bundle: the game and its libraries are jars inside it
	const bundle = unzipSync(new Uint8Array(await readFile(join(dir, "server.jar"))), {
		filter: (f) =>
			f.name.startsWith("META-INF/versions/") || f.name.startsWith("META-INF/libraries/"),
	});
	const classpath: string[] = [];
	let game = join(dir, "server.jar");
	for (const [name, bytes] of Object.entries(bundle)) {
		if (!name.endsWith(".jar")) continue;
		const target = join(dir, "lib", name.split("/").pop() as string);
		await mkdir(join(dir, "lib"), { recursive: true });
		if (!existsSync(target)) await writeFile(target, bytes);
		classpath.push(target);
		if (name.startsWith("META-INF/versions/")) game = target;
	}
	if (!classpath.length) classpath.push(game);
	const mappings = join(dir, "mappings.txt");
	return { dir, classpath, game, mappings: existsSync(mappings) ? mappings : null };
}

interface ProbeEnchantment {
	weight: number;
	/** 1.20.5 and 1.20.6: the item tags of the definition */
	supported?: string;
	primary?: string;
	minLevel: number;
	costs: [number, number][];
	incompatible: string[];
}

interface Probe {
	enchantments?: Record<string, ProbeEnchantment>;
	items: Record<string, { enchantability: number; enchantable: boolean; available?: string[][] }>;
	samples?: Record<string, Record<string, number>>;
}

/** enchantable items of the data generator's report: those with an enchantable and an enchantments component */
async function report(version: string): Promise<Probe> {
	const { dir } = await server(version);
	const out = join(dir, "generated");
	if (!existsSync(join(out, "reports"))) {
		spawnSync(
			java("java"),
			[
				"-DbundlerMainClass=net.minecraft.data.Main",
				"-jar",
				"server.jar",
				"--reports",
				"--output",
				"generated",
			],
			{ cwd: dir, stdio: "ignore" },
		);
	}
	const folder = join(out, "reports", "minecraft", "components", "item");
	const items: Probe["items"] = {};
	for (const file of await readdir(folder)) {
		const { components } = JSON.parse(await readFile(join(folder, file), "utf8"));
		const enchantable = components["minecraft:enchantable"];
		if (!enchantable) continue;
		items[`minecraft:${file.replace(/\.json$/, "")}`] = {
			enchantability: enchantable.value,
			enchantable: "minecraft:enchantments" in components,
		};
	}
	if (!items["minecraft:book"]) throw new Error(`No item components in the ${version} report`);
	return { items };
}

async function probe(version: string, classes: string): Promise<Probe> {
	if (fromReport(version)) return report(version);
	const { dir, classpath, mappings } = await server(version);
	const out = join(dir, "probe.json");
	const mode = dataDriven(version) ? "items" : "full";
	// the game writes a logs/ folder where it runs: keep it in the cache
	run(
		java("java"),
		[
			"-cp",
			[...classpath, classes].map((path) => resolve(path)).join(":"),
			"probe.Probe",
			mappings ? resolve(mappings) : "-",
			resolve(out),
			mode,
			...(mode === "full" ? [SAMPLES.join(";")] : []),
		],
		dir,
	);
	return JSON.parse(await readFile(out, "utf8"));
}

const strip = (id: string) => id.replace(/^minecraft:/, "");

/** the data files of the game jar: enchantments and the enchantment and item tags */
function dataFiles(gameJar: Uint8Array) {
	const files = unzipSync(gameJar, { filter: (f) => f.name.startsWith("data/minecraft/") });
	const json = (path: string) => {
		const bytes = files[`data/minecraft/${path}.json`];
		return bytes ? JSON.parse(new TextDecoder().decode(bytes)) : null;
	};
	const tagEntries = (kind: string, id: string): string[] => {
		const tag = json(`tags/${kind}/${strip(id)}`) ?? json(`tags/${kind}s/${strip(id)}`);
		if (!tag) throw new Error(`Missing ${kind} tag ${id}`);
		return tag.values.flatMap((v: string | { id: string }) => {
			const ref = typeof v === "string" ? v : v.id;
			return ref.startsWith("#") ? tagEntries(kind, ref.slice(1)) : [ref];
		});
	};
	/** a holder set: an id, a #tag or a list of ids */
	const set = (kind: string, value: string | string[]): string[] =>
		Array.isArray(value)
			? value
			: value.startsWith("#")
				? tagEntries(kind, value.slice(1))
				: [value];
	return { json, set };
}

interface Era {
	/** first and last game version with this data; `to` is null for the latest */
	from: string;
	to: string | null;
	enchantments: Record<
		string,
		{ weight: number; costs: [number, number][]; incompatible: string[] }
	>;
	items: Record<string, { enchantability: number; enchantments: string[] }>;
}

type EraData = Omit<Era, "from" | "to">;

/** the same data in the same order, so equal data compares equal */
const sorted = (data: EraData): EraData => ({
	enchantments: Object.fromEntries(
		Object.entries(data.enchantments).sort(([a], [b]) => (a < b ? -1 : 1)),
	),
	items: Object.fromEntries(Object.entries(data.items).sort(([a], [b]) => (a < b ? -1 : 1))),
});

/** Enchantment.isPrimaryItem since 1.20.5: a supported item, and a primary one when the list exists */
const primaryItem = (supported: string[], primary: string[] | null, item: string) =>
	supported.includes(item) && (!primary || primary.includes(item));

/** before 1.21: what the game answered */
function fromCode(result: Probe, gameJar: Uint8Array): EraData {
	const all = result.enchantments as Record<string, ProbeEnchantment>;
	const offered = (item: string) =>
		new Set((result.items[item].available ?? []).flat().map((entry) => entry.split(" ")[0]));
	// the table's enchantments are the ones a book is ever offered
	const pool = [...offered("minecraft:book")].sort();
	const enchantments: EraData["enchantments"] = {};
	for (const id of pool) {
		const e = all[id];
		if (e.minLevel !== 1) throw new Error(`${id} starts at level ${e.minLevel}`);
		enchantments[id] = {
			weight: e.weight,
			costs: e.costs,
			incompatible: e.incompatible.filter((o) => pool.includes(o)).sort(),
		};
	}
	// with tags the probe cannot answer for items (tags load with a world): read them from the jar
	const tagged = pool.some((id) => all[id].supported);
	const { set } = dataFiles(gameJar);
	const takes = (id: string, item: string) =>
		primaryItem(
			set("item", `#${all[id].supported}`),
			all[id].primary ? set("item", `#${all[id].primary}`) : null,
			item,
		);
	const items: EraData["items"] = {};
	for (const [id, item] of Object.entries(result.items)) {
		if (!item.enchantable || item.enchantability <= 0) continue;
		items[id] = {
			enchantability: item.enchantability,
			enchantments:
				id === "minecraft:book"
					? []
					: tagged
						? pool.filter((e) => takes(e, id))
						: [...offered(id)].sort(),
		};
	}
	return { enchantments, items };
}

interface EnchantmentFile {
	weight: number;
	max_level: number;
	min_cost: { base: number; per_level_above_first: number };
	max_cost: { base: number; per_level_above_first: number };
	supported_items: string | string[];
	primary_items?: string | string[];
	exclusive_set?: string | string[];
}

/** 1.21 on: the data files, and the enchantability the game answered */
function fromData(result: Probe, gameJar: Uint8Array): EraData {
	const { json, set } = dataFiles(gameJar);
	const pool = set("enchantment", "#minecraft:in_enchanting_table").sort();
	const files = Object.fromEntries(
		pool.map((id) => [id, json(`enchantment/${strip(id)}`) as EnchantmentFile]),
	);
	const exclusive = (id: string) =>
		files[id].exclusive_set ? set("enchantment", files[id].exclusive_set) : [];
	const enchantments: EraData["enchantments"] = {};
	for (const id of pool) {
		const f = files[id];
		const cost = (c: EnchantmentFile["min_cost"], level: number) =>
			c.base + c.per_level_above_first * (level - 1);
		enchantments[id] = {
			weight: f.weight,
			costs: Array.from({ length: f.max_level }, (_, i) => [
				cost(f.min_cost, i + 1),
				cost(f.max_cost, i + 1),
			]),
			// Enchantment.areCompatible looks both ways
			incompatible: pool
				.filter((o) => o !== id && (exclusive(id).includes(o) || exclusive(o).includes(id)))
				.sort(),
		};
	}
	const takes = (id: string, item: string) =>
		primaryItem(
			set("item", files[id].supported_items),
			files[id].primary_items ? set("item", files[id].primary_items) : null,
			item,
		);
	const items: EraData["items"] = {};
	for (const [id, item] of Object.entries(result.items)) {
		if (!item.enchantable || item.enchantability <= 0) continue;
		items[id] = {
			enchantability: item.enchantability,
			enchantments: id === "minecraft:book" ? [] : pool.filter((e) => takes(e, id)),
		};
	}
	return { enchantments, items };
}

const classes = join(CACHE, "probe-classes");
await mkdir(classes, { recursive: true });
run(java("javac"), ["-d", classes, "scripts/enchanting/Probe.java"]);

const groups: { versions: string[]; data: EraData }[] = [];
const checks: { version: string; result: Probe; data: EraData }[] = [];
for (const version of VERSIONS) {
	console.log(`Minecraft ${version}`);
	const result = await probe(version, classes);
	const jar = new Uint8Array(await readFile((await server(version)).game));
	const data = sorted(dataDriven(version) ? fromData(result, jar) : fromCode(result, jar));
	checks.push({ version, result, data });
	const last = groups.at(-1);
	if (last && JSON.stringify(last.data) === JSON.stringify(data)) last.versions.push(version);
	else groups.push({ versions: [version], data });
	console.log(
		`  ${Object.keys(data.enchantments).length} enchantments, ${Object.keys(data.items).length} items`,
	);
}

// every release from the first version on, oldest first: a group lasts until the next one starts,
// which is only known when the release before the next group was asked too
const releases = (await versionManifest()).versions
	.filter((v) => v.type === "release")
	.map((v) => v.id)
	.reverse();
const eras: Era[] = groups.map((group, i) => {
	const next = groups[i + 1];
	if (!next) return { from: group.versions[0], to: null, ...group.data };
	const to = releases[releases.indexOf(next.versions[0]) - 1];
	if (to !== group.versions.at(-1))
		throw new Error(
			`Data changes between ${group.versions.at(-1)} and ${next.versions[0]}: ask ${to} too`,
		);
	return { from: group.versions[0], to, ...group.data };
});

/** one enchantment or item per line, so git diffs stay readable */
const lines = (obj: Record<string, unknown>) =>
	`{\n${Object.entries(obj)
		.map(([k, v]) => `\t\t\t\t${JSON.stringify(k)}: ${JSON.stringify(v)}`)
		.join(",\n")}\n\t\t\t}`;
await writeFile(
	OUT,
	`{\n\t"eras": [\n${eras
		.map(
			(era) =>
				`\t\t{\n\t\t\t"from": ${JSON.stringify(era.from)},\n\t\t\t"to": ${JSON.stringify(era.to)},\n\t\t\t"enchantments": ${lines(era.enchantments)},\n\t\t\t"items": ${lines(era.items)}\n\t\t}`,
		)
		.join(",\n")}\n\t]\n}\n`,
);
console.log(`\n${eras.length} different sets of data, wrote ${OUT}`);

// the calculator against the game
const { candidates, costOdds } = await import("../src/lib/enchanting");
let failed = false;
for (const { version, result, data } of checks) {
	const era = { from: version, to: version, ...data };
	// with item tags only a book gets candidates from the probe, the others are read from the tags
	const tagged = Object.values(result.enchantments ?? {}).some((e) => e.supported);
	for (const [item, info] of Object.entries(result.items)) {
		if (!info.available || !data.items[item] || (tagged && item !== "minecraft:book")) continue;
		info.available.forEach((expected, index) => {
			const got = candidates(era, item, index + 1)
				.map((c) => `${c.id} ${c.level}`)
				.sort();
			if (got.join() !== [...expected].sort().join()) {
				failed = true;
				console.error(`${version} ${item} at ${index + 1}: game ${expected}, calculator ${got}`);
			}
		});
	}
	for (const [sample, counts] of Object.entries(result.samples ?? {})) {
		const [item, cost] = sample.split("@");
		if (tagged && item !== "minecraft:book") continue;
		// the game's selectEnchantment alone: a book is not cut down to one enchantment less there,
		// the enchanting table does that afterwards
		const odds = costOdds(era, item, Number(cost), new Map(), false);
		const n = counts.n;
		let worst = 0;
		for (const [key, seen] of Object.entries(counts)) {
			if (key === "n") continue;
			const p = key.startsWith("#")
				? (odds.counts[Number(key.slice(1))] ?? 0)
				: (odds.enchantments.get(key) ?? 0);
			const sigma = Math.sqrt(Math.max(p * (1 - p), 1e-9) / n);
			worst = Math.max(worst, Math.abs(seen / n - p) / sigma);
		}
		if (worst > 5) failed = true;
		console.log(`  ${version} ${sample}: largest gap ${worst.toFixed(1)} standard deviations`);
	}
}
if (failed) {
	console.error("\nThe calculator does not match the game.");
	process.exit(1);
}
console.log("\nThe calculator matches the game.");

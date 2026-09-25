/**
 * Official game names in every language of the site, from Minecraft's own language files.
 *
 *   bun run lang:sync            # latest release
 *   bun run lang:sync 26.3       # a specific version
 *
 * English comes from the client jar (cached in .cache/), the other languages are game assets
 * downloaded from Mojang. Writes src/data/lang/<language>.json with
 *
 *   items   item id of the catalog -> name (variants like enchanted books get a name built from
 *           the official parts, e.g. "Enchanted Book (Aqua Affinity)")
 *   terms   the language keys the tools use: biomes, enchantments, effects, potions, banner
 *           patterns, trims, colors, firework stars, dimensions...
 *
 * Run it after items:sync, when a release adds items or renames things.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { openClientJar, resolveVersion } from "./lib/jar";

const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const OUT_DIR = "src/data/lang";

const LANGUAGES = { en: "en_us", "pt-BR": "pt_br", es: "es_es" } as const;

/** language keys the tools read, by prefix */
const TERM_PREFIXES = [
	"biome.minecraft.",
	"enchantment.minecraft.",
	"enchantment.level.",
	"effect.minecraft.",
	"item.minecraft.potion.effect.",
	"item.minecraft.splash_potion.effect.",
	"item.minecraft.lingering_potion.effect.",
	"item.minecraft.tipped_arrow.effect.",
	"potion.potency.",
	"block.minecraft.banner.",
	"trim_pattern.minecraft.",
	"trim_material.minecraft.",
	"color.minecraft.",
	"item.minecraft.firework_star.",
	"item.minecraft.firework_rocket.",
	"merchant.level.",
	"entity.minecraft.villager",
];
const TERM_KEYS = [
	"flat_world_preset.minecraft.overworld",
	"advancements.nether.root.title",
	"biome.minecraft.the_end",
	"block.minecraft.end_gateway",
	"block.minecraft.ominous_banner",
	"mco.backup.entry.seed",
	"language.name",
	"language.region",
	"entity.minecraft.wandering_trader",
];

/** items of old versions that the game renamed; they take the current name */
const LEGACY: Record<string, string> = {
	cactus_green: "green_dye",
	dandelion_yellow: "yellow_dye",
	rose_red: "red_dye",
	grass_path: "dirt_path",
	zombie_pigman_spawn_egg: "zombified_piglin_spawn_egg",
};

const POTION_ITEMS = ["potion", "splash_potion", "lingering_potion"];

type Lang = Record<string, string>;

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function downloadLanguages(version: string): Promise<Record<keyof typeof LANGUAGES, Lang>> {
	const manifest = await getJson<{ versions: { id: string; url: string }[] }>(MANIFEST_URL);
	const entry = manifest.versions.find((v) => v.id === version);
	if (!entry) throw new Error(`Unknown Minecraft version "${version}"`);
	const meta = await getJson<{ assetIndex: { url: string } }>(entry.url);
	const index = await getJson<{ objects: Record<string, { hash: string }> }>(meta.assetIndex.url);

	const asset = async (file: string) => {
		const object = index.objects[`minecraft/lang/${file}.json`];
		if (!object) throw new Error(`No ${file} language in ${version}`);
		const { hash } = object;
		return getJson<Lang>(`https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`);
	};
	// English is not an asset, it ships inside the client jar
	const jar = await openClientJar(version, (f) => f === "lang/en_us.json");
	return {
		en: jar.json<Lang>("lang/en_us.json"),
		"pt-BR": await asset(LANGUAGES["pt-BR"]),
		es: await asset(LANGUAGES.es),
	};
}

const slug = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");

/** catalog ids of every version, plus the items villagers trade (some have no icon) */
async function catalogIds() {
	const ids = new Set<string>();
	const villagers = JSON.parse(await readFile("src/data/villagers.json", "utf8"));
	JSON.stringify(villagers).replace(/"item":"([a-z0-9_]+)"/g, (_, id: string) => {
		ids.add(id);
		return "";
	});
	for (const file of await readdir("src/data/items")) {
		const items: Record<string, string> = JSON.parse(
			await readFile(join("src/data/items", file), "utf8"),
		);
		for (const id of Object.keys(items)) ids.add(id);
	}
	return [...ids].sort();
}

/**
 * Names of the catalog items in one language. Variants carry their meaning in the id:
 * `enchanted_book__enchanted_book_aqua_affinity__<hash>`, `potion__potion_of_swiftness__<hash>`,
 * and tipped arrows share the hash of the potion they carry.
 */
function itemNames(ids: string[], lang: Lang, en: Lang, fallback: Record<string, string>) {
	const plain = (id: string) => {
		const current = LEGACY[id] ?? id;
		return lang[`item.minecraft.${current}`] ?? lang[`block.minecraft.${current}`];
	};

	// English potion names as slugs, back to the effect id: "potion_of_swiftness" -> swiftness
	const potionEffect = new Map<string, string>();
	for (const key of Object.keys(en)) {
		const match = key.match(
			/^item\.minecraft\.(potion|splash_potion|lingering_potion)\.effect\.(.+)$/,
		);
		if (match) potionEffect.set(`${match[1]}:${slug(en[key])}`, match[2]);
	}
	// the hash of a potion variant -> its effect, for the tipped arrows
	const effectOfHash = new Map<string, string>();
	for (const id of ids) {
		const [base, variant, hash] = id.split("__");
		const effect = POTION_ITEMS.includes(base) ? potionEffect.get(`${base}:${variant}`) : undefined;
		if (effect && hash) effectOfHash.set(hash, effect);
	}
	const enchantments = Object.keys(en)
		.filter((key) => key.startsWith("enchantment.minecraft."))
		.map((key) => key.slice("enchantment.minecraft.".length))
		.sort((a, b) => b.length - a.length);
	const ROMAN = ["i", "ii", "iii", "iv", "v"];

	const names: Record<string, string> = {};
	const unnamed: string[] = [];
	for (const id of ids) {
		const [base, variant = "", hash = variant] = id.split("__");
		let name: string | undefined;

		if (base === "enchanted_book" && variant) {
			const rest = variant.replace(/^enchanted_book_/, "");
			const enchantment = enchantments.find((e) => rest === e || rest.startsWith(`${e}_`));
			if (enchantment) {
				const level = ROMAN.indexOf(rest.slice(enchantment.length + 1)) + 1;
				const label = lang[`enchantment.minecraft.${enchantment}`];
				const roman = level > 0 ? ` ${lang[`enchantment.level.${level}`]}` : "";
				name = `${plain(base)} (${label}${roman})`;
			}
		} else if (POTION_ITEMS.includes(base) && variant) {
			const effect = potionEffect.get(`${base}:${variant}`);
			if (effect) name = lang[`item.minecraft.${base}.effect.${effect}`];
		} else if (base === "tipped_arrow" && variant) {
			const effect = effectOfHash.get(hash);
			if (effect) name = lang[`item.minecraft.tipped_arrow.effect.${effect}`];
		} else if (variant.startsWith("ominous_banner")) {
			name = lang["block.minecraft.ominous_banner"];
		}

		name ??= plain(base);
		if (!name) {
			unnamed.push(id);
			name = fallback[id] ?? id;
		}
		names[id] = name;
	}
	return { names, unnamed };
}

/** one entry per line so git diffs stay readable */
const toLines = (obj: Record<string, string>) =>
	`{\n${Object.entries(obj)
		.map(([k, v]) => `\t\t${JSON.stringify(k)}: ${JSON.stringify(v)}`)
		.join(",\n")}\n\t}`;

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const languages = await downloadLanguages(version);
const ids = await catalogIds();
const fallback: Record<string, string> = JSON.parse(
	await readFile("src/data/item-names.json", "utf8"),
);

await mkdir(OUT_DIR, { recursive: true });
for (const [site, lang] of Object.entries(languages)) {
	const { names, unnamed } = itemNames(ids, lang, languages.en, fallback);
	const terms: Record<string, string> = {};
	for (const key of Object.keys(languages.en).sort()) {
		if (!TERM_KEYS.includes(key) && !TERM_PREFIXES.some((p) => key.startsWith(p))) continue;
		// a missing translation falls back to English, like the game does
		terms[key] = lang[key] ?? languages.en[key];
	}
	await writeFile(
		join(OUT_DIR, `${site}.json`),
		`{\n\t"version": ${JSON.stringify(version)},\n\t"items": ${toLines(names)},\n\t"terms": ${toLines(terms)}\n}\n`,
	);
	console.log(
		`  ${site.padEnd(6)} ${Object.keys(names).length} items, ${Object.keys(terms).length} terms` +
			(unnamed.length ? ` (no official name: ${unnamed.join(", ")})` : ""),
	);
}

/**
 * Extracts the banner pattern textures and metadata from the official client jar.
 *
 *   bun run banner:sync            # latest release
 *   bun run banner:sync 26.3       # specific version
 *
 * Writes:
 *   public/banner/<pattern>.png   grayscale pattern masks (+ base.png and banner_base.png)
 *   src/data/banner.json          patterns with names, required pattern items and their recipes
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { openClientJar, resolveVersion, titleCase } from "./lib/jar";

const OUT_DIR = "public/banner";
const TEXTURES = "textures/entity/banner/";
const ITEM_TAGS = "tags/banner_pattern/pattern_item/";

// patterns that cannot be crafted: where to get their pattern item
const OBTAIN: Record<string, string> = {
	globe: "Sold by master-level cartographers",
	piglin: "Found in bastion remnant chests",
	flow: "Loot from trial chambers",
	guster: "Loot from trial chambers",
};

const stripNamespace = (id: string) => id.replace("minecraft:", "");

async function main() {
	const version = await resolveVersion();
	console.log(`Minecraft version: ${version}`);

	const jar = await openClientJar(
		version,
		(f) => f.startsWith(TEXTURES) || f === "lang/en_us.json",
		(f) =>
			f.startsWith(ITEM_TAGS) || (f.startsWith("recipe/") && f.endsWith("_banner_pattern.json")),
	);
	const lang = jar.json<Record<string, string>>("lang/en_us.json");

	await mkdir(OUT_DIR, { recursive: true });
	const ids = jar.list(TEXTURES).filter((id) => id !== "banner_base" && id !== "base");
	for (const id of [...ids, "base", "banner_base"]) {
		await writeFile(join(OUT_DIR, `${id}.png`), jar.file(`${TEXTURES}${id}.png`));
	}

	// pattern id -> the pattern item it needs in the loom (+ crafting recipe when there is one)
	const patternItems = new Map<string, { item: string; recipe?: string[] }>();
	for (const tag of jar.dataList(ITEM_TAGS)) {
		const item = `${tag}_banner_pattern`;
		const recipe = jar.hasData(`recipe/${item}.json`)
			? jar
					.dataJson<{ ingredients?: string[] }>(`recipe/${item}.json`)
					.ingredients?.map(stripNamespace)
			: undefined;
		for (const value of jar.dataJson<{ values: string[] }>(`${ITEM_TAGS}${tag}.json`).values) {
			patternItems.set(stripNamespace(value), { item, recipe });
		}
	}

	const patterns = ids.map((id) => {
		const required = patternItems.get(id);
		return {
			id,
			// "White Bordure" -> "Bordure"
			name: lang[`block.minecraft.banner.${id}.white`]?.replace(/^White /, "") ?? titleCase(id),
			...(required && {
				item: required.item,
				...(required.recipe
					? { recipe: required.recipe }
					: { obtain: OBTAIN[id] ?? "Not craftable" }),
			}),
		};
	});

	await writeFile("src/data/banner.json", `${JSON.stringify({ version, patterns }, null, "\t")}\n`);
	console.log(`Banner: ${patterns.length} patterns, ${patternItems.size} need a pattern item.`);
}

await main();

/**
 * Textures of the enchanting table viewer, from the official client jar.
 *
 *   bun run enchanting-scene:sync            # latest release
 *   bun run enchanting-scene:sync 26.3       # a specific version
 *
 * Writes public/enchanting/: the table, bookshelf and floor blocks, the floating book, the 26
 * glyphs that fly into the table side by side in glyphs.png, and in items/ the sprite of every item
 * the enchanting table data knows (src/data/enchanting.json). Each sprite is found the way the game
 * does it: items/<id>.json picks the model shown on the ground, its layers are drawn on top of each
 * other and a dye tint (leather) colors its layer.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import { openClientJar, resolveVersion } from "./lib/jar";

const OUT_DIR = "public/enchanting";
const BLOCKS = [
	"enchanting_table_top",
	"enchanting_table_side",
	"enchanting_table_bottom",
	"bookshelf",
	"oak_planks",
	"stone_bricks",
];
const BOOK = "entity/enchantment/enchanting_table_book";
const GLYPHS = "abcdefghijklmnopqrstuvwxyz".split("");

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const jar = await openClientJar(
	version,
	(f) =>
		f.startsWith("items/") ||
		f.startsWith("models/item/") ||
		f.startsWith("textures/item/") ||
		f.startsWith("textures/particle/sga_") ||
		f === `textures/${BOOK}.png` ||
		BLOCKS.some((b) => f === `textures/block/${b}.png`),
);

const strip = (id: string) => id.replace(/^minecraft:/, "");

// a model tree of items/<id>.json, as far as it matters here
interface ItemModel {
	type: string;
	model?: string | ItemModel;
	tints?: { type: string; default?: number; value?: number }[];
	property?: string;
	cases?: { when: string | string[]; model: ItemModel }[];
	fallback?: ItemModel;
	on_false?: ItemModel;
	base?: string;
}

/** the model a dropped item shows: the "ground" case of a display select, otherwise the default */
function groundModel(node: ItemModel): { model: string; tints: ItemModel["tints"] } {
	const type = strip(node.type);
	if (type === "model") return { model: node.model as string, tints: node.tints };
	if (type === "select") {
		const ground =
			strip(node.property ?? "") === "display_context" &&
			node.cases?.find((c) => [c.when].flat().includes("ground"));
		return groundModel(ground ? ground.model : (node.fallback as ItemModel));
	}
	if (type === "condition") return groundModel(node.on_false as ItemModel);
	if (type === "range_dispatch") return groundModel(node.fallback as ItemModel);
	throw new Error(`Unsupported item model ${node.type}`);
}

/** layer0, layer1... of a model, following its parents */
function layers(model: string): string[] {
	const path = `models/${strip(model)}.json`;
	const json = jar.json<{ parent?: string; textures?: Record<string, string> }>(path);
	const found = Object.entries(json.textures ?? {})
		.filter(([key]) => /^layer\d+$/.test(key))
		.sort(([a], [b]) => Number(a.slice(5)) - Number(b.slice(5)))
		.map(([, texture]) => texture);
	if (found.length || !json.parent) return found;
	return layers(json.parent);
}

const png = (path: string) => PNG.sync.read(Buffer.from(jar.file(path)));

/** the sprite of an item: its layers over each other, tinted where the model says so */
function sprite(id: string) {
	const { model, tints } = groundModel(jar.json<{ model: ItemModel }>(`items/${id}.json`).model);
	const out = new PNG({ width: 16, height: 16 });
	layers(model).forEach((texture, index) => {
		const layer = png(`textures/${strip(texture)}.png`);
		if (layer.width !== 16) throw new Error(`${texture} is ${layer.width}px wide`);
		const tint = tints?.[index];
		const color = tint ? (tint.default ?? tint.value ?? -1) : -1;
		const [tr, tg, tb] = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
		for (let i = 0; i < 16 * 16 * 4; i += 4) {
			const a = layer.data[i + 3];
			if (!a) continue;
			out.data[i] = (layer.data[i] * tr) / 255;
			out.data[i + 1] = (layer.data[i + 1] * tg) / 255;
			out.data[i + 2] = (layer.data[i + 2] * tb) / 255;
			out.data[i + 3] = a;
		}
	});
	return PNG.sync.write(out);
}

await mkdir(join(OUT_DIR, "items"), { recursive: true });
for (const block of BLOCKS)
	await writeFile(join(OUT_DIR, `${block}.png`), jar.file(`textures/block/${block}.png`));
await writeFile(join(OUT_DIR, "book.png"), jar.file(`textures/${BOOK}.png`));

const atlas = new PNG({ width: 8 * GLYPHS.length, height: 8 });
GLYPHS.forEach((letter, i) => {
	const glyph = png(`textures/particle/sga_${letter}.png`);
	PNG.bitblt(glyph, atlas, 0, 0, 8, 8, i * 8, 0);
});
await writeFile(join(OUT_DIR, "glyphs.png"), PNG.sync.write(atlas));

const data: { eras: { items: Record<string, unknown> }[] } = JSON.parse(
	await readFile("src/data/enchanting.json", "utf8"),
);
const items = [...new Set(data.eras.flatMap((era) => Object.keys(era.items)))].map(strip).sort();
for (const id of items) await writeFile(join(OUT_DIR, "items", `${id}.png`), sprite(id));
console.log(
	`Enchanting scene: ${BLOCKS.length} blocks, the book, ${GLYPHS.length} glyphs, ${items.length} items.`,
);

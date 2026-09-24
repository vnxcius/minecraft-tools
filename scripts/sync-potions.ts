/**
 * Extracts the potion bottle, tipped arrow and status effect textures from the official client jar.
 *
 *   bun run potions:sync            # latest release
 *   bun run potions:sync 26.3       # specific version
 *
 * Writes public/potion/*.png (item textures) and public/potion/effect/<effect>.png.
 * The brewing recipes themselves live in src/lib/potions.ts, they are not part of the client assets.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { openClientJar, resolveVersion } from "./lib/jar";

const OUT_DIR = "public/potion";
const ITEMS = [
	"potion",
	"potion_overlay",
	"splash_potion",
	"lingering_potion",
	"tipped_arrow_base",
	"tipped_arrow_head",
];

async function main() {
	const version = await resolveVersion();
	console.log(`Minecraft version: ${version}`);

	const jar = await openClientJar(
		version,
		(f) =>
			f.startsWith("textures/mob_effect/") || ITEMS.some((i) => f === `textures/item/${i}.png`),
	);

	await mkdir(join(OUT_DIR, "effect"), { recursive: true });
	for (const item of ITEMS) {
		await writeFile(join(OUT_DIR, `${item}.png`), jar.file(`textures/item/${item}.png`));
	}
	const effects = jar.list("textures/mob_effect/");
	for (const effect of effects) {
		await writeFile(
			join(OUT_DIR, "effect", `${effect}.png`),
			jar.file(`textures/mob_effect/${effect}.png`),
		);
	}
	console.log(`Potions: ${ITEMS.length} item textures, ${effects.length} effect icons.`);
}

await main();

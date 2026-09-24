/**
 * Extracts a few block textures used as decoration (dirt footer, stone hero).
 *
 *   bun run decor:sync            # latest release
 *
 * Writes public/decor/<block>.png.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { openClientJar, resolveVersion } from "./lib/jar";

const OUT_DIR = "public/decor";
const BLOCKS = ["dirt", "stone", "deepslate"];

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const jar = await openClientJar(version, (f) =>
	BLOCKS.some((b) => f === `textures/block/${b}.png`),
);

await mkdir(OUT_DIR, { recursive: true });
for (const block of BLOCKS) {
	await writeFile(join(OUT_DIR, `${block}.png`), jar.file(`textures/block/${block}.png`));
}
console.log(`Decor: ${BLOCKS.length} block textures.`);

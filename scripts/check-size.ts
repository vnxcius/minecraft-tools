/**
 * Fails the build when what every visitor downloads grows past its budget: the app's entry script
 * (on every page, before anything shows) and the seed map's engine. Raise a budget on purpose, when
 * the growth is worth it.
 *
 *   bun run build   (runs this after the prerender)
 */
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";
const KB = 1024;

const html = await readFile(join(DIST, "index.html"), "utf8");
const entry = html.match(/<script type="module"[^>]* src="\/([^"]+)"/)?.[1];
if (!entry) throw new Error("dist/index.html has no entry script");

const BUDGETS: { file: string; max: number }[] = [
	// 406 KB when this was set
	{ file: entry, max: 420 * KB },
	// 501 KB without debug info (scripts/build-engine.ts strips it)
	{ file: "engine/engine.wasm", max: 540 * KB },
];

let over = false;
for (const { file, max } of BUDGETS) {
	const { size } = await stat(join(DIST, file));
	if (size > max) {
		over = true;
		console.error(`${file} is ${Math.round(size / KB)} KB, over its ${max / KB} KB budget`);
	}
}
if (over) process.exit(1);
console.log("Every file is within its size budget.");

/**
 * The related tools shown under every tool, picked from what the tools are made of (see
 * scripts/lib/related.ts): the game data and code they share, and how alike their texts are.
 *
 *   bun run related:sync
 *
 * Writes src/data/related.json. Run it after adding a tool or changing what one is about; the tests
 * fail while the file is out of date.
 */
import { writeFile } from "node:fs/promises";
import { pickRelated, rankRelated, toolTexts } from "./lib/related";

const OUT = "src/data/related.json";

const ranking = rankRelated(await toolTexts());
const picked = pickRelated(ranking);
for (const [id, list] of Object.entries(ranking)) {
	const shown = list
		.slice(0, picked[id].length)
		.map(
			(r) => `${r.id} ${r.score.toFixed(2)} (code ${r.code.toFixed(2)}, text ${r.text.toFixed(2)})`,
		);
	console.log(`${id}\n  ${shown.join("\n  ")}`);
}
await writeFile(OUT, `${JSON.stringify(picked, null, "\t")}\n`);
console.log(`\nWrote ${OUT}`);

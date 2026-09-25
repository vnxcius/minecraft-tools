/**
 * Picks the related tools of every tool from what the tools are made of, so nobody has to keep the
 * lists by hand. Two signals, both weighed by how rare they are (tf-idf, cosine similarity):
 *
 *   code      the game data and game logic a tool's page loads (src/data, src/lib), following its
 *             imports from src/routes/tool/<id>.tsx: tools that read the same data (enchantments,
 *             the world generator, banner patterns...) are about the same thing. Ui parts and
 *             packages say how a page is built, not what it is about, so they do not count.
 *   text      the words of the tool's title, description, search result text and its own page text.
 *   category  a small nudge towards the tools of the same menu category.
 *
 * Run by scripts/sync-related.ts; tests/site.test.ts checks that src/data/related.json is current.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/** how much each signal counts, they add up to 1 */
const CODE_WEIGHT = 0.5;
const TEXT_WEIGHT = 0.35;
const CATEGORY_WEIGHT = 0.15;

/** always this many related tools, and one more when it is related enough */
export const MIN_RELATED = 4;
export const MAX_RELATED = 5;
/** the extra tool has to be at least as related as a tool of the same category with nothing else in common */
const EXTRA_SCORE = CATEGORY_WEIGHT;

/** files under src/lib that are plumbing, not about the game */
const PLUMBING = new Set([
	"src/lib/utils.ts",
	"src/lib/seo.ts",
	"src/lib/theme.ts",
	"src/lib/image.ts",
]);

/** what a module is about, or null when it says nothing about the tool */
const isDomain = (file: string) =>
	(file.startsWith("src/lib/") || file.startsWith("src/data/")) && !PLUMBING.has(file);

export interface ToolText {
	id: string;
	category: string;
	/** every text that describes the tool, in English */
	text: string[];
}

const EXTENSIONS = [".ts", ".tsx", ".json", "/index.ts", "/index.tsx"];

/** a module the page imports: a file of the project, or a package name */
function resolveImport(from: string, spec: string): string | null {
	let base: string;
	if (spec.startsWith("@/")) base = join("src", spec.slice(2));
	else if (spec.startsWith(".")) base = join(dirname(from), spec);
	else {
		// a package: keep its name, "three/addons/..." counts as three
		const parts = spec.split("/");
		return `package:${spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]}`;
	}
	// ?raw, ?url and the like
	base = base.replace(/\?.*$/, "");
	if (existsSync(base) && !base.endsWith("/") && /\.\w+$/.test(base)) return base;
	for (const ext of EXTENSIONS) if (existsSync(base + ext)) return base + ext;
	return null;
}

const IMPORT =
	/(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']|new URL\(\s*["']([^"']+)["']/g;

/** the tool a route only redirects to (the slime chunk finder is the seed map), if it does */
function redirectTarget(id: string) {
	const source = readFileSync(join("src", "routes", "tool", `${id}.tsx`), "utf8");
	return source.match(/redirect\(\{\s*to:\s*"\/tool\/([\w-]+)"/)?.[1] ?? null;
}

/** everything a route loads, directly or not; a route that only redirects counts as its target */
function routeModules(id: string): Set<string> {
	const route = join("src", "routes", "tool", `${redirectTarget(id) ?? id}.tsx`);

	const seen = new Set<string>();
	const queue = [route];
	while (queue.length) {
		const file = queue.pop() as string;
		if (file.startsWith("package:") || file.endsWith(".json")) continue;
		const source = readFileSync(file, "utf8");
		for (const match of source.matchAll(IMPORT)) {
			const spec = match[1] ?? match[2] ?? match[3] ?? match[4];
			const target = resolveImport(file, spec);
			if (!target || seen.has(target)) continue;
			// other routes and the tool list itself say nothing about this tool
			if (target.startsWith(join("src", "routes")) || target.endsWith("components/tools.ts"))
				continue;
			seen.add(target);
			queue.push(target);
		}
	}
	return new Set([...seen].map((f) => (f.startsWith("package:") ? f : relative(".", f))));
}

const STOP_WORDS = new Set(
	`a an and are as at be by for from get how in into is it its of on or that the their them this
	to up with you your what which who all any every each more most than then there these those
	can will not no so do does just also out about over one two three minecraft tool tools free
	online browser calculator generator guide`.split(/\s+/),
);

/** words of a text, lower case, without the common ones, plural "s" cut */
function words(text: string): string[] {
	return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
		.filter((w) => w.length > 2 && !STOP_WORDS.has(w))
		.map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

type Vector = Map<string, number>;

/** tf-idf vectors of documents made of terms */
function tfidf(documents: string[][]): Vector[] {
	const df = new Map<string, number>();
	for (const doc of documents)
		for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
	return documents.map((doc) => {
		const vector: Vector = new Map();
		for (const term of doc) {
			const idf = Math.log(documents.length / (df.get(term) as number));
			if (idf > 0) vector.set(term, (vector.get(term) ?? 0) + idf);
		}
		return vector;
	});
}

function cosine(a: Vector, b: Vector) {
	let dot = 0;
	for (const [term, value] of a) dot += value * (b.get(term) ?? 0);
	const norm = (v: Vector) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));
	const n = norm(a) * norm(b);
	return n ? dot / n : 0;
}

export interface RelatedScore {
	id: string;
	score: number;
	code: number;
	text: number;
}

/** every other tool, most related first */
export function rankRelated(tools: ToolText[]): Record<string, RelatedScore[]> {
	const code = tfidf(tools.map((tool) => [...routeModules(tool.id)].filter(isDomain)));
	const text = tfidf(tools.map((tool) => tool.text.flatMap(words)));
	const out: Record<string, RelatedScore[]> = {};
	tools.forEach((tool, i) => {
		out[tool.id] = tools
			.flatMap((other, j) => {
				// a tool and the page it redirects to are the same page
				const alias = redirectTarget(tool.id) === other.id || redirectTarget(other.id) === tool.id;
				if (i === j || alias) return [];
				const c = cosine(code[i], code[j]);
				const t = cosine(text[i], text[j]);
				const same = tool.category === other.category ? 1 : 0;
				const score = CODE_WEIGHT * c + TEXT_WEIGHT * t + CATEGORY_WEIGHT * same;
				return [{ id: other.id, score, code: c, text: t }];
			})
			// equal scores keep the order of the tool list, so the result never flips between runs
			.sort((a, b) => b.score - a.score);
	});
	return out;
}

/** the related tools to show: the best four, and a fifth when it is related enough */
export const pickRelated = (ranking: Record<string, RelatedScore[]>) =>
	Object.fromEntries(
		Object.entries(ranking).map(([id, list]) => {
			const count = (list[MIN_RELATED]?.score ?? 0) >= EXTRA_SCORE ? MAX_RELATED : MIN_RELATED;
			return [id, list.slice(0, count).map((r) => r.id)];
		}),
	);

/**
 * What describes each tool, in English: its title and description, its search result text, and the
 * site text its own page shows (every message key its modules use).
 */
export async function toolTexts(): Promise<ToolText[]> {
	const { PAGES } = await import("../../src/lib/seo");
	// the categories, read from the tool list without loading it (it needs the bundler)
	const list = readFileSync("src/components/tools.ts", "utf8");
	const category = (id: string) =>
		list.match(new RegExp(`id: "${id}",[^}]*?category: "(\\w+)"`, "s"))?.[1] ?? "";
	const { en } = await import("../../src/i18n/messages/en");
	const messages = en as Record<string, string>;
	// the tools are the pages under /tool/ (src/components/tools.ts lists the same, tested)
	const ids = PAGES.filter((p) => p.path.startsWith("/tool/")).map((p) => p.path.slice(6));
	return ids.map((id) => {
		const page = PAGES.find((p) => p.path === `/tool/${id}`);
		const keys = new Set<string>();
		for (const file of routeModules(id)) {
			if (!/\.tsx?$/.test(file)) continue;
			for (const [, key] of readFileSync(file, "utf8").matchAll(/\btn?\(\s*["']([\w.-]+)["']/g))
				keys.add(key);
		}
		const own = [...keys].flatMap((key) =>
			[messages[key], messages[`${key}.one`], messages[`${key}.other`]].filter(Boolean),
		);
		return {
			id,
			category: category(id),
			text: [
				messages[`tool.${id}.title`],
				messages[`tool.${id}.description`],
				page?.title ?? "",
				page?.description ?? "",
				page?.heading ?? "",
				...own,
			],
		};
	});
}

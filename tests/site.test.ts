/** The pieces of the site that must agree: tools, routes, pages for search engines and translations. */
import { existsSync, readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { relatedTools, TOOLS } from "@/components/tools";
import related from "@/data/related.json";
import {
	MAX_RELATED,
	MIN_RELATED,
	pickRelated,
	rankRelated,
	toolTexts,
} from "../scripts/lib/related";
import { LANGUAGES } from "@/i18n/current";
import { MESSAGES } from "@/i18n/messages";
import { PAGE_TEXT } from "@/i18n/pages";
import { MOVED, PAGES } from "@/lib/seo";

describe("tools", () => {
	const paths = new Set<string>(TOOLS.map((tool) => tool.to));

	test("ids and paths are unique", () => {
		expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
		expect(paths.size).toBe(TOOLS.length);
	});

	test("every tool has its route and picture, and every route is a tool", () => {
		for (const tool of TOOLS) {
			expect(tool.to, tool.id).toBe(`/tool/${tool.id}`);
			expect(existsSync(`src/routes/tool/${tool.id}.tsx`), tool.id).toBe(true);
			expect(existsSync(`public${tool.image}`), tool.image).toBe(true);
		}
		for (const file of readdirSync("src/routes/tool"))
			expect(paths.has(`/tool/${file.replace(/\.tsx$/, "")}`), file).toBe(true);
	});

	test("each tool links four or five other existing tools", () => {
		for (const tool of TOOLS) {
			const links = relatedTools(tool);
			expect(links.length, tool.id).toBeGreaterThanOrEqual(MIN_RELATED);
			expect(links.length, tool.id).toBeLessThanOrEqual(MAX_RELATED);
			expect(new Set(links).size, tool.id).toBe(links.length);
			for (const other of links) expect(other.id, tool.id).not.toBe(tool.id);
		}
	});

	test("the related tools are up to date (bun run related:sync)", async () => {
		expect(pickRelated(rankRelated(await toolTexts()))).toEqual(related);
	});
});

describe("pages for search engines", () => {
	test("the home page and every tool have a page, and nothing else", () => {
		expect(PAGES.map((p) => p.path).sort()).toEqual(["/", ...TOOLS.map((t) => t.to)].sort());
	});

	test("titles and descriptions fit in search results, in every language", () => {
		const all = [
			...PAGES.map((page) => ({ language: "en", ...page })),
			...Object.entries(PAGE_TEXT).flatMap(([language, pages]) =>
				Object.entries(pages).map(([path, text]) => ({ language, path, ...text })),
			),
		];
		for (const page of all) {
			const where = `${page.language} ${page.path}`;
			expect(page.title.length, where).toBeLessThanOrEqual(66);
			expect(page.description.length, where).toBeGreaterThanOrEqual(70);
			expect(page.description.length, where).toBeLessThanOrEqual(160);
		}
	});

	test("moved pages point to a tool, and no tool lives at an old path", () => {
		const paths = new Set<string>(TOOLS.map((tool) => tool.to));
		for (const [from, to] of Object.entries(MOVED)) {
			expect(paths.has(to), `${from} -> ${to}`).toBe(true);
			expect(paths.has(from), from).toBe(false);
		}
	});

	test("every page is translated", () => {
		for (const pages of Object.values(PAGE_TEXT))
			expect(Object.keys(pages).sort()).toEqual(PAGES.map((p) => p.path).sort());
	});
});

describe("translations", () => {
	const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
	const english = MESSAGES.en as Record<string, string>;

	test("every language uses the same {placeholders} as English", () => {
		for (const { id } of LANGUAGES) {
			const messages = MESSAGES[id] as Record<string, string>;
			for (const [key, text] of Object.entries(english))
				expect(placeholders(messages[key]), `${id} ${key}`).toEqual(placeholders(text));
		}
	});

	test("no message is empty and plural messages have an 'other' form", () => {
		for (const { id } of LANGUAGES) {
			const messages = MESSAGES[id] as Record<string, string>;
			for (const [key, text] of Object.entries(messages)) {
				expect(text.trim(), `${id} ${key}`).not.toBe("");
				if (key.endsWith(".one"))
					expect(messages, `${id} ${key}`).toHaveProperty(key.replace(/one$/, "other"));
			}
		}
	});
});

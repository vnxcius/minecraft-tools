/**
 * Turns the single page app build into one html file per page, so crawlers and link previews get the
 * right title, description, canonical url, Open Graph tags and structured data without running any
 * JavaScript, and adds sitemap.xml.
 *
 *   bun run build   (runs `vite build` and then this)
 *
 * The tags come from src/lib/seo.ts, the same source the router uses at runtime. Everything written
 * here carries `data-prerender`, src/main.tsx removes it before the router renders its own copy.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { metaTags, PAGES, type Page, SITE_URL, structuredData, urlOf } from "../src/lib/seo";

const DIST = "dist";

const escape = (text: string) =>
	text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function headTags(page: Page) {
	const tags = metaTags(page).map((tag) => {
		if ("title" in tag) return `<title data-prerender>${escape(tag.title)}</title>`;
		const attrs = Object.entries(tag)
			.map(([key, value]) => `${key}="${escape(value)}"`)
			.join(" ");
		return `<meta ${attrs} data-prerender />`;
	});
	tags.push(`<link rel="canonical" href="${urlOf(page.path)}" data-prerender />`);
	for (const data of structuredData(page)) {
		// "<" cannot end the script element inside JSON
		const json = JSON.stringify(data).replace(/</g, "\u003c");
		tags.push(`<script type="application/ld+json" data-prerender>${json}</script>`);
	}
	return tags.join("\n\t\t");
}

/** readable content for the moment before the app renders (and for crawlers that never run it) */
function fallbackContent(page: Page) {
	const links = PAGES.filter((other) => other.path !== page.path)
		.map(
			(other) =>
				`<li><a href="${other.path}">${escape(other.heading === "Useful tools for Minecraft" ? "Home" : other.heading)}</a></li>`,
		)
		.join("");
	return `<main><h1>${escape(page.heading)}</h1><p>${escape(page.description)}</p><nav aria-label="Tools"><ul>${links}</ul></nav></main>`;
}

async function write(path: string, html: string) {
	await mkdir(join(DIST, path), { recursive: true });
	await writeFile(join(DIST, path, "index.html"), html);
}

async function main() {
	const template = await readFile(join(DIST, "index.html"), "utf8");
	if (!template.includes('<div id="root"></div>')) throw new Error("dist/index.html has no #root");

	for (const page of PAGES) {
		const html = template
			.replace("</head>", `\t${headTags(page)}\n\t</head>`)
			.replace('<div id="root"></div>', `<div id="root">${fallbackContent(page)}</div>`);
		await write(page.path === "/" ? "" : page.path, html);
	}

	// unknown urls: the app shows its not found page, search engines must not index it
	await writeFile(
		join(DIST, "404.html"),
		template.replace(
			"</head>",
			'\t<title data-prerender>Page not found | Minecraft Tools</title>\n\t\t<meta name="robots" content="noindex" data-prerender />\n\t</head>',
		),
	);

	const today = new Date().toISOString().slice(0, 10);
	const urls = PAGES.map(
		(page) =>
			`  <url>\n    <loc>${urlOf(page.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${page.priority}</priority>\n  </url>`,
	).join("\n");
	await writeFile(
		join(DIST, "sitemap.xml"),
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
	);

	console.log(`Prerendered ${PAGES.length} pages for ${SITE_URL}, 404.html and sitemap.xml`);
}

await main();

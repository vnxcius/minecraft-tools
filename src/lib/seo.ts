/**
 * Everything search engines and link previews see: titles, descriptions, canonical urls, Open Graph,
 * Twitter cards and structured data. The routes read it through `pageHead()`, and the prerender
 * script (scripts/prerender.ts) writes the same tags into the static html of every page, so
 * crawlers that do not run JavaScript get them too.
 */

import { currentLanguage, LANGUAGES } from "@/i18n/current";
import { PAGE_TEXT } from "@/i18n/pages";

export const SITE_URL = "https://minecraft-tools.cc";
const SITE_NAME = "Minecraft Tools";
// bump ?v= when the picture changes, link previews keep the old one cached by url
const OG_IMAGE = `${SITE_URL}/og.png?v=2`;
const OG_IMAGE_ALT =
	"Minecraft Tools: seed map, villager trades, enchanting, banners, armor trims and more";

export interface Page {
	path: string;
	/** <title>, keep it under about 60 characters */
	title: string;
	/** meta description, keep it under about 155 characters */
	description: string;
	/** the visible h1 of the page, used for the text served before JavaScript runs */
	heading: string;
	priority: number;
}

export const PAGES: Page[] = [
	{
		path: "/",
		title: "Useful Minecraft Tools: Calculators, Generators and Guides",
		description:
			"Free Minecraft tools in your browser: seed map, villager trades, enchanting and anvil order, banner, shield and firework generators, armor trims and more.",
		heading: "Useful tools for Minecraft",
		priority: 1,
	},
	{
		path: "/tool/stack-calculator",
		title: "Minecraft Stack Calculator: Items to Stacks, Chests and Shulkers",
		description:
			"Convert any number of items into stacks, double chests and shulker boxes. Works for 64 and 16 item stacks.",
		heading: "Stack Calculator",
		priority: 0.8,
	},
	{
		path: "/tool/item-checklist",
		title: "Minecraft Item Checklist and Materials List Builder",
		description:
			"Build a materials list with every Minecraft item, set goals and tick items off as you gather them, with your build tutorial video playing beside it.",
		heading: "Items Checklist",
		priority: 0.8,
	},
	{
		path: "/tool/3d-armor-trim-viewer",
		title: "Minecraft Armor Trim Viewer: Preview Every Trim in 3D",
		description:
			"Preview every armor trim pattern and material on every armor type in 3D on an armor stand. Rotate, zoom and pick the best look before you smith it.",
		heading: "3D Armor Trim Viewer",
		priority: 0.9,
	},
	{
		path: "/tool/banner-generator",
		title: "Minecraft Banner Generator with All Patterns and Recipes",
		description:
			"Design Minecraft banners with all 16 colors and 42 patterns. See the materials you need, the loom steps and get a /give command.",
		heading: "Banner Generator",
		priority: 0.9,
	},
	{
		path: "/tool/shield-generator",
		title: "Minecraft Shield Generator: Banner Patterns on Shields",
		description:
			"See any banner pattern on a shield before you craft it. Get the materials list and a /give command for your shield design.",
		heading: "Shield Generator",
		priority: 0.8,
	},
	{
		path: "/tool/firework-generator",
		title: "Minecraft Firework Generator: Rockets, Stars and Recipes",
		description:
			"Design firework stars with every shape, color, fade, trail and twinkle, watch them explode and get the crafting recipe and /give command.",
		heading: "Firework Generator",
		priority: 0.8,
	},
	{
		path: "/tool/potion-maker",
		title: "Minecraft Potion Maker: Brewing Recipes and Durations",
		description:
			"Every Minecraft brewing recipe step by step: ingredients, extended and enhanced versions, splash, lingering and tipped arrows, with ingredient totals.",
		heading: "Potion Maker",
		priority: 0.9,
	},
	{
		path: "/tool/best-enchantments",
		title: "Best Minecraft Enchantments for Every Armor Piece and Tool",
		description:
			"The best enchantments for every armor piece, tool and weapon in Minecraft, like Protection IV, Unbreaking III and Mending, with a /give command.",
		heading: "Best Enchantments",
		priority: 0.9,
	},
	{
		path: "/tool/seed-map",
		title: "Minecraft Seed Map: Biomes, Villages and Structure Finder",
		description:
			"Explore any Minecraft seed in your browser: biomes, villages, strongholds, slime chunks and Nether and End structures. Highlight biomes and find the nearest.",
		heading: "Seed Map",
		priority: 0.9,
	},
	{
		path: "/tool/enchant-order",
		title: "Minecraft Enchantment Order Calculator: Cheapest Anvil Order",
		description:
			'Find the cheapest order to combine enchanted books in the anvil and avoid "Too Expensive!". Level cost of every step, for every item.',
		heading: "Enchantment Order",
		priority: 0.9,
	},
	{
		path: "/tool/enchanting-table",
		title: "Minecraft Enchanting Table Odds: Chance of Every Enchantment",
		description:
			"The exact chance of every enchantment at the enchanting table, by item, bookshelves, slot and level, for each Java Edition version since 1.14.4.",
		heading: "Enchanting Table Probabilities",
		priority: 0.9,
	},
	{
		path: "/tool/villager-trading",
		title: "Minecraft Villager Trading Guide: Every Trade by Profession",
		description:
			"All villager and wandering trader trades by profession and level, enchanted book prices for librarians, and a search for who sells what.",
		heading: "Villager Trading Guide",
		priority: 0.9,
	},
	{
		path: "/tool/nether-portal",
		title: "Minecraft Nether Portal Calculator: Overworld to Nether",
		description:
			"Convert Overworld coordinates to the Nether and back to link nether portals. Divide by 8 going in, multiply by 8 coming out.",
		heading: "Nether Portal Calculator",
		priority: 0.8,
	},
	{
		path: "/tool/slime-chunk-finder",
		title: "Minecraft Slime Chunk Finder: Slime Chunks of Any Seed",
		description:
			"Find the slime chunks of any Minecraft seed on a map, with their coordinates, to build a slime farm. Runs in your browser.",
		heading: "Slime Chunk Finder",
		priority: 0.8,
	},
	{
		path: "/tool/circle-generator",
		title: "Minecraft Circle Generator: Circles, Ovals, Spheres and Domes",
		description:
			"Pixel circles, ovals, spheres and domes for Minecraft builds, layer by layer, with the exact number of blocks you need.",
		heading: "Circle Generator",
		priority: 0.8,
	},
];

const pageByPath = (path: string) => PAGES.find((page) => page.path === path);

/**
 * Pages that moved: old path -> new path. The app redirects them, and the prerender writes a page at
 * the old path pointing crawlers (and old links) to the new one.
 */
export const MOVED: Record<string, string> = {
	"/tool/banner-crafting": "/tool/banner-generator",
	"/tool/shield-designer": "/tool/shield-generator",
	"/tool/firework-crafting": "/tool/firework-generator",
};

/** a page in the language the site is shown in (always English for the prerendered html) */
export function localizedPage(path: string): Page | undefined {
	const page = pageByPath(path);
	const language = currentLanguage();
	if (!page || language === "en") return page;
	return { ...page, ...PAGE_TEXT[language][path] };
}

/** "en", "pt-BR" -> the og:locale form "en_US", "pt_BR" */
const LOCALES = { en: "en_US", "pt-BR": "pt_BR", es: "es_ES" } as const;

export const urlOf = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/** the tool's picture, named after its page ("/tool/seed-map" -> /tools/seed-map.png) */
const imageOf = (path: string) => `${SITE_URL}/tools/${path.split("/").pop()}.png`;

const AUTHOR = { "@type": "Person", name: "Vinicius Simon" };

/** structured data (JSON-LD) of a page */
export function structuredData(page: Page) {
	if (page.path === "/") {
		return [
			{
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: SITE_NAME,
				url: SITE_URL,
				description: page.description,
				// one url per page, the language is picked on the site
				inLanguage: LANGUAGES.map((language) => language.id),
				author: AUTHOR,
			},
			{
				"@context": "https://schema.org",
				"@type": "ItemList",
				name: "Tools",
				itemListElement: PAGES.filter((tool) => tool.path !== "/").map((tool, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: tool.heading,
					url: urlOf(tool.path),
				})),
			},
		];
	}
	return [
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			name: page.heading,
			url: urlOf(page.path),
			description: page.description,
			image: imageOf(page.path),
			applicationCategory: "GameApplication",
			operatingSystem: "Any (web browser)",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
			author: AUTHOR,
			inLanguage: currentLanguage(),
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
				{ "@type": "ListItem", position: 2, name: page.heading, item: urlOf(page.path) },
			],
		},
	];
}

type Meta = Record<string, string>;

/** the tags of a page, as the `meta` list of a TanStack Router `head()` */
export function metaTags(page: Page): Meta[] {
	const url = urlOf(page.path);
	return [
		{ title: page.title },
		{ name: "description", content: page.description },
		{ name: "robots", content: "index, follow, max-image-preview:large" },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: SITE_NAME },
		{ property: "og:locale", content: LOCALES[currentLanguage()] },
		{ property: "og:title", content: page.title },
		{ property: "og:description", content: page.description },
		{ property: "og:url", content: url },
		{ property: "og:image", content: OG_IMAGE },
		{ property: "og:image:width", content: "1200" },
		{ property: "og:image:height", content: "630" },
		{ property: "og:image:alt", content: OG_IMAGE_ALT },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: page.title },
		{ name: "twitter:description", content: page.description },
		{ name: "twitter:image", content: OG_IMAGE },
		{ name: "twitter:image:alt", content: OG_IMAGE_ALT },
	];
}

/** `head` for a route: `head: () => pageHead("/tool/seed-map")` */
export function pageHead(path: string) {
	const page = localizedPage(path) as Page;
	return {
		meta: metaTags(page),
		links: [{ rel: "canonical", href: urlOf(path) }],
		// structured data is only in the prerendered html: React warns about <script> it renders
	};
}

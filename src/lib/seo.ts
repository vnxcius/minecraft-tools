/**
 * Everything search engines and link previews see: titles, descriptions, canonical urls, Open Graph,
 * Twitter cards and structured data. The routes read it through `pageHead()`, and the prerender
 * script (scripts/prerender.ts) writes the same tags into the static html of every page, so
 * crawlers that do not run JavaScript get them too.
 */

export const SITE_URL = "https://minecraft-tools.cc";
export const SITE_NAME = "Minecraft Tools";
export const OG_IMAGE = `${SITE_URL}/og.png`;
export const OG_IMAGE_ALT =
	"Minecraft Tools: useful calculators, designers and guides for Minecraft players";

export interface Page {
	path: string;
	/** <title>, keep it under about 60 characters */
	title: string;
	/** meta description, keep it under about 155 characters */
	description: string;
	/** the visible h1 of the page, used for the text served before JavaScript runs */
	heading: string;
	/** sitemap priority */
	priority: number;
}

export const PAGES: Page[] = [
	{
		path: "/",
		title: "Useful Minecraft Tools: Calculators, Designers and Guides",
		description:
			"Free Minecraft tools in your browser: stack calculator, item checklist, armor trims, banner and shield designers, fireworks, potions, enchantments and a seed map.",
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
			"Build a materials list for your Minecraft build with every item up to the latest version, set quantity goals and tick items off as you gather them.",
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
		path: "/tool/banner-crafting",
		title: "Minecraft Banner Designer with All Patterns and Recipes",
		description:
			"Design Minecraft banners with all 16 colors and 42 patterns. See the materials you need, the loom steps and get a /give command.",
		heading: "Banner Designer",
		priority: 0.9,
	},
	{
		path: "/tool/shield-designer",
		title: "Minecraft Shield Designer: Banner Patterns on Shields",
		description:
			"See any banner pattern on a shield before you craft it. Get the materials list and a /give command for your shield design.",
		heading: "Shield Designer",
		priority: 0.8,
	},
	{
		path: "/tool/firework-crafting",
		title: "Minecraft Firework Rocket and Star Crafting Tool",
		description:
			"Design firework stars with every shape, color, fade, trail and twinkle, watch them explode and get the crafting recipe and /give command.",
		heading: "Firework Crafting",
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
			"Explore any Minecraft seed in your browser: biomes, villages, strongholds, slime chunks, Nether and End structures, plus a nearest biome finder.",
		heading: "Seed Map",
		priority: 0.9,
	},
];

export const pageByPath = (path: string) => PAGES.find((page) => page.path === path);

export const urlOf = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

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
				inLanguage: "en",
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
			applicationCategory: "GameApplication",
			operatingSystem: "Any (web browser)",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
			inLanguage: "en",
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
		{ property: "og:locale", content: "en_US" },
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
	const page = pageByPath(path) as Page;
	return {
		meta: metaTags(page),
		links: [{ rel: "canonical", href: urlOf(path) }],
		scripts: structuredData(page).map((data) => ({
			type: "application/ld+json",
			children: JSON.stringify(data),
		})),
	};
}

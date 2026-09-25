import related from "@/data/related.json";
import { t } from "@/i18n";

export const TOOLS = [
	{
		id: "stack-calculator",
		to: "/tool/stack-calculator",
		category: "Planning",
		image: "/tools/stack-calculator.png",
	},
	{
		id: "item-checklist",
		to: "/tool/item-checklist",
		category: "Planning",
		image: "/tools/item-checklist.png",
	},
	{
		id: "3d-armor-trim-viewer",
		to: "/tool/3d-armor-trim-viewer",
		category: "Generators",
		image: "/tools/3d-armor-trim-viewer.png",
	},
	{
		id: "banner-generator",
		to: "/tool/banner-generator",
		category: "Generators",
		image: "/tools/banner-generator.png",
	},
	{
		id: "shield-generator",
		to: "/tool/shield-generator",
		category: "Generators",
		image: "/tools/shield-generator.png",
	},
	{
		id: "potion-maker",
		to: "/tool/potion-maker",
		category: "Guides",
		image: "/tools/potion-maker.png",
	},
	{
		id: "firework-generator",
		to: "/tool/firework-generator",
		category: "Generators",
		image: "/tools/firework-generator.png",
	},
	{
		id: "seed-map",
		to: "/tool/seed-map",
		category: "World",
		image: "/tools/seed-map.png",
	},
	{
		id: "best-enchantments",
		to: "/tool/best-enchantments",
		category: "Guides",
		image: "/tools/best-enchantments.png",
	},
	{
		id: "enchant-order",
		to: "/tool/enchant-order",
		category: "Guides",
		image: "/tools/enchant-order.png",
	},
	{
		id: "enchanting-table",
		to: "/tool/enchanting-table",
		category: "Guides",
		image: "/tools/enchanting-table.png",
	},
	{
		id: "villager-trading",
		to: "/tool/villager-trading",
		category: "Guides",
		image: "/tools/villager-trading.png",
	},
	{
		id: "nether-portal",
		to: "/tool/nether-portal",
		category: "World",
		image: "/tools/nether-portal.png",
	},
	{
		id: "slime-chunk-finder",
		to: "/tool/slime-chunk-finder",
		category: "World",
		image: "/tools/slime-chunk-finder.png",
	},
	{
		id: "circle-generator",
		to: "/tool/circle-generator",
		category: "Planning",
		image: "/tools/circle-generator.png",
	},
] as const;

export type Tool = (typeof TOOLS)[number];

export const CATEGORIES = ["Planning", "Generators", "Guides", "World"] as const;

/**
 * The tools shown under a tool, most related first: picked from the game data and text the tools
 * share by scripts/sync-related.ts (`bun run related:sync` after adding or changing a tool).
 */
export const relatedTools = (tool: Tool): Tool[] =>
	((related as Record<string, string[]>)[tool.id] ?? []).flatMap((id) =>
		TOOLS.filter((other) => other.id === id),
	);

/** components call useI18n() to re-render on a language change */
export const toolTitle = (tool: Tool) => t(`tool.${tool.id}.title`);
export const toolDescription = (tool: Tool) => t(`tool.${tool.id}.description`);
export const categoryName = (category: Tool["category"]) => t(`category.${category}`);

export const toolByPath = (pathname: string): Tool | undefined =>
	TOOLS.find((tool) => pathname === tool.to || pathname.startsWith(`${tool.to}/`));

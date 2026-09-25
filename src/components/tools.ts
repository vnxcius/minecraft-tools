import { t } from "@/i18n";

export const TOOLS = [
	{
		id: "stack-calculator",
		to: "/tool/stack-calculator",
		category: "Planning",
		image: "/tools/stack-calculator.png",
		related: ["/tool/item-checklist", "/tool/banner-generator", "/tool/nether-portal"],
	},
	{
		id: "item-checklist",
		to: "/tool/item-checklist",
		category: "Planning",
		image: "/tools/item-checklist.png",
		related: ["/tool/stack-calculator", "/tool/seed-map", "/tool/banner-generator"],
	},
	{
		id: "3d-armor-trim-viewer",
		to: "/tool/3d-armor-trim-viewer",
		category: "Generators",
		image: "/tools/3d-armor-trim-viewer.png",
		related: ["/tool/best-enchantments", "/tool/shield-generator", "/tool/banner-generator"],
	},
	{
		id: "banner-generator",
		to: "/tool/banner-generator",
		category: "Generators",
		image: "/tools/banner-generator.png",
		related: ["/tool/shield-generator", "/tool/firework-generator", "/tool/3d-armor-trim-viewer"],
	},
	{
		id: "shield-generator",
		to: "/tool/shield-generator",
		category: "Generators",
		image: "/tools/shield-generator.png",
		related: ["/tool/banner-generator", "/tool/3d-armor-trim-viewer", "/tool/best-enchantments"],
	},
	{
		id: "potion-maker",
		to: "/tool/potion-maker",
		category: "Guides",
		image: "/tools/potion-maker.png",
		related: ["/tool/best-enchantments", "/tool/item-checklist", "/tool/firework-generator"],
	},
	{
		id: "firework-generator",
		to: "/tool/firework-generator",
		category: "Generators",
		image: "/tools/firework-generator.png",
		related: ["/tool/banner-generator", "/tool/potion-maker", "/tool/shield-generator"],
	},
	{
		id: "seed-map",
		to: "/tool/seed-map",
		category: "World",
		image: "/tools/seed-map.png",
		related: ["/tool/nether-portal", "/tool/item-checklist", "/tool/stack-calculator"],
	},
	{
		id: "best-enchantments",
		to: "/tool/best-enchantments",
		category: "Guides",
		image: "/tools/best-enchantments.png",
		related: ["/tool/enchant-order", "/tool/3d-armor-trim-viewer", "/tool/potion-maker"],
	},
	{
		id: "enchant-order",
		to: "/tool/enchant-order",
		category: "Guides",
		image: "/tools/enchant-order.png",
		related: ["/tool/best-enchantments", "/tool/3d-armor-trim-viewer", "/tool/potion-maker"],
	},
	{
		id: "enchanting-table",
		to: "/tool/enchanting-table",
		category: "Guides",
		image: "/tools/enchanting-table.png",
		related: ["/tool/enchant-order", "/tool/best-enchantments", "/tool/villager-trading"],
	},
	{
		id: "villager-trading",
		to: "/tool/villager-trading",
		category: "Guides",
		image: "/tools/villager-trading.png",
		related: ["/tool/enchant-order", "/tool/best-enchantments", "/tool/item-checklist"],
	},
	{
		id: "nether-portal",
		to: "/tool/nether-portal",
		category: "World",
		image: "/tools/nether-portal.png",
		related: ["/tool/seed-map", "/tool/stack-calculator", "/tool/item-checklist"],
	},
	{
		id: "slime-chunk-finder",
		to: "/tool/slime-chunk-finder",
		category: "World",
		image: "/tools/slime-chunk-finder.png",
		related: ["/tool/seed-map", "/tool/nether-portal", "/tool/item-checklist"],
	},
	{
		id: "circle-generator",
		to: "/tool/circle-generator",
		category: "Planning",
		image: "/tools/circle-generator.png",
		related: ["/tool/stack-calculator", "/tool/item-checklist", "/tool/banner-generator"],
	},
] as const;

export type Tool = (typeof TOOLS)[number];

export const CATEGORIES = ["Planning", "Generators", "Guides", "World"] as const;

export const relatedTools = (tool: Tool): Tool[] =>
	tool.related.flatMap((path) => TOOLS.filter((other) => other.to === path));

/** components call useI18n() to re-render on a language change */
export const toolTitle = (tool: Tool) => t(`tool.${tool.id}.title`);
export const toolDescription = (tool: Tool) => t(`tool.${tool.id}.description`);
export const categoryName = (category: Tool["category"]) => t(`category.${category}`);

export const toolByPath = (pathname: string): Tool | undefined =>
	TOOLS.find((tool) => pathname === tool.to || pathname.startsWith(`${tool.to}/`));

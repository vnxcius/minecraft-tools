import {
	BoxIcon,
	FlagIcon,
	FlaskConicalIcon,
	MapIcon,
	RocketIcon,
	ShieldIcon,
	SparklesIcon,
} from "lucide-react";
import { CalculatorIcon, ListDetailsIcon } from "./ui/icons";

export const TOOLS = [
	{
		to: "/tool/stack-calculator",
		title: "Stack Calculator",
		short: "Stacks",
		icon: CalculatorIcon,
		description:
			"How many stacks, shulker boxes and chests are 456 blocks? Punch in a number and find out.",
	},
	{
		to: "/tool/item-checklist",
		title: "Item Checklist",
		short: "Checklist",
		icon: ListDetailsIcon,
		description:
			"Build a materials list for your next build, set quantity goals and tick items off as you gather them.",
	},
	{
		to: "/tool/3d-armor-trim-viewer",
		title: "Armor Trim Viewer",
		short: "Armor Trims",
		icon: BoxIcon,
		description: "Try every armor and trim combination on a 3D armor stand before you smith it.",
	},
	{
		to: "/tool/banner-crafting",
		title: "Banner Designer",
		short: "Banners",
		icon: FlagIcon,
		description:
			"Layer patterns and dyes to design a banner, then get the materials list and the command.",
	},
	{
		to: "/tool/shield-designer",
		title: "Shield Designer",
		short: "Shields",
		icon: ShieldIcon,
		description:
			"Put banner patterns on a shield and see it before you craft it, with materials and command.",
	},
	{
		to: "/tool/potion-maker",
		title: "Potion Maker",
		short: "Potions",
		icon: FlaskConicalIcon,
		description:
			"Pick a potion and get the full brewing recipe: ingredients, steps, duration and upgrades.",
	},
	{
		to: "/tool/firework-crafting",
		title: "Firework Crafting",
		short: "Fireworks",
		icon: RocketIcon,
		description:
			"Combine shapes, colors, trails and twinkles into firework stars, watch them explode and get the recipe.",
	},
	{
		to: "/tool/seed-map",
		title: "Seed Map",
		short: "Seed Map",
		icon: MapIcon,
		description:
			"Explore the world of any seed: biomes, villages, strongholds, slime chunks and more, all generated in your browser.",
	},
	{
		to: "/tool/best-enchantments",
		title: "Best Enchantments",
		short: "Enchants",
		icon: SparklesIcon,
		description:
			"The enchantments worth having on every armor piece, tool and weapon, with the command to get them.",
	},
] as const;

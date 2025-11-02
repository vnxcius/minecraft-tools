import { promises as fs } from "node:fs";
import type { Metadata } from "next";
import ItemChecklist, { type Item } from "./_components/item-checklist";

export const metadata: Metadata = {
	title: "Items Checklist | Useful Minecraft Tools",
	description: "Make yourself a item list for building something cool!",
};

export default async function Page() {
	const file = await fs.readFile(
		`${process.cwd()}/public/minecraft/items.json`,
		"utf8",
	);
	const data = JSON.parse(file) as { items: Item[] };
	return <ItemChecklist items={data.items} />;
}

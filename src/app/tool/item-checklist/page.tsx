import type { Metadata } from "next";
import ItemChecklist, { type Item } from "./_components/item-checklist";
import items from "./items.json";

export const metadata: Metadata = {
	title: "Items Checklist | Useful Minecraft Tools",
	description: "Make yourself a item list for building something cool!",
};

export default async function Page() {
	const data: { items: Item[] } = items;
	return <ItemChecklist items={data.items} />;
}

import { createFileRoute } from "@tanstack/react-router";
import ItemChecklist from "@/components/item-checklist/item-checklist";
import data from "@/data/items.json";

export const Route = createFileRoute("/tool/item-checklist")({
	head: () => ({
		meta: [
			{ title: "Items Checklist | Useful Minecraft Tools" },
			{
				name: "description",
				content: "Make yourself a item list for building something cool!",
			},
		],
	}),
	component: () => <ItemChecklist items={data.items} />,
});

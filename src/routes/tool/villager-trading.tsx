import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import VillagerGuide from "@/components/villager/villager-guide";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/villager-trading")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/villager-trading"),
	component: VillagerPage,
});

function VillagerPage() {
	const { icons } = Route.useLoaderData();
	return <VillagerGuide icons={icons} />;
}

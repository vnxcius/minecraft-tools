import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import VillagerGuide from "@/components/villager/villager-guide";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/villager-trading")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/villager-trading"),
	component: VillagerPage,
});

function VillagerPage() {
	const { icons } = Route.useLoaderData();
	return <VillagerGuide icons={icons} />;
}

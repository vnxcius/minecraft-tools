import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import FireworkDesigner from "@/components/firework/firework-designer";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/firework-generator")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/firework-generator"),
	component: FireworkPage,
});

function FireworkPage() {
	const { icons } = Route.useLoaderData();
	return <FireworkDesigner icons={icons} />;
}

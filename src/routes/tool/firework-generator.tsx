import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import FireworkDesigner from "@/components/firework/firework-designer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/firework-generator")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/firework-generator"),
	component: FireworkPage,
});

function FireworkPage() {
	const { icons } = Route.useLoaderData();
	return <FireworkDesigner icons={icons} />;
}

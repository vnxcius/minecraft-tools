import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import EnchantOrder from "@/components/enchant/enchant-order";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/enchant-order")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/enchant-order"),
	component: EnchantOrderPage,
});

function EnchantOrderPage() {
	const { icons } = Route.useLoaderData();
	return <EnchantOrder icons={icons} />;
}

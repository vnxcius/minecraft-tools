import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import EnchantingTable from "@/components/enchant/enchanting-table";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/enchanting-table")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/enchanting-table"),
	component: EnchantingTablePage,
});

function EnchantingTablePage() {
	const { icons } = Route.useLoaderData();
	return <EnchantingTable icons={icons} />;
}

import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import EnchantGuide from "@/components/enchant/enchant-guide";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/best-enchantments")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/best-enchantments"),
	component: EnchantPage,
});

function EnchantPage() {
	const { icons } = Route.useLoaderData();
	return <EnchantGuide icons={icons} />;
}

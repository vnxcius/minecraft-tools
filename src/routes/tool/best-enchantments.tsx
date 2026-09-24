import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import EnchantGuide from "@/components/enchant/enchant-guide";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/best-enchantments")({
	// item icons come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/best-enchantments"),
	component: EnchantPage,
});

function EnchantPage() {
	const { icons } = Route.useLoaderData();
	return <EnchantGuide icons={icons} />;
}

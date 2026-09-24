import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import PotionMaker from "@/components/potion/potion-maker";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/potion-maker")({
	// item icons (ingredients) come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/potion-maker"),
	component: PotionPage,
});

function PotionPage() {
	const { icons } = Route.useLoaderData();
	return <PotionMaker icons={icons} />;
}

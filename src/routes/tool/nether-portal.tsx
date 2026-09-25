import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import NetherPortal from "@/components/nether-portal";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/nether-portal")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/nether-portal"),
	component: NetherPortalPage,
});

function NetherPortalPage() {
	const { icons } = Route.useLoaderData();
	return <NetherPortal icons={icons} />;
}

import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import NetherPortal from "@/components/nether-portal";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/nether-portal")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/nether-portal"),
	component: NetherPortalPage,
});

function NetherPortalPage() {
	const { icons } = Route.useLoaderData();
	return <NetherPortal icons={icons} />;
}

import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import SeedTool from "@/components/seedmap/seed-tool";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/seed-map")({
	// `?slime=true` opens the map with the slime chunks on (the slime chunk finder links here)
	validateSearch: (search): { slime?: boolean } => ({
		slime: search.slime === true || search.slime === "true" || undefined,
	}),
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/seed-map"),
	component: SeedPage,
});

function SeedPage() {
	const { icons } = Route.useLoaderData();
	const { slime } = Route.useSearch();
	// a new key when the finder turns the slime chunks on while the map is already open
	return <SeedTool key={slime ? "slime" : "map"} icons={icons} slime={slime} />;
}

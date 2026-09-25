import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import ArmorTrimViewer from "@/components/armor-trim/armor-trim-viewer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/3d-armor-trim-viewer")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/3d-armor-trim-viewer"),
	component: ArmorTrimPage,
});

function ArmorTrimPage() {
	const { icons } = Route.useLoaderData();
	return <ArmorTrimViewer icons={icons} />;
}

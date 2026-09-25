import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import ItemChecklist from "@/components/item-checklist/item-checklist";
import { isObtainable, loadItems, resolveVersion } from "@/lib/items";

export const Route = createFileRoute("/tool/item-checklist")({
	// `?v=1.21.10`; anything unknown falls back to the latest version
	validateSearch: (search): { v?: string } => ({
		v: typeof search.v === "string" ? search.v : undefined,
	}),
	loaderDeps: ({ search }) => ({ v: search.v }),
	loader: async ({ deps }) => {
		const version = resolveVersion(deps.v);
		// only what a survival player can actually gather
		const items = (await loadItems(version)).filter((item) => isObtainable(item.id));
		return { version, items };
	},
	head: () => pageHead("/tool/item-checklist"),
	component: ItemChecklistPage,
});

function ItemChecklistPage() {
	const { version, items } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	return (
		<ItemChecklist
			items={items}
			version={version.id}
			onVersionChange={(v) => navigate({ search: { v }, replace: true })}
		/>
	);
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tool/3d-armor-trim-viewer")({
	head: () => ({
		meta: [{ title: "3D Armor Trim Viewer | Useful Minecraft Tools" }],
	}),
	component: () => <section></section>,
});

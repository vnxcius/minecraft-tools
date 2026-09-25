import { createFileRoute, redirect } from "@tanstack/react-router";

// listed as its own tool, but it is the seed map with the slime chunks on
export const Route = createFileRoute("/tool/slime-chunk-finder")({
	beforeLoad: () => {
		throw redirect({ to: "/tool/seed-map", search: { slime: true }, replace: true });
	},
});

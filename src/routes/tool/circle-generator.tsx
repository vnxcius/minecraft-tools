import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import CircleGenerator from "@/components/circle-generator";

export const Route = createFileRoute("/tool/circle-generator")({
	head: () => pageHead("/tool/circle-generator"),
	component: CircleGenerator,
});

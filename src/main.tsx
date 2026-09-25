import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initI18n } from "./i18n";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// the router renders the page's tags itself; the structured data stays from the static html
document.head
	.querySelectorAll('[data-prerender]:not([type="application/ld+json"])')
	.forEach((tag) => tag.remove());

// the language's game names load first, so the first render is already in the right language
initI18n().then(() =>
	createRoot(document.getElementById("root") as HTMLElement).render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	),
);

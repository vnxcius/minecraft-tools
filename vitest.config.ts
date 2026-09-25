import { defineConfig } from "vitest/config";

// kept apart from vite.config.ts: the tests need the path aliases, not the router and css plugins
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: { include: ["tests/**/*.test.ts"] },
});

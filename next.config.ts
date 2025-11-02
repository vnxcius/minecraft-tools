import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	typedRoutes: true,
	// images: {
	// 	unoptimized: true,
	// },
};

export default nextConfig;

// https://opennext.js.org/cloudflare/get-started#12-develop-locally
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
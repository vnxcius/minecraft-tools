import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
};

export default nextConfig;

// https://opennext.js.org/cloudflare/get-started#12-develop-locally
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

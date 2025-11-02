import type { IConfig } from "next-sitemap";

const config: IConfig = {
	siteUrl: process.env.SITE_URL || "http://localhost:3000",
	generateRobotsTxt: true,
	sitemapSize: 7000,
};

export default config;

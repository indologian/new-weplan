import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	plugins:
		mode === "test"
			? []
			: [
					vinext({
						cache: { cdn: cdnAdapter() },
					}),
					cloudflare({
						viteEnvironment: {
							name: "rsc",
							childEnvironments: ["ssr"],
						},
					}),
				],
}));

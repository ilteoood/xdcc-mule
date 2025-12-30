import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		run: true,
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts", "src/utils/xdccDownload.ts"],
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 90,
				statements: 90,
			},
		},
	},
});

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3000",
			},
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./test/setup.ts"],
		run: true,
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.tsx", "src/**/*.ts"],
			exclude: ["src/main.tsx", "src/vite-env.d.ts"],
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 90,
				statements: 90,
			},
		},
	},
});

import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	optimizeDeps: {
		include: ["react", "react-dom", "react-dom/client"],
	},
	build: {
		rollupOptions: {
			input: {
				devtools: resolve(__dirname, "src/devtools/devtools.html"),
				panel: resolve(__dirname, "src/panel/panel.html"),
			},
		},
	},
});

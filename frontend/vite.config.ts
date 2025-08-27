import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "node:path";
import { defineConfig, splitVendorChunkPlugin } from "vite";
import injectHTML from "vite-plugin-html-inject";
import tsConfigPaths from "vite-tsconfig-paths";

type Extension = {
	name: string;
	version: string;
	config: Record<string, unknown>;
};

const listExtensions = (): Extension[] => {
	if (process.env.DATABUTTON_EXTENSIONS) {
		try {
			return JSON.parse(process.env.DATABUTTON_EXTENSIONS) as Extension[];
		} catch (err: unknown) {
			console.error("Error parsing DATABUTTON_EXTENSIONS", err);
			return [];
		}
	}
	return [];
};

const extensions = listExtensions();

const getExtensionConfig = (name: string): string => {
	const extension = extensions.find((it) => it.name === name);
	if (!extension) {
		console.warn(`Extension ${name} not found`);
		return JSON.stringify({});
	}
	return JSON.stringify(extension.config);
};

const buildVariables = () => {
	const defines: Record<string, string> = {
		__APP_ID__: JSON.stringify("archon"),
		__API_PATH__: JSON.stringify(""),
		__API_HOST__: JSON.stringify(""),
		__API_PREFIX_PATH__: JSON.stringify(""),
		__API_URL__: JSON.stringify("http://localhost:8000"),
		__WS_API_URL__: JSON.stringify("ws://localhost:8000"),
		__APP_BASE_PATH__: JSON.stringify("/"),
		__APP_TITLE__: JSON.stringify("Archon"),
		__APP_FAVICON_LIGHT__: JSON.stringify("/favicon-light.svg"),
		__APP_FAVICON_DARK__: JSON.stringify("/favicon-dark.svg"),
		__APP_DEPLOY_USERNAME__: JSON.stringify(""),
		__APP_DEPLOY_APPNAME__: JSON.stringify(""),
		__APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify(""),
		__STACK_AUTH_CONFIG__: JSON.stringify(getExtensionConfig("stack-auth")),
		__FIREBASE_CONFIG__: JSON.stringify(getExtensionConfig("firebase-auth")),
	};

	return defines;
};

export default defineConfig({
	define: buildVariables(),
	plugins: [react(), splitVendorChunkPlugin(), tsConfigPaths(), injectHTML()],
	server: {
		proxy: {
			"/projects": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
			"/github": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
			"/reports": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
		},
	},
	resolve: {
		alias: [
			{ find: "@/components/ui", replacement: path.resolve(__dirname, "./src/extensions/shadcn/components") },
			{ find: "@/hooks", replacement: path.resolve(__dirname, "./src/hooks") },
			{ find: "@", replacement: path.resolve(__dirname, "./src") },
			{ find: "brain", replacement: path.resolve(__dirname, "./src/brain") },
			{ find: "components", replacement: path.resolve(__dirname, "./src/components") },
			{ find: "pages", replacement: path.resolve(__dirname, "./src/pages") },
			{ find: "app", replacement: path.resolve(__dirname, "./src/app") },
			{ find: "utils", replacement: path.resolve(__dirname, "./src/utils") },
		],
	},
});

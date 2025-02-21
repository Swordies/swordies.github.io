import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react()],
	base: '/charactertalker/',
	resolve: {
	  alias: {
		"@": path.resolve(path.dirname(new URL(import.meta.url).pathname), "./src"),
	  },
	},
  })

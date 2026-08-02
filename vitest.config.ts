import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: { provider: "v8", reporter: ["text", "json", "html"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});

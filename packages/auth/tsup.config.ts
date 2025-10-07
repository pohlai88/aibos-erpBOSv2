import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],     // dual outputs
    dts: true,                  // .d.ts
    sourcemap: true,            // .map
    clean: true,                // wipe dist on actual execute (cache hits won't execute)
    splitting: false,
    treeshake: true,
    minify: false,
    target: "es2022",
    // Explicit extensions for consistency
    outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
});

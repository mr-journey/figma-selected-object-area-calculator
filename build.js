// build.js
// NOTE: This script requires the 'chokidar' package.
// Run `npm install chokidar` before using the watch feature.
const esbuild = require("esbuild");
const fs = require("fs-extra");
const chokidar = require("chokidar");

// Check if the --watch flag is present
const watch = process.argv.includes("--watch");

// --- Reusable build functions ---

async function buildMain() {
  try {
    await esbuild.build({
      entryPoints: ["src/code.ts"],
      bundle: true,
      outfile: "dist/code.js",
      platform: "node",
      target: "es6",
    });
    console.log("✔ Main code built");
  } catch (err) {
    console.error("Main build failed:", err);
  }
}

async function buildUi() {
  try {
    const uiResult = await esbuild.build({
      entryPoints: ["src/ui.tsx"],
      bundle: true,
      outfile: "dist/ui.js",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      write: false,
    });
    const uiJs = uiResult.outputFiles[0].text;
    const uiHtml = createHtml(uiJs);
    await fs.writeFile("dist/ui.html", uiHtml);
    console.log("✔ UI built");
  } catch (err) {
    console.error("UI build failed:", err);
  }
}

async function copyManifest() {
  try {
    await fs.copy("src/manifest.json", "dist/manifest.json");
    console.log("✔ Manifest copied");
  } catch (err) {
    console.error("Manifest copy failed:", err);
  }
}

// --- HTML generation ---

function createHtml(uiJs) {
  return `
    <div id="react-page"></div>
    <!-- React and ReactDOM from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Your UI script -->
    <script>
      ${uiJs}
    </script>
  `;
}

// --- Main execution ---

async function run() {
  // Ensure the dist directory exists
  await fs.ensureDir("dist");

  // Run initial build for main, UI, and copy manifest
  await Promise.all([buildMain(), buildUi(), copyManifest()]);

  if (watch) {
    console.log("👀 Watching for changes...");
    // Use chokidar to watch for changes in the src directory and manifest.json
    const watcher = chokidar.watch(["src/**/*.{ts,tsx}", "src/manifest.json"], {
      persistent: true,
    });

    // Add event listeners for file changes
    watcher.on("change", (path) => {
      console.log(`File changed: ${path}`);
      // Rebuild the appropriate part of the plugin based on file
      if (path.endsWith("code.ts")) {
        buildMain();
      } else if (path.endsWith("ui.tsx")) {
        buildUi();
      } else if (path.endsWith("manifest.json")) {
        copyManifest();
      }
    });
  } else {
    console.log("Build complete.");
  }
}

// Start the process
run().catch((e) => {
  console.error(e);
  process.exit(1);
});

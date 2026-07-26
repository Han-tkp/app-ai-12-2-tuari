import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

function copyAssetsTo(targetDir: string) {
  const rootDir = process.cwd();
  const iconSrc = path.join(rootDir, "icons", "icon.png");
  const iconDest = path.join(targetDir, "icon.png");
  const screenshotsSrc = path.join(rootDir, "image-appdrpai");
  const screenshotsDest = path.join(targetDir, "screenshots");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, iconDest);
    console.log(`[copyAssetsPlugin] Copied icon.png -> ${iconDest}`);
  }

  if (!fs.existsSync(screenshotsDest)) {
    fs.mkdirSync(screenshotsDest, { recursive: true });
  }

  if (fs.existsSync(screenshotsSrc)) {
    const files = fs.readdirSync(screenshotsSrc);
    for (const file of files) {
      fs.copyFileSync(path.join(screenshotsSrc, file), path.join(screenshotsDest, file));
    }
    console.log(`[copyAssetsPlugin] Copied ${files.length} screenshots -> ${screenshotsDest}`);
  }
}

function copyAssetsPlugin() {
  return {
    name: "copy-assets-plugin",
    buildStart() {
      try {
        const publicDir = path.join(process.cwd(), "public");
        copyAssetsTo(publicDir);
      } catch (err) {
        console.error("[copyAssetsPlugin] buildStart asset copy error:", err);
      }
    },
    closeBundle() {
      try {
        const distDir = path.join(process.cwd(), "dist");
        copyAssetsTo(distDir);
      } catch (err) {
        console.error("[copyAssetsPlugin] closeBundle asset copy error:", err);
      }
    }
  };
}

export default defineConfig({
  plugins: [copyAssetsPlugin(), react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
});


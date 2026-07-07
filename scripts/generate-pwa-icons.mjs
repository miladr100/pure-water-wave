import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Gera ícones PWA em public/icons/.
 * Uso local (após alterar o logo): npm install -D sharp && npm run generate:pwa-icons
 */
const sharp = (await import("sharp")).default;

const rootDir = process.cwd();
const source = path.join(rootDir, "public", "assets", "pwlogo.png");
const iconsDir = path.join(rootDir, "public", "icons");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

await mkdir(iconsDir, { recursive: true });

for (const icon of sizes) {
  await sharp(source)
    .resize(icon.size, icon.size, { fit: "cover" })
    .png()
    .toFile(path.join(iconsDir, icon.name));
}

console.log("Ícones PWA gerados em public/icons/");

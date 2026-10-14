/**
 * Genera WebP optimizados en varios anchos a partir de assets/raw.
 * Salida: assets/webp/<slug>-<ancho>.webp (no se versiona; se regenera con `pnpm images`).
 * Nunca amplía: si el original es más estrecho que un ancho, ese tamaño se omite.
 */
import { mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "../src/index";
import { slugify } from "../src/slug";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "assets", "raw");
const outDir = join(root, "assets", "webp");
const QUALITY = 80;

await mkdir(outDir, { recursive: true });
const files = (await readdir(rawDir)).filter((f) => /\.(jpe?g|png)$/i.test(f));

let written = 0;
for (const file of files) {
  const slug = slugify(file);
  const input = sharp(join(rawDir, file));
  const { width = 0 } = await input.metadata();
  for (const target of IMAGE_WIDTHS) {
    if (target > width) continue;
    await input
      .clone()
      .resize({ width: target })
      .webp({ quality: QUALITY })
      .toFile(join(outDir, `${slug}-${target}.webp`));
    written++;
  }
}

console.log(`${files.length} imágenes → ${written} WebP en ${outDir}`);

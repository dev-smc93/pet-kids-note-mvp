import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT = join(__dirname, "../public/images/logo/icon.svg");
const OUTPUT_DIR = join(__dirname, "../public/images/icons");

await mkdir(OUTPUT_DIR, { recursive: true });

for (const size of SIZES) {
  await sharp(INPUT)
    .resize(size, size)
    .png()
    .toFile(join(OUTPUT_DIR, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

console.log("PWA icons generated successfully.");

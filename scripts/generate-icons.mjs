import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputSvgPath = path.join(rootDir, 'public', 'icon.svg');
const outputDir = path.join(rootDir, 'assets-generated');

// Ensure output directory exists and do NOT overwrite public/ PNGs
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const BG_COLOR = '#0A0D0E';

async function generateIcons() {
  console.log('Generating PWA & Mobile app icons from:', inputSvgPath);
  console.log('Target output directory:', outputDir);

  const svgBuffer = fs.readFileSync(inputSvgPath);

  // 1. icon-1024.png (iOS App Store icon: 1024x1024, no alpha channel)
  console.log('Generating icon-1024.png (1024x1024, no alpha)...');
  await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: BG_COLOR })
    .flatten({ background: BG_COLOR })
    .removeAlpha()
    .png()
    .toFile(path.join(outputDir, 'icon-1024.png'));

  // 2. pwa-192x192.png (Standard 192x192)
  console.log('Generating pwa-192x192.png...');
  await sharp(svgBuffer, { density: 300 })
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, 'pwa-192x192.png'));

  // 3. pwa-512x512.png (Standard 512x512)
  console.log('Generating pwa-512x512.png...');
  await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'pwa-512x512.png'));

  // 4. apple-touch-icon.png (180x180 for iOS Web Clips / Safari)
  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(svgBuffer, { density: 300 })
    .resize(180, 180, { fit: 'contain', background: BG_COLOR })
    .flatten({ background: BG_COLOR })
    .removeAlpha()
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  // 5. Android Adaptive / Maskable icons with ~20% safe zone margin
  // In a maskable icon, the critical content must reside within an 80% circle (20% margin on all sides).
  // We create a solid canvas with the background color and composite the scaled icon in the center.
  async function createMaskableIcon(size, filename) {
    const margin = Math.round(size * 0.20);
    const innerSize = size - margin * 2; // 60% of total size

    const innerBuffer = await sharp(svgBuffer, { density: 300 })
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const top = Math.round((size - innerSize) / 2);
    const left = Math.round((size - innerSize) / 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([{ input: innerBuffer, top, left }])
      .png()
      .toFile(path.join(outputDir, filename));
  }

  console.log('Generating maskable icons with ~20% safe margin...');
  await createMaskableIcon(192, 'pwa-maskable-192x192.png');
  await createMaskableIcon(512, 'pwa-maskable-512x512.png');
  await createMaskableIcon(192, 'maskable-icon-192x192.png');
  await createMaskableIcon(512, 'maskable-icon-512x512.png');

  console.log('All icons generated successfully in assets-generated/!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

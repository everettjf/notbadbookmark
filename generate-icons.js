// One vector source for the extension, website and store artwork.
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function main() {
  const svg = fs.readFileSync('icons/source.svg', 'utf8');
  for (const size of [16, 32, 48, 128, 512]) {
    const source = await loadImage(Buffer.from(svg.replace('width="128" height="128"', `width="${size}" height="${size}"`)));
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, size, size);
    fs.writeFileSync(`icons/icon${size}.png`, canvas.toBuffer('image/png'));
    console.log(`Generated icon${size}.png`);
  }
  fs.copyFileSync('icons/icon128.png', 'docs/icon128.png');
  fs.copyFileSync('icons/icon32.png', 'docs/favicon.png');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

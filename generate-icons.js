// Preserve the original green and NB lettering; only clip the outer corners.
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function main() {
  for (const size of [16, 32, 48, 128]) {
    const source = await loadImage(`assets/icon-source/icon${size}.png`);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.1875);
    ctx.clip();
    ctx.drawImage(source, 0, 0);
    fs.writeFileSync(`icons/icon${size}.png`, canvas.toBuffer('image/png'));
  }
  fs.copyFileSync('icons/icon128.png', 'docs/icon128.png');
  fs.copyFileSync('icons/icon32.png', 'docs/favicon.png');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background with rounded corners
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.1875);
  ctx.fill();
  
  // Bookmark shape
  const margin = size * 0.25;
  const bookmarkWidth = size * 0.5;
  const bookmarkHeight = size * 0.5;
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin + bookmarkWidth, margin);
  ctx.lineTo(margin + bookmarkWidth, margin + bookmarkHeight);
  ctx.lineTo(margin + bookmarkWidth * 0.5, margin + bookmarkHeight * 0.75);
  ctx.lineTo(margin, margin + bookmarkHeight);
  ctx.closePath();
  ctx.fill();
  
  // Red dot
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(margin + bookmarkWidth * 0.8, margin + size * 0.1, size * 0.06, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas.toBuffer('image/png');
}

// Generate icons
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const buffer = createIcon(size);
  fs.writeFileSync(`icons/icon${size}.png`, buffer);
  console.log(`Generated icon${size}.png`);
});
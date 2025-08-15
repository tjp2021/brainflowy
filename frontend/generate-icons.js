import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [64, 192, 512];
const publicDir = './public';

function generateIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  if (isMaskable) {
    // Add padding for maskable icon
    ctx.fillStyle = '#646cff';
    ctx.fillRect(0, 0, size, size);
  } else {
    // Gradient background for regular icon
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#646cff');
    gradient.addColorStop(1, '#4a54e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  
  // Draw brain/flow symbol
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BF', size / 2, size / 2);
  
  // Add decorative elements
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate regular icons
sizes.forEach(size => {
  const buffer = generateIcon(size);
  const filename = `pwa-${size}x${size}.png`;
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Generated ${filename}`);
});

// Generate maskable icon
const maskableBuffer = generateIcon(512, true);
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), maskableBuffer);
console.log('Generated maskable-icon-512x512.png');

// Generate apple touch icon
const appleBuffer = generateIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleBuffer);
console.log('Generated apple-touch-icon.png');

// Generate favicon
const faviconBuffer = generateIcon(32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);
console.log('Generated favicon.ico');

console.log('All icons generated successfully!');
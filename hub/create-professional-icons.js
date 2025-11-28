const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, filename, color = '#1E40AF') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Add simple "CH" text for CoWorkHub
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size/4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CH', size/2, size/2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', filename), buffer);
  console.log(`Created ${filename}: ${size}x${size}px`);
}

// Create all required icons
console.log('Creating professional PNG icons...');

// Main icons
createIcon(192, 'icon-192x192.png', '#1E40AF');
createIcon(192, 'icon-192x192-maskable.png', '#1E40AF');
createIcon(512, 'icon-512x512.png', '#1E40AF');
createIcon(512, 'icon-512x512-maskable.png', '#1E40AF');

// Shortcut icons
createIcon(96, 'shortcut-desk.png', '#059669');
createIcon(96, 'shortcut-payments.png', '#DC2626');

console.log('All professional icons created!');

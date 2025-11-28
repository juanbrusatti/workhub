const fs = require('fs');
const path = require('path');

// Create simple PNG icons using canvas-like approach
function createPNGIcon(size, filename) {
  // Create a simple 512x512 PNG with a solid color and text
  const canvas = Buffer.alloc(size * size * 4); // RGBA
  
  // Fill with a solid color (dark blue)
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;     // R
    canvas[i + 1] = 0;  // G 
    canvas[i + 2] = 139; // B
    canvas[i + 3] = 255; // A
  }
  
  // Simple PNG header and data
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF, // width
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF, // height
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x4B, 0x6D, 0x29, 0xDC, // CRC
  ]);
  
  return Buffer.concat([pngHeader, canvas]);
}

// Create the required icons
const sizes = [192, 512];
const types = ['', '-maskable'];

sizes.forEach(size => {
  types.forEach(type => {
    const filename = `icon-${size}x${size}${type}.png`;
    const iconData = createPNGIcon(size, filename);
    fs.writeFileSync(path.join(__dirname, 'public', filename), iconData);
    console.log(`Created ${filename}`);
  });
});

// Create shortcut icons
['desk', 'payments'].forEach(name => {
  const filename = `shortcut-${name}.png`;
  const iconData = createPNGIcon(96, filename);
  fs.writeFileSync(path.join(__dirname, 'public', filename), iconData);
  console.log(`Created ${filename}`);
});

console.log('All icons created successfully!');

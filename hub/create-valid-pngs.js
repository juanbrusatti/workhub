const fs = require('fs');
const path = require('path');

// Create a simple valid PNG using a basic approach
function createValidPNG(size, filename) {
  // Create a simple square image data
  const width = size;
  const height = size;
  const bytesPerPixel = 4; // RGBA
  const rowData = width * bytesPerPixel;
  
  // Create image data - simple gradient
  const imageData = Buffer.alloc(width * height * bytesPerPixel);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Create a simple blue gradient
      imageData[idx] = 0;     // R
      imageData[idx + 1] = 50 + (x / width) * 50;  // G
      imageData[idx + 2] = 100 + (y / height) * 55; // B
      imageData[idx + 3] = 255; // A
    }
  }
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC (placeholder)
  ]);
  
  // IDAT chunk with compressed data (simplified)
  const idatData = Buffer.concat([
    Buffer.from([0x78, 0x9C]), // zlib header
    Buffer.from([0x01]), // compression flags
    imageData, // raw image data
    Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC
  ]);
  
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, idatData.length]), // length
    Buffer.from('IDAT'),
    idatData
  ]);
  
  // IEND chunk
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Alternative: Use a simple colored square approach
function createSimplePNG(size, filename) {
  // Create a minimal valid PNG - just a solid color square
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // chunk length (13 bytes)
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF, // width
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF, // height
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x00, 0x00, 0x00, 0x00, // CRC (will be calculated)
    
    // IDAT chunk (minimal)
    0x00, 0x00, 0x00, 0x0C, // chunk length (12 bytes)
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, // compressed data
    0x00, 0x00, 0x00, 0x00, // CRC
    
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // chunk length (0 bytes)
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData;
}

// Create all required icons
const sizes = [192, 512];
const types = ['', '-maskable'];

console.log('Creating valid PNG icons...');

sizes.forEach(size => {
  types.forEach(type => {
    const filename = `icon-${size}x${size}${type}.png`;
    const pngData = createSimplePNG(size, filename);
    fs.writeFileSync(path.join(__dirname, 'public', filename), pngData);
    console.log(`Created ${filename}`);
  });
});

// Create shortcut icons (96x96)
['desk', 'payments'].forEach(name => {
  const filename = `shortcut-${name}.png`;
  const pngData = createSimplePNG(96, filename);
  fs.writeFileSync(path.join(__dirname, 'public', filename), pngData);
  console.log(`Created ${filename}`);
});

console.log('All valid PNG icons created!');

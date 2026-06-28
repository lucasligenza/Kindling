// scripts/generate-icons.js
// Generates simple Kindle-inspired extension icons using Canvas API.
// Run with: node scripts/generate-icons.js (requires 'canvas' npm package)
// If canvas installation fails, falls back to PNG generation using node-png

const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  try {
    // Try using the canvas package
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const scale = size / 128;

    // Background — rounded rectangle (dark charcoal like a Kindle device)
    const radius = 16 * scale;
    const margin = 8 * scale;
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.moveTo(margin + radius, margin);
    ctx.lineTo(size - margin - radius, margin);
    ctx.arcTo(size - margin, margin, size - margin, margin + radius, radius);
    ctx.lineTo(size - margin, size - margin - radius);
    ctx.arcTo(
      size - margin,
      size - margin,
      size - margin - radius,
      size - margin,
      radius
    );
    ctx.lineTo(margin + radius, size - margin);
    ctx.arcTo(margin, size - margin, margin, size - margin - radius, radius);
    ctx.lineTo(margin, margin + radius);
    ctx.arcTo(margin, margin, margin + radius, margin, radius);
    ctx.closePath();
    ctx.fill();

    // Screen area — cream rectangle (like Kindle screen)
    const screenMargin = 20 * scale;
    const screenBottom = size - 32 * scale;
    ctx.fillStyle = "#F5F1E8";
    ctx.fillRect(
      screenMargin,
      screenMargin,
      size - screenMargin * 2,
      screenBottom - screenMargin
    );

    // Text lines (representing content)
    ctx.fillStyle = "#2A2A2A";
    const lineHeight = 6 * scale;
    const lineGap = 4 * scale;
    const textLeft = 28 * scale;
    const textRight = size - 28 * scale;
    let y = 30 * scale;

    // Title line (wider)
    ctx.fillRect(textLeft, y, (textRight - textLeft) * 0.7, lineHeight);
    y += lineHeight + lineGap * 2;

    // Body lines
    for (let i = 0; i < 5; i++) {
      const width =
        i === 4 ? (textRight - textLeft) * 0.5 : textRight - textLeft;
      ctx.fillRect(textLeft, y, width, lineHeight * 0.7);
      y += lineHeight * 0.7 + lineGap;
    }

    return canvas.toBuffer("image/png");
  } catch (err) {
    // Fallback: Generate a simple valid PNG without canvas
    console.log(
      `Canvas not available, using PNG fallback for icon${size}.png`
    );
    return generateSimplePNG(size);
  }
}

function generateSimplePNG(size) {
  // Create a minimal valid PNG with a Kindle-inspired design
  // Using raw PNG chunk construction
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (13 bytes of data)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // color type (2 = RGB)
  ihdr.writeUInt8(0, 10); // compression method
  ihdr.writeUInt8(0, 11); // filter method
  ihdr.writeUInt8(0, 12); // interlace method

  const ihdrChunk = createChunk("IHDR", ihdr);

  // IDAT chunk - create simple pixel data
  const zlib = require("zlib");
  const pixelData = Buffer.alloc(size * size * 3 + size); // RGB + 1 filter byte per scanline
  let offset = 0;

  for (let y = 0; y < size; y++) {
    pixelData[offset++] = 0; // filter type for this scanline

    for (let x = 0; x < size; x++) {
      // Create a simple Kindle-inspired gradient
      const margin = Math.floor(size * 0.1);
      const screenMargin = Math.floor(size * 0.15);

      if (
        x < margin ||
        x >= size - margin ||
        y < margin ||
        y >= size - margin
      ) {
        // Background (dark charcoal)
        pixelData[offset++] = 51; // R
        pixelData[offset++] = 51; // G
        pixelData[offset++] = 51; // B
      } else if (
        x < screenMargin ||
        x >= size - screenMargin ||
        y < screenMargin ||
        y >= size - screenMargin * 0.8
      ) {
        // Border (darker)
        pixelData[offset++] = 100; // R
        pixelData[offset++] = 100; // G
        pixelData[offset++] = 100; // B
      } else {
        // Screen area (cream)
        pixelData[offset++] = 245; // R
        pixelData[offset++] = 241; // G
        pixelData[offset++] = 232; // B
      }
    }
  }

  const compressedData = zlib.deflateSync(pixelData);
  const idatChunk = createChunk("IDAT", compressedData);

  // IEND chunk (empty)
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = calculateCRC(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(data) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  try {
    const buffer = generateIcon(size);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
    console.log(`Generated icon${size}.png`);
  } catch (err) {
    console.error(`Failed to generate icon${size}.png:`, err.message);
  }
});

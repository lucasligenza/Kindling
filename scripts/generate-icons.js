// scripts/generate-icons.js
// Generates fire/kindling-themed extension icons using Canvas API.
// Run with: node scripts/generate-icons.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 128; // scale factor

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw kindling sticks (two crossed sticks at the base)
  ctx.strokeStyle = "#5C3A1E";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(3 * s, 1);

  // Left stick
  ctx.beginPath();
  ctx.moveTo(30 * s, 110 * s);
  ctx.lineTo(64 * s, 55 * s);
  ctx.stroke();

  // Right stick
  ctx.beginPath();
  ctx.moveTo(98 * s, 110 * s);
  ctx.lineTo(64 * s, 55 * s);
  ctx.stroke();

  // Cross stick
  ctx.lineWidth = Math.max(2.5 * s, 1);
  ctx.beginPath();
  ctx.moveTo(38 * s, 90 * s);
  ctx.lineTo(90 * s, 80 * s);
  ctx.stroke();

  // Small extra stick
  ctx.lineWidth = Math.max(2 * s, 1);
  ctx.beginPath();
  ctx.moveTo(50 * s, 100 * s);
  ctx.lineTo(78 * s, 70 * s);
  ctx.stroke();

  // Draw flame — built from layered bezier curves

  // Outer flame (warm orange-red)
  const flameGradient = ctx.createLinearGradient(64 * s, 10 * s, 64 * s, 80 * s);
  flameGradient.addColorStop(0, "#FF4500");
  flameGradient.addColorStop(0.4, "#FF6B00");
  flameGradient.addColorStop(1, "#FF8C00");

  ctx.fillStyle = flameGradient;
  ctx.beginPath();
  ctx.moveTo(64 * s, 8 * s); // tip
  ctx.bezierCurveTo(
    52 * s, 25 * s,
    32 * s, 45 * s,
    36 * s, 65 * s
  );
  ctx.bezierCurveTo(
    38 * s, 80 * s,
    48 * s, 88 * s,
    64 * s, 88 * s
  );
  ctx.bezierCurveTo(
    80 * s, 88 * s,
    90 * s, 80 * s,
    92 * s, 65 * s
  );
  ctx.bezierCurveTo(
    96 * s, 45 * s,
    76 * s, 25 * s,
    64 * s, 8 * s
  );
  ctx.closePath();
  ctx.fill();

  // Middle flame (bright orange-yellow)
  const midGradient = ctx.createLinearGradient(64 * s, 20 * s, 64 * s, 80 * s);
  midGradient.addColorStop(0, "#FFA500");
  midGradient.addColorStop(0.5, "#FFB733");
  midGradient.addColorStop(1, "#FFCC00");

  ctx.fillStyle = midGradient;
  ctx.beginPath();
  ctx.moveTo(64 * s, 22 * s);
  ctx.bezierCurveTo(
    56 * s, 35 * s,
    42 * s, 50 * s,
    45 * s, 65 * s
  );
  ctx.bezierCurveTo(
    47 * s, 78 * s,
    54 * s, 84 * s,
    64 * s, 84 * s
  );
  ctx.bezierCurveTo(
    74 * s, 84 * s,
    81 * s, 78 * s,
    83 * s, 65 * s
  );
  ctx.bezierCurveTo(
    86 * s, 50 * s,
    72 * s, 35 * s,
    64 * s, 22 * s
  );
  ctx.closePath();
  ctx.fill();

  // Inner flame (bright yellow-white core)
  const innerGradient = ctx.createLinearGradient(64 * s, 40 * s, 64 * s, 80 * s);
  innerGradient.addColorStop(0, "#FFE066");
  innerGradient.addColorStop(0.6, "#FFEB99");
  innerGradient.addColorStop(1, "#FFF5CC");

  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.moveTo(64 * s, 40 * s);
  ctx.bezierCurveTo(
    58 * s, 50 * s,
    52 * s, 60 * s,
    54 * s, 70 * s
  );
  ctx.bezierCurveTo(
    55 * s, 78 * s,
    59 * s, 82 * s,
    64 * s, 82 * s
  );
  ctx.bezierCurveTo(
    69 * s, 82 * s,
    73 * s, 78 * s,
    74 * s, 70 * s
  );
  ctx.bezierCurveTo(
    76 * s, 60 * s,
    70 * s, 50 * s,
    64 * s, 40 * s
  );
  ctx.closePath();
  ctx.fill();

  // Small spark/flicker to the right
  ctx.fillStyle = "#FF6B00";
  ctx.beginPath();
  ctx.moveTo(78 * s, 30 * s);
  ctx.bezierCurveTo(
    76 * s, 35 * s,
    72 * s, 42 * s,
    75 * s, 48 * s
  );
  ctx.bezierCurveTo(
    78 * s, 42 * s,
    80 * s, 36 * s,
    78 * s, 30 * s
  );
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer("image/png");
}

const iconsDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Generated icon${size}.png`);
});

// scripts/generate-icons.js
// Generates a cozy campfire/kindling icon with a full log pile and warm glow.
// Run with: node scripts/generate-icons.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 128;

  ctx.clearRect(0, 0, size, size);

  // Warm ambient glow behind everything
  const glow = ctx.createRadialGradient(64 * s, 70 * s, 10 * s, 64 * s, 70 * s, 60 * s);
  glow.addColorStop(0, "rgba(255, 160, 50, 0.25)");
  glow.addColorStop(0.5, "rgba(255, 120, 30, 0.10)");
  glow.addColorStop(1, "rgba(255, 80, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // --- LOG PILE (cozy, full base) ---

  function drawLog(x1, y1, x2, y2, thickness, color, highlightColor) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perpX = Math.sin(angle) * thickness;
    const perpY = -Math.cos(angle) * thickness;

    // Main log body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - perpX, y1 - perpY);
    ctx.lineTo(x2 - perpX, y2 - perpY);
    ctx.lineTo(x2 + perpX, y2 + perpY);
    ctx.lineTo(x1 + perpX, y1 + perpY);
    ctx.closePath();
    ctx.fill();

    // Rounded ends
    ctx.beginPath();
    ctx.arc(x1, y1, thickness, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, thickness, 0, Math.PI * 2);
    ctx.fill();

    // Wood grain highlight
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = Math.max(0.8 * s, 0.5);
    ctx.beginPath();
    ctx.moveTo(x1 - perpX * 0.3, y1 - perpY * 0.3);
    ctx.lineTo(x2 - perpX * 0.3, y2 - perpY * 0.3);
    ctx.stroke();

    // End grain circle on visible ends
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(x2, y2, thickness * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x2, y2, thickness * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  const logThick = 6 * s;

  // Bottom layer — two big base logs
  drawLog(18 * s, 108 * s, 110 * s, 108 * s, logThick, "#5C3A1E", "#7A5230");
  drawLog(14 * s, 96 * s, 114 * s, 96 * s, logThick, "#4E2F18", "#6B4428");

  // Middle layer — crossed logs
  drawLog(20 * s, 84 * s, 108 * s, 84 * s, logThick * 0.9, "#6B4226", "#8B5E3C");
  drawLog(22 * s, 100 * s, 64 * s, 72 * s, logThick * 0.8, "#5C3A1E", "#7A5230");
  drawLog(106 * s, 100 * s, 64 * s, 72 * s, logThick * 0.8, "#5C3A1E", "#7A5230");

  // Top kindling — thinner sticks leaning in
  const stickThick = 3 * s;
  drawLog(35 * s, 92 * s, 56 * s, 62 * s, stickThick, "#6B4226", "#8B5E3C");
  drawLog(93 * s, 92 * s, 72 * s, 62 * s, stickThick, "#6B4226", "#8B5E3C");
  drawLog(50 * s, 95 * s, 64 * s, 65 * s, stickThick * 0.8, "#5C3A1E", "#7A5230");
  drawLog(78 * s, 95 * s, 64 * s, 65 * s, stickThick * 0.8, "#5C3A1E", "#7A5230");

  // --- FLAMES ---

  // Outer flame glow (soft, wide)
  const outerGlow = ctx.createRadialGradient(64 * s, 55 * s, 5 * s, 64 * s, 60 * s, 40 * s);
  outerGlow.addColorStop(0, "rgba(255, 100, 0, 0.3)");
  outerGlow.addColorStop(1, "rgba(255, 60, 0, 0)");
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(64 * s, 55 * s, 40 * s, 0, Math.PI * 2);
  ctx.fill();

  // Main outer flame
  const flameGrad = ctx.createLinearGradient(64 * s, 8 * s, 64 * s, 78 * s);
  flameGrad.addColorStop(0, "#E83A00");
  flameGrad.addColorStop(0.3, "#FF5500");
  flameGrad.addColorStop(0.7, "#FF7700");
  flameGrad.addColorStop(1, "#FF9922");

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(64 * s, 6 * s);
  ctx.bezierCurveTo(54 * s, 18 * s, 28 * s, 40 * s, 32 * s, 60 * s);
  ctx.bezierCurveTo(34 * s, 72 * s, 45 * s, 80 * s, 64 * s, 80 * s);
  ctx.bezierCurveTo(83 * s, 80 * s, 94 * s, 72 * s, 96 * s, 60 * s);
  ctx.bezierCurveTo(100 * s, 40 * s, 74 * s, 18 * s, 64 * s, 6 * s);
  ctx.closePath();
  ctx.fill();

  // Left flicker
  ctx.fillStyle = "#FF6600";
  ctx.beginPath();
  ctx.moveTo(42 * s, 38 * s);
  ctx.bezierCurveTo(38 * s, 44 * s, 36 * s, 55 * s, 40 * s, 62 * s);
  ctx.bezierCurveTo(42 * s, 55 * s, 40 * s, 46 * s, 42 * s, 38 * s);
  ctx.closePath();
  ctx.fill();

  // Right flicker
  ctx.fillStyle = "#FF6600";
  ctx.beginPath();
  ctx.moveTo(86 * s, 34 * s);
  ctx.bezierCurveTo(90 * s, 42 * s, 92 * s, 52 * s, 88 * s, 60 * s);
  ctx.bezierCurveTo(86 * s, 52 * s, 88 * s, 42 * s, 86 * s, 34 * s);
  ctx.closePath();
  ctx.fill();

  // Middle flame layer
  const midGrad = ctx.createLinearGradient(64 * s, 18 * s, 64 * s, 76 * s);
  midGrad.addColorStop(0, "#FF8800");
  midGrad.addColorStop(0.4, "#FFAA22");
  midGrad.addColorStop(1, "#FFCC44");

  ctx.fillStyle = midGrad;
  ctx.beginPath();
  ctx.moveTo(64 * s, 16 * s);
  ctx.bezierCurveTo(57 * s, 28 * s, 40 * s, 46 * s, 43 * s, 62 * s);
  ctx.bezierCurveTo(45 * s, 72 * s, 52 * s, 77 * s, 64 * s, 77 * s);
  ctx.bezierCurveTo(76 * s, 77 * s, 83 * s, 72 * s, 85 * s, 62 * s);
  ctx.bezierCurveTo(88 * s, 46 * s, 71 * s, 28 * s, 64 * s, 16 * s);
  ctx.closePath();
  ctx.fill();

  // Inner bright core
  const coreGrad = ctx.createLinearGradient(64 * s, 35 * s, 64 * s, 75 * s);
  coreGrad.addColorStop(0, "#FFD466");
  coreGrad.addColorStop(0.4, "#FFE599");
  coreGrad.addColorStop(1, "#FFF2CC");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(64 * s, 34 * s);
  ctx.bezierCurveTo(59 * s, 44 * s, 50 * s, 54 * s, 52 * s, 64 * s);
  ctx.bezierCurveTo(53 * s, 72 * s, 58 * s, 76 * s, 64 * s, 76 * s);
  ctx.bezierCurveTo(70 * s, 76 * s, 75 * s, 72 * s, 76 * s, 64 * s);
  ctx.bezierCurveTo(78 * s, 54 * s, 69 * s, 44 * s, 64 * s, 34 * s);
  ctx.closePath();
  ctx.fill();

  // Hot white center
  const hotGrad = ctx.createRadialGradient(64 * s, 65 * s, 2 * s, 64 * s, 65 * s, 12 * s);
  hotGrad.addColorStop(0, "rgba(255, 255, 240, 0.7)");
  hotGrad.addColorStop(1, "rgba(255, 240, 200, 0)");
  ctx.fillStyle = hotGrad;
  ctx.beginPath();
  ctx.arc(64 * s, 65 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();

  // --- SPARKS ---
  ctx.fillStyle = "#FFCC44";
  const sparks = [
    [48, 18, 1.5], [80, 14, 1.2], [38, 28, 1.0],
    [88, 24, 1.3], [52, 10, 1.0], [76, 8, 0.8],
  ];
  sparks.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toBuffer("image/png");
}

const iconsDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const buffer = generateIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Generated icon${size}.png`);
});

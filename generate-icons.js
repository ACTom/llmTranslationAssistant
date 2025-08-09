// 图标生成脚本
// 由于浏览器扩展需要PNG格式图标，这个脚本可以帮助将SVG转换为不同尺寸的PNG

const fs = require('fs');
const path = require('path');

// SVG图标内容
const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="64" cy="64" r="60" fill="url(#gradient)" stroke="#fff" stroke-width="4"/>
  
  <!-- AI芯片图标 -->
  <rect x="32" y="32" width="64" height="64" rx="8" fill="#fff" opacity="0.9"/>
  
  <!-- 电路线条 -->
  <g stroke="#667eea" stroke-width="2" fill="none">
    <line x1="40" y1="48" x2="88" y2="48"/>
    <line x1="40" y1="56" x2="72" y2="56"/>
    <line x1="40" y1="64" x2="88" y2="64"/>
    <line x1="40" y1="72" x2="80" y2="72"/>
    <line x1="40" y1="80" x2="88" y2="80"/>
  </g>
  
  <!-- 翻译符号 -->
  <g fill="#764ba2">
    <!-- 左侧文字块 -->
    <rect x="44" y="52" width="16" height="8" rx="2"/>
    <rect x="44" y="68" width="12" height="8" rx="2"/>
    
    <!-- 箭头 -->
    <path d="M66 60 L74 64 L66 68 Z"/>
    
    <!-- 右侧文字块 -->
    <rect x="76" y="52" width="12" height="8" rx="2"/>
    <rect x="76" y="68" width="16" height="8" rx="2"/>
  </g>
  
  <!-- AI标识 -->
  <text x="64" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff">AI</text>
</svg>`;

// 创建不同尺寸的SVG文件
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const scaledSvg = svgContent.replace('width="128" height="128"', `width="${size}" height="${size}"`);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(__dirname, 'icons', filename);
  
  fs.writeFileSync(filepath, scaledSvg);
  console.log(`Generated ${filename}`);
});

console.log('\nSVG icons generated successfully!');
console.log('\nTo convert to PNG, you can use online tools like:');
console.log('- https://convertio.co/svg-png/');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- Or use command line tools like ImageMagick or Inkscape');

console.log('\nImageMagick command example:');
sizes.forEach(size => {
  console.log(`convert icons/icon-${size}.svg icons/icon-${size}.png`);
});
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');

process.on('message', async (params) => {
  try {
    // Create a canvas with the specified dimensions
    const canvas = createCanvas(params.width, params.height);
    const ctx = canvas.getContext('2d');

    // Draw each item
    for (let key in params) {
      if (key === 'height' || key === 'width') continue; // Skip these

      const item = params[key];

      switch (item.type) {
        case 'text':
          const fontSize = item.size || '16px';
          const font = item.font ? await loadGoogleFont(item.font, fontSize) : `${fontSize} sans-serif`;
          ctx.font = font;
          ctx.fillStyle = item.color || '#000000';

          ctx.fillText(item.content, item.startX, item.startY);
          break;

        case 'image':
          const imageBuffer = Buffer.from(item.content, 'base64');
          const image = await loadImage(imageBuffer);
          ctx.globalAlpha = item.opacity || 1;

          const endX = item.endX || image.width + item.startX;
          const endY = item.endY || image.height + item.startY;

          const width = endX - item.startX;
          const height = endY - item.startY;

          if (item.cropper) {
            applyCropper(ctx, item, width, height);
          }

          ctx.drawImage(image, item.startX, item.startY, width, height);
          ctx.globalAlpha = 1;
          break;

        case 'solid':
          ctx.globalAlpha = item.opacity || 1;
          ctx.fillStyle = item.color || '#000000';

          const rectWidth = (item.endX || params.width) - item.startX;
          const rectHeight = (item.endY || params.height) - item.startY;

          ctx.fillRect(item.startX, item.startY, rectWidth, rectHeight);
          ctx.globalAlpha = 1;
          break;

        case 'border':
          ctx.globalAlpha = item.opacity || 1;
          ctx.strokeStyle = item.color || '#000000';
          ctx.lineWidth = item.width || 1;

          ctx.strokeRect(0, 0, params.width, params.height);
          ctx.globalAlpha = 1;
          break;

        default:
          console.log(`Unknown type: ${item.type}`);
          break;
      }
    }

    // Convert the canvas to a PNG data URL and send back
    const pngBuffer = canvas.toBuffer('image/png');
    process.send({ success: true, data: pngBuffer.toString('base64') });

  } catch (error) {
    process.send({ success: false, error: error.message });
  }
});

async function loadGoogleFont(fontUrl, size) {
  try {
    const response = await fetch(fontUrl);
    const cssText = await response.text();

    const fontUrlMatch = cssText.match(/url\((https:\/\/[^)]+)\)/);
    if (!fontUrlMatch) {
      throw new Error('Font URL not found in CSS');
    }

    const fontFileUrl = fontUrlMatch[1];
    const fontBuffer = await fetch(fontFileUrl).then(res => res.buffer());

    const tempFontPath = './temp-font.ttf';
    fs.writeFileSync(tempFontPath, fontBuffer);

    const fontFamily = 'CustomFont';
    registerFont(tempFontPath, { family: fontFamily });

    fs.unlinkSync(tempFontPath);

    return `${size} '${fontFamily}'`;

  } catch (error) {
    console.error('Error loading Google Font:', error);
    return `${size} sans-serif`;
  }
}

function applyCropper(ctx, item, width, height) {
  if (item.cropper === 'circle') {
    const centerX = item.startX + width / 2;
    const centerY = item.startY + height / 2;
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
  } else if (item.cropper === 'roundedSquare') {
    const cornerRadius = 20;
    ctx.beginPath();
    ctx.moveTo(item.startX + cornerRadius, item.startY);
    ctx.lineTo(item.endX - cornerRadius, item.startY);
    ctx.quadraticCurveTo(item.endX, item.startY, item.endX, item.startY + cornerRadius);
    ctx.lineTo(item.endX, item.endY - cornerRadius);
    ctx.quadraticCurveTo(item.endX, item.endY, item.endX - cornerRadius, item.endY);
    ctx.lineTo(item.startX + cornerRadius, item.endY);
    ctx.quadraticCurveTo(item.startX, item.endY, item.startX, item.endY - cornerRadius);
    ctx.lineTo(item.startX, item.startY + cornerRadius);
    ctx.quadraticCurveTo(item.startX, item.startY, item.startX + cornerRadius, item.startY);
    ctx.closePath();
    ctx.clip();
  }
}
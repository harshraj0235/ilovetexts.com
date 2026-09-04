const sharp = require('sharp');
const path = require('path');

async function optimize() {
  // 1. Compress harsh-raj.png → WebP at 200x200 (used as avatar, no need for 800x800)
  await sharp('public/harsh-raj.png')
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .webp({ quality: 85, effort: 6 })
    .toFile('public/harsh-raj.webp');

  const origSize = require('fs').statSync('public/harsh-raj.png').size;
  const newSize  = require('fs').statSync('public/harsh-raj.webp').size;
  console.log(`harsh-raj: ${Math.round(origSize/1024)}KB → ${Math.round(newSize/1024)}KB WebP`);

  // 2. Compress og-image.png → keep as PNG but optimize + resize if too big
  try {
    const ogMeta = await sharp('public/og-image.png').metadata();
    console.log(`og-image: ${ogMeta.width}x${ogMeta.height} ${Math.round(ogMeta.size/1024)}KB`);
    await sharp('public/og-image.png')
      .resize(1200, 630, { fit: 'cover', withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 85 })
      .toFile('public/og-image-optimized.png');
    const newOg = require('fs').statSync('public/og-image-optimized.png').size;
    console.log(`og-image-optimized: ${Math.round(newOg/1024)}KB`);

    // Also create WebP version for better performance
    await sharp('public/og-image.png')
      .resize(1200, 630, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile('public/og-image.webp');
    const ogWebp = require('fs').statSync('public/og-image.webp').size;
    console.log(`og-image.webp: ${Math.round(ogWebp/1024)}KB`);
  } catch(e) {
    console.log('og-image error:', e.message);
  }

  console.log('Done!');
}

optimize().catch(console.error);

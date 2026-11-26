import sharp from 'sharp';
import { downloadMediaMessage } from 'baileys';

export async function makeImageSticker(message) {
  const buffer = await downloadMediaMessage(message, 'buffer', {});
  if (!buffer?.length) throw new Error('Não consegui baixar a imagem.');

  return sharp(buffer, { animated: false })
    .rotate()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82 })
    .toBuffer();
}

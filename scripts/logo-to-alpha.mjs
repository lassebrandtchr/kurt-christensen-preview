// Laver et gennemsigtigt logo ud fra logo.png ved at gøre den næsten-sorte baggrund til alfa
// ("colour to alpha" mod baggrundsfarven). Logoets farver ændres ikke på synlige pixels.
import sharp from 'sharp';
const [src = 'src/assets/brand/logo.png', out = 'src/assets/brand/logo-transparent.png'] = process.argv.slice(2);
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const bg = [6, 6, 10];
const px = new Uint8ClampedArray(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const d = [0, 1, 2].map((k) => Math.max(0, data[i + k] - bg[k]) / (255 - bg[k]));
  let a = Math.max(...d);
  if (a < 0.03) a = 0; // fjern støj i baggrunden
  for (let k = 0; k < 3; k++) px[j + k] = a ? Math.round((d[k] / a) * 255) : 0;
  px[j + 3] = Math.round(a * 255);
}
await sharp(Buffer.from(px.buffer), { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(out);
console.log('Gemt', out, info.width + 'x' + info.height);

import { chromium } from 'playwright';
import fs from 'fs';

const b64 = fs.readFileSync('RC_Logo_TBG.png').toString('base64');
const dataUri = `data:image/png;base64,${b64}`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<img id="logo" src="${dataUri}" style="width:1024px;height:1024px;">`);
await page.waitForTimeout(300);

const result = await page.evaluate(async () => {
  const img = document.getElementById('logo');
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  // sample a pixel known to be on the dark stroke (top petal, around center-top)
  const samples = [
    [512, 150], [512, 420], [200, 420], [512, 700]
  ];
  return samples.map(([x, y]) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { x, y, r: d[0], g: d[1], b: d[2], a: d[3] };
  });
});
console.log(JSON.stringify(result, null, 2));
await browser.close();

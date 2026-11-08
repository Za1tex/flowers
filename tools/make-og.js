// Делает картинку превью ссылки img/og.png (1200×630) с первого экрана сайта.
// Запуск: node tools/make-og.js   (нужен Playwright с Chromium)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'img'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(root, 'index.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Даём отыграть анимации появления заголовка, лепестки остаются в полёте.
  await page.waitForTimeout(2200);
  await page.addStyleTag({ content: '.hero-art .arch{animation:none!important} .call-bar{display:none!important} .container{padding-left:56px!important;padding-right:56px!important} .hero h1{font-size:80px!important} .facts{display:none!important} .hero{padding-top:56px!important}' });
  await page.screenshot({ path: path.join(root, 'img/og.png') });
  await browser.close();
  console.log('saved img/og.png');
})();

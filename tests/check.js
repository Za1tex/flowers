// Browser checks for the demo site. Run: node tests/check.js
// Prints PASS/FAIL per check, exits 1 if anything fails.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const PHONE_HREF = 'tel:+79000000000';

// Third-party font loads may fail offline; only our own errors count.
const isExternal = (text) => /fonts\.(googleapis|gstatic)\.com/.test(text);

async function open(browser, opts = {}) {
  const { width = 1440, height = 900, ...ctxOpts } = opts;
  const ctx = await browser.newContext({ viewport: { width, height }, ...ctxOpts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !isExternal(m.text() + (m.location().url || ''))) errors.push(m.text()); });
  page.on('requestfailed', (r) => { if (!isExternal(r.url())) errors.push('request failed: ' + r.url()); });
  await page.goto(URL, { waitUntil: 'load' });
  return { ctx, page, errors };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

const checks = [];
const check = (name, run) => checks.push({ name, run });

// ---------- Task 1 ----------
check('loads-without-errors', async (browser) => {
  const { ctx, page, errors } = await open(browser);
  await page.waitForTimeout(500);
  await ctx.close();
  assert(errors.length === 0, errors.join(' | '));
});

check('no-horizontal-overflow', async (browser) => {
  for (const width of [360, 390, 1440]) {
    const { ctx, page } = await open(browser, { width });
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    await ctx.close();
    assert(r.sw <= r.iw, `width ${width}: scrollWidth ${r.sw} > ${r.iw}`);
  }
});

check('meta-tags', async (browser) => {
  const { ctx, page } = await open(browser);
  const m = await page.evaluate(() => {
    const c = (s) => document.querySelector(s)?.getAttribute('content') || '';
    let ld = null;
    try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); } catch (e) {}
    return {
      title: document.title, lang: document.documentElement.lang,
      desc: c('meta[name="description"]'), ogt: c('meta[property="og:title"]'),
      ogd: c('meta[property="og:description"]'), ogi: c('meta[property="og:image"]'), ld,
    };
  });
  await ctx.close();
  assert(m.title.includes('Лепесток'), 'title: ' + m.title);
  assert(m.lang === 'ru', 'lang: ' + m.lang);
  assert(m.desc && m.ogt && m.ogd, 'description / og:title / og:description missing');
  assert(m.ogi.endsWith('img/og.png'), 'og:image: ' + m.ogi);
  assert(m.ld && m.ld['@type'] === 'Florist', 'JSON-LD @type');
  assert(m.ld.telephone === '+79000000000', 'JSON-LD telephone: ' + (m.ld && m.ld.telephone));
});

check('hero', async (browser) => {
  const { ctx, page } = await open(browser);
  await page.waitForTimeout(300);
  const h = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim() || '',
    arches: document.querySelectorAll('.hero .arch').length,
    petals: document.querySelectorAll('.hero .petal').length,
    order: document.querySelector('.hero a[href^="tel:"]')?.getAttribute('href'),
  }));
  await ctx.close();
  assert(h.h1.length > 0, 'h1 empty');
  assert(h.arches >= 2, 'hero arches: ' + h.arches);
  assert(h.petals >= 1, 'petals: ' + h.petals);
  assert(h.order === PHONE_HREF, 'hero order link: ' + h.order);
});

// ---------- Task 2 ----------
check('catalog', async (browser) => {
  const { ctx, page } = await open(browser);
  const cards = await page.$$eval('#catalog .bouquet', (els) => els.map((el) => ({
    title: el.querySelector('h3')?.textContent.trim() || '',
    price: el.querySelector('.price')?.textContent.trim() || '',
    order: el.querySelector('a.order')?.getAttribute('href'),
    arch: !!el.querySelector('.arch'),
  })));
  await ctx.close();
  assert(cards.length >= 6 && cards.length <= 8, 'bouquets: ' + cards.length);
  for (const c of cards) {
    assert(c.title, 'bouquet without title');
    assert(/^\d[\d\s ]* ₽$/.test(c.price), 'bad price: ' + c.price);
    assert(c.order === PHONE_HREF, 'bad order link: ' + c.order);
    assert(c.arch, 'bouquet without arch: ' + c.title);
  }
});

check('occasions', async (browser) => {
  const { ctx, page } = await open(browser);
  const n = await page.$$eval('#occasions .occasion', (els) => els.map((el) => el.querySelector('a[href^="tel:"]')?.getAttribute('href')));
  await ctx.close();
  assert(n.length >= 4 && n.length <= 6, 'occasions: ' + n.length);
  assert(n.every((h) => h === PHONE_HREF), 'occasion without tel link');
});

check('empty-arch-art', async (browser) => {
  const { ctx, page } = await open(browser);
  const bad = await page.$$eval('.arch:not(.has-photo)', (els) => els.filter((el) =>
    !el.querySelector('svg') || !(el.querySelector('figcaption')?.textContent.trim())).length);
  const total = await page.$$eval('.arch', (els) => els.length);
  await ctx.close();
  assert(total > 0, 'no arches');
  assert(bad === 0, `${bad} empty arches without drawing or caption`);
});

check('photo-in-arch', async (browser) => {
  const { ctx, page } = await open(browser, { width: 1440 });
  const sample = 'file://' + path.join(ROOT, 'tests/fixtures/sample.jpg');
  const r = await page.evaluate(async (src) => {
    const fig = document.querySelector('#catalog .arch');
    const before = fig.getBoundingClientRect().height;
    fig.classList.add('has-photo');
    fig.innerHTML = '<img alt="тест">';
    const img = fig.querySelector('img');
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
    return { before, after: fig.getBoundingClientRect().height, fit: getComputedStyle(img).objectFit,
      imgH: img.getBoundingClientRect().height };
  }, sample);
  await ctx.close();
  assert(Math.abs(r.before - r.after) <= 1, `arch height changed ${r.before} -> ${r.after}`);
  assert(r.fit === 'cover', 'object-fit: ' + r.fit);
  assert(Math.abs(r.imgH - r.after) <= 2, `img does not fill arch: ${r.imgH} vs ${r.after}`);
});

// ---------- Task 3 ----------
check('sections', async (browser) => {
  const { ctx, page } = await open(browser);
  const r = await page.evaluate(() => ({
    nav: [...document.querySelectorAll('.nav a')].map((a) => a.getAttribute('href')),
    ids: ['catalog', 'occasions', 'about', 'delivery', 'reviews', 'contacts'].filter((id) => !document.getElementById(id)),
    reviews: document.querySelectorAll('#reviews blockquote.review').length,
    footer: !!document.querySelector('footer'),
  }));
  await ctx.close();
  assert(r.ids.length === 0, 'missing sections: ' + r.ids.join(','));
  for (const h of r.nav) assert(h.startsWith('#'), 'nav href ' + h);
  assert(r.nav.length >= 6, 'nav links: ' + r.nav.length);
  assert(r.reviews === 3, 'reviews: ' + r.reviews);
  assert(r.footer, 'no footer');
});

check('nav-targets-exist', async (browser) => {
  const { ctx, page } = await open(browser);
  const missing = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href'))
    .filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
  await ctx.close();
  assert(missing.length === 0, 'anchors without target: ' + missing.join(','));
});

check('all-tel-same', async (browser) => {
  const { ctx, page } = await open(browser);
  const hrefs = await page.$$eval('a[href^="tel:"]', (as) => as.map((a) => a.getAttribute('href')));
  await ctx.close();
  assert(hrefs.length >= 10, 'tel links: ' + hrefs.length);
  const bad = hrefs.filter((h) => h !== PHONE_HREF);
  assert(bad.length === 0, 'different tel links: ' + bad.join(','));
});

check('call-bar', async (browser) => {
  let { ctx, page } = await open(browser, { width: 390, height: 844 });
  const m = await page.evaluate(() => {
    const bar = document.querySelector('.call-bar');
    if (!bar) return null;
    return { display: getComputedStyle(bar).display, h: bar.getBoundingClientRect().height,
      pad: parseFloat(getComputedStyle(document.body).paddingBottom), href: bar.querySelector('a')?.getAttribute('href') };
  });
  await ctx.close();
  assert(m, 'no .call-bar');
  assert(m.display !== 'none', 'call-bar hidden on phone');
  assert(m.href === PHONE_HREF, 'call-bar href ' + m.href);
  assert(m.pad >= m.h, `body padding-bottom ${m.pad} < bar ${m.h}`);
  ({ ctx, page } = await open(browser, { width: 1440 }));
  const d = await page.$eval('.call-bar', (b) => getComputedStyle(b).display);
  await ctx.close();
  assert(d === 'none', 'call-bar visible on desktop');
});

check('anchor-not-under-header', async (browser) => {
  for (const width of [390, 1440]) {
    const { ctx, page } = await open(browser, { width });
    const r = await page.evaluate(() => {
      const s = document.getElementById('delivery');
      s.scrollIntoView({ behavior: 'instant' });
      return { top: s.getBoundingClientRect().top, hdr: document.querySelector('.site-header').getBoundingClientRect().bottom };
    });
    await ctx.close();
    assert(r.top >= r.hdr - 1, `width ${width}: section top ${r.top} under header ${r.hdr}`);
  }
});

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  let failed = 0;
  for (const c of checks) {
    if (only.length && !only.includes(c.name)) continue;
    try { await c.run(browser); console.log('PASS ' + c.name); }
    catch (e) { failed++; console.log('FAIL ' + c.name + ': ' + e.message.split('\n')[0]); }
  }
  await browser.close();
  console.log(failed ? `${failed} failed` : 'all passed');
  process.exit(failed ? 1 : 0);
})();

module.exports = { open, check, assert, ROOT, URL, PHONE_HREF, fs };

/**
 * Strict mobile audit.
 *
 * The previous script EXCLUDED anything clipped by an overflow:hidden ancestor,
 * on the theory that a clipped element is "intentionally" hidden. That is
 * exactly backwards for text: a sentence sliced in half by its container is the
 * most visible bug a user can hit, and it is precisely how the fibroid labels
 * and the fertility stat cards shipped broken. This version FAILS on clipping.
 */
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const BASE = 'http://localhost:4300';
const ROUTES = [
  '/', '/conditions', '/conditions/pcos', '/conditions/endometriosis',
  '/conditions/fibroids', '/conditions/irregular-periods',
  '/conditions/difficulty-conceiving', '/conditions/recurrent-miscarriage',
  '/pregnancy', '/pregnancy/first-trimester', '/pregnancy/second-trimester',
  '/pregnancy/third-trimester', '/services', '/fertility', '/about', '/faq',
  '/contact', '/book', '/bookings', '/privacy', '/terms', '/refund-policy',
];
const WIDTHS = [320, 390, 430, 768, 1024, 1280, 1920];

const PROBE = () => {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const label = (el) => {
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}${t ? ` "${t}"` : ''}`;
  };

  // 1. document-level horizontal overflow
  if (document.documentElement.scrollWidth > vw + 1) {
    out.push({ type: 'PAGE_OVERFLOW', detail: `scrollWidth ${document.documentElement.scrollWidth} > ${vw}` });
  }

  // Two components are *meant* to be wider than the screen: the infinite
  // credentials marquee and the horizontally-scrollable chapter strip. Anything
  // inside them is excluded; everything else is fair game.
  // Two components are meant to be wider than the screen (the credentials
  // marquee, the scrollable chapter strip), and the hero's decorative orbs and
  // background art deliberately bleed off-canvas behind the content. All are
  // inside `overflow-x:clip` sections and none makes the page scroll sideways,
  // which the PAGE_OVERFLOW check above independently guarantees.
  const EXEMPT = '.marq,.marq-t,.hud-in,.wx-marks,[data-scroller],.wd,.orb,.orb-ring,.scene,.j-bg,.j-bg-in,[aria-hidden="true"]';
  const exempt = (el) => !!el.closest(EXEMPT);

  const all = Array.from(document.querySelectorAll('body *')).filter((el) => !exempt(el));

  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const tag = el.tagName.toLowerCase();
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();

    // Shapes *inside* an <svg> are clipped by the SVG root's own overflow, so a
    // decorative path drawn past the viewBox edge is invisible, not a bug. Only
    // the <svg> element itself is measured here; stray SVG *text* has its own
    // dedicated check further down.
    const insideSvg = el.ownerSVGElement !== null && el.ownerSVGElement !== undefined;

    // 2. an element painting past the right edge of the viewport
    if (!insideSvg && r.right > vw + 1.5 && cs.position !== 'fixed') {
      out.push({ type: 'PAST_RIGHT_EDGE', detail: `${label(el)} right=${r.right.toFixed(0)} vw=${vw}` });
    }
    // 3. an element starting left of the viewport
    if (!insideSvg && r.left < -1.5 && cs.position !== 'fixed') {
      out.push({ type: 'PAST_LEFT_EDGE', detail: `${label(el)} left=${r.left.toFixed(0)}` });
    }

    // 4. TEXT CLIPPED BY ITS OWN BOX (the check the old audit was missing).
    //    scrollWidth exceeding clientWidth on a box that clips means real,
    //    readable content is being sliced off.
    if (ownText.length > 1 && (cs.overflowX === 'hidden' || cs.overflowX === 'clip')) {
      if (el.scrollWidth > el.clientWidth + 2) {
        out.push({ type: 'TEXT_CLIPPED', detail: `${label(el)} scrollW=${el.scrollWidth} clientW=${el.clientWidth}` });
      }
    }

    // 5. a descendant painting outside an ancestor that clips it
    if (!insideSvg && tag !== 'svg' &&
        (cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.overflow === 'hidden')) {
      const kids = Array.from(el.children);
      for (const k of kids) {
        const ks = getComputedStyle(k);
        if (ks.display === 'none' || ks.position === 'absolute' || ks.position === 'fixed') continue;
        const kr = k.getBoundingClientRect();
        if (kr.width === 0) continue;
        if (kr.right > r.right + 2 || kr.left < r.left - 2) {
          out.push({ type: 'CHILD_CLIPPED', detail: `${label(k)} outside ${label(el)} (child ${kr.left.toFixed(0)}–${kr.right.toFixed(0)} vs box ${r.left.toFixed(0)}–${r.right.toFixed(0)})` });
        }
      }
    }
  }

  // 6. SVG <text> painted outside its own <svg> box — how the fibroid labels
  //    got sliced. Compare each text node's rect to the svg's rect.
  for (const svg of Array.from(document.querySelectorAll('svg'))) {
    if (exempt(svg)) continue;
    const sr = svg.getBoundingClientRect();
    if (sr.width === 0) continue;
    for (const t of Array.from(svg.querySelectorAll('text'))) {
      const tr = t.getBoundingClientRect();
      if (tr.width === 0) continue;
      if (tr.right > sr.right + 1 || tr.left < sr.left - 1) {
        out.push({
          type: 'SVG_TEXT_OUTSIDE_BOX',
          detail: `"${(t.textContent || '').trim().slice(0, 40)}" text ${tr.left.toFixed(0)}–${tr.right.toFixed(0)} vs svg ${sr.left.toFixed(0)}–${sr.right.toFixed(0)}`,
        });
      }
    }
  }

  // 7. touch targets
  for (const el of Array.from(document.querySelectorAll('a,button,input,select,[role="button"]'))) {
    if (exempt(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // WCAG 2.5.8 exempts a link sitting inline within a sentence — you cannot
    // pad it to 32px without wrecking the line spacing of the paragraph, and
    // the surrounding text makes it easy enough to hit.
    const inSentence = el.tagName === 'A' && getComputedStyle(el).display.startsWith('inline') &&
      el.parentElement && /^(P|LI|SPAN|EM|STRONG|DD|TD)$/.test(el.parentElement.tagName) &&
      (el.parentElement.textContent || '').trim().length > (el.textContent || '').trim().length + 4;
    if (inSentence) continue;
    if (r.height < 32 || r.width < 32) {
      out.push({ type: 'SMALL_TARGET', detail: `${label(el)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}` });
    }
  }

  return out;
};

(async () => {
  const only = process.argv[2] ? [process.argv[2]] : ROUTES;
  const browser = await chromium.launch();
  let total = 0;
  const seen = new Map();

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, hasTouch: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    for (const route of only) {
      errs.length = 0;
      const resp = await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => null);
      if (!resp || resp.status() !== 200) {
        console.log(`[${w}] ${route}  HTTP ${resp ? resp.status() : 'ERR'}`);
        total++;
        continue;
      }
      // settle reveal animations: scroll the whole page, then return
      await page.evaluate(async () => {
        const step = Math.round(innerHeight * 0.8);
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      const issues = await page.evaluate(PROBE);
      if (errs.length) issues.push({ type: 'JS_ERROR', detail: errs[0].slice(0, 120) });
      if (issues.length) {
        console.log(`\n[${w}px] ${route}`);
        for (const i of issues) {
          console.log(`   ${i.type}: ${i.detail}`);
          const k = i.type + '|' + i.detail.slice(0, 50);
          seen.set(k, (seen.get(k) || 0) + 1);
        }
        total += issues.length;
      }
    }
    await ctx.close();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(total === 0 ? 'CLEAN — no issues at any phone width' : `${total} issue(s) total`);
  if (seen.size) {
    console.log('\nMost frequent:');
    [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
      .forEach(([k, n]) => console.log(`  ${n}x  ${k}`));
  }
  await browser.close();
  process.exit(total ? 1 : 0);
})();

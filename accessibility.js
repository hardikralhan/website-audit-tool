const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

async function checkAccessibility(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const results = await new AxePuppeteer(page).analyze();
  await browser.close();

  return results.violations;
}

module.exports = { checkAccessibility };
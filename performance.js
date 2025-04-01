const lighthouse = require('lighthouse').default; // Access the default exports
const puppeteer = require('puppeteer');

async function runLighthouse(url) {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Lighthouse options
  const lhOptions = {
    port: new URL(browser.wsEndpoint()).port, // Connect to Puppeteer’s browser
    output: 'json',
    onlyCategories: ['performance'],
  };

  // Run Lighthouse
  const runnerResult = await lighthouse(url, lhOptions);
  await browser.close();

  // Extract performance score and issues
  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  const issues = runnerResult.lhr.audits;

  return { performanceScore, issues };
}

module.exports = { runLighthouse };
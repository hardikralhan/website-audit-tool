const lighthouse = require('lighthouse').default; // Access the default exports
const puppeteer = require('puppeteer');

async function runLighthouse(url, options = {}) {
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Default options for Lighthouse
  const defaultOptions = {
    port: new URL(await browser.wsEndpoint()).port,
    output: 'json',
    onlyCategories: ['performance'],
    emulatedFormFactor: 'desktop', // Default to desktop
  };

  // Merge user-provided options with defaults
  const lhOptions = { ...defaultOptions, ...options };

  // Run Lighthouse with the specified options
  const runnerResult = await lighthouse(url, lhOptions);
  await browser.close();

  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  const audits = runnerResult.lhr.audits;

  // Extract detailed issues
  const issues = {
    loadTime: audits['interactive']?.numericValue || 0,
    unoptimizedImages: audits['unoptimized-images']?.details?.items.map(item => ({
      url: item.url,
      size: item.wastedBytes,
    })) || [],
    httpRequests: audits['resource-summary']?.details?.items || [],
    renderBlocking: audits['render-blocking-resources']?.details?.items.map(item => item.url) || [],
    caching: audits['uses-long-cache-ttl']?.score === 0 ? 'No caching detected' : 'Caching present',
    // Include tap targets only for mobile emulation
    tapTargets: lhOptions.emulatedFormFactor === 'mobile' ? audits['tap-targets']?.details?.items || [] : [],
  };

  return {
    performanceScore,
    issues,
  };
}

module.exports = { runLighthouse };
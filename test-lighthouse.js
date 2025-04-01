const lighthouse = require('lighthouse').default; // Access the default export
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.telerik.com/support/demos', { waitUntil: 'networkidle2' });

  const options = {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    onlyCategories: ['performance'],
  };
//   console.log(lighthouse)

  const runnerResult = await lighthouse('https://www.telerik.com/support/demos', options);
  console.log(runnerResult.lhr.categories.performance.score);
  await browser.close();
})();
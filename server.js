const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {
    crawlWebsite
} = require('./crawler');
const {
    runLighthouse
} = require('./performance');
const {
    checkSEO
} = require('./seo');
const {
    checkAccessibility
} = require('./accessibility');
const {
    checkContentQuality
} = require('./content');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json());

// app.post('/audit', async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: 'URL is required' });

//   try {
//     // Crawl the website
//     const pages = await crawlWebsite(url);
//     const auditResults = [];

//     // Analyze each page
//     for (const page of pages) {
//       const performance = await runLighthouse(page.url);
//       const seoIssues = checkSEO(page.content);
//       const accessibilityIssues = await checkAccessibility(page.url);
//       const contentText = require('cheerio').load(page.content)('body').text();
//       const contentIssues = await checkContentQuality(contentText);

//       auditResults.push({
//         url: page.url,
//         performance: performance.performanceScore,
//         performanceIssues: performance.issues,
//         seo: seoIssues,
//         accessibility: accessibilityIssues,
//         content: contentIssues,
//       });
//     }

//     res.json(auditResults);
//   } catch (error) {
//     console.error('Audit error:', error);
//     res.status(500).json({ error: 'Audit failed' });
//   }
// });

app.post('/audit', async (req, res) => {
    const {
        url
    } = req.body;
    if (!url) return res.status(400).json({
        error: 'URL is required'
    });

    const pages = await crawlWebsite(url);
    const report = {
        performance: [],
        uiux: [],
        mobile: [],
        browser: [],
        seo: [],
        security: [],
        accessibility: [],
        functionality: [],
        content: [],
    };

    for (const page of pages) {
        const perf = await runLighthouse(page.url);
        const seo = checkSEO(page.content);
        const access = await checkAccessibility(page.url);
        const content = await checkContentQuality(require('cheerio').load(page.content)('body').text());
        const uiux = await checkUIUX(page.url);
        const security = await checkSecurity(page.url);
        const func = await checkFunctionality(page.url);

        report.performance.push({
            page: page.url,
            issues: perf.issues
        });
        report.seo.push({
            page: page.url,
            issues: seo.map(i => ({
                issue: i,
                recommendation: 'Fix SEO issue'
            }))
        });
        report.accessibility.push({
            page: page.url,
            issues: access
        });
        // Add others similarly...
    }

    res.json(report);
});

async function checkUIUX(url) {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle2'
    });

    const issues = [];
    const buttonStyles = await page.$$eval('button', buttons =>
        buttons.map(btn => ({
            font: window.getComputedStyle(btn).fontFamily,
            color: window.getComputedStyle(btn).color,
        }))
    );

    const uniqueStyles = new Set(buttonStyles.map(s => `${s.font}|${s.color}`));
    if (uniqueStyles.size > 1) issues.push('Inconsistent button styles detected');

    await browser.close();
    return issues;
}

const sslChecker = require('ssl-checker');

async function checkSecurity(url) {
  const issues = [];
  const ssl = await sslChecker(url);
  if (!ssl.valid) issues.push('SSL certificate invalid or expired');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  const resources = await page.evaluate(() => Array.from(document.querySelectorAll('*')).map(el => el.src || el.href));
  if (resources.some(r => r?.startsWith('http:'))) issues.push('Mixed content detected');
  await browser.close();

  return issues;
}

async function checkFunctionality(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));
    await page.goto(url);
    await browser.close();
    return errors.length ? [`JS errors: ${errors.join(', ')}`] : [];
}


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
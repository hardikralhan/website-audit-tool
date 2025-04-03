const express = require('express');
const app = express();
app.use(express.json());
const puppeteer = require('puppeteer');

// Assuming these dependencies are installed and imported
const { crawlWebsite } = require('./crawler'); // Custom function to crawl pages
const { runLighthouse } = require('./performance'); // Custom Lighthouse wrapper
const { checkSEO } = require('./seo'); // Custom SEO checker
const { checkAccessibility } = require('./accessibility'); // Custom accessibility checker
const { checkContentQuality } = require('./content'); // Custom content quality checker
const { checkUIUX } = require('./checkUIUX'); // Custom UI/UX checker
// const { checkSecurity } = require('./security'); // Custom security checker
// const { checkFunctionality } = require('./functionality'); // Custom functionality checker
// const { checkCrossBrowser } = require('./browser'); // Custom cross-browser checker
const cheerio = require('cheerio');

app.post('/audit', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // Crawl the website to get all pages
    const pages = await crawlWebsite(url);

    // Initialize the report structure with renamed keys for clarity
    const report = {
      "Performance & Speed Optimization": [],
      "UI/UX & Design Consistency": [],
      "Mobile Responsiveness & Cross-Device Compatibility": [],
      "Cross-Browser Compatibility": [],
      "SEO & Metadata Optimization": [],
      "Security & SSL Issues": [],
      "Accessibility (WCAG Compliance)": [],
      "Functionality & Usability": [],
      "Content Quality & Readability": []
    };

    // Analyze each page
    for (const page of pages) {
      // 1. Performance & Speed Optimization
      const perf = await runLighthouse(page.url);
      report["Performance & Speed Optimization"].push({
        page: page.url,
        issues: [
          {
            issue: `Page load time: ${perf.issues.loadTime}ms`,
            section: "Overall",
            recommendation: "Optimize images, minify JS/CSS, and use browser caching."
          },
          ...(perf.issues.unoptimizedImages || []).map(img => ({
            issue: `Unoptimized image: ${img.url} (${img.size} bytes)`,
            section: "Images",
            recommendation: `Compress ${img.url} using tools like TinyPNG.`
          })),
          ...(perf.issues.renderBlocking || []).map(file => ({
            issue: `Render-blocking resource: ${file}`,
            section: "Scripts/Styles",
            recommendation: `Defer or async load ${file}.`
          }))
        ]
      });

      // 2. UI/UX & Design Consistency
      const uiux = await checkUIUX(page.url);
      report["UI/UX & Design Consistency"].push({
        page: page.url,
        issues: uiux.map(issue => ({
          issue: issue,
          section: "Design",
          recommendation: "Ensure consistent design elements across pages."
        }))
      });

      // 3. Mobile Responsiveness & Cross-Device Compatibility
      const mobilePerf = await runLighthouse(page.url, { emulatedFormFactor: 'mobile' });
      report["Mobile Responsiveness & Cross-Device Compatibility"].push({
        page: page.url,
        issues: [
          {
            issue: `Mobile performance score: ${mobilePerf.performanceScore}`,
            section: "Overall",
            recommendation: "Optimize resources and layout for mobile devices."
          },
          ...(mobilePerf.issues.tapTargets || []).map(target => ({
            issue: `Tap target too small: ${target.node.label}`,
            section: "Navigation",
            recommendation: "Increase tap target size to at least 48px."
          }))
        ]
      });

      // 4. Cross-Browser Compatibility
    //   const browserCheck = await checkCrossBrowser(page.url);
    //   report["Cross-Browser Compatibility"].push({
    //     page: page.url,
    //     issues: browserCheck.issues.map(issue => ({
    //       issue: issue,
    //       section: "Browser",
    //       recommendation: "Test and fix layout in affected browsers."
    //     }))
    //   });

      // 5. SEO & Metadata Optimization
      const seo = checkSEO(page.content);
      report["SEO & Metadata Optimization"].push({
        page: page.url,
        issues: seo.map(issue => ({
          issue: issue,
          section: "SEO",
          recommendation: "Fix SEO issues like missing meta tags or broken links."
        }))
      });

      // 6. Security & SSL Issues
      const security = await checkSecurity(page.url);
      report["Security & SSL Issues"].push({
        page: page.url,
        issues: security.map(issue => ({
          issue: issue,
          section: "Security",
          recommendation: "Ensure HTTPS and valid SSL certificates."
        }))
      });

      // 7. Accessibility (WCAG Compliance)
      const access = await checkAccessibility(page.url);
      report["Accessibility (WCAG Compliance)"].push({
        page: page.url,
        issues: access.map(violation => ({
          issue: violation.description,
          section: violation.nodes[0]?.target[0] || "Unknown",
          recommendation: violation.help
        }))
      });

      // 8. Functionality & Usability
      const func = await checkFunctionality(page.url);
      report["Functionality & Usability"].push({
        page: page.url,
        issues: func.map(error => ({
          issue: `JavaScript error: ${error}`,
          section: "Scripts",
          recommendation: "Debug and fix the JavaScript error."
        }))
      });

      // 9. Content Quality & Readability
    //   const contentText = cheerio.load(page.content)('body').text();
    //   const contentIssues = await checkContentQuality(contentText);
    //   report["Content Quality & Readability"].push({
    //     page: page.url,
    //     issues: contentIssues.map(issue => ({
    //       issue: issue.message,
    //       section: "Content",
    //       recommendation: issue.replacements?.length ? `Consider: ${issue.replacements[0].value}` : "Review content."
    //     }))
    //   });
    }

    // Return the complete report
    res.json(report);
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Audit failed' });
  }
});

// async function checkUIUX(url) {
//     const browser = await puppeteer.launch({
//         headless: true
//     });
//     const page = await browser.newPage();
//     await page.goto(url, {
//         waitUntil: 'networkidle2'
//     });

//     const issues = [];
//     const buttonStyles = await page.$$eval('button', buttons =>
//         buttons.map(btn => ({
//             font: window.getComputedStyle(btn).fontFamily,
//             color: window.getComputedStyle(btn).color,
//         }))
//     );

//     const uniqueStyles = new Set(buttonStyles.map(s => `${s.font}|${s.color}`));
//     if (uniqueStyles.size > 1) issues.push('Inconsistent button styles detected');

//     await browser.close();
//     return issues;
// }

const sslChecker = require('ssl-checker');
const { URL } = require('url');

async function checkSecurity(url) {
    const issues = [];
    const hostname = new URL(url).hostname;
    const ssl = await sslChecker(hostname);
    if (!ssl.valid) issues.push('SSL certificate invalid or expired');
  
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);
  
    // Get resources, filtering out falsy values (undefined, null, empty strings)
    const resources = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      return Array.from(elements)
        .map(el => el.src || el.href)
        .filter(r => r); // Only include truthy values
    });
  
    // Check for mixed content, ensuring r is a string
    if (resources.some(r => typeof r === 'string' && r.startsWith('http:'))) {
      issues.push('Mixed content detected');
    }
  
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

// Start the server (example port)
app.listen(3000, () => console.log('Server running on port 3000'));
const cheerio = require('cheerio');

function checkSEO(html) {
    const $ = cheerio.load(html);
    const issues = [];
  
    if (!$('meta[name="description"]').length) issues.push('Missing meta description');
    if ($('h1').length !== 1) issues.push(`Incorrect H1 count: ${$('h1').length}`);
    $('img').each((i, img) => !$(img).attr('alt') && issues.push(`Image ${i + 1} missing alt`));
    if (!$('link[rel="canonical"]').length) issues.push('Missing canonical tag');
  
    return issues;
  }

module.exports = { checkSEO };
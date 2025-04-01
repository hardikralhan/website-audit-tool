const cheerio = require('cheerio');

function checkSEO(html) {
  const $ = cheerio.load(html);
  const issues = [];

  if (!$('meta[name="description"]').length) {
    issues.push('Missing meta description');
  }

  if ($('h1').length !== 1) {
    issues.push(`Incorrect number of H1 tags (${$('h1').length})`);
  }

  $('img').each((i, img) => {
    if (!$(img).attr('alt')) {
      issues.push(`Image ${i + 1} missing alt attribute`);
    }
  });

  return issues;
}

module.exports = { checkSEO };
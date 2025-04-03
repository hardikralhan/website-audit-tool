const axios = require('axios');

async function checkContentQuality(text) {
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('language', 'en-US');

  const response = await axios.post('https://api.languagetool.org/v2/check', params);
  const issues = response.data.matches;

  // Additional custom check for long sentences
  const sentences = text.split('.').filter(s => s.trim().length > 50);
  if (sentences.length) {
    issues.push({ message: 'Long sentences detected' });
  }
  
  return issues;
}

module.exports = { checkContentQuality };

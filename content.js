const axios = require('axios');

async function checkContentQuality(text) {
  try {
    const response = await axios.post('https://api.languagetool.org/v2/check', {
      text: text,
      language: 'en-US',
    });
    return response.data.matches;
  } catch (error) {
    console.error('Content quality check error:', error);
    return [];
  }
}

module.exports = { checkContentQuality };
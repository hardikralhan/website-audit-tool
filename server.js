const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { crawlWebsite } = require('./crawler');
const { runLighthouse } = require('./performance');
const { checkSEO } = require('./seo');
const { checkAccessibility } = require('./accessibility');
const { checkContentQuality } = require('./content');

const app = express();
const PORT = 3001;
// const MONGO_URI = 'mongodb://localhost:27017/website_audit';

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json());

// MongoDB Connection
// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// Audit Route
app.post('/audit', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // Crawl the website
    const pages = await crawlWebsite(url);
    const auditResults = [];

    // Analyze each page
    for (const page of pages) {
      const performance = await runLighthouse(page.url);
      const seoIssues = checkSEO(page.content);
      const accessibilityIssues = await checkAccessibility(page.url);
      const contentText = require('cheerio').load(page.content)('body').text();
      const contentIssues = await checkContentQuality(contentText);

      auditResults.push({
        url: page.url,
        performance: performance.performanceScore,
        performanceIssues: performance.issues,
        seo: seoIssues,
        accessibility: accessibilityIssues,
        content: contentIssues,
      });
    }

    // Save to MongoDB
    // await mongoose.connection.collection('audits').insertOne({
    //   url,
    //   auditResults,
    //   timestamp: new Date(),
    // });

    res.json(auditResults);
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Audit failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
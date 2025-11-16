const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

admin.initializeApp();

/**
 * Cloud Function to generate PDF from scrapbook preview page
 *
 * Expects a token parameter that references a document in the pdfPreviews collection
 * The token document contains the scrapbook data and user ID
 *
 * Flow:
 * 1. Validate token from Firestore
 * 2. Check token hasn't expired (5 min TTL)
 * 3. Launch Puppeteer with serverless Chromium
 * 4. Navigate to preview URL with token
 * 5. Generate PDF from rendered page
 * 6. Return PDF as response
 * 7. Delete the token from Firestore
 */
exports.generatePdf = onRequest({
  timeoutSeconds: 300,
  memory: '2GiB',
  cors: true
}, async (req, res) => {
  try {
    // Get token from query parameters
    const token = req.query.token;

    if (!token) {
      res.status(400).json({
        error: 'Missing token parameter'
      });
      return;
    }

    // Validate token from Firestore
    const tokenDoc = await admin.firestore()
      .collection('pdfPreviews')
      .doc(token)
      .get();

    if (!tokenDoc.exists) {
      res.status(404).json({
        error: 'Invalid or expired token'
      });
      return;
    }

    const tokenData = tokenDoc.data();

    // Check if token has expired (5 minute TTL)
    const createdAt = tokenData.createdAt.toDate();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (createdAt < fiveMinutesAgo) {
      // Delete expired token
      await tokenDoc.ref.delete();
      res.status(404).json({
        error: 'Token has expired'
      });
      return;
    }

    // Get the preview URL
    // This will be the hosted URL of your app + /pdf-preview/ + token
    const baseUrl = process.env.APP_URL || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5173';
    const previewUrl = `${baseUrl}/pdf-preview/${token}`;

    console.log('Generating PDF from URL:', previewUrl);

    // Launch Puppeteer with serverless Chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set viewport to A4 landscape dimensions (approximately)
    await page.setViewport({
      width: 1920,  // Wider for landscape
      height: 1358, // A4 landscape aspect ratio
      deviceScaleFactor: 2, // High DPI for better quality
    });

    // Navigate to the preview page
    await page.goto(previewUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait a bit for any animations or lazy loading
    await page.waitForTimeout(2000);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // Delete the token now that we're done
    await tokenDoc.ref.delete();

    // Set response headers
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="our-love-story-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.set('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

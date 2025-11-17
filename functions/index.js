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
  cors: true,
  region: 'europe-west1'
}, async (req, res) => {
  // Set CORS headers explicitly
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

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
    const baseUrl = process.env.APP_URL || 'https://relationship-scrapbook.web.app';
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

    // Increase timeout for large PDFs (default is 30s, we need more for 100+ images)
    page.setDefaultTimeout(180000); // 3 minutes

    // Capture console logs from the browser for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`[Browser Error] ${text}`);
      } else if (type === 'warning') {
        console.warn(`[Browser Warning] ${text}`);
      } else {
        console.log(`[Browser] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
    });

    // Set viewport to A4 landscape dimensions (approximately)
    await page.setViewport({
      width: 1920,  // Wider for landscape
      height: 1358, // A4 landscape aspect ratio
      deviceScaleFactor: 1.5, // Reduced from 2 to speed up PDF generation
    });

    // Navigate to the preview page
    console.log('Navigating to preview page...');
    await page.goto(previewUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });

    console.log('Page loaded, waiting for pdf-ready event...');

    // Wait for the custom 'pdf-ready' event from the React app
    // This event is dispatched after all images are loaded
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check if already ready
        if (window.pdfReady) {
          console.log('[Puppeteer] PDF already ready');
          resolve();
          return;
        }

        // Wait for the custom event
        console.log('[Puppeteer] Waiting for pdf-ready event...');
        const timeout = setTimeout(() => {
          console.log('[Puppeteer] Timeout waiting for pdf-ready event, proceeding anyway');
          resolve();
        }, 30000); // 30 second timeout

        window.addEventListener('pdf-ready', () => {
          console.log('[Puppeteer] Received pdf-ready event!');
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    });

    console.log('PDF ready event received, waiting for fonts and final render...');

    // Wait for fonts to load (important for emoji support)
    await page.evaluate(() => document.fonts.ready);

    // Short wait for final rendering
    await page.waitForTimeout(3000);

    // Generate PDF (timeout set via page.setDefaultTimeout above)
    console.log('Starting PDF generation (this may take 1-2 minutes for large scrapbooks)...');
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

    console.log(`PDF generated successfully, size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    await browser.close();

    console.log('PDF generated, uploading to Storage...');

    // Upload PDF to Firebase Storage instead of returning it directly
    // (Cloud Functions have response size limits)
    // NOTE: Lifecycle policy is configured to auto-delete files in pdfs/ folder after 24 hours
    const bucket = admin.storage().bucket();
    const fileName = `pdfs/${tokenData.userId || 'anonymous'}/scrapbook-${Date.now()}.pdf`;
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          userId: tokenData.userId || 'anonymous',
          generatedAt: new Date().toISOString()
        }
      }
    });

    console.log('PDF uploaded to Storage, generating download URL...');

    // Generate a signed URL that expires in 1 hour
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour from now
    });

    console.log('Download URL generated successfully');

    // Delete the token now that we're done
    await tokenDoc.ref.delete();

    // Return the download URL
    res.status(200).json({
      success: true,
      downloadUrl: url,
      fileName: `our-love-story-${new Date().toISOString().split('T')[0]}.pdf`
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

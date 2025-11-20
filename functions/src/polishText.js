const {onCall} = require('firebase-functions/v2/https');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const {getPolishTextPrompt} = require('./prompts/aiPrompts');
const {cleanAIResponse} = require('./utils/textCleaner');
const {requirePaidTier, trackAIUsage} = require('./utils/userTier');

/**
 * Mock polish text for emulator testing (avoids API costs)
 * @param {string} text - The text to mock polish
 * @returns {string} - Mocked polished text
 */
function mockPolishText(text) {
  // Simple mock that corrects common errors and improves formatting
  let polished = text.trim();

  // Fix common spelling errors (for testing)
  polished = polished.replace(/\bgrammer\b/gi, 'grammar');
  polished = polished.replace(/\bteh\b/gi, 'the');
  polished = polished.replace(/\brecieve\b/gi, 'receive');

  // Capitalize first letter if not already
  if (polished.length > 0) {
    polished = polished.charAt(0).toUpperCase() + polished.slice(1);
  }

  // Ensure proper sentence ending
  if (polished.length > 0 && !polished.match(/[.!?]$/)) {
    polished += '.';
  }

  // Preserve paragraph breaks (double newlines)
  polished = polished.replace(/\n\n/g, '\n\n');

  return polished;
}

/**
 * Cloud Function to polish text using AI
 *
 * Requires user to be authenticated and have paid tier
 *
 * @param {Object} request - The request object
 * @param {Object} request.data - The request data
 * @param {string} request.data.text - The text to polish
 * @returns {Promise<Object>} - Result with polished text
 */
exports.polishText = onCall({
  region: 'europe-west1',
  cors: true,
  secrets: ['GEMINI_API_KEY'],
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new Error('User must be authenticated to use AI features');
  }

  const userId = request.auth.uid;
  const {text} = request.data;

  // Validate input
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter');
  }

  if (text.length > 5000) {
    throw new Error('Text is too long (max 5000 characters)');
  }

  try {
    // Check user tier (throws if not paid)
    await requirePaidTier(userId);

    let polishedText;

    // Check if running in emulator (for testing without API costs)
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' ||
                      process.env.FIRESTORE_EMULATOR_HOST !== undefined;

    if (isEmulator) {
      // Return mocked response in emulator to avoid API costs
      console.log(`[EMULATOR] Mocking AI polish for user ${userId}`);
      polishedText = mockPolishText(text);
    } else {
      // Production: Use real Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('GEMINI_API_KEY environment variable not set');
        throw new Error('AI service is temporarily unavailable');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash-exp'});

      // Get prompt from centralized prompts file
      const prompt = getPolishTextPrompt(text);

      console.log(`Polishing text for user ${userId}, length: ${text.length} characters`);

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      // Clean the response
      polishedText = cleanAIResponse(rawText);
    }

    console.log(`Successfully polished text for user ${userId}`);

    // Track usage (for monitoring/billing)
    await trackAIUsage(userId);

    return {
      success: true,
      polishedText: polishedText,
      originalLength: text.length,
      polishedLength: polishedText.length
    };

  } catch (error) {
    console.error('Error polishing text:', error);

    // Return user-friendly error messages
    if (error.message.includes('tier') || error.message.includes('upgrade')) {
      throw error; // Pass through tier-related errors
    }

    throw new Error('Failed to polish text. Please try again.');
  }
});

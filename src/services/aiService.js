import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * AI Service for text enhancement and grammar correction
 * Uses Cloud Functions to securely call Gemini API
 * Only available for paid tier users
 */
export const aiService = {
  /**
   * Polish and correct grammar in text while preserving meaning and tone
   * Calls Cloud Function which checks user tier before processing
   * @param {string} text - The text to polish
   * @returns {Promise<string>} - The polished text
   */
  async polishText(text) {
    try {
      // Get Cloud Functions instance with europe-west1 region
      const functions = getFunctions(undefined, 'europe-west1');

      // Get the polishText callable function
      const polishTextFn = httpsCallable(functions, 'polishText');

      // Call the function
      const result = await polishTextFn({ text });

      // Return the polished text
      return result.data.polishedText;
    } catch (error) {
      console.error('AI polish text error:', error);

      // Handle specific error messages
      if (error.message.includes('tier') || error.message.includes('upgrade')) {
        throw new Error('AI features are only available for paid tier users. Please upgrade to use this feature.');
      }

      if (error.message.includes('authenticated')) {
        throw new Error('Please sign in to use AI features.');
      }

      throw new Error('Failed to polish text. Please try again.');
    }
  },

  /**
   * Generate a caption for an image (future feature)
   * @param {string} imageData - Base64 image data or URL
   * @param {string} tone - The tone (romantic, playful, poetic)
   * @returns {Promise<string>} - The generated caption
   */
  async generateCaption(imageData, tone = 'romantic') {
    // This would need a separate Cloud Function
    throw new Error('Image caption generation not yet implemented');
  }
};

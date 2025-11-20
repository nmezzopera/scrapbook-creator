/**
 * Utility functions for cleaning and processing AI-generated text
 */

/**
 * Clean AI response by removing quotes, markdown, and code blocks
 * @param {string} text - The raw AI response text
 * @returns {string} - The cleaned text
 */
exports.cleanAIResponse = (text) => {
  let cleanedText = text.trim();

  // Remove leading/trailing triple quotes if present
  cleanedText = cleanedText.replace(/^["'`]{3}\s*/g, '');
  cleanedText = cleanedText.replace(/\s*["'`]{3}$/g, '');

  // Remove leading/trailing single quotes if present
  cleanedText = cleanedText.replace(/^["']\s*/g, '');
  cleanedText = cleanedText.replace(/\s*["']$/g, '');

  // Remove any code block markers
  cleanedText = cleanedText.replace(/^```\w*\n?/g, '');
  cleanedText = cleanedText.replace(/\n?```$/g, '');

  return cleanedText;
};

/**
 * AI Prompts for text processing
 * Centralized location for all AI prompts used across the application
 */

/**
 * Prompt for polishing and improving text
 * @param {string} text - The text to polish
 * @returns {string} - The complete prompt
 */
exports.getPolishTextPrompt = (text) => {
  return `You are a helpful writing assistant for a romantic scrapbook app.

Your task: Polish and improve the following text while:
- Correcting any grammar, spelling, and punctuation errors
- Improving clarity and flow
- Maintaining the original meaning, tone, and emotional sentiment
- Keeping it personal and heartfelt
- Preserving any emojis exactly as they are
- NOT making it overly formal or changing the casual, personal voice
- Use British English spelling and terminology

IMPORTANT FORMATTING RULES:
- Return ONLY the improved text, no quotes, no markdown, no code blocks
- Do NOT wrap the response in triple quotes (""")
- Do NOT add any explanations or commentary
- Preserve paragraph breaks as double line breaks
- Preserve and use empty lines when a section break is needed
- Keep the natural flow of the text

Original text:
${text}

Improved text:`;
};

/**
 * Prompt for generating image captions (future feature)
 * @param {string} tone - The tone (romantic, playful, poetic)
 * @returns {string} - The complete prompt
 */
exports.getImageCaptionPrompt = (tone = 'romantic') => {
  return `Generate a ${tone} caption for this photo in a love scrapbook. Make it heartfelt and personal. Max 2 sentences.`;
};

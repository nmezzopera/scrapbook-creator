const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import modular Cloud Functions
const {generatePdf} = require('./src/generatePdf');
const {polishText} = require('./src/polishText');

// Export functions
exports.generatePdf = generatePdf;
exports.polishText = polishText;

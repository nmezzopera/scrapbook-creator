const admin = require('firebase-admin');

/**
 * User tier management utilities
 */

/**
 * Check if user has paid tier access
 * @param {string} userId - The user ID to check
 * @returns {Promise<{isPaid: boolean, tier: string}>}
 * @throws {Error} If user not found or tier check fails
 */
exports.checkUserTier = async (userId) => {
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .get();

  if (!userDoc.exists) {
    throw new Error('User profile not found');
  }

  const userData = userDoc.data();
  const tier = userData.tier || 'free';

  return {
    isPaid: tier === 'paid',
    tier: tier
  };
};

/**
 * Require user to have paid tier, throw error if not
 * @param {string} userId - The user ID to check
 * @throws {Error} If user does not have paid tier
 */
exports.requirePaidTier = async (userId) => {
  const {isPaid} = await exports.checkUserTier(userId);

  if (!isPaid) {
    throw new Error('AI features are only available for paid tier users. Please upgrade to use this feature.');
  }
};

/**
 * Track AI usage for a user
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
exports.trackAIUsage = async (userId) => {
  await admin.firestore()
    .collection('users')
    .doc(userId)
    .update({
      aiRequestsUsed: admin.firestore.FieldValue.increment(1),
      lastAiRequest: admin.firestore.FieldValue.serverTimestamp()
    });
};

import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const USERS_COLLECTION = 'users'

/**
 * Get user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid))

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }

    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

/**
 * Create a new user profile in Firestore
 * @param {Object} userData - User profile data
 * @returns {Promise<Object>} Created user data
 */
export async function createUserProfile(userData) {
  try {
    const { uid, email, tier = 'free' } = userData

    const newUser = {
      email,
      tier,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(doc(db, USERS_COLLECTION, uid), newUser)

    return { id: uid, ...newUser }
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

/**
 * Update user tier (free or paid)
 * @param {string} uid - User ID
 * @param {string} tier - 'free' or 'paid'
 * @returns {Promise<void>}
 */
export async function updateUserTier(uid, tier) {
  try {
    await setDoc(
      doc(db, USERS_COLLECTION, uid),
      {
        tier,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  } catch (error) {
    console.error('Error updating user tier:', error)
    throw error
  }
}

/**
 * Check if user can upload more images based on their tier
 * @param {string} tier - User tier ('free' or 'paid')
 * @param {number} currentImageCount - Current number of images in section
 * @returns {boolean} Whether user can upload more images
 */
export function canUploadMoreImages(tier, currentImageCount) {
  if (tier === 'paid') {
    return true // No limit for paid users
  }

  // Free users can only have 1 image per section
  return currentImageCount < 1
}

/**
 * Get the max image limit for a tier
 * @param {string} tier - User tier ('free' or 'paid')
 * @returns {number|string} Max images or 'unlimited'
 */
export function getMaxImages(tier) {
  return tier === 'paid' ? 'unlimited' : 1
}

/**
 * Count total images across all sections
 * @param {Array} sections - Array of section objects
 * @returns {number} Total number of images
 */
export function countTotalImages(sections) {
  if (!sections || sections.length === 0) return 0
  return sections.reduce((total, section) => {
    return total + (section.images ? section.images.length : 0)
  }, 0)
}

/**
 * Get limits for a specific tier
 * @param {string} tier - User tier ('free' or 'paid')
 * @returns {Object} Tier limits
 */
export function getTierLimits(tier) {
  if (tier === 'paid') {
    return {
      maxSections: 'unlimited',
      maxImagesTotal: 'unlimited',
      maxImagesPerSection: 'unlimited',
      maxFileSize: 10485760, // 10MB
      maxFileSizeMB: '10'
    }
  }

  return {
    maxSections: 50,
    maxImagesTotal: 50,
    maxImagesPerSection: 1,
    maxFileSize: 512000, // 500KB
    maxFileSizeMB: '0.5'
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all users (admin only)
 * @returns {Promise<Array>} Array of all users
 */
export async function getAllUsers() {
  try {
    const usersCollection = collection(db, USERS_COLLECTION)
    const snapshot = await getDocs(usersCollection)

    const users = []
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() })
    })

    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

/**
 * Update user tier (admin only)
 * @param {string} userId - User ID
 * @param {string} newTier - New tier ('free' or 'paid')
 * @returns {Promise<void>}
 */
export async function adminUpdateUserTier(userId, newTier) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      tier: newTier,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user tier:', error)
    throw error
  }
}

/**
 * Update user admin status (admin only)
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Admin status
 * @returns {Promise<void>}
 */
export async function adminUpdateUserAdmin(userId, isAdmin) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      admin: isAdmin,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user admin status:', error)
    throw error
  }
}

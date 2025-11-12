import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
    const { uid, email, displayName, photoURL, tier = 'free' } = userData

    const newUser = {
      email,
      displayName,
      photoURL,
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

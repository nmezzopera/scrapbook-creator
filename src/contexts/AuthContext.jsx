import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'
import { getUserData, createUserProfile } from '../services/userService'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeUserData = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      // Clean up previous Firestore listener
      if (unsubscribeUserData) {
        unsubscribeUserData()
        unsubscribeUserData = null
      }

      if (user) {
        // Fetch or create user data in Firestore
        try {
          let data = await getUserData(user.uid)

          // If user doesn't exist in Firestore, create profile
          if (!data) {
            data = await createUserProfile({
              uid: user.uid,
              email: user.email,
              tier: 'free' // Default tier
            })
          } else if (!data.email) {
            // Migration: Update existing users to have email field
            const userRef = doc(db, 'users', user.uid)
            await setDoc(userRef, { email: user.email }, { merge: true })
            data.email = user.email
          }

          setUserData(data)

          // Set up real-time listener for user data changes
          const userDocRef = doc(db, 'users', user.uid)
          unsubscribeUserData = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserData({ id: docSnap.id, ...docSnap.data() })
            }
          }, (error) => {
            console.error('Error listening to user data:', error)
          })
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeUserData) {
        unsubscribeUserData()
      }
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!currentUser,
    isPaid: userData?.tier === 'paid',
    isFree: userData?.tier === 'free' || !userData,
    isAdmin: userData?.admin === true
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

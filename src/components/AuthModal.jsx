import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import GoogleIcon from '@mui/icons-material/Google'
import CloseIcon from '@mui/icons-material/Close'

function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl romantic-shadow max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <CloseIcon />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Welcome! 💖
          </h2>
          <p className="text-gray-600">
            Sign in to unlock your scrapbook features
          </p>
        </div>

        {/* Sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 hover:border-romantic-400 hover:bg-romantic-50 text-gray-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">What you get:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-romantic-500">✓</span>
              <span>Save your scrapbook to the cloud</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-romantic-500">✓</span>
              <span>Access from any device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-romantic-500">✓</span>
              <span>Free tier: 1 image per page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-romantic-500">✓</span>
              <span>Upgrade anytime for unlimited images</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

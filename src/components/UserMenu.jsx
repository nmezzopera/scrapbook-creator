import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import StarIcon from '@mui/icons-material/Star'
import AuthModal from './AuthModal'

function UserMenu() {
  const { currentUser, userData, isAuthenticated, signOut, isFree, isPaid } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowMenu(false)
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const handleUpgrade = () => {
    alert('Payment integration coming soon! This will redirect to Stripe or similar payment processor.')
    // TODO: Implement payment flow with Stripe
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        {isAuthenticated ? (
          <div className="relative">
            {/* User button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white rounded-full romantic-shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2 p-2 pr-4"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-romantic-200 flex items-center justify-center">
                  <PersonIcon fontSize="small" />
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900 truncate max-w-32">
                  {currentUser.displayName}
                </div>
                <div className={`text-xs font-medium ${isPaid ? 'text-romantic-600' : 'text-gray-500'}`}>
                  {isPaid ? '⭐ Paid' : 'Free'}
                </div>
              </div>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl romantic-shadow overflow-hidden">
                  {/* User info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="font-semibold text-gray-900">{currentUser.displayName}</div>
                    <div className="text-sm text-gray-600">{currentUser.email}</div>
                    <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      isPaid
                        ? 'bg-gradient-to-r from-romantic-500 to-romantic-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {isPaid ? (
                        <>
                          <StarIcon fontSize="small" />
                          Paid Plan
                        </>
                      ) : (
                        'Free Plan'
                      )}
                    </div>
                  </div>

                  {/* Tier info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Your Plan:</div>
                    {isFree ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          • 1 image per page
                        </div>
                        <button
                          onClick={handleUpgrade}
                          className="w-full mt-3 bg-gradient-to-r from-romantic-500 to-romantic-600 hover:from-romantic-600 hover:to-romantic-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                        >
                          ⭐ Upgrade to Unlimited
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Unlimited images per page ✓</div>
                        <div>• Cloud storage ✓</div>
                        <div>• Priority support ✓</div>
                      </div>
                    )}
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full p-4 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                  >
                    <LogoutIcon fontSize="small" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-romantic-500 to-romantic-600 hover:from-romantic-600 hover:to-romantic-700 text-white font-semibold py-2 px-6 rounded-full romantic-shadow hover:shadow-lg transition-all duration-200"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export default UserMenu

import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, CircularProgress, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import theme from './theme'
import { SnackbarProvider } from './contexts/SnackbarContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Scrapbook from './pages/Scrapbook'
import Admin from './pages/Admin'

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth()
  const [sections, setSections] = useState([])
  const [syncing, setSyncing] = useState(false)

  const isLoadingFromFirestore = useRef(false)
  const isSigningOut = useRef(false)
  const unsubscribeFirestoreRef = useRef(null)
  const hasLoadedInitialData = useRef(false)

  // Load data from Firestore when user is authenticated
  useEffect(() => {
    // Clean up previous listener if it exists
    if (unsubscribeFirestoreRef.current) {
      unsubscribeFirestoreRef.current()
      unsubscribeFirestoreRef.current = null
    }

    if (!currentUser || isSigningOut.current) {
      setSections([])
      hasLoadedInitialData.current = false
      return
    }

    const docRef = doc(db, 'users', currentUser.uid, 'scrapbooks', 'main')

    unsubscribeFirestoreRef.current = onSnapshot(
      docRef,
      (docSnap) => {
        if (isSigningOut.current) return

        isLoadingFromFirestore.current = true

        if (docSnap.exists()) {
          const data = docSnap.data()
          setSections(data.sections || [])
          hasLoadedInitialData.current = true
        } else {
          // Only set empty if this is the initial load
          if (!hasLoadedInitialData.current) {
            setSections([])
            hasLoadedInitialData.current = true
          }
        }

        setTimeout(() => {
          isLoadingFromFirestore.current = false
        }, 100)
      },
      (error) => {
        console.error('Error loading from Firestore:', error)
        isLoadingFromFirestore.current = false
      }
    )

    return () => {
      if (unsubscribeFirestoreRef.current) {
        unsubscribeFirestoreRef.current()
        unsubscribeFirestoreRef.current = null
      }
    }
  }, [currentUser])

  // Save to Firestore whenever sections change
  useEffect(() => {
    // Don't save if:
    // - No user
    // - Currently loading from Firestore
    // - Currently signing out
    // - Haven't loaded initial data yet
    if (!currentUser || isLoadingFromFirestore.current || isSigningOut.current || !hasLoadedInitialData.current) {
      return
    }

    setSyncing(true)
    const docRef = doc(db, 'users', currentUser.uid, 'scrapbooks', 'main')

    const saveTimeout = setTimeout(() => {
      // Final check before saving
      if (currentUser && !isSigningOut.current && hasLoadedInitialData.current) {
        setDoc(docRef, {
          sections,
          updatedAt: new Date()
        })
          .then(() => {
            if (!isSigningOut.current) {
              setSyncing(false)
            }
          })
          .catch((error) => {
            console.error('Error saving to Firestore:', error)
            setSyncing(false)
          })
      } else {
        setSyncing(false)
      }
    }, 300)

    return () => {
      clearTimeout(saveTimeout)
      setSyncing(false)
    }
  }, [sections, currentUser])

  const handleSignOut = () => {
    isSigningOut.current = true

    // Unsubscribe from Firestore immediately
    if (unsubscribeFirestoreRef.current) {
      unsubscribeFirestoreRef.current()
      unsubscribeFirestoreRef.current = null
    }

    // Clear local state
    setSections([])
    hasLoadedInitialData.current = false

    // Reset flag after a delay
    setTimeout(() => {
      isSigningOut.current = false
    }, 1000)
  }

  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
            gap: { xs: 2, sm: 3 },
            px: 2,
          }}
        >
          <FavoriteIcon
            sx={{
              fontSize: { xs: 60, sm: 70, md: 80 },
              color: 'primary.main',
              animation: 'heartbeat 1.5s ease-in-out infinite',
              '@keyframes heartbeat': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
              },
            }}
          />
          <CircularProgress size={60} thickness={4} sx={{ width: { xs: '50px !important', sm: '60px !important' }, height: { xs: '50px !important', sm: '60px !important' } }} />
          <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, textAlign: 'center' }}>
            Loading your love story...
          </Typography>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/scrapbook" /> : <Login />}
        />
        <Route
          path="/scrapbook"
          element={
            <Scrapbook
              user={currentUser}
              sections={sections}
              setSections={setSections}
              syncing={syncing}
              onSignOut={handleSignOut}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <Admin
              user={currentUser}
              sections={sections}
              setSections={setSections}
            />
          }
        />
        <Route
          path="/"
          element={<Navigate to={currentUser ? "/scrapbook" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider>
          <AppContent />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

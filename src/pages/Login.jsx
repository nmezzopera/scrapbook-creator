import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Button, Paper, CircularProgress } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useSnackbar } from '../contexts/SnackbarContext'

function Login() {
  const navigate = useNavigate()
  const { showError } = useSnackbar()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/scrapbook')
    } catch (error) {
      console.error('Sign in error:', error)
      showError('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 3, sm: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <FavoriteIcon
            sx={{
              fontSize: { xs: 60, sm: 70, md: 80 },
              color: 'primary.main',
              mb: { xs: 2, sm: 3 },
              animation: 'heartbeat 1.5s ease-in-out infinite',
              '@keyframes heartbeat': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
              },
            }}
          />

          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              color: 'primary.main',
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            Our Love Story
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontStyle: 'italic',
              color: 'text.secondary',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
            }}
          >
            A collection of our most precious moments
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              mb: { xs: 3, sm: 4 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 1, sm: 0 },
            }}
          >
            Sign in to create and save your scrapbook
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              py: { xs: 1.25, sm: 1.5 },
              px: { xs: 3, sm: 4 },
            }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

export default Login

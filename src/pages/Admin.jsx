import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc } from 'firebase/firestore'
import { storage, db } from '../firebase'
import { useSnackbar } from '../contexts/SnackbarContext'
import UserMenu from '../components/UserMenu'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  AdminPanelSettings as AdminIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'

function Admin({ user, sections, setSections }) {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useSnackbar()
  const [isImporting, setIsImporting] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    navigate('/login')
    return null
  }

  // Calculate stats
  const totalPages = sections.length
  const totalImages = sections.reduce((sum, section) => sum + (section.images?.length || 0), 0)

  const exportToJSON = () => {
    try {
      const dataStr = JSON.stringify(sections, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `scrapbook-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      showSuccess('Scrapbook exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      showError('Failed to export scrapbook')
    }
  }

  const importFromJSON = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setIsImporting(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target.result)

          // Validate the imported data
          if (!Array.isArray(imported)) {
            throw new Error('Invalid format: expected an array of sections')
          }

          showInfo('Importing scrapbook... This may take a moment.')

          // Convert base64 images to Firebase Storage URLs
          let processedSections = imported
          if (user) {
            // Process each section and upload base64 images
            processedSections = await Promise.all(
              imported.map(async (section) => {
                if (section.images && section.images.length > 0) {
                  const processedImages = await Promise.all(
                    section.images.map(async (img) => {
                      // Check if it's a base64 image
                      if (img.startsWith('data:image/')) {
                        try {
                          // Convert base64 to blob
                          const response = await fetch(img)
                          const blob = await response.blob()

                          // Upload to Firebase Storage
                          const timestamp = Date.now()
                          const randomId = Math.random().toString(36).substring(2, 9)
                          const fileName = `${timestamp}-${randomId}.jpg`
                          const storageRef = ref(storage, `users/${user.uid}/scrapbook-images/${fileName}`)

                          await uploadBytes(storageRef, blob)
                          const downloadURL = await getDownloadURL(storageRef)

                          return downloadURL
                        } catch (uploadError) {
                          console.error('Failed to upload image:', uploadError)
                          // Keep the original base64 if upload fails
                          return img
                        }
                      }
                      // Already a URL, keep it
                      return img
                    })
                  )

                  return { ...section, images: processedImages }
                }
                return section
              })
            )

            // Save directly to Firestore to ensure it's persisted
            const docRef = doc(db, 'users', user.uid, 'scrapbooks', 'main')
            await setDoc(docRef, {
              sections: processedSections,
              updatedAt: new Date()
            })
          }

          setSections(processedSections)
          showSuccess('Scrapbook imported successfully!')
        } catch (error) {
          console.error('Import error:', error)
          showError('Failed to import scrapbook: ' + error.message)
        } finally {
          setIsImporting(false)
        }
      }
      reader.readAsText(file)
    }

    // Reset the file input
    e.target.value = ''
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
        pb: 4,
      }}
    >
      {/* Loading Indicator */}
      {isImporting && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        />
      )}

      {/* User Menu */}
      <UserMenu />

      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            onClick={() => navigate('/scrapbook')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 600 }}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
            Admin Panel
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
            Manage your scrapbook data
          </Typography>
        </Box>

        {/* Stats Card */}
        <Card elevation={3} sx={{ mb: { xs: 3, sm: 4 }, borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Scrapbook Statistics
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                <DescriptionIcon sx={{ color: 'primary.main', fontSize: { xs: 28, sm: 32 } }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {totalPages}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Pages
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                <ImageIcon sx={{ color: 'secondary.main', fontSize: { xs: 28, sm: 32 } }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {totalImages}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Images
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Import/Export Section */}
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Data Management
          </Typography>

          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Export JSON */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Download your scrapbook data as a JSON file for backup or transfer.
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportToJSON}
                disabled={sections.length === 0}
                size="medium"
                fullWidth
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Export JSON
              </Button>
            </Box>

            <Divider />

            {/* Import JSON */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Import Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Upload a previously exported JSON file to restore or replace your scrapbook data.
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                size="medium"
                disabled={isImporting}
                fullWidth
                color="secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {isImporting ? 'Importing...' : 'Import JSON'}
                <input
                  type="file"
                  accept=".json"
                  onChange={importFromJSON}
                  hidden
                  disabled={isImporting}
                />
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Back Button */}
        <Box textAlign="center" mt={{ xs: 3, sm: 4 }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/scrapbook')}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Back to Scrapbook
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

export default Admin

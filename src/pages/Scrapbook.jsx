import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import SectionInline from '../components/SectionInline'
import TitleSectionInline from '../components/TitleSectionInline'
import TimelineSectionInline from '../components/TimelineSectionInline'
import UserMenu from '../components/UserMenu'
import { useSnackbar } from '../contexts/SnackbarContext'
import { useAuth } from '../contexts/AuthContext'
import { countTotalImages, getTierLimits } from '../services/userService'
import {
  Box,
  Container,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Favorite as FavoriteIcon,
  PictureAsPdf as PdfIcon,
  Title as TitleIcon,
  Timeline as TimelineIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

function Scrapbook({ user, sections, setSections, syncing, onSignOut }) {
  const navigate = useNavigate()
  const { showInfo, showSuccess, showError } = useSnackbar()
  const { userData } = useAuth()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const [exportStatus, setExportStatus] = useState(null) // null, 'success', or 'error'
  const [exportError, setExportError] = useState('')

  // Calculate quotas
  const userTier = userData?.tier || 'free'
  const limits = getTierLimits(userTier)
  const totalImages = countTotalImages(sections)
  const totalSections = sections.length

  // Redirect if not authenticated
  if (!user) {
    navigate('/login')
    return null
  }

  const addSection = (type = 'regular', afterIndex = null) => {
    const newSection = {
      id: Date.now(),
      type: type,
      title: '',
      description: '',
      images: [],
    }

    // Add specific defaults for special types
    if (type === 'title') {
      newSection.title = 'Your Love Story'
      newSection.description = '<p>2024 - 2025</p>'
      newSection.subtitle = 'and beyond'
    } else if (type === 'timeline') {
      newSection.title = 'Key Events'
      newSection.events = [
        { year: '2024', date: '07.09.2024', description: 'We met in Rome and started dating' },
        { year: '2025', date: '01.01.2025', description: 'We got engaged' }
      ]
    }

    // If afterIndex is specified, insert after that index
    if (afterIndex !== null) {
      const newSections = [...sections]
      newSections.splice(afterIndex + 1, 0, newSection)
      setSections(newSections)
    } else {
      // Otherwise add to the end
      setSections([...sections, newSection])
    }
  }

  const updateSection = (id, updatedData) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, ...updatedData } : section
    ))
  }

  const deleteSection = (id) => {
    setSections(sections.filter(section => section.id !== id))
  }

  const moveSection = (id, direction) => {
    const index = sections.findIndex(s => s.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) return

    const newSections = [...sections]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    setSections(newSections)
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      onSignOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const exportToPDF = async () => {
    if (sections.length === 0) {
      showInfo('Add some sections first!')
      return
    }

    setIsExporting(true)
    setExportStatus(null)
    setExportProgress('Preparing PDF export...')
    setExportError('')

    try {
      // Generate a random token
      const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      setExportProgress('Creating preview token...')

      // Store the sections data with the token in Firestore
      await setDoc(doc(db, 'pdfPreviews', token), {
        sections: sections,
        userId: user.uid,
        createdAt: serverTimestamp()
      })

      setExportProgress('Generating PDF on server...')

      // Get the Cloud Function URL
      // In production, this will be the deployed function URL
      // For now, we'll use the Firebase project ID to construct it
      const functionUrl = import.meta.env.VITE_PDF_FUNCTION_URL ||
        `https://generatepdf-${import.meta.env.VITE_FIREBASE_REGION || 'us-central1'}-relationship-scrapbook.cloudfunctions.net/generatePdf`

      // Call the Cloud Function
      const response = await fetch(`${functionUrl}?token=${token}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.statusText}`)
      }

      setExportProgress('Downloading PDF...')

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `our-love-story-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportStatus('success')
      setExportProgress('PDF created successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportStatus('error')
      setExportError(error.message || 'Failed to create PDF. Please try again.')
      setExportProgress('Export failed')
    }
  }

  const closeExportModal = () => {
    setIsExporting(false)
    setExportStatus(null)
    setExportProgress('')
    setExportError('')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
        pb: 4,
      }}
    >
      {/* Export Modal */}
      <Dialog
        open={isExporting}
        onClose={() => {}} // Prevent closing during export
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          {exportStatus === 'success' ? (
            <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
          ) : exportStatus === 'error' ? (
            <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 1 }} />
          ) : (
            <PdfIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
          )}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          {!exportStatus && (
            <CircularProgress size={40} sx={{ mb: 2 }} />
          )}
          <Typography variant="h6" gutterBottom>
            {exportStatus === 'success' ? 'Export Complete!' : exportStatus === 'error' ? 'Export Failed' : 'Exporting PDF'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {exportProgress}
          </Typography>
          {exportStatus === 'error' && exportError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {exportError}
            </Typography>
          )}
        </DialogContent>
        {exportStatus && (
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={closeExportModal}
              color={exportStatus === 'success' ? 'success' : 'primary'}
              size="large"
            >
              {exportStatus === 'success' ? 'Done' : 'Close'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', top: 0, zIndex: 1100 }}>
        <Toolbar>
          <FavoriteIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 600 }}>
            Our Love Story
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={syncing ? <CloudSyncIcon /> : <CloudDoneIcon />}
              label={syncing ? 'Syncing...' : 'Synced'}
              color={syncing ? 'default' : 'success'}
              size="small"
            />
            <IconButton onClick={exportToPDF} color="secondary" disabled={isExporting || sections.length === 0} title="Export to PDF">
              {isExporting ? <CircularProgress size={24} /> : <PdfIcon />}
            </IconButton>
            <UserMenu />
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
            Our Love Story
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
            A collection of our most precious moments
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Each section below represents one A4 landscape page in your PDF
          </Typography>

          {/* Quota Display (Free Tier Only) */}
          {userTier === 'free' && (
            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              <Chip
                label={`Sections: ${totalSections}/${limits.maxSections}`}
                color={totalSections >= limits.maxSections ? 'warning' : 'default'}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Images: ${totalImages}/${limits.maxImagesTotal}`}
                color={totalImages >= limits.maxImagesTotal ? 'warning' : 'default'}
                size="small"
                variant="outlined"
              />
            </Stack>
          )}
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} justifyContent="center" flexWrap="wrap" mb={4} useFlexGap>
          <Button
            variant="contained"
            startIcon={<TitleIcon />}
            onClick={() => addSection('title')}
            size="medium"
            color="secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Add Title Page
          </Button>
          <Button
            variant="contained"
            startIcon={<TimelineIcon />}
            onClick={() => addSection('timeline')}
            size="medium"
            color="info"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Add Timeline
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => addSection('regular')}
            size="medium"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Add Regular Page
          </Button>
        </Stack>

        {/* Sections */}
        {sections.length === 0 ? (
          <Box textAlign="center" py={{ xs: 6, sm: 10 }}>
            <FavoriteIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'primary.light', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Your scrapbook is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, px: 2 }}>
              Click "Add New Page" to start creating your love story!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={4} alignItems="center">
            {sections.map((section, index) => (
              <Box key={section.id} sx={{ width: '100%', maxWidth: '1200px' }}>
                {/* Section Card */}
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1.414 / 1', // A4 landscape ratio
                    '& > div': {
                      height: '100%',
                    }
                  }}
                >
                  {section.type === 'title' ? (
                    <TitleSectionInline
                      section={section}
                      index={index}
                      totalSections={sections.length}
                      onUpdate={updateSection}
                      onDelete={deleteSection}
                      onMove={moveSection}
                    />
                  ) : section.type === 'timeline' ? (
                    <TimelineSectionInline
                      section={section}
                      index={index}
                      totalSections={sections.length}
                      onUpdate={updateSection}
                      onDelete={deleteSection}
                      onMove={moveSection}
                    />
                  ) : (
                    <SectionInline
                      section={section}
                      index={index}
                      totalSections={sections.length}
                      onUpdate={updateSection}
                      onDelete={deleteSection}
                      onMove={moveSection}
                    />
                  )}
                </Box>

                {/* Add Section Buttons After This Section */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<TitleIcon />}
                    onClick={() => addSection('title', index)}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                  >
                    + Title
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    startIcon={<TimelineIcon />}
                    onClick={() => addSection('timeline', index)}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                  >
                    + Timeline
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => addSection('regular', index)}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                  >
                    + Page
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  )
}

export default Scrapbook

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import SectionInline from '../components/SectionInline'
import TitleSectionInline from '../components/TitleSectionInline'
import TimelineSectionInline from '../components/TimelineSectionInline'
import UserMenu from '../components/UserMenu'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { useSnackbar } from '../contexts/SnackbarContext'
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
} from '@mui/icons-material'

function Scrapbook({ user, sections, setSections, syncing, onSignOut }) {
  const navigate = useNavigate()
  const { showInfo, showSuccess, showError } = useSnackbar()
  const [isExporting, setIsExporting] = useState(false)

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
    showInfo('Creating your beautiful PDF...')

    try {
      // A4 landscape dimensions in mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 297
      const pageHeight = 210

      // Get all section elements
      const sectionElements = document.querySelectorAll('[data-section-id]')

      for (let i = 0; i < sectionElements.length; i++) {
        showInfo(`Processing page ${i + 1} of ${sections.length}...`)

        const sectionElement = sectionElements[i]

        // Capture the section as image
        const imgData = await toPng(sectionElement, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        })

        // Load image to get dimensions
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imgData
        })

        // Add new page for subsequent sections
        if (i > 0) {
          pdf.addPage()
        }

        // Calculate dimensions to fit A4 landscape
        const imgWidth = pageWidth
        const imgHeight = (img.height * pageWidth) / img.width

        // Center the image if it's shorter than the page
        const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight)
      }

      // Save the PDF
      pdf.save(`our-love-story-${new Date().toISOString().split('T')[0]}.pdf`)
      showSuccess('PDF created successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      showError('Failed to create PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
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
      {isExporting && (
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
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', top: 0, zIndex: 1100 }}>
        <Toolbar>
          <FavoriteIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 600 }}>
            Our Love Story
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.photoURL} alt={user.displayName} />
            <Typography variant="body2" sx={{ color: 'text.primary', display: { xs: 'none', sm: 'block' } }}>
              {user.displayName}
            </Typography>
            <Chip
              icon={syncing ? <CloudSyncIcon /> : <CloudDoneIcon />}
              label={syncing ? 'Syncing...' : 'Synced'}
              color={syncing ? 'default' : 'success'}
              size="small"
            />
            <IconButton onClick={exportToPDF} color="secondary" disabled={isExporting || sections.length === 0} title="Export to PDF">
              {isExporting ? <CircularProgress size={24} /> : <PdfIcon />}
            </IconButton>
            <IconButton onClick={handleSignOut} color="primary" title="Sign Out">
              <LogoutIcon />
            </IconButton>
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

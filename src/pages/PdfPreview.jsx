import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Box, CircularProgress, Typography } from '@mui/material'
import SectionDisplay from '../components/SectionDisplay'
import TitleSectionDisplay from '../components/TitleSectionDisplay'
import TimelineSectionDisplay from '../components/TimelineSectionDisplay'

/**
 * PDF Preview Page
 *
 * This page renders a scrapbook in a print-optimized format for PDF generation
 * It fetches data using a temporary token from Firestore
 * All interactive controls are removed for clean PDF output
 */
function PdfPreview() {
  const { token } = useParams()
  const [sections, setSections] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagesReady, setImagesReady] = useState(false)

  // Track image loading and dispatch custom event when all images are ready
  useEffect(() => {
    if (!sections || sections.length === 0) {
      return
    }

    console.log('[PDF Preview] Starting image load tracking...')

    // Collect all image URLs from all sections
    const allImageUrls = []
    sections.forEach(section => {
      if (section.images && Array.isArray(section.images)) {
        allImageUrls.push(...section.images)
      }
    })

    console.log(`[PDF Preview] Found ${allImageUrls.length} images to load`)

    if (allImageUrls.length === 0) {
      // No images, mark as ready immediately
      console.log('[PDF Preview] No images found, marking as ready')
      setImagesReady(true)
      window.pdfReady = true
      window.dispatchEvent(new CustomEvent('pdf-ready'))
      return
    }

    // Create promises for each image
    const imagePromises = allImageUrls.map((url, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
          console.log(`[PDF Preview] Image ${index + 1}/${allImageUrls.length} loaded: ${url.substring(0, 50)}...`)
          resolve()
        }

        img.onerror = (err) => {
          console.error(`[PDF Preview] Image ${index + 1}/${allImageUrls.length} failed to load: ${url.substring(0, 50)}...`, err)
          // Resolve anyway to not block PDF generation
          resolve()
        }

        img.src = url
      })
    })

    // Wait for all images to load
    Promise.all(imagePromises).then(() => {
      console.log('[PDF Preview] All images loaded successfully!')
      setImagesReady(true)

      // Set global flag for Puppeteer
      window.pdfReady = true

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pdf-ready'))
      console.log('[PDF Preview] Dispatched pdf-ready event')
    })
  }, [sections])

  useEffect(() => {
    const fetchPreviewData = async () => {
      try {
        if (!token) {
          setError('No token provided')
          setLoading(false)
          return
        }

        // Fetch the preview data from Firestore
        const tokenDoc = await getDoc(doc(db, 'pdfPreviews', token))

        if (!tokenDoc.exists()) {
          setError('Invalid or expired token')
          setLoading(false)
          return
        }

        const data = tokenDoc.data()

        // Skip expiry check in development mode
        const isDevelopment = import.meta.env.DEV

        if (!isDevelopment) {
          // Check if token is expired (5 min TTL) - only in production
          const createdAt = data.createdAt.toDate()
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

          if (createdAt < fiveMinutesAgo) {
            setError('Token has expired')
            setLoading(false)
            return
          }
        }

        setSections(data.sections || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching preview data:', err)
        setError('Failed to load preview')
        setLoading(false)
      }
    }

    fetchPreviewData()
  }, [token])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff'
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Add emoji font support for PDF generation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Emoji:wght@400;600;700&display=swap');

        body, * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif !important;
        }
      `}</style>

      <Box
        sx={{
          width: '100%',
          backgroundColor: '#fff',
          '@media print': {
            margin: 0,
            padding: 0
          }
        }}
      >
        {sections && sections.map((section, index) => (
        <Box
          key={section.id}
          data-section-id={section.id}
          className={index < sections.length - 1 ? 'page-break' : ''}
          sx={{
            width: '297mm', // A4 landscape width
            height: '210mm', // A4 landscape height
            pageBreakAfter: index < sections.length - 1 ? 'always' : 'auto',
            pageBreakInside: 'avoid',
            backgroundColor: '#fff',
            padding: '40px',
            boxSizing: 'border-box',
            '@media print': {
              margin: 0,
              padding: '40px'
            }
          }}
        >
          <div className="relative w-full h-full" data-section-id={section.id}>
            {section.type === 'title' ? (
              <TitleSectionDisplay section={section} />
            ) : section.type === 'timeline' ? (
              <TimelineSectionDisplay section={section} />
            ) : (
              <SectionDisplay section={section} index={index} />
            )}
          </div>
        </Box>
      ))}
      </Box>
    </>
  )
}

export default PdfPreview

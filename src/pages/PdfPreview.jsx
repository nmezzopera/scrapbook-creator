import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Box, CircularProgress, Typography } from '@mui/material'
import Masonry from 'react-masonry-css'

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

        // Check if token is expired (5 min TTL)
        const createdAt = data.createdAt.toDate()
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

        if (createdAt < fiveMinutesAgo) {
          setError('Token has expired')
          setLoading(false)
          return
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
          sx={{
            width: '100%',
            minHeight: '210mm', // A4 landscape height
            aspectRatio: '1.414 / 1', // A4 landscape aspect ratio
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
          {section.type === 'title' ? (
            <TitleSection section={section} />
          ) : section.type === 'timeline' ? (
            <TimelineSection section={section} />
          ) : (
            <RegularSection section={section} index={index} />
          )}
        </Box>
      ))}
    </Box>
  )
}

// Print-optimized regular section
function RegularSection({ section, index }) {
  const validImages = section.images || []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title */}
      {section.title && (
        <Typography
          variant="h2"
          sx={{
            fontFamily: 'serif',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #e9d5ff',
            paddingBottom: '16px',
            marginBottom: '24px',
            fontSize: '2.5rem'
          }}
        >
          {section.title}
        </Typography>
      )}

      {/* Content: Text and Images */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: validImages.length > 0 ? '1fr 1fr' : '1fr',
          gap: '24px',
          flex: 1
        }}
      >
        {/* Description */}
        {section.description && (
          <Box
            sx={{
              backgroundColor: '#fef2f2',
              padding: '24px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'start'
            }}
          >
            <Box
              className="prose"
              sx={{
                width: '100%',
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: '#374151',
                '& p': { marginBottom: '1em' },
                '& h1, & h2, & h3': { marginTop: '1em', marginBottom: '0.5em' },
                '& ul, & ol': { marginLeft: '1.5em' }
              }}
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          </Box>
        )}

        {/* Images */}
        {validImages.length > 0 && (
          <Box>
            <Masonry
              breakpointCols={{ default: 2 }}
              className="masonry-grid"
              columnClassName="masonry-column"
            >
              {validImages.map((img, idx) => {
                const sizeVariations = ['280px', '340px', '400px']
                const maxHeight = sizeVariations[idx % 3]

                return (
                  <Box
                    key={idx}
                    sx={{
                      breakInside: 'avoid',
                      marginBottom: '8px'
                    }}
                  >
                    <img
                      src={img}
                      alt={`Memory ${idx + 1}`}
                      style={{
                        width: '100%',
                        maxHeight: maxHeight,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        display: 'block'
                      }}
                      crossOrigin="anonymous"
                    />
                  </Box>
                )
              })}
            </Masonry>
          </Box>
        )}
      </Box>

      <style>{`
        .masonry-grid {
          display: flex;
          width: 100%;
          gap: 8px;
        }
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </Box>
  )
}

// Print-optimized title section
function TitleSection({ section }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)'
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontFamily: 'serif',
          fontSize: '4rem',
          fontWeight: 'bold',
          color: '#db2777',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}
      >
        {section.title || 'Our Love Story'}
      </Typography>

      {section.description && (
        <Box
          sx={{
            fontSize: '1.5rem',
            color: '#9f1239',
            fontStyle: 'italic',
            '& p': { margin: 0 }
          }}
          dangerouslySetInnerHTML={{ __html: section.description }}
        />
      )}

      {section.subtitle && (
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'serif',
            fontSize: '2rem',
            color: '#db2777',
            marginTop: '24px',
            fontStyle: 'italic'
          }}
        >
          {section.subtitle}
        </Typography>
      )}
    </Box>
  )
}

// Print-optimized timeline section
function TimelineSection({ section }) {
  const events = section.events || []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title */}
      <Typography
        variant="h2"
        sx={{
          fontFamily: 'serif',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '48px',
          fontSize: '3rem',
          color: '#db2777'
        }}
      >
        {section.title || 'Our Timeline'}
      </Typography>

      {/* Timeline Events */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '32px',
          padding: '0 40px'
        }}
      >
        {events.map((event, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative',
              '&:not(:last-child)::after': {
                content: '""',
                position: 'absolute',
                left: '140px',
                bottom: '-32px',
                width: '2px',
                height: '32px',
                backgroundColor: '#f9a8d4'
              }
            }}
          >
            {/* Year Badge */}
            <Box
              sx={{
                minWidth: '120px',
                padding: '12px 20px',
                backgroundColor: '#db2777',
                color: '#fff',
                borderRadius: '24px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}
            >
              {event.year}
            </Box>

            {/* Event Details */}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#db2777',
                  fontSize: '1.1rem',
                  marginBottom: '4px'
                }}
              >
                {event.date}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: '#374151',
                  lineHeight: 1.6
                }}
              >
                {event.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default PdfPreview

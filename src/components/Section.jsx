import { useState, useRef, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import RichTextEditor from './RichTextEditor'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { CircularProgress, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useSnackbar } from '../contexts/SnackbarContext'

function Section({ section, index, totalSections, onUpdate, onDelete, onMove }) {
  const { showError, showSuccess } = useSnackbar()
  const [isEditing, setIsEditing] = useState(!section.title && !section.description)
  const [isUploading, setIsUploading] = useState(false)
  const [failedImages, setFailedImages] = useState(new Set())

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      showError('Please sign in to upload images')
      return
    }

    setIsUploading(true)
    const uploadedUrls = []

    // Process and upload all images
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Compress the image first
          const compressedBlob = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.onload = (event) => {
              const img = new Image()
              img.onerror = () => reject(new Error('Failed to load image'))
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas')
                  const ctx = canvas.getContext('2d')

                  // Smaller max dimensions for better performance
                  const MAX_WIDTH = 1200
                  const MAX_HEIGHT = 1200

                  let width = img.width
                  let height = img.height

                  // Calculate new dimensions while maintaining aspect ratio
                  if (width > height) {
                    if (width > MAX_WIDTH) {
                      height = (height * MAX_WIDTH) / width
                      width = MAX_WIDTH
                    }
                  } else {
                    if (height > MAX_HEIGHT) {
                      width = (width * MAX_HEIGHT) / height
                      height = MAX_HEIGHT
                    }
                  }

                  canvas.width = width
                  canvas.height = height

                  ctx.drawImage(img, 0, 0, width, height)

                  // Convert to blob with compression
                  canvas.toBlob((blob) => {
                    if (blob) {
                      resolve(blob)
                    } else {
                      reject(new Error('Failed to create blob'))
                    }
                  }, 'image/jpeg', 0.7)
                } catch (err) {
                  reject(err)
                }
              }
              img.src = event.target.result
            }
            reader.readAsDataURL(file)
          })

          // Upload to Firebase Storage
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substring(2, 9)
          const fileName = `${timestamp}-${randomId}.jpg`
          const storageRef = ref(storage, `users/${user.uid}/scrapbook-images/${fileName}`)

          await uploadBytes(storageRef, compressedBlob)
          const downloadURL = await getDownloadURL(storageRef)

          uploadedUrls.push(downloadURL)
        } catch (error) {
          console.error('Failed to upload image:', file.name, error)
          showError(`Failed to upload image: ${file.name}`)
        }
      }
    }

    // Update with all uploaded URLs at once
    if (uploadedUrls.length > 0) {
      onUpdate(section.id, {
        images: [...(section.images || []), ...uploadedUrls]
      })
      showSuccess(`Successfully uploaded ${uploadedUrls.length} image(s)`)
    }

    setIsUploading(false)
  }

  const removeImage = (imageUrl) => {
    const newImages = (section.images || []).filter(img => img !== imageUrl)
    onUpdate(section.id, { images: newImages })
  }

  const moveImage = (index, direction) => {
    const images = [...(section.images || [])]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= images.length) return

    [images[index], images[newIndex]] = [images[newIndex], images[index]]
    onUpdate(section.id, { images })
  }

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => new Set([...prev, imageUrl]))
  }

  // Filter out failed images
  const validImages = (section.images || []).filter(img => !failedImages.has(img))

  // Masonry breakpoint configuration
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  }

  // Render Title Page
  if (section.type === 'title') {
    const isLocked = section.isLocked || false
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingSubtitle, setIsEditingSubtitle] = useState(false)
    const [isEditingBottomText, setIsEditingBottomText] = useState(false)
    const [localTitle, setLocalTitle] = useState(section.title || '')
    const [localSubtitle, setLocalSubtitle] = useState(section.subtitle || '')
    const titleInputRef = useRef(null)
    const subtitleInputRef = useRef(null)
    const updateTimeoutRef = useRef(null)

    const toggleLock = () => {
      onUpdate(section.id, { isLocked: !isLocked })
    }

    useEffect(() => {
      if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus()
        titleInputRef.current.select()
      }
    }, [isEditingTitle])

    useEffect(() => {
      if (isEditingBottomText && subtitleInputRef.current) {
        subtitleInputRef.current.focus()
        subtitleInputRef.current.select()
      }
    }, [isEditingBottomText])

    useEffect(() => {
      if (localTitle !== section.title) {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = setTimeout(() => {
          onUpdate(section.id, { title: localTitle })
        }, 2000)
      }
      return () => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
      }
    }, [localTitle])

    useEffect(() => {
      if (localSubtitle !== section.subtitle) {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = setTimeout(() => {
          onUpdate(section.id, { subtitle: localSubtitle })
        }, 2000)
      }
      return () => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
      }
    }, [localSubtitle])

    const handleDescriptionChange = (value) => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = setTimeout(() => {
        onUpdate(section.id, { description: value })
      }, 2000)
    }

    return (
      <div className="relative w-full" data-section-id={section.id}>
        {/* Side Controls */}
        <div className="absolute -left-14 top-0 flex flex-col gap-2" data-pdf-hide>
          <span className="text-xs font-semibold text-romantic-600 text-center bg-white rounded px-2 py-1">
            {index + 1}
          </span>
          <Tooltip title={isLocked ? "Unlock to edit" : "Lock section"} placement="left">
            <button
              onClick={toggleLock}
              className={`p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors romantic-shadow ${isLocked ? 'text-gray-600' : 'text-romantic-600'}`}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>
          </Tooltip>
          {!isLocked && (
            <>
              <button
                onClick={() => onMove(section.id, 'up')}
                disabled={index === 0}
                className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
                title="Move Up"
              >
                ↑
              </button>
              <button
                onClick={() => onMove(section.id, 'down')}
                disabled={index === totalSections - 1}
                className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
                title="Move Down"
              >
                ↓
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this page?')) {
                    onDelete(section.id)
                  }
                }}
                className="p-2 hover:bg-red-100 bg-white text-red-600 rounded-lg transition-colors romantic-shadow"
                title="Delete"
              >
                ✕
              </button>
            </>
          )}
        </div>

        {/* Title Page Content */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 romantic-shadow romantic-border w-full h-full flex flex-col items-center justify-center text-center">
          <div className="relative inline-block p-12">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-gray-800"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-gray-800"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-gray-800"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-gray-800"></div>

            <div className="px-8">
              {/* Inline Title Editing */}
              {!isLocked && isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false)
                    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
                    onUpdate(section.id, { title: localTitle })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false)
                      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
                      onUpdate(section.id, { title: localTitle })
                    }
                  }}
                  className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-4 leading-tight w-full text-center bg-romantic-50/50 focus:outline-none focus:bg-romantic-100/50 px-4 py-2 rounded"
                  placeholder="Your Title Here"
                />
              ) : (
                <h1
                  onClick={() => !isLocked && setIsEditingTitle(true)}
                  className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-4 leading-tight ${
                    !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 px-4 py-2 rounded transition-colors' : ''
                  }`}
                  title={!isLocked ? 'Click to edit title' : ''}
                >
                  {section.title || (!isLocked ? 'Click to add title...' : 'Your Title Here')}
                </h1>
              )}

              {/* Inline Subtitle/Description Editing */}
              {!isLocked && (isEditingSubtitle || !section.description) ? (
                <div className="text-xl md:text-2xl lg:text-3xl text-gray-800 leading-relaxed">
                  <RichTextEditor
                    value={section.description || ''}
                    onChange={handleDescriptionChange}
                  />
                </div>
              ) : (
                <div
                  onClick={() => !isLocked && setIsEditingSubtitle(true)}
                  className={`text-xl md:text-2xl lg:text-3xl text-gray-800 leading-relaxed ${
                    !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 px-4 py-2 rounded transition-colors' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: section.description || (!isLocked ? '<p>Click to add subtitle...</p>' : '<p>Add your subtitle...</p>') }}
                  title={!isLocked ? 'Click to edit subtitle' : ''}
                />
              )}
            </div>
          </div>

          {/* Inline Bottom Text Editing */}
          {!isLocked && isEditingBottomText ? (
            <input
              ref={subtitleInputRef}
              type="text"
              value={localSubtitle}
              onChange={(e) => setLocalSubtitle(e.target.value)}
              onBlur={() => {
                setIsEditingBottomText(false)
                if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
                onUpdate(section.id, { subtitle: localSubtitle })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingBottomText(false)
                  if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
                  onUpdate(section.id, { subtitle: localSubtitle })
                }
              }}
              className="text-lg md:text-xl text-gray-600 mt-8 italic w-full text-center bg-romantic-50/50 focus:outline-none focus:bg-romantic-100/50 px-4 py-2 rounded"
              placeholder="and beyond"
            />
          ) : section.subtitle || !isLocked ? (
            <p
              onClick={() => !isLocked && setIsEditingBottomText(true)}
              className={`text-lg md:text-xl text-gray-600 mt-8 italic ${
                !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 px-4 py-2 rounded transition-colors' : ''
              }`}
              title={!isLocked ? 'Click to edit bottom text' : ''}
            >
              {section.subtitle || (!isLocked ? 'Click to add bottom text...' : '')}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  // Render Timeline Page
  if (section.type === 'timeline') {
    const events = section.events || []
    const isLocked = section.isLocked || false

    const toggleLock = () => {
      onUpdate(section.id, { isLocked: !isLocked })
    }

    // Group events by year
    const eventsByYear = events.reduce((acc, event) => {
      const year = event.year || 'Unknown'
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(event)
      return acc
    }, {})

    // Get sorted years
    const sortedYears = Object.keys(eventsByYear).sort()

    return (
      <div className="relative w-full" data-section-id={section.id}>
        {/* Side Controls */}
        <div className="absolute -left-14 top-0 flex flex-col gap-2" data-pdf-hide>
          <span className="text-xs font-semibold text-romantic-600 text-center bg-white rounded px-2 py-1">
            {index + 1}
          </span>
          <Tooltip title={isLocked ? "Unlock to edit" : "Lock section"} placement="left">
            <button
              onClick={toggleLock}
              className={`p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors romantic-shadow ${isLocked ? 'text-gray-600' : 'text-romantic-600'}`}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>
          </Tooltip>
          {!isLocked && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors text-romantic-600 hover:text-romantic-700 romantic-shadow"
                title="Edit Content"
              >
                ✏️
              </button>
              <button
                onClick={() => onMove(section.id, 'up')}
                disabled={index === 0}
                className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
                title="Move Up"
              >
                ↑
              </button>
              <button
                onClick={() => onMove(section.id, 'down')}
                disabled={index === totalSections - 1}
                className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
                title="Move Down"
              >
                ↓
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this page?')) {
                    onDelete(section.id)
                  }
                }}
                className="p-2 hover:bg-red-100 bg-white text-red-600 rounded-lg transition-colors romantic-shadow"
                title="Delete"
              >
                ✕
              </button>
            </>
          )}
        </div>

        {/* Timeline Content */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 md:p-12 romantic-shadow romantic-border w-full h-full overflow-auto">
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-8 md:mb-12">
            {section.title || 'Key Events'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {sortedYears.map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-bold text-gray-900 border-b-4 border-romantic-300 pb-2">
                  {year}
                </h3>
                <div className="space-y-4">
                  {eventsByYear[year].map((event, idx) => (
                    <div key={idx}>
                      {event.date && (
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                          <strong className="text-romantic-600 text-lg md:text-xl">{event.date}</strong> {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Edit Timeline</span>
            <IconButton onClick={() => setIsEditing(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-3">
              <div>
                <label className="block text-sm font-semibold mb-2">Timeline Title</label>
                <input
                  type="text"
                  value={section.title || ''}
                  onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                  placeholder="e.g., Key Events"
                  className="w-full px-4 py-3 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-xl"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold">Timeline Events</label>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const currentEvents = section.events || []
                      onUpdate(section.id, {
                        events: [...currentEvents, { year: '', date: '', description: '' }]
                      })
                    }}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Add Event
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {(section.events || []).map((event, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        border: '2px solid #f9a8d4',
                        borderRadius: 2,
                        backgroundColor: '#fdf2f8',
                        position: 'relative'
                      }}
                    >
                      <div className="flex gap-2 mb-3">
                        <div className="flex-shrink-0 flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (idx === 0) return
                              const newEvents = [...(section.events || [])]
                              ;[newEvents[idx - 1], newEvents[idx]] = [newEvents[idx], newEvents[idx - 1]]
                              onUpdate(section.id, { events: newEvents })
                            }}
                            disabled={idx === 0}
                            className="p-1 bg-white rounded hover:bg-romantic-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              if (idx === (section.events || []).length - 1) return
                              const newEvents = [...(section.events || [])]
                              ;[newEvents[idx], newEvents[idx + 1]] = [newEvents[idx + 1], newEvents[idx]]
                              onUpdate(section.id, { events: newEvents })
                            }}
                            disabled={idx === (section.events || []).length - 1}
                            className="p-1 bg-white rounded hover:bg-romantic-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            title="Move Down"
                          >
                            ↓
                          </button>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-gray-700">Year</label>
                              <input
                                type="text"
                                value={event.year || ''}
                                onChange={(e) => {
                                  const newEvents = [...(section.events || [])]
                                  newEvents[idx] = { ...newEvents[idx], year: e.target.value }
                                  onUpdate(section.id, { events: newEvents })
                                }}
                                placeholder="e.g., 2024"
                                className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-gray-700">Date</label>
                              <input
                                type="text"
                                value={event.date || ''}
                                onChange={(e) => {
                                  const newEvents = [...(section.events || [])]
                                  newEvents[idx] = { ...newEvents[idx], date: e.target.value }
                                  onUpdate(section.id, { events: newEvents })
                                }}
                                placeholder="e.g., 07.09.2024"
                                className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-700">Description</label>
                            <textarea
                              value={event.description || ''}
                              onChange={(e) => {
                                const newEvents = [...(section.events || [])]
                                newEvents[idx] = { ...newEvents[idx], description: e.target.value }
                                onUpdate(section.id, { events: newEvents })
                              }}
                              placeholder="e.g., We met in Rome and started dating"
                              rows={2}
                              className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <button
                            onClick={() => {
                              const newEvents = (section.events || []).filter((_, i) => i !== idx)
                              onUpdate(section.id, { events: newEvents })
                            }}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Remove Event"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-right">Event #{idx + 1}</div>
                    </Box>
                  ))}
                </div>

                {(section.events || []).length === 0 && (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                    <p>No events yet. Click "Add Event" to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setIsEditing(false)} variant="contained" fullWidth>
              Done Editing
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }

  // Regular section rendering
  return (
    <div className="relative w-full" data-section-id={section.id}>
      {/* Side Controls - Positioned absolutely outside */}
      {!isLocked && (
        <div className="absolute -left-14 top-0 flex flex-col gap-2" data-pdf-hide>
          <span className="text-xs font-semibold text-romantic-600 text-center bg-white rounded px-2 py-1">
            {index + 1}
          </span>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors text-romantic-600 hover:text-romantic-700 romantic-shadow"
            title="Edit Content"
          >
            ✏️
          </button>

          {/* Move Up */}
          <button
            onClick={() => onMove(section.id, 'up')}
            disabled={index === 0}
            className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
            title="Move Up"
          >
            ↑
          </button>

          {/* Move Down */}
          <button
            onClick={() => onMove(section.id, 'down')}
            disabled={index === totalSections - 1}
            className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
            title="Move Down"
          >
            ↓
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this page?')) {
                onDelete(section.id)
              }
            }}
            className="p-2 hover:bg-red-100 bg-white text-red-600 rounded-lg transition-colors romantic-shadow"
            title="Delete"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Section Content */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-4 sm:p-6 romantic-shadow romantic-border overflow-hidden w-full h-full flex flex-col">
        {/* Title */}
        {section.title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 uppercase tracking-wide border-b-2 border-romantic-300 pb-2 sm:pb-3 mb-4 flex-shrink-0">
            {section.title}
          </h2>
        )}

        {/* Content area with text and images - fills remaining space */}
        {(section.description || validImages.length > 0) && (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
            {/* Text content */}
            {section.description && (
              <div className={`bg-romantic-50/50 p-4 rounded-lg ${!validImages.length ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-2' : ''} flex items-start`}>
                <div
                  className="prose prose-base sm:prose-lg lg:prose-xl max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.description }}
                />
              </div>
            )}

            {/* Images in masonry layout */}
            {validImages.length > 0 && (
              <div className={`${!section.description ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                <Masonry
                  breakpointCols={{
                    default: 2,
                    1024: 2,
                    640: 1
                  }}
                  className="flex w-full gap-2"
                  columnClassName="space-y-2"
                >
                  {validImages.map((img, idx) => {
                    // Vary image sizes for collage effect: small, medium, large
                    const sizeVariations = ['280px', '340px', '400px']
                    const maxHeight = sizeVariations[idx % 3]

                    return (
                      <div key={idx} className="break-inside-avoid">
                        <img
                          src={img}
                          alt={`Memory ${idx + 1}`}
                          className="w-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                          style={{
                            maxHeight: maxHeight,
                            objectFit: 'cover',
                            width: '100%',
                            display: 'block'
                          }}
                          crossOrigin="anonymous"
                          onError={() => handleImageError(img)}
                        />
                      </div>
                    )
                  })}
                </Masonry>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!section.title && !section.description && validImages.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">Click edit to add your memories...</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fecdd3 100%)',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #f9a8d4',
          pb: 2
        }}>
          <span className="text-xl font-script text-romantic-600">
            Edit Page {index + 1}
          </span>
          <IconButton onClick={() => setIsEditing(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-romantic-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                placeholder="Give this page a title..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-lg sm:text-xl font-script"
              />
            </div>

            {/* Description Editor */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-romantic-700 mb-2">
                Description
              </label>
              <RichTextEditor
                value={section.description}
                onChange={(value) => onUpdate(section.id, { description: value })}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-romantic-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-xs sm:text-sm text-romantic-700 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:bg-romantic-100 file:text-romantic-700 hover:file:bg-romantic-200 file:cursor-pointer disabled:opacity-50"
              />
              {isUploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={24} />
                  <span className="text-sm text-romantic-600">Uploading images...</span>
                </Box>
              )}

              {/* Uploaded Images Gallery */}
              {(section.images || []).length > 0 && (
                <div className="mt-4">
                  <div className="text-xs sm:text-sm font-semibold text-romantic-700 mb-2">
                    Your Images ({(section.images || []).length}) - Click arrows to reorder
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(section.images || []).map((img, idx) => (
                      <div key={idx} className="relative group bg-white p-2 rounded-lg shadow-sm">
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveImage(idx, 'up')}
                            disabled={idx === 0}
                            className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600"
                            title="Move Left"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => moveImage(idx, 'down')}
                            disabled={idx === (section.images || []).length - 1}
                            className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600"
                            title="Move Right"
                          >
                            →
                          </button>
                          <button
                            onClick={() => removeImage(img)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-1">#{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{
          borderTop: '2px solid #f9a8d4',
          pt: 2,
          px: 3,
          pb: 2
        }}>
          <Button
            onClick={() => setIsEditing(false)}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
              },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Done Editing
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Section

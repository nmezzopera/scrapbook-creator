import { useState, useEffect, useRef } from 'react'
import Masonry from 'react-masonry-css'
import RichTextEditor from './RichTextEditor'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { CircularProgress, IconButton, Tooltip } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useSnackbar } from '../contexts/SnackbarContext'

function SectionInline({ section, index, totalSections, onUpdate, onDelete, onMove }) {
  const { showError, showSuccess } = useSnackbar()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [failedImages, setFailedImages] = useState(new Set())
  const [localTitle, setLocalTitle] = useState(section.title || '')
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null)

  const titleInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const updateTimeoutRef = useRef(null)
  const titleContainerRef = useRef(null)

  // Click outside to close title editing
  useEffect(() => {
    if (!isEditingTitle) return

    const handleClickOutside = (event) => {
      if (titleContainerRef.current && !titleContainerRef.current.contains(event.target)) {
        setIsEditingTitle(false)
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        onUpdate(section.id, { title: localTitle })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isEditingTitle, localTitle, section.id, onUpdate])

  // Debounced auto-save for title
  useEffect(() => {
    if (localTitle !== section.title) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      updateTimeoutRef.current = setTimeout(() => {
        onUpdate(section.id, { title: localTitle })
      }, 2000)
    }
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [localTitle])

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

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

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
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
                  const MAX_WIDTH = 1200
                  const MAX_HEIGHT = 1200
                  let width = img.width
                  let height = img.height

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

    if (uploadedUrls.length > 0) {
      onUpdate(section.id, {
        images: [...(section.images || []), ...uploadedUrls]
      })
      showSuccess(`Successfully uploaded ${uploadedUrls.length} image(s)`)
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (imageUrl) => {
    const newImages = (section.images || []).filter(img => img !== imageUrl)
    onUpdate(section.id, { images: newImages })
  }

  const moveImage = (imgIndex, direction) => {
    const images = [...(section.images || [])]
    const newIndex = direction === 'left' ? imgIndex - 1 : imgIndex + 1

    if (newIndex < 0 || newIndex >= images.length) return

    [images[imgIndex], images[newIndex]] = [images[newIndex], images[imgIndex]]
    onUpdate(section.id, { images })
  }

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => new Set([...prev, imageUrl]))
  }

  const handleDescriptionChange = (value) => {
    // Debounced auto-save happens automatically through onUpdate
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(section.id, { description: value })
    }, 2000)
  }

  const validImages = (section.images || []).filter(img => !failedImages.has(img))
  const isLocked = section.isLocked || false

  const toggleLock = () => {
    onUpdate(section.id, { isLocked: !isLocked })
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
            title={isLocked ? "Unlock" : "Lock"}
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

      {/* Main Section Content */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-4 sm:p-6 romantic-shadow romantic-border overflow-hidden w-full h-full flex flex-col">
        {/* Inline Title Editing */}
        {!isLocked && isEditingTitle ? (
          <div className="mb-4 flex-shrink-0">
            <div ref={titleContainerRef} className="relative flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false)
                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current)
                  }
                  onUpdate(section.id, { title: localTitle })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                    if (updateTimeoutRef.current) {
                      clearTimeout(updateTimeoutRef.current)
                    }
                    onUpdate(section.id, { title: localTitle })
                  }
                }}
                placeholder="Click to add title..."
                className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 uppercase tracking-wide border-b-2 border-romantic-400 pb-2 sm:pb-3 focus:outline-none focus:border-romantic-600 px-2 bg-romantic-50/50 flex-1"
              />
              <button
                onClick={() => {
                  setIsEditingTitle(false)
                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current)
                  }
                  onUpdate(section.id, { title: localTitle })
                }}
                className="flex-shrink-0 text-romantic-600 hover:text-romantic-700 bg-white rounded-full p-1.5 shadow-lg border-2 border-romantic-300 text-lg font-bold"
                title="Done"
              >
                ✓
              </button>
            </div>
          </div>
        ) : (
          <h2
            onClick={() => !isLocked && setIsEditingTitle(true)}
            className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 uppercase tracking-wide border-b-2 border-romantic-300 pb-2 sm:pb-3 mb-4 flex-shrink-0 ${
              !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 hover:border-romantic-400 transition-colors px-2 -mx-2' : ''
            }`}
            title={!isLocked ? 'Click to edit title' : ''}
          >
            {section.title || (!isLocked ? 'Click to add title...' : '')}
          </h2>
        )}

        {/* Content area with text and images */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Inline Description Editing */}
          <div className={`bg-romantic-50/50 p-4 rounded-lg ${!validImages.length ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-2' : ''} flex items-start`}>
            {!isLocked && (isEditingDescription || !section.description) ? (
              <div className="w-full">
                <RichTextEditor
                  value={section.description || ''}
                  onChange={handleDescriptionChange}
                  onDone={() => setIsEditingDescription(false)}
                />
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="mt-2 text-sm text-romantic-600 hover:text-romantic-700 underline"
                  >
                    Start editing...
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isLocked && setIsEditingDescription(true)}
                className={`prose prose-base sm:prose-lg lg:prose-xl max-w-none text-gray-700 leading-relaxed w-full ${
                  !isLocked ? 'cursor-pointer hover:bg-romantic-100/50 rounded p-2 -m-2 transition-colors' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: section.description || (!isLocked ? '<p class="text-gray-400">Click to add description...</p>' : '') }}
                title={!isLocked ? 'Click to edit description' : ''}
              />
            )}
          </div>

          {/* Images with inline controls */}
          <div className={`${!section.description && !isEditingDescription ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            {!isLocked && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 px-4 border-2 border-dashed border-romantic-300 rounded-lg hover:border-romantic-400 hover:bg-romantic-50 transition-colors flex items-center justify-center gap-2 text-romantic-600 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <CircularProgress size={20} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <AddPhotoAlternateIcon />
                      <span>Add Images</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {validImages.length > 0 && (
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
                  const sizeVariations = ['280px', '340px', '400px']
                  const maxHeight = sizeVariations[idx % 3]

                  return (
                    <div
                      key={idx}
                      className="break-inside-avoid relative group"
                      onMouseEnter={() => setHoveredImageIndex(idx)}
                      onMouseLeave={() => setHoveredImageIndex(null)}
                    >
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

                      {/* Inline Image Controls */}
                      {!isLocked && hoveredImageIndex === idx && (
                        <div className="absolute top-2 right-2 flex gap-1 bg-white/90 rounded-lg p-1 shadow-lg">
                          <Tooltip title="Move Left">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveImage(idx, 'left')}
                                disabled={idx === 0}
                              >
                                <ArrowBackIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move Right">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveImage(idx, 'right')}
                                disabled={idx === validImages.length - 1}
                              >
                                <ArrowForwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => removeImage(img)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  )
                })}
              </Masonry>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!section.title && !section.description && validImages.length === 0 && !isLocked && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">Click on the title or description to start editing...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionInline

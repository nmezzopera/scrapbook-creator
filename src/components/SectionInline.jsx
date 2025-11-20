import { useState, useEffect, useRef } from 'react'
import Masonry from 'react-masonry-css'
import RichTextEditor from './RichTextEditor'
import SideControls from './SideControls'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { CircularProgress, IconButton, Tooltip } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useSnackbar } from '../contexts/SnackbarContext'
import { useAuth } from '../contexts/AuthContext'
import { canUploadMoreImages, getMaxImages } from '../services/userService'
import { useClickOutside } from '../hooks/useClickOutside'
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate'

function SectionInline({ section, index, totalSections, onUpdate, onDelete, onMove }) {
  const { showError, showSuccess } = useSnackbar()
  const { userData, isAuthenticated } = useAuth()
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

  // Click outside to close title editing and save
  useClickOutside(
    titleContainerRef,
    () => {
      setIsEditingTitle(false)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      onUpdate(section.id, { title: localTitle })
    },
    isEditingTitle
  )

  // Debounced auto-save for title
  useDebouncedUpdate(
    localTitle,
    (value) => onUpdate(section.id, { title: value }),
    2000,
    section.title
  )

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

    // Check user tier and existing image count
    const currentImageCount = (section.images || []).length
    const userTier = userData?.tier || 'free'

    // Check if user can upload more images
    if (!canUploadMoreImages(userTier, currentImageCount)) {
      const maxImages = getMaxImages(userTier)
      showError(`Free tier limited to ${maxImages} image per page. Upgrade to paid for unlimited images!`)
      return
    }

    // For free tier, limit to 1 image total
    if (userTier === 'free' && currentImageCount + files.length > 1) {
      showError(`Free tier limited to 1 image per page. You can upload ${1 - currentImageCount} more image(s). Upgrade for unlimited!`)
      return
    }

    setIsUploading(true)
    const uploadedUrls = []

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Tier-based compression settings
          const MAX_WIDTH = userTier === 'free' ? 800 : 1200
          const MAX_HEIGHT = userTier === 'free' ? 800 : 1200
          const QUALITY = userTier === 'free' ? 0.5 : 0.7
          const MAX_FILE_SIZE = userTier === 'free' ? 512000 : 10485760 // 500KB or 10MB

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
                  }, 'image/jpeg', QUALITY)
                } catch (err) {
                  reject(err)
                }
              }
              img.src = event.target.result
            }
            reader.readAsDataURL(file)
          })

          // Check if compressed blob exceeds tier limit
          if (compressedBlob.size > MAX_FILE_SIZE) {
            const sizeMB = (compressedBlob.size / 1024 / 1024).toFixed(2)
            const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(2)
            showError(`Image "${file.name}" is too large (${sizeMB}MB). Free tier limit is ${maxMB}MB per image. Try a smaller image or upgrade to paid.`)
            continue
          }

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
  const userTier = userData?.tier || 'free'
  const currentImageCount = validImages.length
  const canAddMore = canUploadMoreImages(userTier, currentImageCount)
  const maxImages = getMaxImages(userTier)

  const toggleLock = () => {
    onUpdate(section.id, { isLocked: !isLocked })
  }

  return (
    <div className="relative w-full" data-section-id={section.id}>
      {/* Side Controls */}
      <SideControls
        index={index}
        isLocked={isLocked}
        onToggleLock={toggleLock}
        onMoveUp={() => onMove(section.id, 'up')}
        onMoveDown={() => onMove(section.id, 'down')}
        onDelete={() => onDelete(section.id)}
        canMoveUp={index > 0}
        canMoveDown={index < totalSections - 1}
      />

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
          >
            {section.title || (!isLocked ? 'Click to add title...' : '')}
          </h2>
        )}

        {/* Content area with text and images */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Inline Description Editing */}
          <div className={`bg-romantic-50/50 p-4 rounded-lg ${!validImages.length ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-2' : ''} flex items-start`}>
            {!isLocked && isEditingDescription ? (
              <div className="w-full">
                <RichTextEditor
                  value={section.description || ''}
                  onChange={handleDescriptionChange}
                  onDone={() => setIsEditingDescription(false)}
                />
              </div>
            ) : !section.description && !isLocked ? (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="w-full flex items-center justify-center py-16 border-2 border-dashed border-romantic-300 rounded-lg hover:border-romantic-400 hover:bg-romantic-100/50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <p className="text-lg text-romantic-600 font-semibold mb-1">Click to add description</p>
                  <p className="text-sm text-gray-500">Tell your story here...</p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isLocked && setIsEditingDescription(true)}
                className={`prose prose-base sm:prose-lg lg:prose-xl max-w-none text-gray-700 leading-relaxed w-full ${
                  !isLocked ? 'cursor-pointer hover:bg-romantic-100/50 rounded p-2 -m-2 transition-colors' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: section.description }}
              />
            )}
          </div>

          {/* Images with inline controls */}
          <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            {!isLocked && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading || !canAddMore}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !canAddMore}
                  className="w-full py-3 px-4 border-2 border-dashed border-romantic-300 rounded-lg hover:border-romantic-400 hover:bg-romantic-50 transition-colors flex flex-col items-center justify-center gap-2 text-romantic-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <CircularProgress size={20} />
                      <span>Uploading...</span>
                    </>
                  ) : !canAddMore ? (
                    <>
                      <AddPhotoAlternateIcon />
                      <span className="font-semibold">Image Limit Reached</span>
                      <span className="text-xs text-gray-500">
                        {userTier === 'free' ? `Free: ${maxImages} image per page. Upgrade for unlimited!` : 'Upgrade for more images'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AddPhotoAlternateIcon />
                      <span>Add Images</span>
                      {userTier === 'free' && (
                        <span className="text-xs text-gray-500">
                          Free: {currentImageCount}/{maxImages} used
                        </span>
                      )}
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

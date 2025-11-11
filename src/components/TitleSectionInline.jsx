import { useState, useEffect, useRef } from 'react'
import RichTextEditor from './RichTextEditor'
import { Tooltip } from '@mui/material'

function TitleSectionInline({ section, index, totalSections, onUpdate, onDelete, onMove }) {
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

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Focus subtitle input when editing starts
  useEffect(() => {
    if (isEditingBottomText && subtitleInputRef.current) {
      subtitleInputRef.current.focus()
      subtitleInputRef.current.select()
    }
  }, [isEditingBottomText])

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
  }, [localTitle, section.title, section.id, onUpdate])

  // Debounced auto-save for subtitle
  useEffect(() => {
    if (localSubtitle !== section.subtitle) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      updateTimeoutRef.current = setTimeout(() => {
        onUpdate(section.id, { subtitle: localSubtitle })
      }, 2000)
    }
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [localSubtitle, section.subtitle, section.id, onUpdate])

  const handleDescriptionChange = (value) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
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
              if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
              }
              onUpdate(section.id, { subtitle: localSubtitle })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingBottomText(false)
                if (updateTimeoutRef.current) {
                  clearTimeout(updateTimeoutRef.current)
                }
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

export default TitleSectionInline

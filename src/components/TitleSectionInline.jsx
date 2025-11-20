import { useState, useRef } from 'react'
import RichTextEditor from './RichTextEditor'
import SideControls from './SideControls'
import { useClickOutside } from '../hooks/useClickOutside'
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate'

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
  const titleContainerRef = useRef(null)
  const bottomTextContainerRef = useRef(null)

  const toggleLock = () => {
    onUpdate(section.id, { isLocked: !isLocked })
  }

  // Click outside to close title editing
  useClickOutside(
    titleContainerRef,
    () => {
      setIsEditingTitle(false)
      onUpdate(section.id, { title: localTitle })
    },
    isEditingTitle
  )

  // Click outside to close bottom text editing
  useClickOutside(
    bottomTextContainerRef,
    () => {
      setIsEditingBottomText(false)
      onUpdate(section.id, { subtitle: localSubtitle })
    },
    isEditingBottomText
  )

  // Debounced auto-save for title
  useDebouncedUpdate(
    localTitle,
    (value) => onUpdate(section.id, { title: value }),
    2000,
    section.title
  )

  // Debounced auto-save for subtitle
  useDebouncedUpdate(
    localSubtitle,
    (value) => onUpdate(section.id, { subtitle: value }),
    2000,
    section.subtitle
  )

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
      <SideControls
        index={index}
        isLocked={isLocked}
        onToggleLock={toggleLock}
        onMoveUp={() => onMove(section.id, 'up')}
        onMoveDown={() => onMove(section.id, 'down')}
        onDelete={() => onDelete(section.id)}
        canMoveUp={index !== 0}
        canMoveDown={index !== totalSections - 1}
      />

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
              <div className="mb-4">
                <div ref={titleContainerRef} className="flex items-center justify-center gap-2">
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
                    className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight text-center bg-romantic-50/50 focus:outline-none focus:bg-romantic-100/50 px-4 py-2 rounded flex-1 max-w-3xl"
                    placeholder="Your Title Here"
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
                  onDone={() => setIsEditingSubtitle(false)}
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
          <div className="mt-8">
            <div ref={bottomTextContainerRef} className="flex items-center justify-center gap-2">
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
                className="text-lg md:text-xl text-gray-600 italic text-center bg-romantic-50/50 focus:outline-none focus:bg-romantic-100/50 px-4 py-2 rounded flex-1 max-w-xl"
                placeholder="and beyond"
              />
              <button
                onClick={() => {
                  setIsEditingBottomText(false)
                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current)
                  }
                  onUpdate(section.id, { subtitle: localSubtitle })
                }}
                className="flex-shrink-0 text-romantic-600 hover:text-romantic-700 bg-white rounded-full p-1.5 shadow-lg border-2 border-romantic-300 text-lg font-bold"
                title="Done"
              >
                ✓
              </button>
            </div>
          </div>
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

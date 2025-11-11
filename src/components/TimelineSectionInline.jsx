import { useState, useEffect, useRef } from 'react'
import { Tooltip, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

function TimelineSectionInline({ section, index, totalSections, onUpdate, onDelete, onMove }) {
  const isLocked = section.isLocked || false
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(section.title || '')
  const [editingEventIndex, setEditingEventIndex] = useState(null)
  const [hoveredEventIndex, setHoveredEventIndex] = useState(null)

  const titleInputRef = useRef(null)
  const updateTimeoutRef = useRef(null)

  const events = section.events || []

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

  const addEvent = () => {
    const currentEvents = section.events || []
    onUpdate(section.id, {
      events: [...currentEvents, { year: '', date: '', description: '' }]
    })
    // Auto-focus on the new event
    setEditingEventIndex(currentEvents.length)
  }

  const updateEvent = (eventIndex, field, value) => {
    const newEvents = [...events]
    newEvents[eventIndex] = { ...newEvents[eventIndex], [field]: value }
    onUpdate(section.id, { events: newEvents })
  }

  const deleteEvent = (eventIndex) => {
    const newEvents = events.filter((_, i) => i !== eventIndex)
    onUpdate(section.id, { events: newEvents })
  }

  const moveEvent = (eventIndex, direction) => {
    const newEvents = [...events]
    const newIndex = direction === 'up' ? eventIndex - 1 : eventIndex + 1

    if (newIndex < 0 || newIndex >= newEvents.length) return

    ;[newEvents[eventIndex], newEvents[newIndex]] = [newEvents[newIndex], newEvents[eventIndex]]
    onUpdate(section.id, { events: newEvents })
  }

  // Group events by year
  const eventsByYear = events.reduce((acc, event, idx) => {
    const year = event.year || 'Unknown'
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push({ ...event, originalIndex: idx })
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
            className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-8 md:mb-12 w-full bg-romantic-50/50 focus:outline-none focus:bg-romantic-100/50 px-4 py-2 rounded"
            placeholder="Timeline Title"
          />
        ) : (
          <h2
            onClick={() => !isLocked && setIsEditingTitle(true)}
            className={`text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-8 md:mb-12 ${
              !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 px-4 py-2 rounded transition-colors' : ''
            }`}
            title={!isLocked ? 'Click to edit title' : ''}
          >
            {section.title || (!isLocked ? 'Click to add title...' : 'Key Events')}
          </h2>
        )}

        {/* Timeline Events */}
        {events.length === 0 && !isLocked ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg mb-4">No events yet. Click "Add Event" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {sortedYears.map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-bold text-gray-900 border-b-4 border-romantic-300 pb-2">
                  {year}
                </h3>
                <div className="space-y-4">
                  {eventsByYear[year].map((event) => {
                    const eventIdx = event.originalIndex
                    const isEditing = editingEventIndex === eventIdx
                    const isHovered = hoveredEventIndex === eventIdx

                    return (
                      <div
                        key={eventIdx}
                        className="relative group"
                        onMouseEnter={() => setHoveredEventIndex(eventIdx)}
                        onMouseLeave={() => setHoveredEventIndex(null)}
                      >
                        {!isLocked && isEditing ? (
                          <div className="bg-romantic-50/50 p-4 rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700">Year</label>
                                <input
                                  type="text"
                                  value={event.year || ''}
                                  onChange={(e) => updateEvent(eventIdx, 'year', e.target.value)}
                                  placeholder="e.g., 2024"
                                  className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700">Date</label>
                                <input
                                  type="text"
                                  value={event.date || ''}
                                  onChange={(e) => updateEvent(eventIdx, 'date', e.target.value)}
                                  placeholder="e.g., 07.09.2024"
                                  className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-gray-700">Description</label>
                              <textarea
                                value={event.description || ''}
                                onChange={(e) => updateEvent(eventIdx, 'description', e.target.value)}
                                placeholder="e.g., We met in Rome and started dating"
                                rows={2}
                                className="w-full px-3 py-2 border-2 border-romantic-200 rounded-lg focus:outline-none focus:border-romantic-400 text-sm"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingEventIndex(null)}
                                className="px-3 py-1 bg-romantic-600 text-white rounded hover:bg-romantic-700 text-sm"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => !isLocked && setEditingEventIndex(eventIdx)}
                            className={`${
                              !isLocked ? 'cursor-pointer hover:bg-romantic-50/50 p-3 -m-3 rounded transition-colors' : ''
                            }`}
                            title={!isLocked ? 'Click to edit event' : ''}
                          >
                            {event.date && (
                              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                <strong className="text-romantic-600 text-lg md:text-xl">{event.date}</strong>{' '}
                                {event.description}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Event Controls */}
                        {!isLocked && isHovered && !isEditing && (
                          <div className="absolute top-0 right-0 flex gap-1 bg-white/90 rounded-lg p-1 shadow-lg">
                            <Tooltip title="Move Up">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveEvent(eventIdx, 'up')
                                  }}
                                  disabled={eventIdx === 0}
                                >
                                  <span className="text-sm">↑</span>
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveEvent(eventIdx, 'down')
                                  }}
                                  disabled={eventIdx === events.length - 1}
                                >
                                  <span className="text-sm">↓</span>
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm('Delete this event?')) {
                                    deleteEvent(eventIdx)
                                  }
                                }}
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
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Event Button */}
        {!isLocked && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={addEvent}
              className="px-6 py-3 bg-romantic-600 text-white rounded-lg hover:bg-romantic-700 transition-colors flex items-center gap-2 shadow-md"
            >
              <AddIcon />
              <span>Add Event</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineSectionInline

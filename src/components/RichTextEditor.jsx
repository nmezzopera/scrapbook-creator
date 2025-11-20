import { useState, useRef, useEffect } from 'react'
import * as emoji from 'node-emoji'
import { aiService } from '../services/aiService'
import AIPolishModal from './AIPolishModal'

function RichTextEditor({ value, onChange, onDone }) {
  const editorRef = useRef(null)

  // Emoji autocomplete state
  const [showEmojiPopup, setShowEmojiPopup] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')
  const [emojiSuggestions, setEmojiSuggestions] = useState([])
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const emojiPopupRef = useRef(null)

  // AI polish state
  const [isPolishing, setIsPolishing] = useState(false)
  const [polishError, setPolishError] = useState(null)
  const [showPolishModal, setShowPolishModal] = useState(false)
  const [originalText, setOriginalText] = useState('')
  const [polishedText, setPolishedText] = useState('')

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [])

  // Scroll selected emoji into view
  useEffect(() => {
    if (showEmojiPopup && emojiPopupRef.current) {
      const selectedElement = emojiPopupRef.current.children[0]?.children[selectedEmojiIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedEmojiIndex, showEmojiPopup])

  // WhatsApp-style simple shortcuts (non-colon format)
  const simpleShortcuts = {
    '<3': '❤️',
    '</3': '💔',
    ':)': '😊',
    ':-)': '😊',
    ':(': '😢',
    ':-(': '😢',
    ':D': '😃',
    ':-D': '😃',
    ';)': '😉',
    ';-)': '😉',
    ':P': '😛',
    ':-P': '😛',
    ':p': '😛',
    ':-p': '😛',
    ':*': '😘',
    ':-*': '😘',
    '<3<3': '💕',
    'xD': '😆',
    'XD': '😆',
    ':o': '😮',
    ':O': '😮',
    ':-o': '😮',
    ':-O': '😮',
  }

  const replaceEmojiShortcuts = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return false

    const range = selection.getRangeAt(0)
    const textNode = range.startContainer

    // Only process text nodes
    if (textNode.nodeType !== Node.TEXT_NODE) return false

    const text = textNode.textContent
    const cursorPos = range.startOffset

    // Get text before cursor (excluding the space that was just typed)
    const textBeforeCursor = text.substring(0, cursorPos).trimEnd()
    const trimmedCursorPos = textBeforeCursor.length

    // First check for simple shortcuts (WhatsApp-style) at the end
    for (const [shortcut, emojiChar] of Object.entries(simpleShortcuts)) {
      if (textBeforeCursor.endsWith(shortcut)) {
        const shortcutStart = trimmedCursorPos - shortcut.length
        // Replace the shortcut with emoji
        const beforeShortcut = text.substring(0, shortcutStart)
        const afterShortcut = text.substring(cursorPos)
        textNode.textContent = beforeShortcut + emojiChar + ' ' + afterShortcut

        // Restore cursor position after emoji and space
        const newRange = document.createRange()
        newRange.setStart(textNode, shortcutStart + emojiChar.length + 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)

        return true
      }
    }

    // Check for :shortcode: format (comprehensive emoji support via node-emoji)
    // Look for pattern :word: at the end
    const colonPattern = /:[a-zA-Z0-9_+-]+:$/
    const match = textBeforeCursor.match(colonPattern)

    if (match) {
      const shortcode = match[0]
      const emojiChar = emoji.get(shortcode)

      // If emoji exists and is different from shortcode (meaning it was found)
      if (emojiChar && emojiChar !== shortcode) {
        const shortcodeStart = trimmedCursorPos - shortcode.length
        const beforeShortcut = text.substring(0, shortcodeStart)
        const afterShortcut = text.substring(cursorPos)
        textNode.textContent = beforeShortcut + emojiChar + ' ' + afterShortcut

        // Restore cursor position after emoji and space
        const newRange = document.createRange()
        newRange.setStart(textNode, shortcodeStart + emojiChar.length + 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)

        return true
      }
    }

    return false
  }

  const getCaretCoordinates = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return null

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const editorRect = editorRef.current.getBoundingClientRect()

    return {
      top: rect.bottom - editorRect.top + editorRef.current.scrollTop,
      left: rect.left - editorRect.left + editorRef.current.scrollLeft
    }
  }

  const detectEmojiShortcode = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return null

    const range = selection.getRangeAt(0)
    const textNode = range.startContainer

    if (textNode.nodeType !== Node.TEXT_NODE) return null

    const text = textNode.textContent
    const cursorPos = range.startOffset
    const textBeforeCursor = text.substring(0, cursorPos)

    // Look for :word pattern (incomplete shortcode)
    const match = textBeforeCursor.match(/:([a-zA-Z0-9_+-]*)$/)
    if (match) {
      return {
        search: match[1],
        colonPos: cursorPos - match[1].length - 1
      }
    }

    return null
  }

  const updateEmojiSuggestions = (searchTerm) => {
    if (!searchTerm) {
      // Show popular emojis when just typed ":"
      const popular = ['heart', 'smile', 'fire', 'star', 'pizza', 'tada', 'sparkles', 'rocket']
      const suggestions = popular.map(name => ({
        name,
        emoji: emoji.get(name)
      })).filter(item => item.emoji && item.emoji !== `:${item.name}:`)

      setEmojiSuggestions(suggestions.slice(0, 8))
    } else {
      // Search for matching emojis
      const results = emoji.search(searchTerm)
      setEmojiSuggestions(results.slice(0, 8))
    }
    setSelectedEmojiIndex(0)
  }

  const insertSelectedEmoji = () => {
    if (emojiSuggestions.length === 0) return false

    const selection = window.getSelection()
    if (!selection.rangeCount) return false

    const range = selection.getRangeAt(0)
    const textNode = range.startContainer

    if (textNode.nodeType !== Node.TEXT_NODE) return false

    const text = textNode.textContent
    const cursorPos = range.startOffset
    const textBeforeCursor = text.substring(0, cursorPos)

    // Find the colon position
    const match = textBeforeCursor.match(/:([a-zA-Z0-9_+-]*)$/)
    if (!match) return false

    const colonPos = cursorPos - match[0].length
    const selectedEmoji = emojiSuggestions[selectedEmojiIndex]

    // Replace :search with emoji
    const beforeColon = text.substring(0, colonPos)
    const afterCursor = text.substring(cursorPos)
    textNode.textContent = beforeColon + selectedEmoji.emoji + ' ' + afterCursor

    // Move cursor after emoji
    const newRange = document.createRange()
    newRange.setStart(textNode, colonPos + selectedEmoji.emoji.length + 1)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)

    setShowEmojiPopup(false)
    setEmojiSearch('')

    return true
  }

  const handleKeyDown = (e) => {
    // Handle emoji popup navigation
    if (showEmojiPopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedEmojiIndex(prev =>
          prev < emojiSuggestions.length - 1 ? prev + 1 : prev
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedEmojiIndex(prev => prev > 0 ? prev - 1 : prev)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const inserted = insertSelectedEmoji()
        if (inserted) {
          handleInput()
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowEmojiPopup(false)
        setEmojiSearch('')
        return
      }
    }

    // Handle space for emoji conversion
    if (e.key === ' ') {
      const replaced = replaceEmojiShortcuts()
      if (replaced) {
        e.preventDefault()
        handleInput()
      }
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)

      // Check for emoji shortcode
      const shortcodeData = detectEmojiShortcode()
      if (shortcodeData) {
        setEmojiSearch(shortcodeData.search)
        updateEmojiSuggestions(shortcodeData.search)

        const coords = getCaretCoordinates()
        if (coords) {
          setPopupPosition(coords)
        }
        setShowEmojiPopup(true)
      } else {
        setShowEmojiPopup(false)
        setEmojiSearch('')
      }
    }
  }

  const handlePolishText = async () => {
    if (!editorRef.current || isPolishing) return

    // Get current HTML content
    const htmlContent = editorRef.current.innerHTML

    // Get plain text from HTML (strip tags but preserve emojis)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    if (!plainText.trim()) {
      setPolishError('Please enter some text first')
      setTimeout(() => setPolishError(null), 3000)
      return
    }

    setIsPolishing(true)
    setPolishError(null)

    try {
      const polishedPlainText = await aiService.polishText(plainText)

      // Convert line breaks to <br> tags for HTML display
      // First replace double newlines (paragraph breaks) with a placeholder
      // Then replace single newlines with <br>
      // Then convert placeholder back to double <br> for empty lines
      const polishedHtmlText = polishedPlainText
        .replace(/\n\n/g, '<<<PARAGRAPH_BREAK>>>')  // Preserve paragraph breaks
        .replace(/\n/g, '<br>')                      // Convert single line breaks
        .replace(/<<<PARAGRAPH_BREAK>>>/g, '<br><br>') // Restore paragraph breaks

      // Store both versions for comparison
      setOriginalText(htmlContent)
      setPolishedText(polishedHtmlText)

      // Show the comparison modal
      setShowPolishModal(true)
    } catch (error) {
      console.error('Error polishing text:', error)
      setPolishError(error.message || 'Failed to polish text. Please try again.')
      setTimeout(() => setPolishError(null), 5000)
    } finally {
      setIsPolishing(false)
    }
  }

  const handleAcceptPolishedText = (newText) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = newText
      onChange(newText)
    }
  }


  return (
    <div className="space-y-2 relative">
      {/* Action buttons */}
      <div className="flex justify-between items-center mb-2">
        {/* AI Polish button */}
        <button
          type="button"
          onClick={handlePolishText}
          disabled={isPolishing}
          className="text-romantic-600 hover:text-romantic-700 bg-white rounded-full px-4 py-2 shadow-lg border-2 border-romantic-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Polish text and fix grammar using AI"
        >
          {isPolishing ? (
            <>
              <span className="inline-block animate-spin">⚙️</span>
              <span>Polishing...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Polish Text</span>
            </>
          )}
        </button>

        {/* Done button for mobile/tablet */}
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-romantic-600 hover:text-romantic-700 bg-white rounded-full px-4 py-2 shadow-lg border-2 border-romantic-300 text-sm font-bold"
            title="Done"
          >
            ✓ Done
          </button>
        )}
      </div>

      {/* Error message */}
      {polishError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {polishError}
        </div>
      )}

      {/* AI Polish Comparison Modal */}
      <AIPolishModal
        open={showPolishModal}
        onClose={() => setShowPolishModal(false)}
        originalText={originalText}
        polishedText={polishedText}
        onAccept={handleAcceptPolishedText}
      />

      {/* Emoji Autocomplete Popup */}
      {showEmojiPopup && emojiSuggestions.length > 0 && (
        <div
          ref={emojiPopupRef}
          className="absolute bg-white rounded-lg shadow-xl border-2 border-romantic-300 z-50 max-h-64 overflow-y-auto"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            minWidth: '250px'
          }}
        >
          <div className="p-1">
            {emojiSuggestions.map((item, index) => (
              <div
                key={item.name}
                className={`px-3 py-2 cursor-pointer rounded flex items-center gap-3 ${
                  index === selectedEmojiIndex
                    ? 'bg-romantic-200'
                    : 'hover:bg-romantic-50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setSelectedEmojiIndex(index)
                  insertSelectedEmoji()
                  handleInput()
                }}
                onMouseEnter={() => setSelectedEmojiIndex(index)}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm text-gray-700">:{item.name}:</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-1 text-xs text-gray-500 border-t border-romantic-200 bg-romantic-50">
            ↑↓ navigate • Enter/Tab select • Esc close
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[150px] p-4 bg-white rounded-lg romantic-border focus:outline-none focus:border-romantic-500 prose max-w-none relative"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      />
    </div>
  )
}

export default RichTextEditor

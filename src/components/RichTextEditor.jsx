import { useState, useRef, useEffect } from 'react'
import * as emoji from 'node-emoji'

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const savedSelectionRef = useRef(null)

  // Emoji autocomplete state
  const [showEmojiPopup, setShowEmojiPopup] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')
  const [emojiSuggestions, setEmojiSuggestions] = useState([])
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const emojiPopupRef = useRef(null)

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

  const applyFormat = (command) => {
    document.execCommand(command, false, null)
    editorRef.current?.focus()
  }

  const handleLinkButtonClick = () => {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()

    if (selectedText) {
      // Save the selection range
      if (selection.rangeCount > 0) {
        savedSelectionRef.current = selection.getRangeAt(0)
      }
      // Pre-fill with selected text
      setLinkText(selectedText)
    } else {
      savedSelectionRef.current = null
      setLinkText('')
    }

    setShowLinkInput(!showLinkInput)
  }

  const insertLink = () => {
    if (!linkUrl) return

    const text = linkText || linkUrl
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #db2777; text-decoration: underline;">${text}</a>`

    // Restore the saved selection if we have one
    if (savedSelectionRef.current) {
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(savedSelectionRef.current)
    }

    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = linkHtml
      range.insertNode(tempDiv.firstChild)
    }

    setShowLinkInput(false)
    setLinkUrl('')
    setLinkText('')
    savedSelectionRef.current = null
    handleInput()
    editorRef.current?.focus()
  }

  return (
    <div className="space-y-2 relative">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-white/50 rounded-lg romantic-border">
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="px-3 py-1 bg-white hover:bg-romantic-100 rounded border border-romantic-300 font-bold transition-colors"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="px-3 py-1 bg-white hover:bg-romantic-100 rounded border border-romantic-300 italic transition-colors"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={handleLinkButtonClick}
          className="px-3 py-1 bg-white hover:bg-romantic-100 rounded border border-romantic-300 transition-colors"
          title="Insert Link (Select text first to turn it into a link)"
        >
          Link
        </button>
        <div className="flex-1 flex items-center justify-end">
          <span className="text-xs text-gray-500 italic" title="Type : to open emoji picker with autocomplete! Also supports shortcuts like <3 :) with SPACE">
            ✨ Type : for emoji picker or &lt;3 :) + SPACE
          </span>
        </div>
      </div>

      {/* Link Input Modal */}
      {showLinkInput && (
        <div className="p-3 bg-white rounded-lg romantic-border space-y-2">
          <input
            type="text"
            placeholder="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="w-full px-3 py-2 border border-romantic-300 rounded focus:outline-none focus:border-romantic-500"
          />
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                insertLink()
              }
            }}
            className="w-full px-3 py-2 border border-romantic-300 rounded focus:outline-none focus:border-romantic-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={insertLink}
              className="px-4 py-2 bg-romantic-500 hover:bg-romantic-600 text-white rounded transition-colors"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false)
                setLinkUrl('')
                setLinkText('')
                savedSelectionRef.current = null
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

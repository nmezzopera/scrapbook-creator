import { useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing updates
 * @param {*} value - The value to watch for changes
 * @param {function} onUpdate - Callback function to execute after debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 2000)
 * @param {*} originalValue - The original value to compare against (optional)
 */
export function useDebouncedUpdate(value, onUpdate, delay = 2000, originalValue = undefined) {
  const timeoutRef = useRef(null)

  useEffect(() => {
    // Only update if value has changed from original (if originalValue provided)
    if (originalValue !== undefined && value === originalValue) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onUpdate(value)
    }, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])
}

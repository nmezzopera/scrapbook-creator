import { useEffect } from 'react'

/**
 * Custom hook to detect clicks outside a ref element
 * @param {React.RefObject} ref - The ref to the element to detect clicks outside of
 * @param {function} onClickOutside - Callback function to execute when clicking outside
 * @param {boolean} enabled - Whether the hook is enabled (default: true)
 */
export function useClickOutside(ref, onClickOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickOutside(event)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, onClickOutside, enabled])
}

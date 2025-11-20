import { Tooltip } from '@mui/material'

/**
 * Reusable side controls component for section management
 * Displays lock, move up/down, and delete buttons on the left side of sections
 */
function SideControls({
  index,
  isLocked,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  confirmDelete = true,
  deleteMessage = 'Are you sure you want to delete this page?'
}) {
  const handleDelete = () => {
    if (confirmDelete) {
      if (window.confirm(deleteMessage)) {
        onDelete()
      }
    } else {
      onDelete()
    }
  }

  return (
    <div className="absolute -left-14 top-0 flex flex-col gap-2" data-pdf-hide>
      <span className="text-xs font-semibold text-romantic-600 text-center bg-white rounded px-2 py-1">
        {index + 1}
      </span>
      <Tooltip title={isLocked ? "Unlock to edit" : "Lock section"} placement="left">
        <button
          onClick={onToggleLock}
          className={`p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors romantic-shadow ${
            isLocked ? 'text-gray-600' : 'text-romantic-600'
          }`}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>
      </Tooltip>
      {!isLocked && (
        <>
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
            title="Move Up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-2 hover:bg-romantic-100 bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-romantic-600 romantic-shadow"
            title="Move Down"
          >
            ↓
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-100 bg-white text-red-600 rounded-lg transition-colors romantic-shadow"
            title="Delete"
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}

export default SideControls

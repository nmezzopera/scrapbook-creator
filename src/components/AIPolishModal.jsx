import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

/**
 * Modal to show original vs AI-polished text with accept/reject options
 */
function AIPolishModal({ open, onClose, originalText, polishedText, onAccept }) {
  const handleAccept = () => {
    onAccept(polishedText);
    onClose();
  };

  const handleKeepOriginal = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="bg-romantic-50 border-b-2 border-romantic-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="font-serif text-xl text-romantic-700">AI Text Polish</span>
        </div>
      </DialogTitle>

      <DialogContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Original</h3>
              <span className="text-xs text-gray-500">{originalText.length} characters</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-[200px] max-h-[400px] overflow-y-auto">
              <div
                className="prose max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: originalText }}
              />
            </div>
          </div>

          {/* Polished Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-romantic-600 uppercase tracking-wide">✨ Polished</h3>
              <span className="text-xs text-gray-500">{polishedText.length} characters</span>
            </div>
            <div className="p-4 bg-romantic-50 rounded-lg border-2 border-romantic-300 min-h-[200px] max-h-[400px] overflow-y-auto">
              <div
                className="prose max-w-none text-gray-800 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: polishedText }}
              />
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>What changed?</strong> The AI has improved grammar, spelling, punctuation, and clarity while preserving your tone and meaning.
          </p>
        </div>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-3 w-full justify-end">
          <Button
            onClick={handleKeepOriginal}
            variant="outlined"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Keep Original
          </Button>
          <Button
            onClick={handleAccept}
            variant="contained"
            className="bg-romantic-600 hover:bg-romantic-700 text-white"
            autoFocus
          >
            ✓ Use Polished Version
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}

export default AIPolishModal;

/**
 * Pure presentation component for displaying a title section
 * No logic, state, or side effects - just rendering
 */
function TitleSectionDisplay({ section }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-8 romantic-shadow romantic-border text-center" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="relative inline-block p-12">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-gray-800"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-gray-800"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-gray-800"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-gray-800"></div>

        <div className="px-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-4 leading-tight">
            {section.title || 'Your Title Here'}
          </h1>

          {/* Subtitle/Description */}
          {section.description && (
            <div
              className="text-xl md:text-2xl lg:text-3xl text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          )}
        </div>
      </div>

      {/* Bottom Text */}
      {section.subtitle && (
        <p className="text-lg md:text-xl text-gray-600 mt-8 italic">
          {section.subtitle}
        </p>
      )}
    </div>
  )
}

export default TitleSectionDisplay

import Masonry from 'react-masonry-css'

/**
 * Pure presentation component for displaying a scrapbook section
 * No logic, state, or side effects - just rendering
 */
function SectionDisplay({ section, index }) {
  const validImages = section.images || []

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-4 sm:p-6 romantic-shadow romantic-border overflow-hidden" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 uppercase tracking-wide border-b-2 border-romantic-300 pb-2 sm:pb-3 mb-4 flex-shrink-0">
        {section.title || ''}
      </h2>

      {/* Content area with text and images */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
        {/* Description */}
        <div className={`bg-romantic-50/50 p-4 rounded-lg ${!validImages.length ? 'lg:col-span-2' : ''} ${index % 2 === 1 ? 'lg:col-start-2' : ''} flex items-start`}>
          {section.description ? (
            <div
              className="prose prose-base sm:prose-lg lg:prose-xl max-w-none text-gray-700 leading-relaxed w-full"
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          ) : null}
        </div>

        {/* Images */}
        <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
          {validImages.length > 0 && (
            <Masonry
              breakpointCols={{
                default: 2,
                1024: 2,
                640: 1
              }}
              className="flex w-full gap-2"
              columnClassName="space-y-2"
            >
              {validImages.map((img, idx) => {
                const sizeVariations = ['280px', '340px', '400px']
                const maxHeight = sizeVariations[idx % 3]

                return (
                  <div key={idx} className="break-inside-avoid relative">
                    <img
                      src={img}
                      alt={`Memory ${idx + 1}`}
                      className="w-full rounded-lg shadow-md"
                      style={{
                        maxHeight: maxHeight,
                        objectFit: 'cover',
                        width: '100%',
                        display: 'block'
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                )
              })}
            </Masonry>
          )}
        </div>
      </div>
    </div>
  )
}

export default SectionDisplay

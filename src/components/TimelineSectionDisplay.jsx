/**
 * Pure presentation component for displaying a timeline section
 * No logic, state, or side effects - just rendering
 */
function TimelineSectionDisplay({ section }) {
  const events = section.events || []

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
    <div className="bg-white/80 backdrop-blur rounded-2xl p-8 md:p-12 romantic-shadow romantic-border overflow-auto" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title */}
      <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-8 md:mb-12">
        {section.title || 'Key Events'}
      </h2>

      {/* Timeline Events */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {sortedYears.map((year) => (
            <div key={year} className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 border-b-4 border-romantic-300 pb-2">
                {year}
              </h3>
              <div className="space-y-4">
                {eventsByYear[year].map((event, idx) => (
                  <div key={idx}>
                    {event.date && (
                      <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                        <strong className="text-romantic-600 text-lg md:text-xl">{event.date}</strong>{' '}
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimelineSectionDisplay

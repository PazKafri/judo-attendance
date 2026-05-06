export default function SessionHistoryScreen({ store, group, onBack, onOpenDate }) {
  const { state } = store

  const sessions = Object.keys(state.attendance)
    .filter(k => k.startsWith(group.id + '-'))
    .sort().reverse()
    .map(k => {
      const dateStr = k.replace(group.id + '-', '')
      const record = state.attendance[k] || {}
      let present = 0, absent = 0, unmarked = 0
      group.students.forEach(s => {
        if (record[s.id] === true) present++
        else if (record[s.id] === false) absent++
        else unmarked++
      })
      const date = new Date(dateStr + 'T12:00:00')
      const dateLabel = date.toLocaleDateString('he-IL', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
      return { dateStr, dateLabel, present, absent, unmarked }
    })

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="topbar-title">אימוני {group.name}</span>
      </div>

      {sessions.length === 0 ? (
        <div className="no-items">אין אימונים מתועדים עדיין.</div>
      ) : (
        <>
          <div className="section-label">{sessions.length} אימונים מתועדים</div>
          {sessions.map(({ dateStr, dateLabel, present, absent, unmarked }) => {
            const total = present + absent + unmarked
            const pct = total > 0 ? Math.round(present / (present + absent) * 100) : null
            return (
              <div
                key={dateStr}
                onClick={() => onOpenDate(dateStr)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'14px 16px', borderBottom:'1px solid #f0f0f0',
                  background:'#fff', cursor:'pointer'
                }}
              >
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600}}>{dateLabel}</div>
                  <div style={{display:'flex', gap:10, marginTop:4, fontSize:13}}>
                    <span style={{color:'#2d7a3a', fontWeight:600}}>✓ {present}</span>
                    <span style={{color:'#c5221f', fontWeight:600}}>✕ {absent}</span>
                    {unmarked > 0 && <span style={{color:'#aaa'}}>○ {unmarked}</span>}
                  </div>
                </div>
                {pct !== null && (
                  <div style={{
                    fontSize:14, fontWeight:700,
                    color: pct >= 75 ? '#2d7a3a' : pct >= 50 ? '#e67700' : '#c5221f'
                  }}>{pct}%</div>
                )}
                <span style={{color:'#ccc', fontSize:16}}>‹</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

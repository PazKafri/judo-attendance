import { useState } from 'react'

function initials(name) {
  const p = name.trim().split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function dayOfWeek(dateStr) { return new Date(dateStr).getDay() }

export default function AttendanceScreen({ store, group, onBack, initialDate }) {
  const { state, update } = store
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr())
  const [poppedId, setPoppedId] = useState(null) // ANIMATION 2
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  const dayIndex = dayOfWeek(selectedDate)
  const groupDays = (group.schedule || []).map(x => x.day)

  const relevantStudents = group.students.filter(s => {
    if (s.inactive) return false
    if (s.startDate && selectedDate < s.startDate) return false
    if (s.endDate && selectedDate > s.endDate) return false
    const studentDays = s.days == null ? groupDays : s.days
    return studentDays.includes(dayIndex)
  })

  const existing = state.attendance[group.id+'-'+selectedDate] || {}
  const [marks, setMarks] = useState(() => {
    const m = {}
    relevantStudents.forEach(s => m[s.id] = existing[s.id] ?? null)
    return m
  })

  function handleDateChange(newDate) {
    setSelectedDate(newDate)
    const ex = state.attendance[group.id+'-'+newDate] || {}
    const newDayIndex = dayOfWeek(newDate)
    const newRelevant = group.students.filter(s => {
      if (s.inactive) return false
      if (s.startDate && newDate < s.startDate) return false
      if (s.endDate && newDate > s.endDate) return false
      const studentDays = s.days == null ? groupDays : s.days
      return studentDays.includes(newDayIndex)
    })
    const m = {}
    newRelevant.forEach(s => m[s.id] = ex[s.id] ?? null)
    setMarks(m)
  }

  function toggle(sid, val) {
    setMarks(m => ({ ...m, [sid]: m[sid] === val ? null : val }))
    setPoppedId(sid + '-' + val) // ANIMATION 2
  }

  function markAll() {
    const all = {}
    relevantStudents.forEach(s => all[s.id] = true)
    setMarks(all)
  }

  function clearAll() {
    const cleared = {}
    relevantStudents.forEach(s => cleared[s.id] = null)
    setMarks(cleared)
  }

  function save() {
    update(s => { s.attendance[group.id+'-'+selectedDate] = { ...marks } })
    onBack()
  }

  const hasChanges = relevantStudents.some(s => marks[s.id] !== (existing[s.id] ?? null))

  function handleBack() {
    if (hasChanges) setShowBackConfirm(true)
    else onBack()
  }

  const dateLabel = new Date(selectedDate + 'T12:00:00')
    .toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const isToday = selectedDate === todayStr()

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={handleBack}>←</button>
        <span className="topbar-title">נוכחות — {group.name}</span>
      </div>

      {showBackConfirm && (
        <div className="confirm-box" style={{margin:'8px 16px'}}>
          <p>יש שינויים שלא נשמרו</p>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <button
              className="btn-confirm"
              style={{padding:'10px', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit'}}
              onClick={save}
            >שמור וצא</button>
            <div className="form-btns">
              <button onClick={() => setShowBackConfirm(false)}>המשך עריכה</button>
              <button className="btn-del" onClick={onBack}>צא בלי לשמור</button>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:'12px 16px', borderBottom:'1px solid #f0f0f0', background:'#fafafa'}}>
        <div style={{fontSize:12, color:'#888', marginBottom:6}}>תאריך אימון:</div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={e => handleDateChange(e.target.value)}
            style={{
              padding:'8px 12px', borderRadius:10, border:'1px solid #e0e0e0',
              fontSize:14, fontFamily:'inherit', background:'#fff', flex:1
            }}
          />
          {!isToday && (
            <button
              onClick={() => handleDateChange(todayStr())}
              style={{
                padding:'8px 12px', borderRadius:10, border:'1px solid #e0e0e0',
                background:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit',
                color:'#1a73e8', whiteSpace:'nowrap'
              }}
            >
              היום
            </button>
          )}
        </div>
        <div style={{fontSize:13, color:'#555', marginTop:6}}>{dateLabel}</div>
        {!groupDays.includes(dayIndex) && groupDays.length > 0 && (
          <div style={{fontSize:12, color:'#e67700', marginTop:4}}>
            ⚠️ הקבוצה לא מתאמנת ביום זה בדרך כלל
          </div>
        )}
      </div>

      <div style={{display:'flex', alignItems:'center', gap:8, padding:'0 16px', borderBottom:'1px solid #f0f0f0', background:'#fafafa'}}>
        <div style={{flex:1, fontSize:12, color:'#aaa', padding:'10px 0 6px'}}>
          {relevantStudents.length} תלמידים
        </div>
        <button
          onClick={markAll}
          style={{
            padding:'5px 12px', borderRadius:20, border:'1px solid #34a853',
            background:'#e6f4ea', color:'#2d7a3a', fontSize:12,
            fontWeight:600, cursor:'pointer', fontFamily:'inherit'
          }}
        >✓ סמן כולם נוכחים</button>
        <button
          onClick={clearAll}
          style={{
            padding:'5px 12px', borderRadius:20, border:'1px solid #f5c6c2',
            background:'#fce8e6', color:'#c5221f', fontSize:12,
            fontWeight:500, cursor:'pointer', fontFamily:'inherit'
          }}
        >✕ נקה הכל</button>
      </div>

      {relevantStudents.length === 0 ? (
        <div className="no-items">אין תלמידים לקבוצה זו ביום זה.</div>
      ) : (
        relevantStudents.map(s => (
          <div key={s.id} className="student-row">
            <div className="student-avatar">{initials(s.name)}</div>
            <div className="student-name" style={{flex:1}}>{s.name}</div>
            <button
              className={`tick-btn${marks[s.id]===false?' absent':''}${poppedId===s.id+'-false'?' tick-pop':''}`}
              onClick={() => toggle(s.id, false)}
              onAnimationEnd={() => setPoppedId(null)}
            >✕</button>
            <button
              className={`tick-btn${marks[s.id]===true?' present':''}${poppedId===s.id+'-true'?' tick-pop':''}`}
              style={{marginRight:6}}
              onClick={() => toggle(s.id, true)}
              onAnimationEnd={() => setPoppedId(null)}
            >✓</button>
          </div>
        ))
      )}

      {relevantStudents.length > 0 && (() => {
        const presentCount = relevantStudents.filter(s => marks[s.id] === true).length
        const absentCount  = relevantStudents.filter(s => marks[s.id] === false).length
        const unmarked     = relevantStudents.length - presentCount - absentCount
        return (
          <div style={{
            display:'flex', gap:0, borderTop:'1px solid #f0f0f0',
            background:'#fafafa', fontSize:13
          }}>
            <div style={{flex:1, textAlign:'center', padding:'10px 0', color:'#2d7a3a', fontWeight:600, borderLeft:'1px solid #f0f0f0'}}>
              ✓ {presentCount} נוכחים
            </div>
            <div style={{flex:1, textAlign:'center', padding:'10px 0', color:'#c5221f', fontWeight:600, borderLeft:'1px solid #f0f0f0'}}>
              ✕ {absentCount} נעדרים
            </div>
            <div style={{flex:1, textAlign:'center', padding:'10px 0', color:'#aaa', fontWeight:500}}>
              ○ {unmarked} לא סומנו
            </div>
          </div>
        )
      })()}

      <div className="save-bar">
        <button className="save-btn" onClick={save}>שמור נוכחות</button>
      </div>
    </div>
  )
}
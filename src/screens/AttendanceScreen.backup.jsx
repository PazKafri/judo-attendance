import { useState } from 'react'

function initials(name) {
  const p = name.trim().split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function AttendanceScreen({ store, group, onBack }) {
  const { state, update } = store
  const existing = state.attendance[group.id+'-'+todayStr()] || {}
  const [marks, setMarks] = useState(() => {
    const m = {}
    group.students.forEach(s => m[s.id] = existing[s.id] ?? null)
    return m
  })

  function toggle(sid, val) {
    setMarks(m => ({ ...m, [sid]: m[sid] === val ? null : val }))
  }

  function save() {
    update(s => { s.attendance[group.id+'-'+todayStr()] = { ...marks } })
    onBack()
  }

  const d = new Date()
  const dateStr = d.toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="topbar-title">נוכחות — {group.name}</span>
      </div>
      <div className="section-label">{dateStr}</div>

      {group.students.length === 0 ? (
        <div className="no-items">אין תלמידים בקבוצה.</div>
      ) : (
        group.students.map(s => (
          <div key={s.id} className="student-row">
            <div className="student-avatar">{initials(s.name)}</div>
            <div className="student-name" style={{flex:1}}>{s.name}</div>
            <button className={`tick-btn${marks[s.id]===false?' absent':''}`} onClick={() => toggle(s.id, false)}>✕</button>
            <button className={`tick-btn${marks[s.id]===true?' present':''}`} style={{marginRight:6}} onClick={() => toggle(s.id, true)}>✓</button>
          </div>
        ))
      )}

      <div className="save-bar">
        <button className="save-btn" onClick={save}>שמור נוכחות</button>
      </div>
    </div>
  )
}
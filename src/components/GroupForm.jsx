import { useState } from 'react'

const DAYS_FULL = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

export default function GroupForm({ onConfirm, onCancel, initialName='', initialSchedule=[], confirmLabel='הוסף' }) {
  const [name, setName] = useState(initialName)
  const [schedule, setSchedule] = useState(
    initialSchedule.length ? [...initialSchedule] : []
  )

  function toggleDay(i) {
    setSchedule(s => {
      const exists = s.find(x => x.day === i)
      if (exists) return s.filter(x => x.day !== i)
      return [...s, { day: i, time: '17:00' }].sort((a,b) => a.day - b.day)
    })
  }

  function setTime(day, field, val) {
    setSchedule(s => s.map(x => {
      if (x.day !== day) return x
      const parts = x.time.split(':')
      if (field === 'hour') parts[0] = String(Math.max(0, Math.min(23, parseInt(val)||0))).padStart(2,'0')
      if (field === 'minute') parts[1] = String(Math.max(0, Math.min(59, parseInt(val)||0))).padStart(2,'0')
      return { ...x, time: parts.join(':') }
    }))
  }

  function confirm() {
    if (!name.trim()) return
    onConfirm(name.trim(), schedule)
  }

  const numStyle = {
    width: 58, textAlign: 'center', fontSize: 15, fontWeight: 600,
    borderRadius: 8, border: '1px solid #e0e0e0', padding: '7px 4px', fontFamily: 'inherit'
  }

  return (
    <div className="inline-form">
      <input
        placeholder="שם הקבוצה"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />

      <div className="form-label">ימי אימון ושעות:</div>
      <div className="days-grid" style={{marginBottom: schedule.length ? 10 : 14}}>
        {DAYS_FULL.map((d, i) => (
          <button
            key={i}
            className={`day-chip${schedule.find(x=>x.day===i) ? ' selected' : ''}`}
            onClick={() => toggleDay(i)}
          >
            {d}
          </button>
        ))}
      </div>

      {schedule.map(({ day, time }) => {
        const parts = time.split(':')
        return (
          <div key={day} style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:'#fff', borderRadius:8, border:'1px solid #e0e0e0'}}>
            <span style={{flex:1, fontSize:14, fontWeight:500}}>{DAYS_FULL[day]}</span>
            <div style={{display:'flex', alignItems:'center', gap:6, direction:'ltr'}}>
              <input
                type="number" min="0" max="23"
                value={parseInt(parts[0])}
                onChange={e => setTime(day, 'hour', e.target.value)}
                style={numStyle}
              />
              <span style={{fontSize:16, fontWeight:600, color:'#555'}}>:</span>
              <input
                type="number" min="0" max="59" step="5"
                value={parseInt(parts[1])}
                onChange={e => setTime(day, 'minute', e.target.value)}
                style={numStyle}
              />
            </div>
          </div>
        )
      })}

      <div className="form-btns" style={{marginTop: schedule.length ? 4 : 0}}>
        <button onClick={onCancel}>ביטול</button>
        <button className="btn-confirm" onClick={confirm}>{confirmLabel}</button>
      </div>
    </div>
  )
}
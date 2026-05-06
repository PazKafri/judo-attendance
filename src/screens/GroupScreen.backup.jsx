import { useState } from 'react'
import GroupForm from '../components/GroupForm'

function consecutiveAbsences(state, gid, sid) {
  const keys = Object.keys(state.attendance).filter(k => k.startsWith(gid+'-')).sort().reverse()
  let streak = 0
  for (const k of keys) {
    const r = state.attendance[k]
    if (!r) break
    if (r[sid] === false) streak++
    else if (r[sid] === true) break
  }
  return streak
}

function initials(name) {
  const p = name.trim().split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

export default function GroupScreen({ store, group, onBack, onAttendance, onStats }) {
  const { state, update } = store
  const [showEdit, setShowEdit] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function saveEdit(name, schedule) {
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      g.name = name
      g.schedule = schedule
      g.location = name.split(/[—\-–]/)[0].trim()
    })
    setShowEdit(false)
  }

 function addStudent() {
    const names = newStudentName
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)
    if (!names.length) return
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      names.forEach(name => g.students.push({ id: Date.now() + Math.random(), name }))
    })
    setNewStudentName('')
    setShowAddStudent(false)
  }

  function deleteStudent(sid) {
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      g.students = g.students.filter(s => s.id !== sid)
    })
    setConfirmDeleteId(null)
  }

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="topbar-title">{group.name}</span>
        <button className="topbar-btn" onClick={() => { setShowEdit(v=>!v); setShowAddStudent(false) }}>✏️</button>
        <button className="topbar-btn" onClick={() => { setShowAddStudent(v=>!v); setShowEdit(false) }}>+</button>
      </div>

      {showEdit && (
        <GroupForm
          initialName={group.name}
          initialSchedule={group.schedule || []}
          confirmLabel="שמור"
          onConfirm={saveEdit}
          onCancel={() => setShowEdit(false)}
        />
      )}

     {showAddStudent && (
        <div className="inline-form">
          <div className="form-label">הקלידי שם אחד בכל שורה:</div>
          <textarea
            placeholder={'יובל כהן\nליאור לוי\nמיה ברקוביץ׳'}
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            autoFocus
            rows={6}
            style={{
              width:'100%', padding:'10px 12px', borderRadius:10,
              border:'1px solid #e0e0e0', fontSize:15, fontFamily:'inherit',
              resize:'vertical', marginBottom:10
            }}
          />
          <div className="form-btns">
            <button onClick={() => { setShowAddStudent(false); setNewStudentName('') }}>ביטול</button>
            <button className="btn-confirm" onClick={addStudent}>הוסף</button>
          </div>
        </div>
      )}

      <div className="group-actions">
        <button onClick={onAttendance}>סמן נוכחות</button>
        <button onClick={onStats}>סטטיסטיקות</button>
      </div>

      {group.students.length === 0 ? (
        <div className="no-items">אין תלמידים עדיין.<br/>לחצי + להוסיף.</div>
      ) : (
        <>
          <div className="section-label">תלמידים</div>
          {group.students.map(s => {
            const streak = consecutiveAbsences(state, group.id, s.id)
            return (
              <div key={s.id}>
                <div className="student-row">
                  <div className="student-avatar">{initials(s.name)}</div>
                  <div style={{flex:1}}>
                    <div className="student-name">{s.name}</div>
                    {streak >= 2 && <div className="student-streak">⚠️ {streak} פעמים ברצף לא הגיע/ה</div>}
                  </div>
                  <button className="icon-btn" style={{color:'#ea4335'}} onClick={() => setConfirmDeleteId(confirmDeleteId === s.id ? null : s.id)}>✕</button>
                </div>
                {confirmDeleteId === s.id && (
                  <div className="confirm-box">
                    <p>להסיר את {s.name}?</p>
                    <div className="form-btns">
                      <button onClick={() => setConfirmDeleteId(null)}>ביטול</button>
                      <button className="btn-del" onClick={() => deleteStudent(s.id)}>הסר</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
import { useState, useRef } from 'react'
import GroupForm from '../components/GroupForm'
import { consecutiveAbsences } from '../useStore'

const DAYS_FULL = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

function todayStr() { return new Date().toISOString().split('T')[0] }
function todayDay() { return new Date().getDay() }

function lastSessionLabel(attendanceKeys, groupId) {
  const keys = attendanceKeys
    .filter(k => k.startsWith(groupId + '-'))
    .sort().reverse()
  if (!keys.length) return null
  const dateStr = keys[0].replace(groupId + '-', '')
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'אימון אחרון: היום'
  if (diff === 1) return 'אימון אחרון: אתמול'
  return `אימון אחרון: לפני ${diff} ימים`
}

export default function HomeScreen({ store, onOpenGroup, onQuickAttendance }) {
  const { state, update, importState, COLORS } = store
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)
  const today = todayDay()
  const nowMin = new Date().getHours()*60 + new Date().getMinutes()

  const byLoc = {}
  state.groups.forEach(g => {
    if (!byLoc[g.location]) byLoc[g.location] = []
    byLoc[g.location].push(g)
  })

  function addGroup(name, schedule) {
    const loc = name.split(/[—\-–]/)[0].trim()
    update(s => {
      s.groups.push({
        id: Date.now(), name, location: loc, schedule,
        color: COLORS[s.groups.length % COLORS.length], students: []
      })
    })
    setShowAddForm(false)
  }

  function deleteGroup(id) {
    update(s => { s.groups = s.groups.filter(g => g.id !== id) })
    setConfirmDeleteId(null)
  }

  function exportData() {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `judo-backup-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result)
        if (!data.groups || !data.attendance) throw new Error()
        importState(data)
        setImportError(null)
      } catch {
        setImportError('הקובץ אינו תקין')
        setTimeout(() => setImportError(null), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">הקבוצות שלי</span>
        <button className="topbar-btn" title="ייבא גיבוי" onClick={() => fileInputRef.current.click()}>📂</button>
        <button className="topbar-btn" title="ייצא גיבוי" onClick={exportData}>💾</button>
        <button className="topbar-btn" onClick={() => setShowAddForm(v => !v)}>+</button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{display:'none'}}
        onChange={handleImportFile}
      />

      {importError && (
        <div style={{margin:'8px 16px', padding:'10px 14px', borderRadius:10, background:'#fce8e6', color:'#c5221f', fontSize:13}}>
          ⚠️ {importError}
        </div>
      )}

      {showAddForm && (
        <GroupForm
          onConfirm={addGroup}
          onCancel={() => setShowAddForm(false)}
          confirmLabel="הוסף"
        />
      )}

      {state.groups.map(gr => {
        const todaySchedule = (gr.schedule || []).find(x => x.day === today)
        if (!todaySchedule) return null
        const [h,m] = todaySchedule.time.split(':').map(Number)
        const diff = (h*60+m) - nowMin
        if (diff >= 0 && diff <= 30)
          return <div key={gr.id} className="notif-banner">⏰ אימון {gr.name} בעוד {diff} דקות ({todaySchedule.time})</div>
        return null
      })}

      {state.groups.length === 0 && (
        <div className="no-items">אין קבוצות עדיין.<br/>לחצי + להוסיף.</div>
      )}

      {(() => {
        let cardIndex = 0
        return Object.entries(byLoc).map(([loc, groups]) => (
        <div key={loc}>
          <div className="location-header">{loc}</div>
          {groups.map(gr => {
            const delay = cardIndex++ * 45
            const schedule = gr.schedule || []
            const todayEntry = schedule.find(x => x.day === today)
            const daysText = schedule.length
              ? schedule.map(x => `${DAYS_FULL[x.day]} ${x.time}`).join(', ')
              : 'ימים לא הוגדרו'
            const todayRecord = state.attendance[gr.id+'-'+todayStr()] || {}
            const groupDaysList = schedule.map(x => x.day)
            const relevantToday = todayEntry ? gr.students.filter(s => {
              if (s.inactive) return false
              const sDays = s.days == null ? groupDaysList : s.days
              return sDays.includes(today)
            }) : []
            const allMarked = relevantToday.length > 0 &&
              relevantToday.every(s => todayRecord[s.id] === true || todayRecord[s.id] === false)
            const alerts = gr.students.filter(s => !s.messageSent && consecutiveAbsences(state, gr.id, s.id) >= 3).length
            const lastSession = lastSessionLabel(Object.keys(state.attendance), gr.id)
            const currentMonth = new Date().toISOString().slice(0, 7)
            const groupHasPayments = gr.students.some(s => s.payments && s.payments[currentMonth])
            const unpaidCount = groupHasPayments
              ? gr.students.filter(s => !s.inactive && !(s.payments && s.payments[currentMonth])).length
              : 0

            let badge = null
            if (todayEntry) {
              badge = allMarked
                ? <span className="badge badge-done">✓ סומן</span>
                : <button
                    className="badge badge-today-btn"
                    onClick={e => { e.stopPropagation(); onQuickAttendance(gr.id) }}
                  >אימון היום</button>
            } else if (schedule.length) {
              const next = schedule.find(x => x.day > today) ?? schedule[0]
              badge = <span className="badge badge-next">{DAYS_FULL[next.day]}</span>
            }

            return (
              <div key={gr.id} className="group-row-wrap" style={{animationDelay:`${delay}ms`}}>
                <div className="group-card" onClick={() => onOpenGroup(gr.id)}>
                  <div className="group-dot" style={{background: gr.color}} />
                  <div style={{flex:1}}>
                    <div className="group-name">{gr.name}</div>
                    <div className="group-meta">{daysText} | {gr.students.length} תלמידים</div>
                    {lastSession && (
                      <div style={{fontSize:11, color:'#aaa', marginTop:2}}>{lastSession}</div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    {unpaidCount > 0 && <span className="badge badge-unpaid">₪ {unpaidCount}</span>}
                    {alerts > 0 && <span className="badge badge-alert">{alerts} ⚠️</span>}
                    {badge}
                    <button
                      className="del-side"
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === gr.id ? null : gr.id) }}
                    >🗑</button>
                  </div>
                </div>
                {confirmDeleteId === gr.id && (
                  <div className="confirm-box">
                    <p>למחוק את "{gr.name}"?</p>
                    <div className="form-btns">
                      <button onClick={() => setConfirmDeleteId(null)}>ביטול</button>
                      <button className="btn-del" onClick={() => deleteGroup(gr.id)}>מחק</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))
    })()}
    </div>
  )
}
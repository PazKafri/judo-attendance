import { useState } from 'react'
import GroupForm from '../components/GroupForm'
import { consecutiveAbsences } from '../useStore'

const DAYS_FULL = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

function initials(name) {
  const p = name.trim().split(' ')
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase()
}

export default function GroupScreen({ store, group, onBack, onAttendance, onStudentHistory, onSessionHistory }) {
  const { state, update } = store
  const [showEdit, setShowEdit] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [editDaysId, setEditDaysId] = useState(null)
  const [editDatesId, setEditDatesId] = useState(null)
  const [editParentId, setEditParentId] = useState(null)
  const [editNotesId, setEditNotesId] = useState(null)
  const [expandedActionsId, setExpandedActionsId] = useState(null)
  const [editNameId, setEditNameId] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [search, setSearch] = useState('')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthLabel = new Date().toLocaleDateString('he-IL', { month: 'long' })

  const groupDays = (group.schedule || []).map(x => x.day)
  const groupHasPayments = group.students.some(s => s.payments && s.payments[currentMonth])

  function closeAllPanels() {
    setEditDaysId(null)
    setEditDatesId(null)
    setEditParentId(null)
    setEditNotesId(null)
    setExpandedActionsId(null)
    setEditNameId(null)
    setConfirmDeleteId(null)
  }

  function togglePayment(sid) {
    update(st => {
      const student = st.groups.find(g => g.id === group.id).students.find(x => x.id === sid)
      if (!student.payments) student.payments = {}
      if (student.payments[currentMonth]) delete student.payments[currentMonth]
      else student.payments[currentMonth] = true
    })
  }

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
    const names = newStudentName.split('\n').map(n => n.trim()).filter(n => n.length > 0)
    if (!names.length) return
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      names.forEach(name => g.students.push({
        id: Date.now() + Math.random(), name, days: null, gender: 'male',
        parentName: '', parentType: null, parentPhone: ''
      }))
    })
    setNewStudentName('')
    setShowAddStudent(false)
  }

  function saveStudentName(sid) {
    const trimmed = editNameValue.trim()
    if (trimmed) {
      update(s => {
        const student = s.groups.find(g => g.id === group.id).students.find(x => x.id === sid)
        student.name = trimmed
      })
    }
    setEditNameId(null)
  }

  function deleteStudent(sid) {
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      g.students = g.students.filter(s => s.id !== sid)
    })
    setConfirmDeleteId(null)
  }

  function toggleStudentDay(sid, day) {
    update(s => {
      const g = s.groups.find(g => g.id === group.id)
      const student = g.students.find(x => x.id === sid)
      if (student.days === null) student.days = [...groupDays]
      if (student.days.includes(day)) student.days = student.days.filter(d => d !== day)
      else student.days = [...student.days, day].sort()
    })
  }

  function updateParent(sid, field, value) {
    update(s => {
      const student = s.groups.find(g => g.id === group.id).students.find(x => x.id === sid)
      student[field] = value
    })
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
        <button onClick={onSessionHistory}>היסטוריית אימונים</button>
      </div>

      {group.students.length === 0 ? (
        <div className="no-items">אין תלמידים עדיין.<br/>לחצי + להוסיף.</div>
      ) : (
        <>
          <div className="section-label" style={{display:'flex', alignItems:'center', gap:8, paddingLeft:16}}>
            <span style={{flex:1}}>תלמידים</span>
            {group.students.length > 4 && (
              <input
                type="search"
                placeholder="חיפוש..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding:'4px 10px', borderRadius:20, border:'1px solid #e0e0e0',
                  fontSize:13, fontFamily:'inherit', width:110, background:'#fff', outline:'none'
                }}
              />
            )}
          </div>

          {group.students.filter(s => !search || s.name.includes(search)).map((s, index) => {
            const streak = consecutiveAbsences(state, group.id, s.id)
            const studentDays = s.days == null ? groupDays : s.days
            const isEditingName = editNameId === s.id
            const hasParent = s.parentPhone || s.parentName
            const isPaid = !!(s.payments && s.payments[currentMonth])

            return (
              <div key={s.id}>

                {/* ── main row ── */}
                <div className="student-row student-row-animated" style={{animationDelay:`${index*40}ms`}}>
                  <div className="student-avatar">{initials(s.name)}</div>

                  {/* name / inline edit */}
                  {isEditingName ? (
                    <div style={{flex:1, display:'flex', gap:6, alignItems:'center'}}>
                      <input
                        autoFocus
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveStudentName(s.id); if (e.key === 'Escape') setEditNameId(null) }}
                        style={{
                          flex:1, padding:'6px 10px', borderRadius:8,
                          border:'1px solid #1a73e8', fontSize:14, fontFamily:'inherit'
                        }}
                      />
                      <button className="icon-btn" style={{color:'#34a853'}} onClick={() => saveStudentName(s.id)}>✓</button>
                      <button className="icon-btn" style={{color:'#888'}} onClick={() => setEditNameId(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{flex:1, cursor:'pointer'}} onClick={() => onStudentHistory(s.id)}>
                      <div style={{display:'flex', alignItems:'center', gap:6}}>
                        <span className="student-name" style={{color:'#1a73e8'}}>{s.name}</span>
                      </div>
                      {streak >= 2 && <div className="student-streak">⚠️ {streak} פעמים ברצף לא הגיע/ה</div>}
                      {s.days != null && s.days.length < groupDays.length && (
                        <div style={{fontSize:12, color:'#1a73e8', marginTop:2}}>
                          {s.days.map(d => DAYS_FULL[d]).join(', ')} בלבד
                        </div>
                      )}
                      {(groupHasPayments || s.notes?.trim()) && (
                        <div style={{display:'flex', gap:8, marginTop:3, flexWrap:'wrap'}}>
                          {groupHasPayments && (
                            <span
                              onClick={e => { e.stopPropagation(); togglePayment(s.id) }}
                              style={{
                                fontSize:11, cursor:'pointer', padding:'1px 7px', borderRadius:20,
                                background: isPaid ? '#e6f4ea' : '#f5f5f5',
                                color: isPaid ? '#2d7a3a' : '#aaa',
                                border: '1px solid ' + (isPaid ? '#c3e6cb' : '#e0e0e0')
                              }}
                            >{isPaid ? `✓ שילם ${monthLabel}` : `₪ לא שילם`}</span>
                          )}
                          {s.notes?.trim() && (
                            <span style={{fontSize:11, color:'#f4a03a'}}>📝</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* action buttons — hidden while editing name */}
                  {!isEditingName && (
                    <>
                      {/* parent */}
                      <button
                        style={{
                          background: hasParent ? '#e6f4ea' : '#fce8e6',
                          border: '1px solid ' + (hasParent ? '#c3e6cb' : '#f5c6c2'),
                          borderRadius: 20, padding: '3px 9px', cursor: 'pointer',
                          fontSize: 15, lineHeight: 1, flexShrink: 0
                        }}
                        onClick={() => { setExpandedActionsId(null); setEditParentId(editParentId === s.id ? null : s.id) }}
                        title="פרטי הורה"
                      >📞</button>

                      {/* expand secondary actions */}
                      <button
                        className="icon-btn"
                        style={{color: expandedActionsId === s.id ? '#1a73e8' : '#bbb', fontSize:20, paddingBottom:4}}
                        onClick={() => {
                          if (expandedActionsId === s.id) {
                            setExpandedActionsId(null)
                            setEditNotesId(null); setEditDatesId(null); setEditDaysId(null)
                          } else {
                            setEditParentId(null)
                            setExpandedActionsId(s.id)
                          }
                        }}
                      >⋯</button>

                      {/* delete */}
                      <button
                        className="icon-btn"
                        style={{color:'#ea4335'}}
                        onClick={() => setConfirmDeleteId(confirmDeleteId === s.id ? null : s.id)}
                      >✕</button>
                    </>
                  )}
                </div>

                {/* ── expanded actions strip ── */}
                {expandedActionsId === s.id && !isEditingName && (
                  <div style={{
                    display:'flex', gap:6, padding:'8px 12px',
                    background:'#f8f8f8', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap'
                  }}>
                    <button
                      onClick={() => { setEditNotesId(null); setEditDatesId(null); setEditDaysId(null); setEditNameId(s.id); setEditNameValue(s.name) }}
                      style={{padding:'5px 11px', borderRadius:20, fontSize:12, border:'1px solid #e0e0e0', background:'#fff', cursor:'pointer', fontFamily:'inherit', color:'#555'}}
                    >✏️ שם</button>

                    <button
                      onClick={() => update(st => {
                        const student = st.groups.find(g => g.id === group.id).students.find(x => x.id === s.id)
                        student.gender = student.gender === 'female' ? 'male' : 'female'
                      })}
                      style={{
                        padding:'5px 11px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600,
                        border:'1px solid ' + (s.gender === 'female' ? '#f48fb1' : '#90caf9'),
                        background: s.gender === 'female' ? '#fce8f3' : '#e8f0fe',
                        color: s.gender === 'female' ? '#c2185b' : '#1565c0'
                      }}
                    >{s.gender === 'female' ? 'בת' : 'בן'}</button>

                    <button
                      onClick={() => togglePayment(s.id)}
                      style={{
                        padding:'5px 11px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600,
                        border:'1px solid ' + (isPaid ? '#c3e6cb' : '#e0e0e0'),
                        background: isPaid ? '#e6f4ea' : '#fff',
                        color: isPaid ? '#2d7a3a' : '#555'
                      }}
                    >{isPaid ? '✓ שילם' : '₪ שילם?'}</button>

                    <button
                      onClick={() => { setEditDatesId(null); setEditDaysId(null); setEditNotesId(editNotesId === s.id ? null : s.id) }}
                      style={{
                        padding:'5px 11px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                        border:'1px solid ' + (s.notes?.trim() ? '#f4a03a' : '#e0e0e0'),
                        background: s.notes?.trim() ? '#fff9f0' : '#fff',
                        color: s.notes?.trim() ? '#f4a03a' : '#555'
                      }}
                    >📝 הערה</button>

                    <button
                      onClick={() => { setEditNotesId(null); setEditDaysId(null); setEditDatesId(editDatesId === s.id ? null : s.id) }}
                      style={{
                        padding:'5px 11px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                        border:'1px solid ' + (s.inactive ? '#f5c6c2' : '#e0e0e0'),
                        background: s.inactive ? '#fce8e6' : '#fff',
                        color: s.inactive ? '#c5221f' : '#555'
                      }}
                    >🗓 תאריכים</button>

                    <button
                      onClick={() => { setEditNotesId(null); setEditDatesId(null); setEditDaysId(editDaysId === s.id ? null : s.id) }}
                      style={{
                        padding:'5px 11px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                        border:'1px solid ' + (s.days != null ? '#1a73e8' : '#e0e0e0'),
                        background: s.days != null ? '#e8f0fe' : '#fff',
                        color: s.days != null ? '#1a73e8' : '#555'
                      }}
                    >📅 ימים</button>
                  </div>
                )}

                {/* ── parent panel ── */}
                {editParentId === s.id && (
                  <div style={{padding:'12px 16px', background:'#f0f8ff', borderBottom:'1px solid #e0e0e0'}}>
                    <div style={{fontSize:12, color:'#555', marginBottom:10, fontWeight:600}}>פרטי הורה — {s.name}</div>

                    {/* parent type */}
                    <div style={{display:'flex', gap:8, marginBottom:10}}>
                      {['mother','father'].map(type => {
                        const label = type === 'mother' ? 'אמא' : 'אבא'
                        const active = s.parentType === type
                        return (
                          <button
                            key={type}
                            onClick={() => updateParent(s.id, 'parentType', active ? null : type)}
                            style={{
                              flex:1, padding:'7px', borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                              fontSize:14, fontWeight:600,
                              border: '1px solid ' + (active ? '#1a73e8' : '#e0e0e0'),
                              background: active ? '#e8f0fe' : '#fff',
                              color: active ? '#1a73e8' : '#888'
                            }}
                          >{label}</button>
                        )
                      })}
                    </div>

                    {/* parent name */}
                    <input
                      type="text"
                      placeholder={s.parentType === 'mother' ? 'שם האמא' : s.parentType === 'father' ? 'שם האבא' : 'שם ההורה'}
                      value={s.parentName || ''}
                      onChange={e => updateParent(s.id, 'parentName', e.target.value)}
                      style={{
                        width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e0e0e0',
                        fontSize:14, fontFamily:'inherit', marginBottom:8, background:'#fff'
                      }}
                    />

                    {/* phone */}
                    <input
                      type="tel"
                      placeholder="מספר טלפון"
                      value={s.parentPhone || ''}
                      onChange={e => updateParent(s.id, 'parentPhone', e.target.value)}
                      style={{
                        width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e0e0e0',
                        fontSize:14, fontFamily:'inherit', background:'#fff', direction:'ltr', textAlign:'right',
                        marginBottom:10
                      }}
                    />

                    {/* payment */}
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
                      <span style={{fontSize:13, color:'#555'}}>₪ תשלום {monthLabel}:</span>
                      <button
                        onClick={() => togglePayment(s.id)}
                        style={{
                          padding:'6px 16px', borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                          fontSize:13, fontWeight:600,
                          border: '1px solid ' + (isPaid ? '#34a853' : '#e0e0e0'),
                          background: isPaid ? '#e6f4ea' : '#fff',
                          color: isPaid ? '#2d7a3a' : '#888'
                        }}
                      >{isPaid ? '✓ שילם' : 'לא שילם'}</button>
                    </div>

                    <button
                      onClick={() => setEditParentId(null)}
                      style={{
                        width:'100%', padding:'8px 14px', borderRadius:10, background:'#1a1a1a',
                        color:'#fff', fontSize:13, fontWeight:600,
                        border:'none', cursor:'pointer', fontFamily:'inherit'
                      }}
                    >שמור ✓</button>
                  </div>
                )}

                {/* ── notes panel ── */}
                {editNotesId === s.id && (
                  <div style={{padding:'12px 16px', background:'#fffdf0', borderBottom:'1px solid #f0e68c'}}>
                    <div style={{fontSize:12, color:'#888', marginBottom:8}}>הערות — {s.name}:</div>
                    <textarea
                      autoFocus
                      value={s.notes || ''}
                      onChange={e => update(st => {
                        const student = st.groups.find(g => g.id === group.id).students.find(x => x.id === s.id)
                        student.notes = e.target.value
                      })}
                      placeholder="פציעה, חופשה, מידע חשוב..."
                      rows={3}
                      style={{
                        width:'100%', padding:'8px 12px', borderRadius:10,
                        border:'1px solid #e0e0e0', fontSize:14, fontFamily:'inherit',
                        resize:'vertical', background:'#fff', lineHeight:1.5
                      }}
                    />
                    <button
                      onClick={() => setEditNotesId(null)}
                      style={{
                        marginTop:8, padding:'7px 20px', borderRadius:10,
                        background:'#1a1a1a', color:'#fff', fontSize:13,
                        border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600
                      }}
                    >שמור ✓</button>
                  </div>
                )}

                {/* ── dates panel ── */}
                {editDatesId === s.id && (
                  <div style={{padding:'12px 16px', background:'#f8f8f8', borderBottom:'1px solid #f0f0f0'}}>
                    <div style={{fontSize:12, color:'#888', marginBottom:10}}>תאריכי פעילות — {s.name}:</div>
                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{fontSize:13, color:'#555', width:70}}>התחלה:</span>
                        <input
                          type="date"
                          value={s.startDate || ''}
                          onChange={e => update(st => {
                            st.groups.find(g => g.id === group.id).students.find(x => x.id === s.id).startDate = e.target.value
                          })}
                          style={{flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid #e0e0e0', fontSize:13, fontFamily:'inherit'}}
                        />
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{fontSize:13, color:'#555', width:70}}>עזב/ה:</span>
                        <input
                          type="date"
                          value={s.endDate || ''}
                          onChange={e => update(st => {
                            const student = st.groups.find(g => g.id === group.id).students.find(x => x.id === s.id)
                            student.endDate = e.target.value
                            student.inactive = !!e.target.value
                          })}
                          style={{flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid #e0e0e0', fontSize:13, fontFamily:'inherit'}}
                        />
                      </div>
                      {s.inactive && (
                        <button
                          onClick={() => update(st => {
                            const student = st.groups.find(g => g.id === group.id).students.find(x => x.id === s.id)
                            student.inactive = false
                            student.endDate = ''
                          })}
                          style={{padding:'6px', borderRadius:8, border:'1px solid #34a853', background:'#e6f4ea', color:'#2d7a3a', fontSize:12, cursor:'pointer', fontFamily:'inherit'}}
                        >החזר לפעיל</button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── days panel ── */}
                {editDaysId === s.id && (
                  <div style={{padding:'10px 16px', background:'#f8f8f8', borderBottom:'1px solid #f0f0f0'}}>
                    <div style={{fontSize:12, color:'#888', marginBottom:8}}>ימי אימון של {s.name}:</div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {groupDays.map(day => {
                        const active = studentDays.includes(day)
                        return (
                          <button
                            key={day}
                            onClick={() => toggleStudentDay(s.id, day)}
                            style={{
                              padding:'5px 12px', borderRadius:20, fontSize:13, cursor:'pointer',
                              border:'1px solid ' + (active ? '#1a73e8' : '#e0e0e0'),
                              background: active ? '#e8f0fe' : '#fff',
                              color: active ? '#1a73e8' : '#555',
                              fontWeight: active ? 600 : 400
                            }}
                          >{DAYS_FULL[day]}</button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── delete confirm ── */}
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
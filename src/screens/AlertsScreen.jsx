import { useState } from 'react'
import { consecutiveAbsences } from '../useStore'

function buildPaymentMessage(studentName, gender) {
  const firstName = studentName.split(' ')[0]
  const smile = '\u{1F60A}'
  const pray  = '\u{1F64F}'
  return `היי! ${smile}\nתזכורת ידידותית לתשלום דמי החוג של ${firstName} לחודש הנוכחי.\nתודה רבה! ${pray}`
}

function whatsappLink(phone, message) {
  if (!phone) return null
  let clean = phone.replace(/[\s\-\(\)]/g, '')
  if (clean.startsWith('0')) clean = '972' + clean.slice(1)
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`
}

function buildMessage(studentName, gender) {
  const pronoun = gender === 'female' ? 'איתה' : 'איתו'
  const arrived = gender === 'female' ? 'הגיעה' : 'הגיע'
  const firstName = studentName.split(' ')[0]
  const smile = '\u{1F60A}'
  const pray  = '\u{1F64F}'
  return `היי! ${smile}\nשמתי לב שכבר כמה זמן ${firstName} לא ${arrived} לחוג.\nהכל בסדר? אם יש משהו שקרה או סתם נתקעתם בלו"ז – אין בעיה בכלל, רק רציתי לבדוק שהכל טוב ${pronoun} ${pray}`
}

export default function AlertsScreen({ store }) {
  const { state, update } = store
  const [copied, setCopied] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [copiedPayment, setCopiedPayment] = useState(null)

  const currentMonth = new Date().toISOString().slice(0, 7)

  const paymentAlerts = []
  state.groups.forEach(gr => {
    const groupHasPayments = gr.students.some(s => s.payments && s.payments[currentMonth])
    if (!groupHasPayments) return
    gr.students.forEach(s => {
      if (!s.inactive && !(s.payments && s.payments[currentMonth])) {
        paymentAlerts.push({ group: gr, student: s })
      }
    })
  })

  function copyPaymentMessage(student) {
    const msg = buildPaymentMessage(student.name, student.gender)
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedPayment(student.id)
      setTimeout(() => setCopiedPayment(null), 2500)
    })
  }

  const alerts = []
  state.groups.forEach(gr => {
    gr.students.forEach(s => {
      const streak = consecutiveAbsences(state, gr.id, s.id)
      // auto-clear messageSent if the student has since attended
      if (s.messageSent && streak === 0) {
        update(st => {
          const student = st.groups.find(g => g.id === gr.id)?.students.find(x => x.id === s.id)
          if (student) delete student.messageSent
        })
      }
      if (streak >= 3) alerts.push({ group: gr, student: s, streak })
    })
  })
  alerts.sort((a, b) => b.streak - a.streak)

  function copyMessage(student) {
    const msg = buildMessage(student.name, student.gender)
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(student.id)
      setTimeout(() => setCopied(null), 2500)
    })
  }

  function markSent(groupId, studentId) {
    update(s => {
      const g = s.groups.find(g => g.id === groupId)
      const st = g.students.find(x => x.id === studentId)
      st.messageSent = new Date().toISOString()
    })
    setExpandedId(null)
  }

  function clearSent(groupId, studentId) {
    update(s => {
      const g = s.groups.find(g => g.id === groupId)
      const st = g.students.find(x => x.id === studentId)
      delete st.messageSent
    })
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">התראות נוכחות</span>
      </div>

      {alerts.length === 0 ? (
        <div className="no-items">
          ✅ אין התראות כרגע.<br/>כל התלמידים מגיעים באופן סדיר.
        </div>
      ) : (
        <>
          <div className="section-label">{alerts.length} תלמידים עם 3+ היעדרויות ברצף</div>
          {alerts.map(({ group: gr, student: s, streak }) => {
            const key = gr.id+'-'+s.id
            const isExpanded = expandedId === key
            const alreadySent = !!s.messageSent
            const sentDate = s.messageSent
              ? new Date(s.messageSent).toLocaleDateString('he-IL', {day:'numeric', month:'long'})
              : null

            return (
              <div key={key} style={{borderBottom:'1px solid #f0f0f0'}}>
                <div
                  style={{display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', cursor:'pointer'}}
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                >
                  <div style={{
                    width:42, height:42, borderRadius:'50%',
                    background: alreadySent ? '#e6f4ea' : '#fce8e6',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, flexShrink:0
                  }}>
                    {alreadySent ? '✅' : '⚠️'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15, fontWeight:600}}>{s.name}</div>
                    <div style={{fontSize:13, color:'#888', marginTop:2}}>{gr.name}</div>
                    {alreadySent && (
                      <div style={{fontSize:12, color:'#2d7a3a', marginTop:2}}>הודעה נשלחה ב-{sentDate}</div>
                    )}
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4}}>
                    <div style={{
                      background:'#fce8e6', color:'#c5221f', borderRadius:10,
                      padding:'4px 12px', fontSize:13, fontWeight:600
                    }}>
                      {streak} פעמים
                    </div>
                    <div style={{fontSize:12, color:'#aaa'}}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{padding:'0 16px 16px', background:'#fafafa'}}>
                    <div style={{
                      background:'#fff', border:'1px solid #e0e0e0', borderRadius:10,
                      padding:'12px 14px', fontSize:14, lineHeight:1.7,
                      color:'#333', marginBottom:12, whiteSpace:'pre-line'
                    }}>
                      {buildMessage(s.name, s.gender)}
                    </div>
                    {(() => {
                      const msg = buildMessage(s.name, s.gender)
                      const waLink = whatsappLink(s.parentPhone, msg)
                      return (
                        <div style={{display:'flex', flexDirection:'column', gap:8}}>
                          {waLink ? (
                            <div style={{display:'flex', gap:8}}>
                              <a
                                href={waLink}
                                style={{
                                  flex:1, textAlign:'center',
                                  padding:'10px', borderRadius:10,
                                  background:'#25D366', color:'#fff',
                                  fontSize:13, fontWeight:600, textDecoration:'none'
                                }}
                              >💬 וואטסאפ ל{s.parentType === 'mother' ? 'אמא' : s.parentType === 'father' ? 'אבא' : 'הורה'}{s.parentName ? ` — ${s.parentName}` : ''}</a>
                              <a
                                href={`tel:${s.parentPhone}`}
                                style={{
                                  padding:'10px 14px', borderRadius:10,
                                  background:'#e8f0fe', color:'#1a73e8',
                                  fontSize:13, fontWeight:600, textDecoration:'none',
                                  border:'1px solid #c5d8fd'
                                }}
                              >📞 חייג</a>
                            </div>
                          ) : (
                            <div style={{fontSize:12, color:'#aaa', textAlign:'center', padding:'6px 0'}}>
                              אין מספר טלפון — הוסיפי בפרטי התלמיד/ה
                            </div>
                          )}
                          <div style={{display:'flex', gap:8}}>
                            <button
                              onClick={() => copyMessage(s)}
                              style={{
                                flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                                border:'1px solid #1a73e8', background: copied===s.id ? '#e8f0fe' : '#fff',
                                color:'#1a73e8', fontSize:13, fontWeight:600, fontFamily:'inherit'
                              }}
                            >{copied === s.id ? '✓ הועתק!' : '📋 העתק'}</button>
                            {!alreadySent ? (
                              <button
                                onClick={() => markSent(gr.id, s.id)}
                                style={{
                                  flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                                  border:'none', background:'#1a1a1a',
                                  color:'#fff', fontSize:13, fontWeight:600, fontFamily:'inherit'
                                }}
                              >✅ נשלח</button>
                            ) : (
                              <button
                                onClick={() => clearSent(gr.id, s.id)}
                                style={{
                                  flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                                  border:'1px solid #e0e0e0', background:'#fff',
                                  color:'#888', fontSize:13, fontFamily:'inherit'
                                }}
                              >בטל סימון</button>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
      {paymentAlerts.length > 0 && (
        <>
          <div className="section-label" style={{marginTop:8}}>
            {paymentAlerts.length} תלמידים שלא שילמו החודש
          </div>
          {paymentAlerts.map(({ group: gr, student: s }) => {
            const key = 'pay-' + gr.id + '-' + s.id
            const msg = buildPaymentMessage(s.name, s.gender)
            const waLink = whatsappLink(s.parentPhone, msg)
            return (
              <div key={key} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'12px 16px', borderBottom:'1px solid #f0f0f0', background:'#fff'
              }}>
                <div style={{
                  width:38, height:38, borderRadius:'50%',
                  background:'#fff8e1', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:18, flexShrink:0
                }}>₪</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15, fontWeight:600}}>{s.name}</div>
                  <div style={{fontSize:13, color:'#888', marginTop:2}}>{gr.name}</div>
                </div>
                <div style={{display:'flex', gap:6}}>
                  {waLink && (
                    <a
                      href={waLink}
                      style={{
                        padding:'7px 12px', borderRadius:10,
                        background:'#25D366', color:'#fff',
                        fontSize:13, fontWeight:600, textDecoration:'none'
                      }}
                    >💬</a>
                  )}
                  {s.parentPhone && (
                    <a
                      href={`tel:${s.parentPhone}`}
                      style={{
                        padding:'7px 12px', borderRadius:10,
                        background:'#e8f0fe', color:'#1a73e8',
                        fontSize:13, fontWeight:600, textDecoration:'none',
                        border:'1px solid #c5d8fd'
                      }}
                    >📞</a>
                  )}
                  <button
                    onClick={() => copyPaymentMessage(s)}
                    style={{
                      padding:'7px 12px', borderRadius:10, cursor:'pointer',
                      border:'1px solid #e0e0e0',
                      background: copiedPayment === s.id ? '#e8f0fe' : '#fff',
                      color:'#1a73e8', fontSize:13, fontFamily:'inherit'
                    }}
                  >{copiedPayment === s.id ? '✓' : '📋'}</button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
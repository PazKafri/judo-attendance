import { useState } from 'react'

const TEMPLATES = [
  {
    label: 'ביטול אימון',
    text: 'שלום להורים! \u{1F64F}\nאימון היום מבוטל. מתנצלים על אי הנוחות.\nנתראה באימון הבא!'
  },
  {
    label: 'תזכורת תשלום',
    text: 'שלום! \u{1F60A}\nתזכורת ידידותית לתשלום דמי החוג לחודש הנוכחי.\nתודה רבה! \u{1F64F}'
  },
  {
    label: 'אימון מיוחד',
    text: 'שלום!\nהאימון הקרוב יהיה מיוחד \u{1F94B}\nנא להגיע עם מדי ג\'ודו.'
  },
  {
    label: 'בשורה טובה',
    text: 'שלום להורים! \u{1F60A}\nיש לנו בשורה מצוינת לשתף אתכם...'
  },
]

export default function BroadcastScreen({ store }) {
  const { state, update } = store
  const [message, setMessage] = useState('')
  const [selectedGroups, setSelectedGroups] = useState([])
  const [copied, setCopied] = useState(false)
  const [openedGroup, setOpenedGroup] = useState(null)
  const [editLinkId, setEditLinkId] = useState(null)
  const [linkValue, setLinkValue] = useState('')

  function toggleGroup(id) {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelectedGroups(state.groups.map(g => g.id))
  }

  function copyMessage() {
    if (!message.trim()) return
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function openGroup(gr) {
    navigator.clipboard.writeText(message).then(() => {
      setOpenedGroup(gr.id)
      setTimeout(() => setOpenedGroup(null), 3000)
      window.open(gr.waGroupLink, '_blank')
    })
  }

  function saveLink(groupId) {
    update(s => {
      const g = s.groups.find(g => g.id === groupId)
      g.waGroupLink = linkValue.trim()
    })
    setEditLinkId(null)
  }

  const hasMessage = message.trim().length > 0
  const hasSelected = selectedGroups.length > 0
  const selectedGroupObjects = state.groups.filter(g => selectedGroups.includes(g.id))

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">הודעה לקבוצות</span>
      </div>

      {/* Message composer */}
      <div style={{padding:'12px 16px', borderBottom:'1px solid #f0f0f0'}}>
        <div style={{fontSize:12, color:'#888', marginBottom:8}}>כתבי הודעה:</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="כתבי כאן את ההודעה..."
          rows={4}
          style={{
            width:'100%', padding:'10px 12px', borderRadius:10,
            border:'1px solid #e0e0e0', fontSize:14, fontFamily:'inherit',
            resize:'vertical', lineHeight:1.6, background:'#fff'
          }}
        />
        <div style={{fontSize:12, color:'#aaa', marginBottom:6, marginTop:4}}>תבניות מוכנות:</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => setMessage(t.text)}
              style={{
                padding:'5px 12px', borderRadius:20, fontSize:12,
                border:'1px solid #e0e0e0', background:'#f8f8f8',
                cursor:'pointer', fontFamily:'inherit', color:'#555'
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Group selector */}
      <div>
        <div className="section-label" style={{display:'flex', alignItems:'center', gap:8, paddingLeft:16}}>
          <span style={{flex:1}}>בחרי קבוצות לשליחה</span>
          {state.groups.length > 1 && (
            <button
              onClick={selectAll}
              style={{
                padding:'3px 10px', borderRadius:20, fontSize:12,
                border:'1px solid #1a73e8', background:'#e8f0fe',
                color:'#1a73e8', cursor:'pointer', fontFamily:'inherit'
              }}
            >בחר הכל</button>
          )}
        </div>

        {state.groups.length === 0 ? (
          <div className="no-items" style={{padding:'20px 16px'}}>אין קבוצות</div>
        ) : state.groups.map(gr => {
          const isSelected = selectedGroups.includes(gr.id)
          const hasLink = !!gr.waGroupLink
          const isEditingLink = editLinkId === gr.id

          return (
            <div key={gr.id} style={{borderBottom:'1px solid #f0f0f0'}}>
              <div
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 16px', cursor:'pointer',
                  background: isSelected ? '#f0f7ff' : '#fff'
                }}
                onClick={() => toggleGroup(gr.id)}
              >
                <div style={{
                  width:22, height:22, borderRadius:6, flexShrink:0,
                  border:'2px solid ' + (isSelected ? '#1a73e8' : '#ddd'),
                  background: isSelected ? '#1a73e8' : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontSize:14
                }}>{isSelected ? '✓' : ''}</div>

                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600}}>{gr.name}</div>
                  <div style={{fontSize:12, color:'#888'}}>
                    {gr.students.filter(s => !s.inactive).length} תלמידים פעילים
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    setEditLinkId(isEditingLink ? null : gr.id)
                    setLinkValue(gr.waGroupLink || '')
                  }}
                  style={{
                    padding:'4px 10px', borderRadius:20, fontSize:12,
                    border:'1px solid ' + (hasLink ? '#34a853' : '#e0e0e0'),
                    background: hasLink ? '#e6f4ea' : '#fff',
                    color: hasLink ? '#2d7a3a' : '#888',
                    cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap'
                  }}
                >{hasLink ? '✓ לינק WA' : '+ לינק WA'}</button>
              </div>

              {isEditingLink && (
                <div style={{padding:'0 16px 12px', background:'#fafafa', borderTop:'1px solid #f0f0f0'}}>
                  <div style={{fontSize:12, color:'#888', marginBottom:6, marginTop:8}}>
                    לינק לקבוצת וואטסאפ (מהאפליקציה ← הקבוצה ← הוסף דרך קישור):
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <input
                      type="text"
                      placeholder="https://chat.whatsapp.com/..."
                      value={linkValue}
                      onChange={e => setLinkValue(e.target.value)}
                      style={{
                        flex:1, padding:'8px 12px', borderRadius:10,
                        border:'1px solid #e0e0e0', fontSize:13, fontFamily:'inherit',
                        direction:'ltr', textAlign:'left', background:'#fff'
                      }}
                    />
                    <button
                      onClick={() => saveLink(gr.id)}
                      style={{
                        padding:'8px 14px', borderRadius:10, background:'#1a1a1a',
                        color:'#fff', fontSize:13, border:'none',
                        cursor:'pointer', fontFamily:'inherit', fontWeight:600
                      }}
                    >שמור</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Send section */}
      {hasMessage && hasSelected && (
        <div style={{padding:'16px'}}>
          <div style={{fontSize:13, color:'#555', marginBottom:12}}>
            {selectedGroups.length === 1 ? 'קבוצה אחת נבחרה' : `${selectedGroups.length} קבוצות נבחרו`}
          </div>

          <button
            onClick={copyMessage}
            style={{
              width:'100%', padding:'13px', borderRadius:12,
              border:'none', background: copied ? '#34a853' : '#1a1a1a',
              color:'#fff', fontSize:15, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', marginBottom:12,
              transition:'background 0.2s'
            }}
          >{copied ? '✓ הועתק ללוח!' : '📋 העתק הודעה'}</button>

          {selectedGroupObjects.filter(gr => gr.waGroupLink).length > 0 && (
            <>
              <div style={{fontSize:12, color:'#888', marginBottom:8}}>
                לחצי על קבוצה — ההודעה תועתק אוטומטית ותוכלי להדביק בצ'אט:
              </div>
              {selectedGroupObjects.filter(gr => gr.waGroupLink).map(gr => {
                const justOpened = openedGroup === gr.id
                return (
                  <button
                    key={gr.id}
                    onClick={() => openGroup(gr)}
                    style={{
                      display:'flex', alignItems:'center', gap:10, width:'100%',
                      padding:'12px 14px', borderRadius:10, marginBottom:8,
                      background: justOpened ? '#d4edda' : '#e6f4ea',
                      border:'1px solid ' + (justOpened ? '#34a853' : '#c3e6cb'),
                      color:'#2d7a3a', fontSize:14, fontWeight:600,
                      cursor:'pointer', fontFamily:'inherit', textAlign:'right',
                      transition:'background 0.2s'
                    }}
                  >
                    <span style={{fontSize:20}}>💬</span>
                    <span style={{flex:1}}>{gr.name}</span>
                    <span style={{fontSize:12, color: justOpened ? '#34a853' : '#888'}}>
                      {justOpened ? '✓ הועתק — הדביקי!' : 'פתחי ↗'}
                    </span>
                  </button>
                )
              })}
            </>
          )}

          {selectedGroupObjects.filter(gr => !gr.waGroupLink).length > 0 && (
            <div style={{fontSize:12, color:'#aaa', marginTop:8}}>
              {selectedGroupObjects.filter(gr => !gr.waGroupLink).map(gr => gr.name).join(', ')} —
              העתיקי את ההודעה ושלחי ידנית
            </div>
          )}
        </div>
      )}

      {(!hasMessage || !hasSelected) && (
        <div style={{padding:'30px 16px', textAlign:'center', color:'#bbb', fontSize:13}}>
          {!hasMessage ? 'כתבי הודעה למעלה כדי להתחיל' : 'בחרי לפחות קבוצה אחת'}
        </div>
      )}
    </div>
  )
}

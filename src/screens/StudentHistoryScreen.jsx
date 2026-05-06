const DAYS_FULL = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']

export default function StudentHistoryScreen({ store, group, student, onBack }) {
  const { state } = store

  const keys = Object.keys(state.attendance)
    .filter(k => k.startsWith(group.id+'-'))
    .sort().reverse()

  const records = keys
    .filter(k => state.attendance[k][student.id] !== undefined && state.attendance[k][student.id] !== null)
    .map(k => {
      const dateStr = k.replace(group.id+'-', '')
      const date = new Date(dateStr + 'T12:00:00')
      const present = state.attendance[k][student.id]
      return { dateStr, date, present }
    })

  const total = records.length
  const present = records.filter(r => r.present).length
  const absent = records.filter(r => !r.present).length
  const pct = total ? Math.round(present/total*100) : 0

  let streak = 0
  for (const r of records) {
    if (!r.present) streak++
    else break
  }

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="topbar-title">{student.name}</span>
      </div>

      <div style={{padding:'16px', background:'#fafafa', borderBottom:'1px solid #f0f0f0'}}>
        <div style={{display:'flex', gap:12, justifyContent:'space-between'}}>
          <div style={{flex:1, background:'#e6f4ea', borderRadius:10, padding:'12px', textAlign:'center'}}>
            <div style={{fontSize:22, fontWeight:700, color:'#2d7a3a'}}>{present}</div>
            <div style={{fontSize:12, color:'#2d7a3a', marginTop:2}}>הגיע/ה</div>
          </div>
          <div style={{flex:1, background:'#fce8e6', borderRadius:10, padding:'12px', textAlign:'center'}}>
            <div style={{fontSize:22, fontWeight:700, color:'#c5221f'}}>{absent}</div>
            <div style={{fontSize:12, color:'#c5221f', marginTop:2}}>נעדר/ה</div>
          </div>
          <div style={{flex:1, background:'#e8f0fe', borderRadius:10, padding:'12px', textAlign:'center'}}>
            <div style={{fontSize:22, fontWeight:700, color:'#1a73e8'}}>{pct}%</div>
            <div style={{fontSize:12, color:'#1a73e8', marginTop:2}}>נוכחות</div>
          </div>
        </div>
        {streak >= 2 && (
          <div style={{marginTop:10, padding:'8px 12px', background:'#fff3cd', borderRadius:8, fontSize:13, color:'#856404'}}>
            ⚠️ {streak} היעדרויות ברצף אחרונות
          </div>
        )}
      </div>

      <div className="section-label">{group.name}</div>

      {records.length === 0 ? (
        <div className="no-items">אין נתוני נוכחות עדיין.</div>
      ) : (
        records.map(({ dateStr, date, present }) => (
          <div key={dateStr} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px', borderBottom:'1px solid #f0f0f0', background:'#fff'
          }}>
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0,
              background: present ? '#e6f4ea' : '#fce8e6',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16
            }}>
              {present ? '✓' : '✕'}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14, fontWeight:500}}>
                {date.toLocaleDateString('he-IL', {weekday:'long', day:'numeric', month:'long'})}
              </div>
              <div style={{fontSize:12, color:'#888', marginTop:1}}>{dateStr}</div>
            </div>
            <div style={{
              fontSize:13, fontWeight:600, padding:'3px 10px', borderRadius:20,
              background: present ? '#e6f4ea' : '#fce8e6',
              color: present ? '#2d7a3a' : '#c5221f'
            }}>
              {present ? 'נוכח/ת' : 'נעדר/ת'}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
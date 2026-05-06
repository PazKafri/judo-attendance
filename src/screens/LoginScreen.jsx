import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccessMsg('נשלח אימייל אימות — בדקי את תיבת הדואר ולחצי על הקישור')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('אימייל או סיסמה שגויים')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#f8f8f8', padding:24
    }}>
      <div style={{
        width:'100%', maxWidth:380, background:'#fff',
        borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{textAlign:'center', marginBottom:28}}>
          <div style={{fontSize:40, marginBottom:8}}>🥋</div>
          <div style={{fontSize:20, fontWeight:700}}>ניהול נוכחות ג׳ודו</div>
          <div style={{fontSize:13, color:'#888', marginTop:4}}>
            {isSignup ? 'יצירת חשבון חדש' : 'כניסה לחשבון'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12, color:'#555', marginBottom:6}}>אימייל</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width:'100%', padding:'10px 14px', borderRadius:10,
                border:'1px solid #e0e0e0', fontSize:15, fontFamily:'inherit',
                direction:'ltr', textAlign:'left', background:'#fafafa'
              }}
            />
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:12, color:'#555', marginBottom:6}}>סיסמה</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="לפחות 6 תווים"
              style={{
                width:'100%', padding:'10px 14px', borderRadius:10,
                border:'1px solid #e0e0e0', fontSize:15, fontFamily:'inherit',
                direction:'ltr', textAlign:'left', background:'#fafafa'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding:'10px 14px', borderRadius:10, background:'#fce8e6',
              color:'#c5221f', fontSize:13, marginBottom:14
            }}>{error}</div>
          )}

          {successMsg && (
            <div style={{
              padding:'10px 14px', borderRadius:10, background:'#e6f4ea',
              color:'#2d7a3a', fontSize:13, marginBottom:14
            }}>{successMsg}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%', padding:'12px', borderRadius:12, border:'none',
              background: loading ? '#999' : '#1a1a1a', color:'#fff',
              fontSize:15, fontWeight:600, cursor: loading ? 'default' : 'pointer',
              fontFamily:'inherit'
            }}
          >{loading ? 'רגע...' : isSignup ? 'הרשמה' : 'כניסה'}</button>
        </form>

        <div style={{textAlign:'center', marginTop:20}}>
          <button
            onClick={() => { setIsSignup(v => !v); setError(null); setSuccessMsg(null) }}
            style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:13, color:'#1a73e8', fontFamily:'inherit'
            }}
          >{isSignup ? 'יש לי כבר חשבון — כניסה' : 'אין לי חשבון — הרשמה'}</button>
        </div>
      </div>
    </div>
  )
}
